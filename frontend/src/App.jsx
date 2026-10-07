import { useState } from "react";
import "./App.css";

function App() {

  const [message, setMessage] = useState("");

  const saveData = async () => {

    try {

      const response = await fetch("http://localhost:5000/save");

      const data = await response.json();

      setMessage(data.message);

    } catch (error) {

      setMessage("Backend connection failed");

    }
  };


  const readData = async () => {

    try {

      const response = await fetch("http://localhost:5000/data");

      const data = await response.json();

      setMessage(data.data || data.message);

    } catch (error) {

      setMessage("Backend connection failed");

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