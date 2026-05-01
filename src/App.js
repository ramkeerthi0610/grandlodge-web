import React from "react";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="header">🏨 Hotel Management System</header>

      <div className="container">
        <div className="card">
          <h2>Total Rooms</h2>
          <p>120</p>
        </div>

        <div className="card">
          <h2>Available Rooms</h2>
          <p>45</p>
        </div>

        <div className="card">
          <h2>Booked Rooms</h2>
          <p>75</p>
        </div>
      </div>
    </div>
  );
}

export default App;
