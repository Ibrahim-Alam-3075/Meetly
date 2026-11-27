import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { User, Shield, Save, Calendar, Vote, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { updateUser } from "../authSlice";
import { useToast } from "../context/ToastContext";
import { AVATAR_COLORS, getInitials, getVoterId } from "../utils/themePresets";
import "./Profile.css";

function Profile() {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const events = useSelector((state) => state.event.events);
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const [name, setName] = useState(currentUser?.name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || "#6366f1");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => {
    if (!currentUser) return { hosted: 0, voted: 0, going: 0 };
    const myId = String(currentUser._id);
    let hosted = 0;
    let voted = 0;
    let going = 0;

    events.forEach((ev) => {
      const orgId = ev.organizer?._id || ev.organizer;
      if (String(orgId) === myId) hosted++;

      const hasVoted =
        (ev.dates || []).some(
          (d) =>
            (d.votes || []).some((v) => getVoterId(v) === myId) ||
            (d.maybeVotes || []).some((v) => getVoterId(v) === myId)
        ) ||
        (ev.venues || []).some(
          (v) =>
            (v.votes || []).some((u) => getVoterId(u) === myId) ||
            (v.maybeVotes || []).some((u) => getVoterId(u) === myId)
        );
      if (hasVoted) voted++;

      const myAtt = (ev.attendance || []).find((a) => String(a.user) === myId);
      if (myAtt && myAtt.choice === "yes") going++;
    });

    return { hosted, voted, going };
  }, [events, currentUser]);

  if (!currentUser) {
    return (
      <div className="empty-state glass-card">
        <h2>Sign in to view your profile</h2>
        <Link to="/login" className="hero-btn-primary">Sign In</Link>
      </div>
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) {
      addToast("Name cannot be empty", "error");
      return;
    }
    if (password && password.length < 8) {
      addToast("New password must be at least 8 characters", "error");
      return;
    }
    if (password && password !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          avatarColor,
          ...(password ? { password } : {})
        })
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.message || "Update failed", "error");
      } else {
        dispatch(
          updateUser({
            name: data.name,
            bio: data.bio || "",
            avatarColor: data.avatarColor || avatarColor
          })
        );
        setPassword("");
        setConfirmPassword("");
        addToast("Profile updated successfully!", "success");
      }
    } catch {
      addToast("Could not reach the server", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-ultra fade-up">
      <section className="profile-banner glass-card">
        <span
          className="avatar-circle profile-big-avatar"
          style={{ background: avatarColor }}
        >
          {getInitials(name || currentUser.name)}
        </span>
        <div className="profile-banner-info">
          <h1>{name || currentUser.name}</h1>
          <p className="profile-email mono">{currentUser.email}</p>
          {bio && <p className="profile-bio-preview">{bio}</p>}
        </div>
      </section>

      <section className="profile-stats">
        <div className="kpi-card glass-card">
          <div className="kpi-icon indigo"><Calendar size={20} /></div>
          <div>
            <div className="kpi-val mono">{stats.hosted}</div>
            <div className="kpi-label">Events Hosted</div>
          </div>
        </div>
        <div className="kpi-card glass-card">
          <div className="kpi-icon amber"><Vote size={20} /></div>
          <div>
            <div className="kpi-val mono">{stats.voted}</div>
            <div className="kpi-label">Polls Voted</div>
          </div>
        </div>
        <div className="kpi-card glass-card">
          <div className="kpi-icon emerald"><CheckCircle2 size={20} /></div>
          <div>
            <div className="kpi-val mono">{stats.going}</div>
            <div className="kpi-label">Confirmed RSVPs</div>
          </div>
        </div>
      </section>

      <form className="profile-grid" onSubmit={handleSave}>
        <div className="glass-card profile-panel">
          <div className="card-sec-head">
            <User size={18} />
            <h3>Profile Details</h3>
          </div>

          <div className="field-group">
            <label htmlFor="prof-name">Display Name</label>
            <input
              id="prof-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="prof-bio">Bio</label>
            <textarea
              id="prof-bio"
              rows="3"
              placeholder="Tell your teammates a bit about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="field-group">
            <label>Avatar Ring Color</label>
            <div className="swatch-row">
              {AVATAR_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  className={`color-dot ${avatarColor === col ? "selected" : ""}`}
                  style={{ background: col }}
                  onClick={() => setAvatarColor(col)}
                  aria-label={`Color ${col}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card profile-panel">
          <div className="card-sec-head">
            <Shield size={18} />
            <h3>Security &amp; Password</h3>
          </div>

          <div className="field-group">
            <label htmlFor="prof-pass">New Password (optional)</label>
            <div className="input-icon-wrap">
              <input
                id="prof-pass"
                type={showPass ? "text" : "password"}
                placeholder="Min. 8 characters"
                style={{ paddingLeft: 14 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="prof-confirm">Confirm New Password</label>
            <input
              id="prof-confirm"
              type={showPass ? "text" : "password"}
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div style={{ marginTop: "auto", paddingTop: 12 }}>
            <button type="submit" disabled={saving} style={{ width: "100%" }}>
              <Save size={16} />
              <span>{saving ? "Saving Changes..." : "Save Profile Changes"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Profile;
