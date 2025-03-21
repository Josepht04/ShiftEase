import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import

const firebaseConfig = {
  apiKey: "AIzaSyDbWo4Fu2yEqMrgrKMMUWhRqQB15RxjDRg",
  authDomain: "shiftease-467b2.firebaseapp.com",
  projectId: "shiftease-467b2",
  storageBucket: "shiftease-467b2.firebasestorage.app",
  messagingSenderId: "1076547087587",
  appId: "1:1076547087587:web:a914e6daa675e5315469d6",
  measurementId: "G-F9E27PLJWR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth=getAuth(app);
const db=getFirestore(app);

export {auth,db};
export default(app);
