import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { addUser } from '../authSlice';

function Register() {
  const users = useSelector((state) => state.auth.users);
  const dispatch = useDispatch();
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

    const existingUser = users.find(
      (user) => user.email === email.trim().toLowerCase()
    );

    if (existingUser) {
      setMessage('An account with this email already exists.');
      return;
    }

    const newUser = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password
    };

    dispatch(addUser(newUser));

    navigate('/login');
  }

  return (
    <div className="app-container">
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

        <button type="submit">Register</button>
      </form>

      <p>{message}</p>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}

export default Register;
