import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import styles from './AdminHomePage.module.css';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../../../Config/firebase";
import { AuthContext } from "../../../Config/Routes/AuthContext";
import { getUserDataByEmail } from "../../../Config/Routes/getUserData";
import { collection, doc, setDoc, getDoc, updateDoc, writeBatch, getDocs, query, where } from "firebase/firestore";


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
  const [shifts, setShifts] = useState({});
  const [users, setUsers] = useState({});

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


      if (newStatus === "Accepted") {
        try {
          // ✅ Fetch leave data from local state
          const leaveData = leaves.find((leave) => leave.id === leaveId);
          if (!leaveData) {
            console.error("Leave data not found in state.");
            return;
          }

          const { userId, date } = leaveData;

          // ✅ Validate userId and leaveDate
          if (!userId || !date) {
            console.log("Invalid leave data: userId or leaveDate missing.");
            return;
          }

          // ✅ Query timetable for the specific date
          const timetableRef = collection(db, "timetables");
          const q = query(timetableRef, where("date", "==", date));
          const timetableSnapshot = await getDocs(q);

          if (timetableSnapshot.empty) {
            console.log(`No timetable found for leave date: ${date}`);
            return;
          }
          const batch = writeBatch(db); // ✅ Initialize write batch

          // ✅ Process timetable shifts & remove userId
          timetableSnapshot.forEach((doc) => {
            const { shifts } = doc.data();
            if (!shifts) return; // Skip update if no shifts

            const updatedShifts = Object.fromEntries(
              Object.entries(shifts).map(([shift, users]) => [
                shift,
                Array.isArray(users) ? users.filter((id) => id !== userId) : users,
              ])
            );

            // ✅ Add update to batch
            batch.update(doc.ref, { shifts: updatedShifts });
          });

          // ✅ Update leave status in the batch
          batch.update(doc(db, "leaves", leaveId), { status: newStatus });

          // ✅ Commit batch write
          await batch.commit();

          alert(`Leave Granted`);
          forceReload();
        } catch (error) {
          console.log("Error processing leave acceptance:", error);
        }
      }
      else {
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
      let users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

      const shifts = ["Morning", "Evening", "Night"];

      if (users.length === 0) {
        alert("No users found in the database!");
        return;
      }

      const minUsersPerShift = 3;
      const maxUsersPerShift = 4;

      // Track user shift count to ensure fairness
      let userShiftCounts = {};
      users.forEach(user => {
        userShiftCounts[user.uid] = 0;
      });

      // Get start and end of the current month
      const currentdate = new Date();
      const startOfMonth = new Date(currentdate.getFullYear(), currentdate.getMonth(), 1);
      const endOfMonth = new Date(currentdate.getFullYear(), currentdate.getMonth() + 1, 0);

      // Generate days array
      const days = Array.from({ length: endOfMonth.getDate() }, (_, i) => {
        const newDate = new Date(startOfMonth);
        newDate.setDate(startOfMonth.getDate() + i);
        const dateString = newDate.toISOString().split("T")[0];

        return {
          date: newDate.getDate(),
          day: newDate.toLocaleDateString("en-us", { weekday: "long" }),
          month: newDate.toLocaleDateString("en-us", { month: "long" }),
          year: newDate.getFullYear(),
          dateString: dateString,
        };
      });

      for (let day of days) {
        const dayString = day.dateString;

        // Check if timetable already exists for the day
        const q = query(collection(db, "timetables"), where("date", "==", dayString));
        const existingTimetableSnapshot = await getDocs(q);

        if (!existingTimetableSnapshot.empty) {
          console.log(`Skipping ${dayString} as it already exists.`);
          continue;
        }

        // If it's Sunday, mark it as a rest day
        if (day.day === "Sunday") {
          const timetableDocRef = doc(collection(db, "timetables"));
          await setDoc(timetableDocRef, { date: dayString, shifts: "Sunday" });
          console.log(`Marked ${dayString} as Sunday.`);
          continue;
        }

        let shiftsForDay = { Morning: [], Evening: [], Night: [] };

        // Shuffle users randomly for fair distribution
        let shuffledUsers = [...users].sort(() => Math.random() - 0.5);

        // Assign users to shifts fairly
        for (let shift of shifts) {
          let shiftUsers = [];

          while (shiftUsers.length < minUsersPerShift && shuffledUsers.length > 0) {
            let user = shuffledUsers.shift(); // Use shift() instead of pop() to maintain order
            if (user) {
              shiftUsers.push(user.uid);
              userShiftCounts[user.uid]++;
            }
          }

          // Add additional users if needed (up to maxUsersPerShift)
          while (shiftUsers.length < maxUsersPerShift && shuffledUsers.length > 0) {
            let user = shuffledUsers.shift();
            if (user) {
              shiftUsers.push(user.uid);
              userShiftCounts[user.uid]++;
            }
          }

          shiftsForDay[shift] = shiftUsers;
        }

        // Ensure all users get fair "No Shift" days
        users.forEach(user => {
          if (!Object.values(shiftsForDay).flat().includes(user.uid)) {
            userShiftCounts[user.uid] = Math.max(0, userShiftCounts[user.uid] - 1);
          }
        });

        const timetableDocRef = doc(collection(db, "timetables"));
        await setDoc(timetableDocRef, { date: dayString, shifts: shiftsForDay });

        console.log(`Generated shifts for ${dayString}`);
      }

      alert("Timetable generated successfully!");
    } catch (error) {
      console.error("Error generating timetable:", error);
      alert("Error generating timetable: " + error.message);
    }
  };





  useEffect(() => {
    const fetchShifts = async () => {
      const querySnapshot = await getDocs(collection(db, "timetables"));
      const shiftData = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        shiftData[data.date] = {
          morning: data.shifts?.Morning || [],
          evening: data.shifts?.Evening || [],
          night: data.shifts?.Night || []
        };
      });

      setShifts(shiftData);
    };

    fetchShifts();
  }, []);

  // Fetch all users and store displayNames in state
  useEffect(() => {
    const fetchUsers = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = {};

      usersSnapshot.forEach((doc) => {
        usersData[doc.id] = doc.data().displayName; // Store user displayName by UID
      });

      setUsers(usersData);
    };

    fetchUsers();
  }, []);

  // Get month dates
  const currentdate = new Date();
  const startOfMonth = new Date(currentdate.getFullYear(), currentdate.getMonth(), 1);
  const endOfMonth = new Date(currentdate.getFullYear(), currentdate.getMonth() + 1, 0);

  // Generate days array for the month
  const days = Array.from({ length: endOfMonth.getDate() }, (_, i) => {
    const newDate = new Date(startOfMonth);
    newDate.setDate(startOfMonth.getDate() + i);
    const dateString = newDate.toISOString().split("T")[0];

    return {
      date: newDate.getDate(),
      day: newDate.toLocaleDateString("en-us", { weekday: "long" }),
      month: newDate.toLocaleDateString("en-us", { month: "long" }),
      year: newDate.getFullYear(),
      dateString: dateString,
      shifts: shifts[dateString] || { morning: [], evening: [], night: [] }
    };
  });


  // Convert UID to displayName for each shift
  const getDisplayNames = (uids) => uids.map((uid) => users[uid] || uid);

  const renderTabContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <div>
            <h1>This Month's Schedule</h1>
            <div className={styles.scheduleContainer}>
              <div className={styles.daysRow}>
                {days.slice(0, 7).map((day, index) => (
                  <div key={index} className={styles.dayHeader}>
                    {day.day}
                  </div>
                ))}
              </div>

              <div className={styles.boxesRow}>
                {days.map((day) => (
                  <div
                    key={day.dateString}
                    className={`${styles.box} ${day.day === "Sunday" ? styles.holidayHighlight : ""} 
                  ${day.date === currentdate.getDate() ? styles.todayHighlight : ""}`}
                  >
                    <div className={styles.shift}>
                      {day.shifts.morning.length > 0 && (
                        <div>
                          <strong>Morning:</strong> {getDisplayNames(day.shifts.morning).join(", ")}
                        </div>
                      )}
                      {day.shifts.evening.length > 0 && (
                        <div>
                          <strong>Evening:</strong> {getDisplayNames(day.shifts.evening).join(", ")}
                        </div>
                      )}
                      {day.shifts.night.length > 0 && (
                        <div>
                          <strong>Night:</strong> {getDisplayNames(day.shifts.night).join(", ")}
                        </div>
                      )}
                      {day.shifts.morning.length === 0 &&
                        day.shifts.evening.length === 0 &&
                        day.shifts.night.length === 0 && <div>No Shift</div>}

                      <span className={styles.boxdate}>{day.date}</span>
                      <div className={styles.tooltip}>
                        This is {day.day} <br /> {day.date}
                        <sup>th</sup> {day.month} {day.year}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <form className={styles.leaveTable}>
            {leaves.length === 0 ? (
              <p>No leave requests available.</p>
            ) : (
              leaves.map((leave) => {
                // ✅ Compute next day for each leave
                const leaveDate = new Date(leave.date);
                leaveDate.setDate(leaveDate.getDate() + 1);
                const nextDay = leaveDate.toISOString().split("T")[0];
        
                return (
                  <div key={leave.id} className={styles.leaveCard}>
                    <div><strong>Date:</strong> {nextDay}</div>
                    <div><strong>User:</strong> {leave.userName}</div>
                    <div><strong>Reason:</strong> {leave.reason}</div>
        
                    {leave.status !== "Pending" && (
                      <div className={leave.status === "Accepted" ? styles.accept : styles.decline}>
                        <strong>{leave.status}</strong>
                      </div>
                    )}
        
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
                );
              })
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
      default: setActiveTab(1);
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
