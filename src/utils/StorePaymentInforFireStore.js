import { adminAccessDb } from "@/lib/firebase-admin";

const COLLECTION_NAME = "ShortTimePaymentInfo";

export async function storePaymentInfo(bookingInformation, roomUpdatesMap , customerId ,paymentSessionId) {

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Set expiration time to 1 day from now

    const docRef = adminAccessDb.collection(COLLECTION_NAME).doc();
    await docRef.set({
      paymentSessionId: paymentSessionId ?? null,
      bookingInformation: bookingInformation,
      roomUpdatesMap : JSON.stringify([...roomUpdatesMap]),
      stripeCustomerId: customerId ?? null,
      expiresAt: expiresAt,
    });

    console.log("Stored payment info with document ID:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error("Error storing payment info:", error);
  }
}

export async function getPaymentInfo(paymentSessionId) {
  if (!paymentSessionId) return null;

  try {
    const querySnapshot = await adminAccessDb
      .collection(COLLECTION_NAME)
      .where("paymentSessionId", "==", paymentSessionId)
      .limit(1) // Optional: since paymentSessionId should be unique
      .get();

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return doc.data();
  } catch (error) {
    console.error("Error retrieving payment info:", error);
    return null;
  }
}


export async function getPaymentInfoById(docId) {
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




export async function deletePaymentInfo(paymentSessionId) {
  if (!paymentSessionId) return;

  try {
    const querySnapshot = await adminAccessDb
      .collection(COLLECTION_NAME)
      .where("paymentSessionId", "==", paymentSessionId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      console.log("No payment info found to delete.");
      return;
    }

    const doc = querySnapshot.docs[0];
    await doc.ref.delete();
    console.log(`Deleted payment info with paymentSessionId: ${paymentSessionId}`);
  } catch (error) {
    console.error("Error deleting payment info:", error);
  }
}



export async function deletePaymentInfoById(docId) {
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





export async function cleanupExpiredPaymentInfo() {
  const now = new Date();

  try {
    const querySnapshot = await adminAccessDb
      .collection(COLLECTION_NAME)
      .where("expiresAt", "<=", now)
      .get();

    const batch = adminAccessDb.batch();
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error cleaning up expired payment info:", error);
  }
}
