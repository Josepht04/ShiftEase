import {auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";

 const signedin = 'false';

const handleadduser=async (email,password)=>{

    try{
        const usercredential=await createUserWithEmailAndPassword(auth,email,password);
        const user=usercredential.user;
        console.log("Successfully Created User : ",user.email);
        return user;
    }catch(error){
        console.log("Error during Signup:\n",error.message);
    }
 }

 const handlesignin = async (email, password) => {

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("signed in successfully as:",user.email);
      return userCredential;
    } catch (error) {
      console.error("Error during sign-in:\n", error.message);
    }
  };

 export {handleadduser,handlesignin};