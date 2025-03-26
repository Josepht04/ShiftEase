import React from 'react';
import PropTypes from 'prop-types';
import styles from './LandingPage.module.css';
import infobg1 from '../../Assets/Images/landing1.jpeg';
import infobg2 from '../../Assets/Images/landing2.jpg';

const LandingPage = () => (
  <div className={styles.info}>
    <div className={styles.row1}>
      <h1>Welcome to ShiftEase</h1>
      <h3>Smart Scheduling, Seamless Shifts!</h3>
    </div>

    <div className={styles.row2}>
      <img src={infobg1} alt='img' className={styles.infoimg1} />
      <div>
      <h3>ShiftEase is a smart and efficient web application designed to simplify employee shift scheduling.
          It helps managers create, assign, and modify work shifts while ensuring optimal coverage and fairness
          Employees can view their schedules, swap shifts, and request time off seamlessly.</h3>
          </div>    

    </div>
  </div>
);

LandingPage.propTypes = {};

LandingPage.defaultProps = {};

export default LandingPage;
