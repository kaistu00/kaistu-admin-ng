import type { Firestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'kaitsu-project';
const EMULATOR_HOST = '127.0.0.1:8080';

let db: Firestore | null = null;

export async function initFirebase(): Promise<boolean> {
  if (db) return false;

  const isLocal = process.env['ENVIRONMENT'] === 'LOCAL';
  const { initializeApp, getApps } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (getApps().length === 0) {
    initializeApp({ projectId: PROJECT_ID });
  }

  db = getFirestore();

  if (isLocal) {
    db.settings({ host: EMULATOR_HOST, ssl: false });
  }

  console.log(`Firebase Admin initialized (${isLocal ? 'local emulator' : 'production'})`);
  return true;
}

export function getDb(): Firestore {
  if (!db) throw new Error('Firebase not initialized');
  return db;
}
