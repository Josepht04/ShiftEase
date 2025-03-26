import React, { useContext, useEffect, useState } from "react";
import styles from "./UserProfile.module.css";
import { AuthContext } from "../../../Config/Routes/AuthContext";
import { getUserDataByEmail } from "../../../Config/Routes/getUserData";
import { db } from "../../../Config/firebase";
import { collection, getDocs, getDoc, doc, updateDoc, where, query } from "firebase/firestore";
import Performance from "../Performance/Performance";
import { ArrowLeftRight } from "lucide-react";

const UserProfile = () => {
  const { currentUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [shifts, setShifts] = useState({});
  const [activeTab, setActiveTab] = useState(1);
  const [swapRequests, setSwapRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const dbLoc = "user";

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
              Object.keys(shifts).forEach((shiftType) => {
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

  useEffect(() => {
    const fetchSwaps = async () => {
      if (!currentUser) return;

      try {
        const swapsRef = collection(db, "swaps");
        const querySnapshot = await getDocs(swapsRef);

        // ✅ Filter swaps for the current user
        const filteredSwaps = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((swap) => swap.requestTo === currentUser.uid);

        // ✅ Fetch all users at once
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        // ✅ Create a lookup dictionary for users (UID -> User Data)
        const usersMap = {};
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          usersMap[doc.id] = {
            displayName: userData.displayName || "Unknown User",
            photoURL: userData.photoURL || "",
            email: userData.email || "No Email"
          };
        });

        // ✅ Map swap requests with user display names
        const swapsData = filteredSwaps.map((swap) => ({
          ...swap,
          requestByName: usersMap[swap.requestBy]?.displayName || "Unknown User",
        }));

        setSwapRequests(swapsData);
      } catch (error) {
        console.error("Error fetching swap requests:", error);
      }
    };

    fetchSwaps();
  }, [currentUser]);


  const handleSwapUpdate = async (swapId, newStatus) => {
    try {
      const swapRef = doc(db, "swaps", swapId);
      const swapDoc = await getDoc(swapRef);

      if (!swapDoc.exists()) {
        alert("Swap request no longer exists.");
        return;
      }

      const swapData = swapDoc.data();
      if (swapData.status !== "Pending") {
        alert("This swap request has already been processed.");
        return;
      }

      if (newStatus === "Accepted") {
        // 1. Fetch the timetable entry for the given date
        const timetableRef = collection(db, "timetables");
        const timetableQuery = query(timetableRef, where("date", "==", swapData.date));
        const timetableSnapshot = await getDocs(timetableQuery);



        if (timetableSnapshot.empty) {
          alert("Timetable entry for the swap date not found.");
          return;
        }

        const timetableDoc = timetableSnapshot.docs[0]; // Assuming one entry per date
        const timetableData = timetableDoc.data();
        const updatedShifts = { ...timetableData.shifts };

        const { requestBy, requestTo, requestingUserShift, selectedUserShift } = swapData;

        // 2. Swap UIDs in the shifts
        if (
          updatedShifts[requestingUserShift] &&
          updatedShifts[selectedUserShift] &&
          updatedShifts[requestingUserShift].includes(requestBy) &&
          updatedShifts[selectedUserShift].includes(requestTo)
        ) {
          updatedShifts[requestingUserShift] = updatedShifts[requestingUserShift].map((uid) =>
            uid === requestBy ? requestTo : uid
          );

          updatedShifts[selectedUserShift] = updatedShifts[selectedUserShift].map((uid) =>
            uid === requestTo ? requestBy : uid
          );

          // 3. Update Firestore with the new shifts
          const timetableDocRef = doc(db, "timetables", timetableDoc.id);
          await updateDoc(timetableDocRef, { shifts: updatedShifts });

          // 4. Update the swap request status
          await updateDoc(swapRef, { status: "Accepted" });

          alert("Swap request accepted, and timetable updated!");

          forceReload();
        } else {
          alert("Error: Users are not in the correct shifts.");
        }
      } else {
        // If declined, just update status
        await updateDoc(swapRef, { status: "Declined" });
        alert("Swap request declined!");
      }
    } catch (error) {
      console.error(`Error updating swap request: ${error}`);
    }
  };


  useEffect(() => {
    const fetchLeaveRequests = async () => {
      if (!currentUser) return;

      try {
        const leavesRef = collection(db, "leaves");
        const q = query(leavesRef, where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        const leavesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLeaveRequests(leavesData);
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      }
    };

    fetchLeaveRequests();
  }, [currentUser]);

  const forceReload = () => {
    window.location.reload();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 1:
        return (
          <div className={styles.swaptab}>
            {swapRequests.length === 0 ? (
              <p>No swap requests available.</p>
            ) : (
              swapRequests.map((swap) => (
                <form key={swap.id} className={styles.swapinfo}>
                  <div className={styles.swapdets}>
                    <div className={styles.swapshift}>
                      <div>{swap.requestByName}</div>
                      <div>{swap.selectedUserShift}</div>
                    </div>
                    <ArrowLeftRight />
                    <div className={styles.swapshift}>
                      <div>{userData?.displayName}</div>
                      <div>{swap.requestingUserShift}</div>
                    </div>
                  </div>

                  {/* Date & Status */}
                  <div className={styles.date}><strong>Date:</strong> {swap.date}</div>
                  <div className={styles.date}><strong>Status:</strong> {swap.status}</div>
                  {swap.status === "Pending" ? (<div>
                    <div className={styles.swapbtn}>
                      <button type="button" className={styles.btns} onClick={() => handleSwapUpdate(swap.id, "Accepted")}>
                        Accept
                      </button>
                      <button type="button" className={styles.btns} onClick={() => handleSwapUpdate(swap.id, "Declined")}>
                        Decline
                      </button>
                    </div>
                  </div>) : ""}
                </form>
              ))

            )}
          </div>

        );
      case 2:
        return <div>
          {leaveRequests.length === 0 ? (
            <p>No leave requests found.</p>
          ) : (
            <ul>
              {leaveRequests.map((leave) => (
                <li key={leave.id}>
                  <div className={styles.leaveinfo}>
                    <div><strong>Date:</strong> {leave.date}</div>
                    <div><strong>Reason:</strong> {leave.reason}</div>
                    <div><strong>Status:</strong> {leave.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>;
      case 3:
        return <div><Performance shifts={shifts} /></div>;
      default:
        return null;
    }
  };

  if (!currentUser) {
    return <div>Loading... Please log in.</div>;
  }

  if (!userData) {
    return <div>Loading user data...<br /> Try Logging in</div>;
  }

  return (
    <div className={styles.UserProfile}>
      <div className={styles.userInfo}>
        <h1>{userData?.displayName}</h1>
        <div className={styles.pfpContainer}>
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              alt={userData.displayName}
              onError={(e) => { e.target.onerror = null; e.target.src = ""; }}
              className={styles.pfp}
            />
          ) : (
            <div className={styles.initials}>
              {userData?.displayName?.split(" ").map(name => name[0].toUpperCase()).join("") || "U"}
            </div>
          )}
        </div>
      </div>

      <div className={styles.tabGroup}>
        <div
          className={`${styles.tab} ${activeTab === 1 ? styles.activeTab : ""}`}
          onClick={() => setActiveTab(1)}
        >Swap Status</div>

        <div
          className={`${styles.tab} ${activeTab === 2 ? styles.activeTab : ""}`}
          onClick={() => setActiveTab(2)}
        >Leave Status</div>

        <div
          className={`${styles.tab} ${activeTab === 3 ? styles.activeTab : ""}`}
          onClick={() => setActiveTab(3)}
        >Performance</div>
      </div>

      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default UserProfile;