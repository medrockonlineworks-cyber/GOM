import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBUhJx3uCQqiAXrtj_pOkcL7tY5cjKE1So",
  authDomain: "wise-shuttle-l8gvj.firebaseapp.com",
  projectId: "wise-shuttle-l8gvj",
  storageBucket: "wise-shuttle-l8gvj.firebasestorage.app",
  messagingSenderId: "218732737850",
  appId: "1:218732737850:web:66c1d519eb0d2242db4c03"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-globalonlinemark-9acee852-dea2-4921-af69-f1bc4c5c38a6");

export { app, db };
