import pkg from 'pg';
import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';

dotenv.config();

const { Pool } = pkg;

// Use exact production config from firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBUhJx3uCQqiAXrtj_pOkcL7tY5cjKE1So",
  authDomain: "wise-shuttle-l8gvj.firebaseapp.com",
  projectId: "wise-shuttle-l8gvj",
  storageBucket: "wise-shuttle-l8gvj.firebasestorage.app",
  messagingSenderId: "218732737850",
  appId: "1:218732737850:web:66c1d519eb0d2242db4c03"
};

const databaseId = "ai-studio-globalonlinemark-9acee852-dea2-4921-af69-f1bc4c5c38a6";

async function main() {
  console.log("=== CONNECTING TO PRODUCTION FIRESTORE ===");
  try {
    const app = initializeApp(firebaseConfig);
    const db = initializeFirestore(app, {
      databaseId: databaseId
    });

    console.log("Fetching collections from custom DB...");
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`Firestore custom db users count: ${usersSnap.size}`);

    const txsSnap = await getDocs(collection(db, 'transactions'));
    console.log(`Firestore custom db txs count: ${txsSnap.size}`);

    console.log("\nFirestore Users Detail (Balances):");
    usersSnap.forEach(doc => {
      const u = doc.data();
      console.log(` - ID: ${doc.id}, Phone: ${u.phoneNumber}, Balance: ${u.walletBalance}, Role: ${u.role}`);
    });

    console.log("\nFirestore Transactions Detail:");
    txsSnap.forEach(doc => {
      const tx = doc.data();
      console.log(` - ID: ${doc.id}, UserID: ${tx.userId}, Phone: ${tx.userPhone}, Type: ${tx.type}, Amount: ${tx.amount}, Status: ${tx.status}, Ref: ${tx.accountNumberOrRef || tx.refCode}`);
    });

  } catch (err) {
    console.error('Firestore Production DB error:', err);
  }
}

main();
