import fetch from 'node-fetch'; // wait, node-fetch or native fetch? Node v18+ supports native global fetch. Let's use native fetch!
import * as dotenv from 'dotenv';

dotenv.config();

const projectId = "wise-shuttle-l8gvj";
const databaseId = "ai-studio-globalonlinemark-9acee852-dea2-4921-af69-f1bc4c5c38a6";
const apiKey = "AIzaSyBUhJx3uCQqiAXrtj_pOkcL7tY5cjKE1So";

async function main() {
  console.log("=== QUERYING FIRESTORE VIA REST API ===");
  try {
    const txUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/transactions?key=${apiKey}`;
    const usersUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users?key=${apiKey}`;

    console.log("Fetching transactions...");
    const txRes = await fetch(txUrl);
    const txData = await txRes.json();

    console.log("Fetching users...");
    const usersRes = await fetch(usersUrl);
    const usersData = await usersRes.json();

    console.log("\n--- FIRESTORE TRANSACTIONS ---");
    if (txData.documents) {
      txData.documents.forEach((doc) => {
        const fields = doc.fields;
        const id = doc.name.split('/').pop();
        console.log(`ID: ${id}`);
        console.log(JSON.stringify(fields, null, 2));
      });
    } else {
      console.log("No transactions found or empty response.", txData);
    }

    console.log("\n--- FIRESTORE USERS ---");
    if (usersData.documents) {
      usersData.documents.forEach((doc) => {
        const fields = doc.fields;
        const id = doc.name.split('/').pop();
        console.log(`ID: ${id}`);
        console.log(` - Phone: ${fields.phoneNumber?.stringValue}, Balance: ${fields.walletBalance?.doubleValue || fields.walletBalance?.integerValue}, Role: ${fields.role?.stringValue}`);
      });
    } else {
      console.log("No users found or empty response.", usersData);
    }

  } catch (err) {
    console.error("REST API Error:", err);
  }
}

main();
