import * as admin from "firebase-admin";

// --- Firebase Admin SDK Initialization ---
// Support multiple initialization methods to make local development easier:
// 1. Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file path (standard GCP behavior).
//    In this case, calling admin.initializeApp() without args will use ADC.
// 2. Set FIREBASE_SERVICE_ACCOUNT to the full service account JSON string (useful for containerized apps
//    or CI where you want to inject the JSON via env). Also set FIREBASE_PROJECT_ID for databaseURL.
// If neither is present, initialization will fail with a helpful error.

const firebaseServiceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
const firebaseServiceAccountBase64 =
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
const googleCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const firebaseProjectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT;

try {
  if (firebaseServiceAccountBase64) {
    // FIREBASE_SERVICE_ACCOUNT_BASE64 should be a base64-encoded JSON string of the service account.
    let decoded: string;
    try {
      decoded = Buffer.from(firebaseServiceAccountBase64, "base64").toString(
        "utf8"
      );
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_BASE64 is set but is not valid base64."
      );
    }

    let serviceAccount: admin.ServiceAccount;
    try {
      serviceAccount = JSON.parse(decoded) as admin.ServiceAccount;
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_BASE64 decoded value is not valid JSON."
      );
    }

    const databaseURL = firebaseProjectId
      ? `https://${firebaseProjectId}.firebaseio.com`
      : undefined;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      ...(databaseURL ? { databaseURL } : {}),
    });
    console.log(
      "Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_BASE64 env var."
    );
  } else if (firebaseServiceAccountEnv) {
    // FIREBASE_SERVICE_ACCOUNT should be the raw JSON string for a service account.
    let serviceAccount: admin.ServiceAccount;
    try {
      serviceAccount = JSON.parse(
        firebaseServiceAccountEnv
      ) as admin.ServiceAccount;
    } catch (err) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON.");
    }

    const databaseURL = firebaseProjectId
      ? `https://${firebaseProjectId}.firebaseio.com`
      : undefined;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      ...(databaseURL ? { databaseURL } : {}),
    });
    console.log(
      "Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT env var."
    );
  } else if (googleCredentialsPath) {
    // Let the SDK pick up Application Default Credentials from the provided file path.
    admin.initializeApp();
    console.log(
      "Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS."
    );
  } else if (
    process.env.NODE_ENV === "test" ||
    process.env.USE_FIRESTORE_EMULATOR === "true"
  ) {
    // Helpful during local tests where you might run the Firestore emulator.
    // If the emulator is in use, configure the SDK to connect to it.
    // The emulator host should be set via FIRESTORE_EMULATOR_HOST (e.g., localhost:8080).
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized in test/emulator mode.");
  } else {
    throw new Error(
      "Firebase credentials not provided. Set FIREBASE_SERVICE_ACCOUNT (JSON) or GOOGLE_APPLICATION_CREDENTIALS (file path), and optionally FIREBASE_PROJECT_ID."
    );
  }
} catch (error) {
  // Prevent crashing during hot-reloads in development environments if the app is already initialized.
  if (!/already exists/.test((error as Error).message)) {
    console.error("Firebase Admin SDK initialization error:", error);
    // For development we don't always want to exit; in production you may want to.
    // process.exit(1);
  }
}

const db = admin.firestore();
console.log("Firestore service initialized.");

// --- Interfaces ---

export interface ComplianceRule {
  id: string;
  guideline_id: string;
  name: string;
  description: string;
  rule_text: string;
  target_files: string[];
}

export interface ComplianceReport {
  app_status: "HIGH_RISK" | "MEDIUM_RISK" | "LOW_RISK" | "UNKNOWN";
  risk_score: number;
  issues: {
    guideline_id: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    file_path: string;
    line_number?: number;
    violation_summary: string;
    actionable_fix: string;
  }[];
}

// --- Service Functions ---

/**
 * Fetches all compliance rules from the central Firestore collection.
 * @returns {Promise<ComplianceRule[]>} A promise that resolves to an array of compliance rules.
 */
export const fetchComplianceRules = async (): Promise<ComplianceRule[]> => {
  const rulesCollection = "/global/minosguard/compliance_rules";
  const snapshot = await db.collection(rulesCollection).get();

  if (snapshot.empty) {
    console.warn(
      `Warning: No compliance rules found in Firestore at '${rulesCollection}'. The analysis will be limited.`
    );
    return [];
  }

  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as ComplianceRule)
  );
};

/**
 * Saves a compliance analysis report to Firestore.
 * @param {string} appId The application ID.
 *- * @param {string} userId The user ID associated with the scan.
 * @param {string} reportId The unique ID for the report (typically the jobId).
 * @param {ComplianceReport} reportData The report data to save.
 */
export const saveComplianceReport = async (
  appId: string,
  userId: string,
  reportId: string,
  reportData: ComplianceReport
): Promise<void> => {
  const reportPath = `/artifacts/${appId}/users/${userId}/compliance_reports/${reportId}`;
  const docRef = db.doc(reportPath);

  await docRef.set({
    ...reportData,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    jobId: reportId,
  });

  console.log(
    `Compliance report ${reportId} saved to Firestore at path: ${reportPath}`
  );
};
