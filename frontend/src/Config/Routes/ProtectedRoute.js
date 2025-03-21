import React from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const [user, loading] = useAuthState(auth);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to={adminOnly ? '/admin/login' : '/login'} />;
    }

    // If this route is for admin only, check if the user is in the "admins" collection
    if (adminOnly) {
        const checkAdmin = async () => {
            const userDocRef = doc(db, "admins", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                return <Navigate to="/admin/login" />;
            }
        };
        checkAdmin();
    }

    return children;
};

export default ProtectedRoute;
