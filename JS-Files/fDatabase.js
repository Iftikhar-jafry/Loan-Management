// firebaseConfig.js

// Initialize Firebase (make sure firebase.js is loaded in your HTML before this script)
const firebaseConfig = {
        apiKey: "AIzaSyCfEnI90pQnGBTyh_ecw94EkRkawG9M2_Y",
        authDomain: "personalloanmanagement-41554.firebaseapp.com",
        projectId: "personalloanmanagement-41554",
        storageBucket: "personalloanmanagement-41554.firebasestorage.app",
        messagingSenderId: "112089002774",
        appId: "1:112089002774:web:44c0d262a21ee04c4cd637"
    };


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase Auth and Firestore instances
const auth = firebase.auth();
const db = firebase.firestore();

// Export them for use in other files
export { auth, db };