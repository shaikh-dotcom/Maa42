// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDoW4SqAx3MLFYQh65xtqWyrAwGtE_tu0",
  authDomain: "medsophia-6b1dd.firebaseapp.com",
  projectId: "medsophia-6b1dd",
  storageBucket: "medsophia-6b1dd.firebasestorage.app",
  messagingSenderId: "367132062111",
  appId: "1:367132062111:web:54b0eb6b25024dd01acdaa",
  measurementId: "G-W71743E86R",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
