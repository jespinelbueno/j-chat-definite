

import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import clsx from "clsx";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const token = localStorage.getItem("token");

  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => !prevDarkMode);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <Router>
      <div
        className={clsx("App", {
          light: !darkMode,
          dark: darkMode,
        })}
        style={{
          backgroundColor: "var(--bg-color)",
          color: "var(--text-color)",
        }}
      >
        <button className="toggle-mode-button" onClick={toggleDarkMode}>
          {darkMode ? (
                         <svg
                width='20px'
                height='20px'
                viewBox='0 0 24 24'
                fill='#000000'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M3 12H5M5.00006 19L7.00006 17M12 19V21M17 17L19 19M5 5L7 7M19 12H21M16.9999 7L18.9999 5M12 3V5M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z'
                  stroke='#ffffff'
                  stroke-width='1.5'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                />
              </svg>
          ) : (
                          <svg
                fill='#000000'
                width='20px'
                height='20px'
                viewBox='0 0 16 16'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path d='M11.47 2.18a6.49 6.49 0 0 1 3.22 5.5 6.84 6.84 0 0 1-7.08 6.55 7.42 7.42 0 0 1-3.82-1 7 7 0 0 1-1.9-1.65 9.47 9.47 0 0 0 3.34-.74 9.92 9.92 0 0 0 3.3-2.24 10 10 0 0 0 2.94-6.42M10.82.45a.66.66 0 0 0-.66.69 8.63 8.63 0 0 1-2.55 6.54 8.68 8.68 0 0 1-6.09 2.57H.66a.66.66 0 0 0-.58 1 8.45 8.45 0 0 0 7.53 4.39A8.15 8.15 0 0 0 16 7.68 7.85 7.85 0 0 0 11.07.51a.61.61 0 0 0-.25-.06z' />
              </svg>
          )}
        </button>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {token && <Route path="/chat/*" element={<Chat />} />}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

