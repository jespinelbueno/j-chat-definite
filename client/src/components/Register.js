import React, { useState } from "react";
import axios from "axios";
import "./styles/Register.css";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("https://juandi-chat-backend.vercel.app/api/register", {
        username,
        email,
        password,
      });

      if (username === null) {
        window.alert("Please enter a username");
      }

      if (email === null) {
        window.alert("Please enter a email");
      }

      if (password === null) {
        window.alert("Please enter a password");
      }

      // Redirect to the login page after successful registration
      window.alert("Registration successfully");
      window.location.href = "/";
    } catch (error) {
      setErrorMessage("Registration failed. Please try again.");
    }
  };

  const navigate = useNavigate();

  const navigateToLogin = () => {
    navigate("/");
  };

  return (
    <div className='main-container-register'>
      <div className='register-container'>
        <h4>Join us!</h4>
        <br />
        <h5>You are going to be assigned a random/funny profile picture...</h5>
        <form className='form-container-register' onSubmit={handleSubmit}>
          <input
            type='text'
            placeholder='Username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <br />
          <input
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <button type='submit'>Register</button>
          <br />
          <button onClick={navigateToLogin}>Back to Login</button>
        </form>
        {errorMessage && <p>{errorMessage}</p>}
      </div>
    </div>
  );
};

export default Register;
