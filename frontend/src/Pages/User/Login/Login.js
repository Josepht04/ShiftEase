import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';
import { auth,db } from '../../../Config/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { handlesignin } from '../../../Config/Routes/Authroute';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../../Config/Routes/AuthContext';
import { doc, setDoc, getDoc } from "firebase/firestore";

const Login = () => {

   const [email, setemail] = useState('');
   const [pwd, setpwd] = useState('');
   const navigate = useNavigate();
   const location = useLocation();
   const { currentUser, setCurrentUser } = useContext(AuthContext);  // Add setCurrentUser here


   const handleGoogleLogin = async (e) => {
      e.preventDefault();  

      try {
         const provider = new GoogleAuthProvider();
         const result = await signInWithPopup(auth, provider);
         const user=result.user;

         const userDocRef=doc(db,"users",user.uid);
         const userSnapshot =await getDoc(userDocRef);

         if(!userSnapshot.exists()){
            await setDoc(userDocRef,{
               email:user.email,
               displayName:user.displayName,
               photoURL:user.photoURL, 
            })
         }

         console.log("User signed in as :", result.user.email);

         if (result) {
            setCurrentUser(result.user);  // Save user to context
            if (location.pathname !== '/admin')
               navigate('/');
         }
      } catch (error) {
         console.error("Google Sign-In Error:\n", error);
      }
   }

   const handlelogin = async (e) => {
      e.preventDefault();
      
      try {
         if (!email || !pwd)
            throw new Error("Email or Password Cannot be Empty");
         
         const userCredential = await handlesignin(email, pwd);
         
         if (userCredential) {
            setCurrentUser(userCredential.user);  // Save user to context
            if (location.pathname !== '/admin')
               navigate('/');
         }
      } catch (error) {
         console.error("Email Sign-in Error:\n", error);
      }
   };

   return (
      <header>
         <div className={styles.overlay}>
            <div className={styles.Login}>
               <form className={styles.formfield}>
                  <h1>Welcome back</h1>
                  <div className={styles.gsignin}>
                     <button className={styles.gbtn} onClick={handleGoogleLogin}>
                        <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="google" />
                        <p>Sign in with Google</p>
                     </button>
                  </div>

                  <div className={styles.or}>
                     <div><hr className={styles.line}></hr></div>
                     <div className={styles.or}>or</div>
                     <div><hr className={styles.line}></hr></div>
                  </div>

                  <div className={styles.items}>
                     <label>Email id:</label>
                     <input type="email" className={styles.txtbox}
                        value={email} onChange={(e) => setemail(e.target.value)}
                     />
                  </div>
                  <div className={styles.items}>
                     <label>Password:</label>
                     <input type="password" className={styles.txtbox}
                        value={pwd} onChange={(e) => setpwd(e.target.value)}
                     />
                  </div>

                  <div className={styles.forgotpwd}><p>Forgot Password</p></div>

                  <div>
                     <input type="submit" value="Login" className={styles.loginbtn} onClick={handlelogin} />
                  </div>
               </form>
            </div>
         </div>
      </header>
   );
}

Login.propTypes = {};
Login.defaultProps = {};
export default Login;
