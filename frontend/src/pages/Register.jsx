import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="app-container">
      <h2>Register</h2>
      <p>Create a new account.</p>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;
