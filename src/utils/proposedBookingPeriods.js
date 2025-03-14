import { adminAccessDb } from "@/lib/firebase-admin";

export async function storeProposedPeriodsBatch(addedDocsIds) {
  if (!addedDocsIds.length) return;

  console.log(`Storing ${addedDocsIds.length} proposed periods`);

  const batch = adminAccessDb.batch();
  const collectionRef = adminAccessDb.collection("proposedBookedPeriods");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

  addedDocsIds.forEach(doc => {
    // Extract components from document ID format: roomId_semester_year
    const {docId , roomId, semester, year} = doc;
    
    if (!roomId || !semester || !year) {
      console.warn(`Skipping invalid document ID: ${docId}`);
      return;
    }


    const docRef = collectionRef.doc();
    batch.set(docRef, {
      roomId,
      semester,
      year,
      expiresAt,
    });
  });


  await batch.commit();
  console.log(`Batch stored ${addedDocsIds.length} proposed periods`);
}


export async function getValidProposedPeriods() {
  await cleanupExpiredPeriods();
  const now = new Date();
  const snapshot = await adminAccessDb
    .collection("proposedBookedPeriods")
    .where("expiresAt", ">", now)
    .get();

  console.log(
    `Fetched ${snapshot.docs.length} valid proposed periods from Firestore`
  );

  return snapshot.docs.map((doc) => doc.data());
}

export async function cleanupExpiredPeriods() {
  const now = new Date();
  const snapshot = await adminAccessDb
    .collection("proposedBookedPeriods")
    .where("expiresAt", "<", now)
    .get();

  if (snapshot.empty) return;

  const batch = adminAccessDb.batch();
  snapshot.docs.forEach((docSnap) => {
    const docRef = adminAccessDb
      .collection("proposedBookedPeriods")
      .doc(docSnap.id);
    batch.delete(docRef);
  });

  await batch.commit();
}

export async function deleteAddedDocs(addedDocsIds) {
  if (addedDocsIds.size === 0) return;

  const batch = adminAccessDb.batch();
  addedDocsIds.forEach((docId) => {
    const docRef = adminAccessDb
      .collection("proposedBookedPeriods")
      .doc(docId);
    batch.delete(docRef);
  });

  await batch.commit();
}