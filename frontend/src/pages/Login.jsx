import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="app-container">
      <h2>Login</h2>
      <p>Sign in to your account.</p>
      <p>
        No account yet? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;
