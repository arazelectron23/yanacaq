import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    deleteDoc, 
    setDoc, 
    getDoc,
    query,
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase konsolundan aldığınız öz konfiqurasiya məlumatlarınızı daxil edin:
const firebaseConfig = {
  apiKey: "AIzaSyBgubYlhAKW-6Nx7TwOM59A9_6Ag1EXVkI",
  authDomain: "yanacaq-d14fd.firebaseapp.com",
  projectId: "yanacaq-d14fd",
  storageBucket: "yanacaq-d14fd.firebasestorage.app",
  messagingSenderId: "89017190401",
  appId: "1:89017190401:web:cd8e4a7be104d765d85800"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    deleteDoc, 
    setDoc, 
    getDoc,
    query,
    orderBy 
};