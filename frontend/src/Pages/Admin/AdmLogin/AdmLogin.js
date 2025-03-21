import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './AdmLogin.module.css';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { db } from "../../../Config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const AdmLogin = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();  // Fixed variable name

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            const auth = getAuth();
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(db, "admins", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                if (onLoginSuccess) onLoginSuccess();  // Ensure it's called properly
                navigate("/admin"); // Navigate to the admin home page
            } else {
                setError("You are not authorized as an admin.");
            }
        } catch (error) {
            setError("Login failed: " + error.message);
        }
    };

    return (
        <div className={styles.admLoginContainer}>
            <div className={styles.admOverlay}></div>
            <form onSubmit={handleSubmit} className={styles.admLoginForm}>
                <h2 className={styles.admTitle}>Admin Login</h2>
                {error && <p className={styles.admError}>{error}</p>}
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.admInput}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.admInput}
                />
                <button type="submit" className={styles.admButton}>Login</button>
            </form>
        </div>
    );
};

AdmLogin.propTypes = {
    onLoginSuccess: PropTypes.func,
};

export default AdmLogin;
