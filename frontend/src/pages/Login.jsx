import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { login } from "../authSlice";
import { useToast } from "../context/ToastContext";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please fill in your email and password.");
      return;
    }

    setLoading(true);
    fetch("http://localhost:5000/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          dispatch(
            login({
              _id: data._id,
              name: data.name,
              email: data.email,
              bio: data.bio || "",
              avatarColor: data.avatarColor || "#6366f1"
            })
          );
          addToast(`Welcome back, ${data.name}!`, "success");
          navigate("/dashboard");
        } else {
          setError(data.message || "Invalid credentials");
        }
      })
      .catch(() => setError("Could not reach the server. Is the backend running?"))
      .finally(() => setLoading(false));
  }

  return (
    <div className="auth-shell fade-up">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="auth-logo"><Sparkles size={20} /></div>
          <h2>Welcome back</h2>
          <p>Sign in to your Meetly Ultra workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label htmlFor="login-email">Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
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
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            <ArrowRight size={17} />
          </button>
        </form>

        <p className="auth-footer-text">
          New to Meetly? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
