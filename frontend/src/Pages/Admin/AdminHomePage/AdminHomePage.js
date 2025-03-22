import React, { useState } from 'react';
import styles from './AdminHomePage.module.css';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../../../Config/firebase";
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";

const AdminHomePage = () => {
  const [displayName, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [role, setRole] = useState('user');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const handleAddUserForm = () => setShowAddUserForm(true);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!displayName || !email || !pwd || !role) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, pwd);
      const user = userCredential.user;

      const userDocRef = doc(collection(db, role === 'admin' ? "admins" : "users"), user.uid);
      await setDoc(userDocRef, { displayName, email, role, createdAt: new Date().toISOString() });

      alert("User added successfully!");
      setName('');
      setEmail('');
      setPwd('');
      setShowAddUserForm(false);
    } catch (error) {
      alert("Error adding user: " + error.message);
    }
  };

  const handleGenerateTimetable = async () => {
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates.");
      return;
    }

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

      const shiftsSnapshot = await getDocs(collection(db, "shifts"));
      const shifts = shiftsSnapshot.docs.map(doc => doc.data().name);

      if (users.length === 0 || shifts.length === 0) {
        alert("Users or Shifts data is missing!");
        return;
      }

      const totalShifts = shifts.length;
      const totalUsers = users.length;
      const maxUsersPerShift = 4;

      const currentDate = new Date(fromDate);
      const endDate = new Date(toDate);

      while (currentDate <= endDate) {
        const dayString = currentDate.toISOString().split('T')[0];

        // Check if timetable already exists for the day
        const q = query(collection(db, "timetables"), where("date", "==", dayString));
        const existingTimetableSnapshot = await getDocs(q);

        if (!existingTimetableSnapshot.empty) {
          console.log(`Skipping ${dayString} as it already exists.`);
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        if (currentDate.getDay() === 0) { // If it's Sunday
          const timetableDocRef = doc(collection(db, "timetables"));
          await setDoc(timetableDocRef, { date: dayString, shifts: { morning: "Off Day", evening: "Off Day", night: "Off Day" } });
          console.log(`Marked ${dayString} as an Off Day.`);
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const shiftsForDay = {};
        shifts.forEach(shift => shiftsForDay[shift] = []);

        for (let i = 0; i < totalUsers; i++) {
          const userIndex = (i + currentDate.getDate()) % totalUsers;
          const user = users[userIndex];
          const shiftIndex = i % totalShifts;
          const shiftName = shifts[shiftIndex];

          if (shiftsForDay[shiftName].length < maxUsersPerShift) {
            shiftsForDay[shiftName].push(user.uid);
          }
        }

        const timetableDocRef = doc(collection(db, "timetables"));
        await setDoc(timetableDocRef, { date: dayString, shifts: shiftsForDay });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      alert("Timetable generated successfully!");
    } catch (error) {
      console.error("Error generating timetable:", error);
      alert("Error generating timetable: " + error.message);
    }
  };


  return (
    <div className={styles.adminHomePageContainer}>
      <h1>Welcome Back, Admin</h1>

      <div className={styles.dateSelection}>
        <label>From:</label>
        <input type='date' value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <label>To:</label>
        <input type='date' value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      <div className={styles.buttonContainer}>
        <button className={styles.adhmbtn} onClick={handleAddUserForm}>Add User</button>
        <button className={styles.adhmbtn} onClick={handleGenerateTimetable}>Generate</button>
        <button className={styles.adhmbtn}>View Schedule</button>
      </div>

      {showAddUserForm && (
        <form onSubmit={handleSubmit} className={styles.addUserForm}>
          <input 
            className={styles.adhmip} 
            type='text' 
            placeholder='Name' 
            value={displayName} 
            onChange={(e) => setName(e.target.value)} 
          />
          <input 
            className={styles.adhmip} 
            type='email' 
            placeholder='Email' 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            className={styles.adhmip} 
            type='password' 
            placeholder='Password' 
            value={pwd} 
            onChange={(e) => setPwd(e.target.value)} 
          />
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            className={styles.adhmip}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className={styles.adhmbtn}>Submit</button>
        </form>
      )}
    </div>
  );
};

export default AdminHomePage;
