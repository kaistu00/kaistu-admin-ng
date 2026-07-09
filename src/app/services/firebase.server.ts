import type { Firestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'kaitsu-project';
const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const AUTH_EMULATOR_HOST = '127.0.0.1:9099';

let db: Firestore | null = null;

export async function initFirebase(): Promise<boolean> {
  const isLocal = process.env['ENVIRONMENT'] === 'LOCAL';

  if (isLocal) {
    process.env['FIREBASE_AUTH_EMULATOR_HOST'] = AUTH_EMULATOR_HOST;
    process.env['FIRESTORE_EMULATOR_HOST'] = FIRESTORE_EMULATOR_HOST;
  }

  if (db) return false;

  const { initializeApp, getApps } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (getApps().length === 0) {
    initializeApp({ projectId: PROJECT_ID });
  }

  db = getFirestore();

  if (isLocal) {
    db.settings({ host: FIRESTORE_EMULATOR_HOST, ssl: false });
  }

  console.log(`Firebase Admin initialized (${isLocal ? 'local emulator' : 'production'})`);
  return true;
}

export function getDb(): Firestore {
  if (!db) throw new Error('Firebase not initialized');
  return db;
}
