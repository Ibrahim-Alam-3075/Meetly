import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "./Auth.css";

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  function handleRegister(e) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setMessage('Please fill all fields');
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

        fetch('http://localhost:5000/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password })
    })
      .then(response => response.json())
      .then(data => {
        if (data._id) {
          navigate('/login');
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
      <h2>Create Account</h2>

      <form onSubmit={handleRegister}>
        <div>
          <label>Name: </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label>Email: </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label>Password: </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button className = "auth-button" type="submit">Register</button>
      </form>

      <p>{message}</p>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}

export default Register;
