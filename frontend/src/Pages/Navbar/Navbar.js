import React, { useEffect, useState } from 'react';
import styles from './Navbar.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../Config/firebase';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Set the user state to current user if logged in
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error.message);
    }
  };

  return (
    <header>
      <div className={styles.Navbar}>
        <div className={styles.title}>
          <Link to='/'><h2>ShiftEase</h2></Link>
        </div>

        <div className={styles.menuItems}>
          {user ? (
            <>
              <div className={styles.profilebtn}>
                <Link to='/profile'>Profile</Link> {/* Profile Button when user is logged in */}
              </div>
              <div className={styles.signOutBtn}>
                <button onClick={handleSignOut} className={styles.signOutButton}>Sign Out</button>
              </div>
            </>
          ) : (
            <div className={styles.login}>
              <Link to='/login'>Login</Link> {/* Login Button when no user is logged in */}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
  