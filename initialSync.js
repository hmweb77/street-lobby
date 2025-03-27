const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });


const { createClient } = require("@sanity/client");
const { cert, initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

console.log("Starting Firebase and Sanity synchronization...");

// Initialize Sanity Client
const sanityAdminClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "pkg5i4cw",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2023-01-01",
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

console.log("Sanity client initialized successfully.");

// Initialize Firebase Admin
const firebaseConfig = {
  credential: cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
  }),
};

const adminApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const adminAccessDb = getFirestore(adminApp);
console.log("Firebase initialized successfully.");

// Function to fetch all documents from Sanity
async function fetchAllSanityDocuments() {
  console.log("Fetching all documents from Sanity...");
  const documents = await sanityAdminClient.fetch("*[]");
  console.log(`Fetched ${documents.length} documents from Sanity.`);
  return documents;
}

// Function to prepare document before storing
function prepareDocument(data) {
  const { _id, _type, _createdAt, _updatedAt, _rev, ...documentData } = data;
  return {
    ...documentData,
    status: _id.includes("draft") ? "draft" : "published",
    sanityMetadata: { _type, _id, createdAt: _createdAt, updatedAt: _updatedAt, revision: _rev },
  };
}



// Function to store documents in Firestore
async function storeDocumentsInFirestore(documents) {
  console.log("Storing documents in Firestore...");
  const batch = adminAccessDb.batch();
  
  documents.forEach((doc) => {
    // Destructure metadata fields from the document
    const { _id, _type, _createdAt, _updatedAt, _rev, ...documentData } = doc;
    
    // Create the modified document payload
    const documentPayload = {
      ...documentData,
      status: _id.includes('draft') ? 'draft' : 'published',
      sanityMetadata: {
        _type,
        _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        revision: _rev
      }
    };

    // Get reference to the appropriate collection and document
    const docRef = adminAccessDb.collection(_type).doc(_id);
    
    // Queue the document for batch write with merge option
    batch.set(docRef, documentPayload, { merge: true });
    console.log(`Prepared and queued document ${_id} in collection '${_type}'`);
  });

  // Commit the batch write
  await batch.commit();
  console.log("All documents have been stored in Firestore successfully.");
}

// Trigger the initial sync
async function triggerInitialSync() {
  try {
    console.log("Checking initial sync status...");
    const metaRef = adminAccessDb.collection("metadata").doc("sanitySync");
    const metaDoc = await metaRef.get();

    // if (metaDoc.exists && metaDoc.data().synced) {
    //   console.log("Initial sync already performed. Skipping sync.");
    //   return;
    // }

    console.log("Starting initial sync...");
    const sanityData = await fetchAllSanityDocuments();
    await storeDocumentsInFirestore(sanityData);
    await metaRef.set({ synced: true, lastSynced: new Date() });
    console.log("Initial sync completed successfully.");
  } catch (error) {
    console.error("Error syncing data:", error);
  }
}

triggerInitialSync();
