import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export const getUserDataByEmail = async (email) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return userData;
    } else {
      console.log("No user found with this email.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data by email:\n", error.message);
  }
};
