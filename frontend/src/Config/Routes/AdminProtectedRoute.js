import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';

const AdminProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  const checkAdmin = async () => {
    const userDocRef = doc(db, "admins", user.uid);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists();
  };

  const isAdmin = checkAdmin();

  if (!isAdmin) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default AdminProtectedRoute;
