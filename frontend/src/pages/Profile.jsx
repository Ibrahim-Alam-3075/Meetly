import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { updateUser } from "../authSlice";
import "./Profile.css";

function Profile() {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="app-container">
        <p>Please log in to edit your profile.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    if (password && password.length < 4) {
      setError("New password must be at least 4 characters.");
      return;
    }

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("token");

    const payload = {
      name: name.trim(),
      bio: bio.trim(),
    };

    if (password) {
      payload.password = password;
    }

    fetch("http://localhost:5000/api/users/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        setSaving(false);
        if (data._id) {
          dispatch(updateUser(data));
          setMessage("Profile updated successfully!");
          setPassword("");
          setConfirmPassword("");
        } else {
          setError(data.message || "Failed to update profile.");
        }
      })
      .catch((err) => {
        setSaving(false);
        setError("Network error: " + err.message);
      });
  }

  return (
    <div className="app-container profile-page">
      <h2>Edit Profile</h2>

      {message && <p className="profile-success">{message}</p>}
      {error && <p className="profile-error">{error}</p>}

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email address</label>
          <input
            type="email"
            value={currentUser.email || ""}
            disabled
            className="disabled-input"
          />
          <small className="field-note">Email cannot be changed.</small>
        </div>

        <div className="form-group">
          <label htmlFor="profile-name">Name</label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="profile-bio">About / Bio</label>
          <textarea
            id="profile-bio"
            rows="3"
            placeholder="A short note about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="profile-password">New Password (optional)</label>
          <input
            id="profile-password"
            type="password"
            placeholder="Leave blank to keep current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {password && (
          <div className="form-group">
            <label htmlFor="profile-confirm-password">Confirm New Password</label>
            <input
              id="profile-confirm-password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

export default Profile;

