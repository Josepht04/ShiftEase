import React, { useEffect, useState } from 'react';
import styles from './Navbar.module.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../Config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); 
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const currentpage = location.pathname;
  const dbName = currentpage === "/admin" ? "admins" : "users";
  const home= userData?.role === "admin"? "/admin" : "/";
  const pfp = userData?.role === "admin"? "/admin" : "/profile";

  // Fetching user data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDocRef = doc(db, dbName, currentUser.uid); // Use currentUser.uid instead of email
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
          } else {
            console.log("No such document found!");
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false); // Mark loading as false when done
    });

    return () => unsubscribe();
  }, [dbName]);

  // Render Loading State
  if (loading) return <div>Loading...</div>;
;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
      navigate('/info');
    } catch (error) {
      console.error("Error signing out: ", error.message);
    }
  };

  return (
    <header>
      <div className={styles.Navbar}>
        <div className={styles.title}>
          <Link to={home} ><h2>ShiftEase</h2></Link>
        </div>

        <div className={styles.menuItems}>
          {user ? (
            <>
              <div className={styles.profilewrapper}>
                <div className={styles.profilebtn}>
                  <Link to={pfp}>
                    {userData && userData.photoURL && userData.photoURL !== "" ? (
                      <img
                        src={userData.photoURL}
                        alt={userData.displayName ? 
                          userData.displayName.split(" ").map((name) => name[0].toUpperCase()).join("") 
                          : "User"}
                        onError={(e) => { e.target.onerror = null; e.target.src = ""; }}
                        className={styles.pfp}
                      />
                    ) : (
                      <div className={styles.initials}>
                        {userData?.displayName ? 
                          userData.displayName.split(" ").map((name) => name[0].toUpperCase()).join("") 
                          : "U"}
                      </div>
                    )}
                  </Link>
                </div>
                <div className={styles.signOutTooltip}>
                  <button onClick={handleSignOut} className={styles.signOutButton}>Sign Out</button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.login}>
              <Link to='/login'>Login</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
