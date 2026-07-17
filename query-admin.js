import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
admin.initializeApp();

// Get custom Firestore database instance
const db = getFirestore("ai-studio-globalonlinemark-9acee852-dea2-4921-af69-f1bc4c5c38a6");

async function main() {
  console.log("=== CONNECTING TO CUSTOM FIRESTORE WITH ADMIN SDK ===");
  try {
    const usersSnap = await db.collection('users').get();
    const txsSnap = await db.collection('transactions').get();

    console.log(`Firestore users count: ${usersSnap.size}`);
    console.log(`Firestore txs count: ${txsSnap.size}`);

    console.log("\nFirestore Users:");
    usersSnap.forEach(doc => {
      const u = doc.data();
      console.log(` - ID: ${doc.id}, Phone: ${u.phoneNumber}, Balance: ${u.walletBalance}, Role: ${u.role}`);
    });

    console.log("\nFirestore Transactions:");
    txsSnap.forEach(doc => {
      const tx = doc.data();
      console.log(` - ID: ${doc.id}, UserID: ${tx.userId}, Phone: ${tx.userPhone}, Type: ${tx.type}, Amount: ${tx.amount}, Status: ${tx.status}, Ref: ${tx.accountNumberOrRef || tx.refCode}`);
    });

  } catch (err) {
    console.error('Firestore Admin SDK Error:', err);
  }
}

main();
