import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "../context/ToastContext";
import "./Auth.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    fetch("http://localhost:5000/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data._id) {
          addToast("Account created! Sign in to continue.", "success");
          navigate("/login");
        } else {
          setError(data.message || "Registration failed");
        }
      })
      .catch(() => setError("Could not reach the server."))
      .finally(() => setLoading(false));
  }

  return (
    <div className="auth-shell fade-up">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="auth-logo"><Sparkles size={20} /></div>
          <h2>Create your account</h2>
          <p>Start planning events with Meetly Ultra</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label htmlFor="reg-name">Full Name</label>
            <div className="input-icon-wrap">
              <User size={16} className="input-icon" />
              <input
                id="reg-name"
                type="text"
                placeholder="Ibrahim Alam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="reg-email">Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="reg-password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="reg-password"
                type={showPass ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPass((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" disabled={loading} className="auth-submit">
            <span>{loading ? "Creating account..." : "Create Account"}</span>
            <ArrowRight size={17} />
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
