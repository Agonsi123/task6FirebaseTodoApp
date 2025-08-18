const admin = require("firebase-admin");

const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SDK_BASE64;

let serviceAccount;

if (serviceAccountBase64) {
  try {
    const decodedJsonString = Buffer.from(serviceAccountBase64, "base64").toString("utf8");
    serviceAccount = JSON.parse(decodedJsonString);
  } catch (e) {
    console.error(
      "ERROR: Firebase Admin SDK: Invalid Base64 or JSON in FIREBASE_ADMIN_SDK_BASE64.",
      e
    );
  }
} else {
  console.error(
    "ERROR: Firebase Admin SDK: FIREBASE_ADMIN_SDK_BASE64 environment variable is not set."
  );
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (admin.apps.length && !serviceAccount) {
  // Warn if already initialized but config was missing, might indicate build-time vs runtime issues
  console.warn(
    "Firebase Admin SDK was already initialized, but service account config was missing for this instance."
  );
} else if (!admin.apps.length && !serviceAccount) {
  // If no app initialized and no service account, explicitly warn.
  console.warn(
    "Firebase Admin SDK not initialized: Service account config was missing or invalid."
  );
}

const adminDb = admin.firestore();

module.exports = { adminDb, admin };
