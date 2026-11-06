import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
function Login({ users, onLogin }) {

    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
    const [message,setMessage] = useState('');

    const navigate = useNavigate();


    function handleLogin(e){
e.preventDefault();

const user = users.find(user => user.email.trim().toLowerCase() === email.trim().toLowerCase() && user.password === password);

if(user){
    onLogin({name: user.name, email: user.email});
    navigate("/dashboard");

}else{
    setMessage('Invalid email or password');
}
    }

  return (
    <div className="app-container">
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

<button type="submit">Login</button>
      </form>
      <p>{message}</p>
      <p>No account yet? <Link to="/register">Register</Link></p>
   </div>
  );
}

export default Login;
