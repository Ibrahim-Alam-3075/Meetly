import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../authSlice";
import "./Auth.css";

function Login() {
    const dispatch = useDispatch();

    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [message,setMessage] = useState('');

    const navigate = useNavigate();


       function handleLogin(e){
e.preventDefault();

fetch('http://localhost:5000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password })
})
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            dispatch(login({ _id: data._id, name: data.name, email: data.email }));
            navigate("/dashboard");
        } else {
            setMessage(data.message);
        }
    })
    .catch(() => {
        setMessage('Could not reach the server');
    });
    }

  return (
    <div className="auth-card">
      <h2>Login Page</h2>
      <form onSubmit={handleLogin}>
        <div> <label>Email:</label>
        <input type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)} /></div>
        <div> <label>Password:</label>
        <input type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)} /> </div>

<button className = "auth-button" type="submit">Login</button>
      </form>
      <p>{message}</p>
      <p>No account yet? <Link to="/register">Register</Link></p>
   </div>
  );
}

export default Login;
