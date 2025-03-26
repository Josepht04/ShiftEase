import React from "react";
import PropTypes from 'prop-types';
import styles from "./Performance.module.css";

import {
  Chart as ChartJS,
  BarElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Performance = ({ shifts }) => {
  // Process shifts to count shift occurrences per month
  const monthCounts = Array(12).fill(0);

  Object.keys(shifts).forEach(date => {
    const month = new Date(date).getMonth(); // Extract month from date
    monthCounts[month] += shifts[date].length; // Count how many shifts were assigned that day
  });

  const data = {
    labels: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ],
    datasets: [
      {
        label: "Shifts",
        data: monthCounts,
        backgroundColor: "rgb(47, 46, 46)",
        borderColor: "black",
        borderWidth: 1,
        borderRadius: 14
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true }
    }
  };

  return (
    <div className={styles.Performance}>
      <h1>This Year's Performance</h1>
      <div className={styles.graph}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

Performance.propTypes = {
  shifts: PropTypes.object.isRequired,
};

export default Performance;
