import React from 'react';
import PropTypes from 'prop-types';
import styles from './LandingPage.module.css';
import infobg1 from '../../Assets/Images/landing1.jpeg';
import infobg2 from '../../Assets/Images/landing2.jpg';

const LandingPage = () => (
  <div className={styles.info}>
    <div className={styles.row1}>
      <div>
        <h1>Welcome to ShiftEase</h1>
        <h3>Smart Scheduling, Seamless Shifts!</h3>
      </div>
     
    </div>
    <br></br><br></br><br></br><br></br>
    <div className={styles.row2}>
      <img src={infobg1} alt='img' className={styles.infoimg1} />
      <div>
        <br></br><br></br><br></br>
      <h3>ShiftEase is a smart and efficient web application designed to simplify employee shift scheduling.
          It helps managers create, assign, and modify work shifts while ensuring optimal coverage and fairness
          Employees can view their schedules, swap shifts, and request time off seamlessly.</h3>
          </div>    
      {/* <h3>ShiftEase is your ultimate solution for hassle-free employee scheduling.
        Designed to eliminate conflicts and streamline workforce management, our web application allows managers to create, assign, and adjust shifts effortlessly.
        Employees can request swaps, manage time-off, and receive instant updates, ensuring smooth communication and operational efficiency. 
        With a smart, automated system, ShiftEase helps businesses stay organized, productive, and employee-friendly!</h3> */}
    </div>
  </div>
);

LandingPage.propTypes = {};

LandingPage.defaultProps = {};

export default LandingPage;
