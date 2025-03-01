import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const AdminCheatingReports = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    socket.on("newCheatingAlert", (alert) => {
      setAlerts((prevAlerts) => [...prevAlerts, alert]);
    });
  }, []);

  return (
    <div>
      <h2>Cheating Reports</h2>
      <ul>
        {alerts.map((alert, index) => (
          <li key={index}>
            <strong>{alert.studentId}:</strong> {alert.message} <em>({alert.timestamp})</em>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminCheatingReports;
