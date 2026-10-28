import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqH9TUE4imZaILd0qguUSLBMUkIi9VkeE",
  authDomain: "myning-f9cc2.firebaseapp.com",
  databaseURL: "https://myning-f9cc2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "myning-f9cc2",
  storageBucket: "myning-f9cc2.firebasestorage.app",
  messagingSenderId: "871896675366",
  appId: "1:871896675366:web:41dfef9e4566a8848962e7",
  measurementId: "G-K3PD2DW2V7"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);