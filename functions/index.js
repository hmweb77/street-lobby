const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const { createDBHelpers } = require('./lib/db');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const { createOrUpdateDocument, deleteDocument } = createDBHelpers(db);

// Get secret from environment config
const SIGNATURE_KEY = process.env.SIGNATURE_KEY;
const expectedProjectId = process.env.ExpectedProjectId || 'pkg5i4cw';

exports.sanityWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Validate request method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Verify Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(403).json({ error: "Unauthorized - Missing token" });
    }

    // Extract and verify JWT
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, SIGNATURE_KEY);
      functions.logger.info("JWT Verified", { decoded });
    } catch (error) {
      functions.logger.error("JWT Verification Failed", { error: error.message });
      return res.status(403).json({ error: "Invalid token" });
    }

    // Validate Sanity headers
    const headers = req.headers;

    if (headers['sanity-project-id'] !== expectedProjectId) {
      return res.status(403).json({ error: 'Unauthorized project/dataset' });
    }

    // Parse request body
    let data;
    try {
      data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      functions.logger.info("Request Body Parsed", { data });
      functions.logger.info("Request Headers Parsed", { headers });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    // Validate required fields
    const operation = headers['sanity-operation'];
    const id = headers['sanity-document-id'];
    if (!operation || !data._type || !id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['sanity-operation (header)', '_type (body)', '_id (header)']
      });
    }
    

    // Prepare document data
    const { _type, _id, _createdAt, _updatedAt, _rev,   ...documentData } = data;
    const documentPayload = {
      ...documentData,
      status:  id.includes('draft') ? 'draft' : 'published',
      sanityMetadata: {
        _type, 
        _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        revision: _rev
      }
    };

    // Process operation
    switch (operation.toLowerCase()) {
      case 'create':
      case 'update':
        await createOrUpdateDocument(_type, id, documentPayload);
        break;
      case 'delete':
        await deleteDocument(_type, id);
        break;
      default:
        return res.status(400).json({ error: `Invalid operation: ${operation}` });
    }

    
    return res.status(200).json({
      success: true,
      operation,
      documentId: id,
      collection: _type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    functions.logger.error("Webhook Processing Error", {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message
    });
  }
});