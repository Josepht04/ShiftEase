import React, { useContext, useEffect, useState } from "react";
import styles from "./UserHomePage.module.css";
import { AuthContext } from "../../../Config/Routes/AuthContext";
import { getUserDataByEmail } from "../../../Config/Routes/getUserData";
import { db } from "../../../Config/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { ArrowLeftRight } from "lucide-react";



const UserHomePage = () => {
  const currentdate = new Date();
  const { currentUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [shifts, setShifts] = useState({});
  const [swapRequestform, setswapRequestform] = useState(false);
  const [leaveRequestform, setleaveRequestform] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [monthView, setMonthView] = useState(false);
  const [time, setTime] = useState("Week");

  const handleSwapRequest = () => {
    setswapRequestform(true);
    setleaveRequestform(false);
    setSelectedDate("");
    setSelectedShift("");
  }

  const handletimetable = () => {
    setTime("Month");
    setMonthView(true);
    setTimeout(() => {
      setTime("Week");
      setMonthView(false);
    }, 200000);

  }

  const handleLeaveRequest = () => {
    setleaveRequestform(true);
    setswapRequestform(false);
  }

  const dbLoc = "user"

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
    const fetchShifts = async () => {
      if (currentUser) {
        try {
          const timetableRef = collection(db, "timetables");
          const querySnapshot = await getDocs(timetableRef);

          const shiftData = {};
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.shifts) {
              const { shifts } = data;
              Object.keys(shifts).forEach(shiftType => {
                if (shifts[shiftType].includes(currentUser.uid)) {
                  shiftData[data.date] = shiftData[data.date] || [];
                  shiftData[data.date].push(shiftType);
                }
              });
            }
          });

          setShifts(shiftData);
        } catch (error) {
          console.error("Error fetching shifts: ", error);
        }
      }
    };
    fetchShifts();
  }, [currentUser]);

  const fetchAvailableUsers = async (selectedDate, selectedShift) => {
    try {
      const timetableRef = collection(db, "timetables");
      const timetableQuery = query(timetableRef, where("date", "==", selectedDate));
      const timetableSnapshot = await getDocs(timetableQuery);

      const usersToFetch = [];

      timetableSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.shifts) {
          Object.keys(data.shifts).forEach((shiftType) => {
            if (shiftType !== selectedShift && data.shifts[shiftType].length > 0) {
              data.shifts[shiftType].forEach((userId) => {
                usersToFetch.push({ userId, shiftType });
              });
            }
          });
        }
      });

      // Fetch user details from the 'users' collection
      const userDetailsPromises = usersToFetch.map(async ({ userId, shiftType }) => {
        const userRef = collection(db, "users");
        const userDocSnapshot = await getDocs(query(userRef, where("__name__", "==", userId)));

        if (!userDocSnapshot.empty) {
          const userDoc = userDocSnapshot.docs[0];
          const userData = userDoc.data();
          return { userId, displayName: userData.displayName || "Unknown User", shiftType };
        }
        return null;
      });

      const userDetails = await Promise.all(userDetailsPromises);
      const filteredUsers = userDetails.filter(user => user !== null);

      setAvailableUsers(filteredUsers);

    } catch (error) {
      console.error("Error fetching available users: ", error);
    }
  };


  if (!currentUser) {
    return <div>Loading... Please log in.</div>;
  }

  if (!userData) {
    return <div>Loading user data...<br /> Try Loging in</div>;
  }

  const displayName = userData?.displayName || "User";

  let days = [];

  if (!monthView) {
    // Calculate the start of the week (Monday as start)
    const startOfWeek = new Date(currentdate);
    const dayOffset = currentdate.getDay() === 0 ? -6 : 1 - currentdate.getDay();
    startOfWeek.setDate(currentdate.getDate() + dayOffset);

    // Generate array for 7 days of the week
    days = Array.from({ length: 7 }, (_, i) => {
      const newDate = new Date(startOfWeek);
      newDate.setDate(startOfWeek.getDate() + i);

      return {
        date: newDate.getDate(),
        day: newDate.toLocaleDateString("en-us", { weekday: "long" }),
        month: newDate.toLocaleDateString("en-us", { month: "long" }),
        year: newDate.getFullYear(),
        dateString: newDate.toISOString().split("T")[0],
      };
    });
  } else {
    // Monthly View
    const startOfMonth = new Date(currentdate.getFullYear(), currentdate.getMonth(), 1);
    const endOfMonth = new Date(currentdate.getFullYear(), currentdate.getMonth() + 1, 0);

    // Generate array for all days of the month
    days = Array.from({ length: endOfMonth.getDate() }, (_, i) => {
      const newDate = new Date(startOfMonth);
      newDate.setDate(startOfMonth.getDate() + i);
      const dateString = newDate.toISOString().split("T")[0];

      return {
        date: newDate.getDate(),
        day: newDate.toLocaleDateString("en-us", { weekday: "long" }),
        month: newDate.toLocaleDateString("en-us", { month: "long" }),
        year: newDate.getFullYear(),
        dateString: dateString,
        shifts: shifts?.[dateString] || ["No Shift"],
      };
    });
  }

  return (
    <div className={styles.UserHomePage}>
      <div className={styles.monthView} onClick={handletimetable}>
        <h1>Hello {displayName},<br />Welcome Back</h1>
        <h2 className={styles.heading}>This {time}'s Schedule</h2>
      </div>



      {!monthView ? (
        // Weekly View
        <div className={styles.scheduleContainer}>
          <div className={styles.daysRow}>
            {days.map((day) => (
              <div key={day.dateString} className={styles.dayHeader}>
                {day.day}
              </div>
            ))}
          </div>

          <div className={styles.boxesRow}>
            {days.map((day) => {
              const previousDay = new Date(day.dateString);
              previousDay.setDate(previousDay.getDate() - 1);
              const previousDateString = previousDay.toISOString().split("T")[0];

              return (
                <div
                  key={day.dateString}
                  className={`${styles.box} ${day.day === "Sunday" || !shifts[previousDateString] ? styles.sundayHighlight : ""} 
                    ${previousDateString === currentdate.toISOString().split("T")[0] ? styles.todayHighlight : ""}`}
                >
                  <div className={styles.shift}>
                    {shifts?.[previousDateString]?.join(", ") || "Off Duty"}
                    <span className={styles.date}>{day.date}</span>
                    <div className={styles.tooltip}>
                      This is {day.day} <br /> {day.date}
                      <sup>th</sup> {day.month} {day.year}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Monthly View
        <div className={styles.monthContainer}>
          <div className={styles.monthGrid}>
            {days.map((day) => (
              <div key={day.date}
                className={`${styles.box} ${day.day === "Sunday" || !shifts[day.dateString] ? styles.sundayHighlight : ""}
              ${day.dateString === currentdate.toISOString().split("T")[0] ? styles.todayHighlight : ""}`}>
                {shifts?.[day.dateString]?.join(", ") || "Off Duty"}
                <span className={styles.date}>{day.date}</span>
                <div className={styles.tooltip}>
                  This is {day.day} <br /> {day.date}
                  <sup>th</sup> {day.month} {day.year}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}





      <div className={styles.btns}>
        <button className={styles.btn}>Download Schedule</button>
        <button className={styles.btn} onClick={handleSwapRequest}>Swap Shifts</button>
        <button className={styles.btn} onClick={handleLeaveRequest}>Leave of Absence Request</button>
      </div>

      {swapRequestform && (
        <div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();

              if (!selectedDate) {
                alert("Please select a date.");
                return;
              }

              const selected = new Date(selectedDate);
              const currentDate = new Date();
              currentDate.setHours(0, 0, 0, 0);
              selected.setHours(0, 0, 0, 0);

              if (selected.getTime() < currentDate.getTime()) {
                alert("Swap requests cannot be made for the past.");
                return;
              }

              const selectedUserId = e.target.swapShifts.value;
              const selectedUser = availableUsers.find(user => user.userId === selectedUserId);
              const formattedDate = selected.toISOString().split('T')[0]; // Format date as "YYYY-MM-DD"

              try {
                // Reference to the swaps collection
                const swapsRef = collection(db, "swaps");

                // Check if a swap request already exists for the same user and date
                const existingSwapQuery = query(
                  swapsRef,
                  where("requestBy", "==", currentUser.uid),
                  where("date", "==", selectedDate)  // Use formatted date for comparison
                );

                const existingSwapSnapshot = await getDocs(existingSwapQuery);

                if (!existingSwapSnapshot.empty) {
                  // A swap request already exists
                  const existingSwap = existingSwapSnapshot.docs[0].data();
                  alert(`You have already made a swap request on this date. Status: ${existingSwap.status}`);
                  return;
                }

                // Save the swap request to the 'swaps' collection
                await addDoc(swapsRef, {
                  requestBy: currentUser.uid,
                  requestTo: selectedUserId,
                  date: selectedDate,
                  requestingUserShift: selectedShift,
                  selectedUserShift: selectedUser.shiftType,
                  status: "Pending",
                });

                alert("Swap request sent successfully!");
                setswapRequestform(false);

              } catch (error) {
                console.log("Error sending swap request: ", error);
                alert("Failed to send swap request. Try again.");
              }
            }}
            className={styles.swapform}
          >
            <h2>Swap Shifts</h2>
            <div>
              <label>Date:</label>
              <input
                type="date"
                onChange={async (e) => {
                  const selectedDate = e.target.value;
                  setSelectedDate(selectedDate);

                  if (shifts[selectedDate]) {
                    const selectedShift = shifts[selectedDate].join(", ");
                    setSelectedShift(selectedShift);

                    // Fetch available users for swapping
                    await fetchAvailableUsers(selectedDate, selectedShift);
                  } else {
                    setSelectedShift("No Shift");
                    setAvailableUsers([]);
                  }
                }}
              />
            </div>

            {selectedDate && (
              <div className={styles.swapdets}>
                <span>{selectedShift}</span> <ArrowLeftRight size={20} />
                <select name="swapShifts" id="swapShifts">
                  {availableUsers.length > 0 ? (
                    availableUsers.map((user, index) => (
                      <option key={index} value={user.userId}>
                        {user.displayName} - Shift: {user.shiftType}
                      </option>
                    ))
                  ) : (
                    <option>No available users for swap</option>
                  )}
                </select>
              </div>
            )}

            <button type="submit">Send Swap Request</button>
          </form>
        </div>
      )}

      {leaveRequestform && (
        <div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();

              if (!selectedDate) {
                alert("Please select a date.");
                return;
              }

              let selected = new Date(selectedDate);
              selected.setDate(selected.getDate() - 1); // Subtract 1 day
              let newselected = selected.toISOString().split("T")[0];
              console.log(newselected);
              console.log(selectedDate);
              const currentDate = new Date();
              currentDate.setHours(0, 0, 0, 0);  // Set current date to midnight for comparison
              selected.setHours(0, 0, 0, 0);    // Set selected date to midnight for comparison

              // if (selected.getTime() <= currentDate.getTime()) { // Compare dates using getTime()
              //   alert("Leave requests must be made at least 1 day in advance.");
              //   return;
              // }

              const reason = e.target.reason.value;

              try {
                const leavesRef = collection(db, "leaves");

                await addDoc(leavesRef, {
                  userId: currentUser.uid,
                  date: newselected,
                  reason: reason || "No reason provided",
                  status: "Pending",
                });

                alert("Leave request sent successfully!");
                setleaveRequestform(false);
              } catch (error) {
                console.log("Error sending leave request: ", error);
                alert("Failed to send leave request. Try again.");
              }
            }}
            className={styles.leaveform}
          >
            <h2>Leave Request Form</h2>
            <div>
              <label>Date:</label>
              <input
                type="date"
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className={styles.leavereqbox}
              />
            </div>

            <div>
              <label>Reason:</label>
              <textarea name="reason" placeholder="If any"></textarea>
            </div>

            <button type="submit">Send Leave Request</button>
          </form>
        </div>
      )}


    </div>
  );
};

export default UserHomePage;