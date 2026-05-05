import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Button from "../components/ui/Button";
import "../components/css/Profile.css";

const ROLE_BADGE = {
  ADMIN: { label: "Admin", cls: "badge-red" },
  COMPETITOR: { label: "Competitor", cls: "badge-blue" },
  STANDARD: { label: "Standard", cls: "badge-neutral" },
};

function Avatar({ username, size = 80 }) {
  return (
    <div
      className="profile-avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// Change Password Modal
function ChangePasswordModal({ userId, onClose }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!password) {
      setError("Password cannot be empty.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/users/${userId}`, {
        password,
        confirmPassword: confirm,
      });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError("Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Change Password</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">Password updated! ✓</div>}
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Editable Field
function EditableField({ label, value, onSave, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  return (
    <div className="editable-field">
      <div className="editable-label">{label}</div>
      {editing ? (
        <div className="editable-input-row">
          <input
            className="form-input editable-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            autoFocus
          />
          <button
            className="editable-btn save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "…" : "✓"}
          </button>
          <button
            className="editable-btn cancel"
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          className="editable-value-row"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
        >
          <span className="editable-value">
            {value || <span className="editable-empty">{placeholder}</span>}
          </span>
          <span className="editable-edit-icon">✎</span>
        </div>
      )}
    </div>
  );
}

// Main Profile Page
export default function Profile() {
  const { user, login } = useAuth();
  const uid = user?.userId ?? user?.id;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!uid) return;
    api
      .get(`/users/${uid}`)
      .then((r) => setUserData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [uid]);

  const updateField = async (field, value) => {
    setSaveError("");
    try {
      const res = await api.patch(`/users/${uid}`, { [field]: value });
      setUserData(res.data);
      // tyler durden - Update localStorage user so sidebar/dashboard reflect changes
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...stored, [field]: value }),
      );
    } catch (e) {
      setSaveError("Failed to save. Please try again.");
      console.error(e);
    }
  };

  if (loading) return <div className="profile-loading">Loading…</div>;

  const roleBadge = ROLE_BADGE[userData?.role] ?? ROLE_BADGE.STANDARD;
  const initials =
    `${userData?.firstname?.[0] ?? ""}${userData?.lastname?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header-row">
        <div>
          <div className="page-title">Profile</div>
          <div className="page-sub">Manage your account information</div>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left — Avatar + quick info */}
        <div className="profile-card profile-card-left">
          <div className="avatar-section">
            <div className="profile-avatar">
              <span>{initials || userData?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="avatar-name">
              {userData?.firstname} {userData?.lastname}
            </div>
            <div className="avatar-username">@{userData?.username}</div>
            <span className={`badge ${roleBadge.cls}`}>{roleBadge.label}</span>
          </div>

          <div className="profile-divider" />

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-val">{uid}</div>
              <div className="profile-stat-label">User ID</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-val">{userData?.role}</div>
              <div className="profile-stat-label">Role</div>
            </div>
          </div>

          <div className="profile-divider" />

          <button
            className="password-btn"
            onClick={() => setShowPassword(true)}
          >
            🔒 Change Password
          </button>
        </div>

        {/* Right — Editable fields */}
        <div className="profile-card profile-card-right">
          <div className="section-title">Personal Information</div>
          <div className="fields-list">
            <EditableField
              label="First Name"
              value={userData?.firstname ?? ""}
              placeholder="Enter first name"
              onSave={(v) => updateField("firstname", v)}
            />
            <EditableField
              label="Last Name"
              value={userData?.lastname ?? ""}
              placeholder="Enter last name"
              onSave={(v) => updateField("lastname", v)}
            />
            <EditableField
              label="Username"
              value={userData?.username ?? ""}
              placeholder="Enter username"
              onSave={(v) => updateField("username", v)}
            />
            <EditableField
              label="Email"
              value={userData?.email ?? ""}
              placeholder="Enter email"
              onSave={(v) => updateField("email", v)}
            />
          </div>

          {saveError && (
            <div className="form-error" style={{ marginTop: 12 }}>
              {saveError}
            </div>
          )}

          <div className="profile-divider" style={{ margin: "20px 0" }} />

          <div className="section-title">Account</div>
          <div className="account-info">
            <div className="account-row">
              <span className="account-label">Account Status</span>
              <span className="badge badge-green">Active</span>
            </div>
            <div className="account-row">
              <span className="account-label">Role</span>
              <div className="role-selector">
                {["STANDARD", "COMPETITOR"].map((r) => (
                  <button
                    key={r}
                    className={`role-btn${userData?.role === r ? " active" : ""}`}
                    onClick={() => updateField("role", r)}
                    disabled={userData?.role === r}
                  >
                    {r === "STANDARD" ? "Standard" : "Competitor"}
                  </button>
                ))}
              </div>
            </div>
            <div className="account-row">
              <span className="account-label">Password</span>
              <button
                className="link-btn"
                onClick={() => setShowPassword(true)}
              >
                Change password →
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPassword && (
        <ChangePasswordModal
          userId={uid}
          onClose={() => setShowPassword(false)}
        />
      )}
    </div>
  );
}
