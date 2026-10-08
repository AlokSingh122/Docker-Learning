import { useState } from "react";
import "./App.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://13.201.223.157:5000"
).replace(/\/$/, "");

function App() {

  const [message, setMessage] = useState("");

  const saveData = async () => {

    try {

      const response = await fetch(`${API_BASE_URL}/save`);
      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data = await response.json();

      setMessage(data.message);

    } catch (error) {

      setMessage(`Backend connection failed: ${error.message}`);

    }
  };


  const readData = async () => {

    try {

      const response = await fetch(`${API_BASE_URL}/data`);
      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data = await response.json();

      setMessage(data.data || data.message);

    } catch (error) {

      setMessage(`Backend connection failed: ${error.message}`);

    }
  };


  return (
    <div className="container">

      <div className="card">

        <h1>Docker Volume Demo</h1>

        <p>
          React + Flask + Docker Compose
        </p>

        <button onClick={saveData}>
          Save Data
        </button>

        <button onClick={readData}>
          Read Data
        </button>

        <div className="response">

          <h3>Backend Response</h3>

          <p>{message}</p>

        </div>

      </div>

    </div>
  );
}

export default App;