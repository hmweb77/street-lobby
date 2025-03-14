import { adminAccessDb as firestore } from "@/lib/firebase-admin"; // Import Firestore instance
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  writeBatch
} from "firebase/firestore";

export async function storeProposedPeriod(roomId, semester, year) {
  const docId = `${roomId}_${semester}_${year}`; // Unique ID
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now

  await setDoc(doc(firestore, "proposedBookedPeriods", docId), {
    roomId,
    semester,
    year,
    expiresAt,
  });

  console.log(
    `Stored temporary period for Room ${roomId}, Expires at: ${expiresAt}`
  );
}

export async function getValidProposedPeriods() {
  const now = new Date();
  const q = query(
    collection(firestore, "proposedBookedPeriods"),
    where("expiresAt", ">", now)
  );
  const snapshot = await getDocs(q);

  const periods = snapshot.docs.map((doc) => doc.data());
  return periods;
}

export async function cleanupExpiredPeriods() {
  const now = new Date();

  // Query expired periods
  const q = query(
    collection(firestore, "proposedBookedPeriods"),
    where("expiresAt", "<", now)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return; // No expired periods to delete

  // Initialize a Firestore batch
  const batch = writeBatch(firestore);

  // Add delete operations to the batch
  snapshot.docs.forEach((docSnap) => {
    batch.delete(doc(firestore, "proposedBookedPeriods", docSnap.id));
  });

  // Commit all deletions in a single request
  await batch.commit();
}

export async function deleteAddedDocs(addedDocsIds) {
  if (addedDocsIds.size === 0) return; // No documents to delete

  // Initialize a Firestore batch
  const batch = writeBatch(firestore);

  // Add delete operations to the batch
  addedDocsIds.forEach((docId) => {
    batch.delete(doc(firestore, "proposedBookedPeriods", docId));
  });

  // Commit all deletions in a single request
  await batch.commit();

}




// Step 2: Listen to Firestore updates and filter remainingSemesters
export function listenToValidProposedPeriods(roomsWithAvailableSemesters, onSnapshotCallback) {
  const now = new Date();

  // Firestore query to get only non-expired proposed periods
  const q = query(
    collection(firestore, "proposedBookedPeriods"),
    where("expiresAt", ">", now)
  );

  // Real-time listener
  return onSnapshot(q, (snapshot) => {
    const proposedPeriods = snapshot.docs.map((doc) => doc.data());

    const updatedRooms = roomsWithAvailableSemesters.map((room) => {
      const filteredSemesters = room.remainingSemesters.filter(
        (semesterObj) =>
          !proposedPeriods.some(
            (period) =>
              period.roomId === room.id &&
              period.semester === semesterObj.semester &&
              period.year === semesterObj.year
          )
      );

      return { ...room, remainingSemesters: filteredSemesters };
    });

    onSnapshotCallback(updatedRooms); // Call the provided callback with updated data
  });
}

