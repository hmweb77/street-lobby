import { adminAccessDb } from "@/lib/firebase-admin";

const COLLECTION_NAME = "PaypalPaymentInfo";

export async function storePaypalPaymentInfo(data) {

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Set expiration time to 1 day from now

    const docRef = adminAccessDb.collection(COLLECTION_NAME).doc();
    await docRef.set({
      ...data,
    });

    console.log("Stored payment info with document ID:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("Error storing payment info:", error);
  }
}



export async function addFieldsToPaypalPaymentInfo(docId, fields) {
  if (!docId || !fields) return;

  try {
    const docRef = adminAccessDb.collection(COLLECTION_NAME).doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log("No payment info found with the given ID to add fields.");
      return;
    }

    await docRef.set(fields, { merge: true });
    console.log(`Added fields to payment info with document ID: ${docId}`);
  } catch (error) {
    console.error("Error adding fields to payment info:", error);
  }
}

export async function updatePaypalPaymentInfo(docId, fields) {
  if (!docId || !fields) return;

  try {
    const docRef = adminAccessDb.collection(COLLECTION_NAME).doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log("No payment info found with the given ID to update.");
      return;
    }

    await docRef.update(fields);
    console.log(`Updated payment info with document ID: ${docId}`);
  } catch (error) {
    console.error("Error updating payment info:", error);
  }
}



export async function getPaypalPaymentInfoById(docId) {
  if (!docId) return null;

  try {
    const docRef = adminAccessDb.collection(COLLECTION_NAME).doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log("No payment info found with the given ID.");
      return null;
    }

    return doc.data();
  } catch (error) {
    console.error("Error retrieving payment info by ID:", error);
    return null;
  }
}



export async function deletePaypalPaymentInfoById(docId) {
  if (!docId) return;

  try {
    const docRef = adminAccessDb.collection(COLLECTION_NAME).doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log("No payment info found with the given ID to delete.");
      return;
    }

    await docRef.delete();
    console.log(`Deleted payment info with document ID: ${docId}`);
  } catch (error) {
    console.error("Error deleting payment info by ID:", error);
  }
}



export async function getPaypalPaymentInfoByBookingId(bookingId) {
  if (!bookingId) return null;

  try {
    const querySnapshot = await adminAccessDb
      .collection(COLLECTION_NAME)
      .where("bookingId", "==", bookingId)
      .get();

    if (querySnapshot.empty) {
      console.log("No payment info found with the given booking ID.");
      return null;
    }

    // Assuming there's only one document with a given bookingId
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error retrieving payment info by booking ID:", error);
    return null;
  }
}
