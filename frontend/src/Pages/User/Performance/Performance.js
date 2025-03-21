import React from "react";
import styles from "./Performance.module.css";

import {
  Chart as ChartJS,BarElement,Tooltip,Legend,CategoryScale,LinearScale
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const data = {
  labels: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],
  datasets: [
    {
      label: "Shifts",
      data: [40, 30, 50, 69, 90, 60, 80, 40, 30, 50, 69, 90],
      backgroundColor: "rgb(47, 46, 46)",
      borderColor: "black",
      borderWidth: 1,
      borderRadius:14
    }
  ],
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

const Performance = () => {
  return (
    <div className={styles.Performance}>
      <h1>This Year's Performance</h1>
      <div className={styles.graph}>
        <Bar data={data} options={options}/>
      </div>
    </div>
  );
};

export default Performance;
