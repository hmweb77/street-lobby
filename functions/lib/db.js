// db.js - Database operations module
const { getFirestore } = require('firebase-admin/firestore');

const createDBHelpers = (db) => ({
  createOrUpdateDocument: async (collection, id, data) => {
    try {
      await db.collection(collection).doc(id).set(data, { merge: true });
      console.log(`Document ${id} updated in ${collection}`);
      return true;
    } catch (error) {
      console.error(`Error updating ${collection}/${id}:`, error);
      throw error;
    }
  },

  deleteDocument: async (collection, id) => {
    try {
      await db.collection(collection).doc(id).delete();
      console.log(`Document ${id} deleted from ${collection}`);
      return true;
    } catch (error) {
      console.error(`Error deleting ${collection}/${id}:`, error);
      throw error;
    }
  }
});

module.exports = { createDBHelpers };