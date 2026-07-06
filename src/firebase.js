import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAJBtuQ1yJ982VTXf6RGXIgxmmbDBT_WqQ",
  authDomain: "admin-panel-d7b0e.firebaseapp.com",
  databaseURL: "https://admin-panel-d7b0e-default-rtdb.firebaseio.com",
  projectId: "admin-panel-d7b0e",
  storageBucket: "admin-panel-d7b0e.firebasestorage.app",
  messagingSenderId: "609937565911",
  appId: "1:609937565911:web:213ce2a722679a52116892",
  measurementId: "G-806FPP3BKM"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;