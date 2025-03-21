import React, { useContext, useEffect, useState } from "react";
import styles from "./UserHomePage.module.css";
import { AuthContext } from "../../../Config/Routes/AuthContext";
import { getUserDataByEmail } from "../../../Config/Routes/getUserData";
import { db } from "../../../Config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const UserHomePage = () => {
  const currentdate = new Date();
  const { currentUser } = useContext(AuthContext); 
  const [userData, setUserData] = useState(null);
  const [shifts, setShifts] = useState({}); // Store shifts by date

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userInfo = await getUserDataByEmail(currentUser.email);  
        setUserData(userInfo);
      }
    };
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const fetchShifts = async () => {
      if (currentUser) {
        try {
          const timetableRef = collection(db, "timetables");

          const q = query(timetableRef, where("userId", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);

          const shiftData = {};
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const shiftDate = new Date(data.fromDate).toDateString();
            shiftData[shiftDate] = data.shift;
          });

          setShifts(shiftData);
        } catch (error) {
          console.error("Error fetching shifts: ", error);
        }
      }
    };
    fetchShifts();
  }, [currentUser]);

  if (!currentUser) {
    return <div>Loading... Please log in.</div>;
  }

  if (!userData) {
    return <div>Loading user data...</div>;  // Waiting for Firestore data
  }

  const displayName = userData?.displayName || "User";

  // Find the most recent Monday
  const startOfWeek = new Date(currentdate);
  const dayOffset = currentdate.getDay() === 0 ? -6 : 1 - currentdate.getDay(); 
  startOfWeek.setDate(currentdate.getDate() + dayOffset);

  // Generate the week from Monday to Sunday
  const days = Array.from({ length: 7 }, (_, i) => {
    const newDate = new Date(startOfWeek);
    newDate.setDate(startOfWeek.getDate() + i);
    return {
      date: newDate.getDate(),
      day: newDate.toLocaleDateString("en-us", { weekday: "long" }),
      month: newDate.toLocaleDateString("en-us", { month: "long" }),
      year: newDate.getFullYear(),
      dateString: newDate.toDateString(), // For shift lookup
    };
  });

  return (
    <div className={styles.UserHomePage}>
      <h1>Hello {displayName},<br />Welcome Back</h1>
      <h2 className={styles.heading}>This Week's Schedule</h2>

      <div className={styles.scheduleContainer}>
        <div className={styles.daysRow}>
          {days.map((day) => (
            <div key={day.date} className={styles.dayHeader}>
              {day.day}
            </div>
          ))}
        </div>

        <div className={styles.boxesRow}>
          {days.map((day) => (
            <div
              key={day.date}
              className={`${styles.box} 
                ${day.day === "Sunday" ? styles.sundayHighlight : ""} 
                ${day.date === currentdate.getDate() ? styles.todayHighlight : ""}`}
            >
              <div className={styles.shift}>
                {shifts[day.dateString] || "No Shift"}  {/* Display shift if exists */}
                <span className={styles.date}>{day.date}</span>
                <div className={styles.tooltip}>
                  This is {day.day} <br /> {day.date}<sup>th</sup> {day.month} {day.year}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.btns}>
          <button className={styles.btn}>Download Schedule</button>
          <button className={styles.btn}>Swap Shifts</button>
          <button className={styles.btn}>Leave of Absence Request</button>
        </div>
      </div>
    </div>
  );
};

export default UserHomePage;
