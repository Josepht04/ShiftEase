import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import styles from './AdminHomePage.module.css';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../../../Config/firebase";
import { AuthContext } from "../../../Config/Routes/AuthContext";
import { getUserDataByEmail } from "../../../Config/Routes/getUserData";
import { collection, doc, setDoc, getDoc , updateDoc , writeBatch , getDocs, query, where } from "firebase/firestore";


const AdminHomePage = () => {
  const [displayName, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [role, setRole] = useState('user');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { currentUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const dbLoc = "admin";
  const [activeTab, setActiveTab] = useState(1);
  const [swapRequests, setSwapRequests] = useState([]);
  const [leaves, setLeaves] = useState([]);
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userInfo = await getUserDataByEmail(currentUser.email, dbLoc);
        setUserData(userInfo);
      }
    };
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const fetchLeaves = async () => {
      if (!currentUser) return; // Ensure user is logged in

      try {
        // 🔹 Fetch all leave requests from Firestore
        const leavesRef = collection(db, "leaves");
        const leavesSnapshot = await getDocs(leavesRef);
        const allLeaves = leavesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));


        // 🔹 Fetch all users at once
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        // 🔹 Create a lookup dictionary (UID -> User Data)
        const usersMap = {};
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          usersMap[doc.id] = userData.displayName || "Unknown User";
        });

        // 🔹 Map leave requests & replace userId with display names
        const leavesData = allLeaves.map((leave) => ({
          ...leave,
          userName: usersMap[leave.userId] || "Unknown User",
        }));

        setLeaves(leavesData); // Update state with formatted leaves
      } catch (error) {
        console.error("Error fetching leaves data:", error);
      }
    };

    fetchLeaves();
  }, [currentUser]);


  useEffect(() => {
    const fetchSwaps = async () => {
      if (!currentUser) return; // Ensure user is logged in

      try {
        // 🔹 Fetch all swaps from Firestore
        const swapsRef = collection(db, "swaps");
        const querySnapshot = await getDocs(swapsRef);
        const allSwaps = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // 🔹 Fetch all users at once
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        // 🔹 Create a lookup dictionary (UID -> User Data)
        const usersMap = {};
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          usersMap[doc.id] = {
            displayName: userData.displayName || "Unknown User",
            photoURL: userData.photoURL || "",
            email: userData.email || "No Email"
          };
        });

        // 🔹 Map swap requests & replace UIDs with display names
        const swapsData = allSwaps.map((swap) => ({
          ...swap,
          requestByName: usersMap[swap.requestBy]?.displayName || "Unknown User",
          requestToName: usersMap[swap.requestTo]?.displayName || "Unknown User",
        }));

        setSwapRequests(swapsData); // Update state with formatted swaps
      } catch (error) {
        console.error("Error fetching swap requests:", error);
      }
    };

    fetchSwaps();
  }, [currentUser]);

  const forceReload = () => {
    window.location.reload();
  };

  const handleLeaveUpdate = async (leaveId, newStatus) => {
    if (!leaveId) return;
  
    try {
      const leaveRef = doc(db, "leaves", leaveId);
  
      // ✅ Update leave status in Firestore
      await updateDoc(leaveRef, { status: newStatus });
  
      if (newStatus === "Accepted") {
        // Fetch leave data to get userId & leave date
        const leaveDoc = await getDoc(leaveRef);
        if (!leaveDoc.exists()) return;
  
        const { userId, date } = leaveDoc.data();
  
        // ✅ Query timetable for the specific date
        const timetableRef = collection(db, "timetables");
        const q = query(timetableRef, where("date", "==", date));
        const timetableSnapshot = await getDocs(q);
  
        if (timetableSnapshot.empty) {
          console.log("No timetable found for the given leave date.");
          return;
        }
  
        const batch = writeBatch(db);
  
        // ✅ Process timetable shifts & remove userId
        timetableSnapshot.forEach((doc) => {
          const timetableData = doc.data();
          const updatedShifts = { ...timetableData.shifts };
  
          Object.keys(updatedShifts).forEach((shift) => {
            if (Array.isArray(updatedShifts[shift])) {
              updatedShifts[shift] = updatedShifts[shift].filter(id => id !== userId);
            }
          });
  
          batch.update(doc.ref, { shifts: updatedShifts });
        });
  
        await batch.commit();
        console.log(`Leave Granted on ${date}.`);
        forceReload();
      } else {
        alert(`Leave Denied`);
        forceReload();
      }
    } catch (error) {
      console.error("Error updating leave status:", error);
    }
  };
  

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
      await setDoc(userDocRef, { displayName, email, role });

      alert("User added successfully!");
      setName('');
      setEmail('');
      setPwd('');
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <div>
            <h2>View Timetable</h2>
          </div>
        );
      case 2:
        return (
          <form className={styles.leaveTable}>
            {leaves.length === 0 ? (
              <p>No leave requests available.</p>
            ) : (
              leaves.map((leave) => (
                <div key={leave.id} className={styles.leaveCard}>
                  <div><strong>Date:</strong> {leave.date}</div>
                  <div><strong>User:</strong> {leave.userName}</div>
                  <div><strong>Reason:</strong> {leave.reason}</div>
                  {leave.status != "Pending" &&(<div className={`${leave.status === "Accepted" ? styles.accept
                      : styles.decline}`}>
                    <strong>{leave.status}</strong></div>)}

                  {/* ✅ Render buttons for PENDING leaves */}
                  {leave.status === "Pending" && (
                    <div className={styles.leavebtn}>
                      <button type="button" className={styles.btns} onClick={() => handleLeaveUpdate(leave.id, "Accepted")}>
                        Accept
                      </button>
                      <button type="button" className={styles.btns} onClick={() => handleLeaveUpdate(leave.id, "Declined")}>
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </form>


        );
      case 3:
        return (
          <div className={styles.swaptab}>
            {swapRequests.length === 0 ? (
              <p>No swap requests available.</p>
            ) : (
              swapRequests.map((swap) => (
                <form key={swap.id} className={styles.swapinfo}>
                  <div className={styles.swapdets}>
                    <div className={styles.swapshift}>
                      <div>{swap.requestByName}</div> {/* ✅ Requester’s Name */}
                      <div>{swap.selectedUserShift}</div> {/* ✅ Requester's Shift */}
                    </div>
                    <ArrowLeftRight />
                    <div className={styles.swapshift}>
                      <div>{swap.requestToName}</div> {/* ✅ Corrected Receiver's Name */}
                      <div>{swap.requestingUserShift}</div> {/* ✅ Receiver’s Shift */}
                    </div>
                  </div>

                  {/* Date & Status */}
                  <div className={styles.date}><strong>Date:</strong> {swap.date}</div>
                  <div className={`${swap.status === "Pending" ? styles.pending
                    : swap.status === "Accepted" ? styles.accept
                      : styles.decline}`}>
                    <strong>{swap.status}</strong></div>
                </form>
              ))
            )}
          </div>

        );
      case 4:
        return (
          <div className={styles.generateform}>
            <div className={styles.dateSelection}>
              <div className={styles.dates}><label>From:</label>
                <input type='date' value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={styles.date} /></div>
              <div className={styles.dates}><label>To:</label>
                <input type='date' value={toDate} onChange={(e) => setToDate(e.target.value)} className={styles.date} /></div>
            </div>

            <div className={styles.buttonContainer}>
              <button className={styles.adhmbtn} onClick={handleGenerateTimetable}>Generate</button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className={styles.Uform}>
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
              <div className={styles.addUserbtn}><button type="submit" className={styles.adhmbtn}>Add User</button></div>
            </form>
          </div>
        );
    }
  };

  return (
    <>
      <div className={styles.adminHomePage}>
        <h1>Welcome Back,{userData?.displayName}</h1>

        <div className={styles.tabGroup}>
          <div
            className={`${styles.tab} ${activeTab === 1 ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(1)}
          >View Schedule</div>

          <div
            className={`${styles.tab} ${activeTab === 2 ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(2)}
          >Leave Requests</div>

          <div
            className={`${styles.tab} ${activeTab === 3 ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(3)}
          >Swaps</div>

          <div
            className={`${styles.tab} ${activeTab === 4 ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(4)}
          >Generate</div>

          <div
            className={`${styles.tab} ${activeTab === 5 ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(5)}
          >Add User</div>
        </div>



        <div className={styles.tabContent}>
          {renderTabContent()}
        </div>
      </div>
    </>

  );
};

export default AdminHomePage;
