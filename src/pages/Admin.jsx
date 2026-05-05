import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Button from "../components/ui/Button";
import "../components/css/Admin.css";

// Shared helpers
function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body" style={{ padding: "24px 20px 16px" }}>
          <div className="confirm-icon">⚠️</div>
          <div className="confirm-msg">{message}</div>
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-val">{value ?? "—"}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// USERS TAB
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api
      .get("/users")
      .then((r) => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await api.patch(`/users/${userId}`, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (userId) => {
    const token = localStorage.getItem("token");
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      console.error(e);
    }
    setDeleting(null);
  };

  const ROLE_COLORS = {
    STANDARD: "badge-neutral",
    COMPETITOR: "badge-blue",
    ADMIN: "badge-red",
  };

  if (loading) return <div className="tab-loading">Loading users…</div>;

  return (
    <div>
      <div className="tab-toolbar">
        <div className="tab-count-label">{users.length} users total</div>
      </div>
      <div className="admin-table">
        <div className="admin-table-head">
          <div>ID</div>
          <div>Username</div>
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Actions</div>
        </div>
        {users.map((u) => (
          <div key={u.id} className="admin-table-row">
            <div className="td-id">#{u.id}</div>
            <div className="td-bold">{u.username}</div>
            <div>
              {u.firstname} {u.lastname}
            </div>
            <div className="td-muted">{u.email}</div>
            <div>
              <select
                className="role-select"
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
              >
                <option value="STANDARD">Standard</option>
                <option value="COMPETITOR">Competitor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <button
                className="action-btn danger"
                onClick={() => setDeleting(u)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {deleting && (
        <Confirm
          message={`Delete user "${deleting.username}"? This cannot be undone.`}
          onConfirm={() => handleDelete(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

//  COMPETITIONS TAB
function CompetitionsTab() {
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [participants, setParticipants] = useState({});
  const [deleting, setDeleting] = useState(null);

  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });

  useEffect(() => {
    api
      .get("/competitions")
      .then((r) => setComps(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchParticipants = async (compId) => {
    if (participants[compId]) {
      setExpanded(expanded === compId ? null : compId);
      return;
    }
    try {
      const res = await api.get(`/competitions/${compId}/leaderboard`);
      setParticipants((prev) => ({ ...prev, [compId]: res.data }));
      setExpanded(compId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await api.post("/competitions", form);
      setComps((prev) => [...prev, res.data]);
      setForm({ name: "", startDate: "", endDate: "" });
      setShowCreate(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/competitions/${id}`);
      setComps((prev) => prev.filter((c) => c.competitionId !== id));
    } catch (e) {
      console.error(e);
    }
    setDeleting(null);
  };

  const handleScoreUpdate = async (participantId, score, compId) => {
    try {
      await api.patch(
        `/competitions/participants/${participantId}/score?score=${score}`,
      );
      const res = await api.get(`/competitions/${compId}/leaderboard`);
      setParticipants((prev) => ({ ...prev, [compId]: res.data }));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="tab-loading">Loading competitions…</div>;

  return (
    <div>
      <div className="tab-toolbar">
        <div className="tab-count-label">{comps.length} competitions</div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          + New Competition
        </Button>
      </div>

      {showCreate && (
        <div className="create-form">
          <div className="create-form-title">New Competition</div>
          <div className="create-form-fields">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                placeholder="Competition name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                className="form-input"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                className="form-input"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={!form.name || !form.startDate || !form.endDate}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      <div className="admin-table">
        <div className="admin-table-head">
          <div>ID</div>
          <div>Name</div>
          <div>Start</div>
          <div>End</div>
          <div>Actions</div>
        </div>
        {comps.map((c) => (
          <div key={c.competitionId}>
            <div className="admin-table-row">
              <div className="td-id">#{c.competitionId}</div>
              <div className="td-bold">{c.name}</div>
              <div className="td-muted">{c.startDate}</div>
              <div className="td-muted">{c.endDate}</div>
              <div className="action-group">
                <button
                  className="action-btn"
                  onClick={() => fetchParticipants(c.competitionId)}
                >
                  {expanded === c.competitionId ? "Hide" : "Participants"}
                </button>
                <button
                  className="action-btn danger"
                  onClick={() => setDeleting(c)}
                >
                  Delete
                </button>
              </div>
            </div>

            {expanded === c.competitionId && participants[c.competitionId] && (
              <div className="participants-panel">
                <div className="participants-title">
                  Participants ({participants[c.competitionId].length})
                </div>
                {participants[c.competitionId].length === 0 ? (
                  <div className="td-muted" style={{ padding: "8px 0" }}>
                    No participants yet
                  </div>
                ) : (
                  participants[c.competitionId].map((p) => (
                    <div key={p.id} className="participant-row">
                      <span className="td-bold">{p.username}</span>
                      <div className="score-edit">
                        <input
                          className="score-input"
                          type="number"
                          defaultValue={p.score}
                          onBlur={(e) =>
                            handleScoreUpdate(
                              p.id,
                              Number(e.target.value),
                              c.competitionId,
                            )
                          }
                        />
                        <span className="td-muted">pts</span>
                      </div>
                      <span className="rank-badge">#{p.ranking}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {deleting && (
        <Confirm
          message={`Delete competition "${deleting.name}"?`}
          onConfirm={() => handleDelete(deleting.competitionId)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

//  EXERCISES TAB
function ExercisesTab() {
  const [exercises, setExercises] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "STRENGTH",
    difficulty: "BEGINNER",
    muscleGroupId: "",
  });

  useEffect(() => {
    Promise.all([api.get("/exercise"), api.get("/muscle-group")])
      .then(([exRes, mgRes]) => {
        setExercises(exRes.data);
        setMuscleGroups(mgRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    try {
      const res = await api.post("/exercise", form);
      setExercises((prev) => [...prev, res.data]);
      setForm({
        name: "",
        type: "STRENGTH",
        difficulty: "BEGINNER",
        muscleGroupId: "",
      });
      setShowCreate(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/exercise/${id}`);
      setExercises((prev) => prev.filter((e) => (e.exerciseid ?? e.id) !== id));
    } catch (e) {
      console.error(e);
    }
    setDeleting(null);
  };

  const DIFF_CLS = {
    BEGINNER: "badge-green",
    INTERMEDIATE: "badge-orange",
    ADVANCED: "badge-red",
  };

  if (loading) return <div className="tab-loading">Loading exercises…</div>;

  return (
    <div>
      <div className="tab-toolbar">
        <div className="tab-count-label">{exercises.length} exercises</div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          + New Exercise
        </Button>
      </div>

      {showCreate && (
        <div className="create-form">
          <div className="create-form-title">New Exercise</div>
          <div className="create-form-fields">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                placeholder="Exercise name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {["STRENGTH", "CARDIO", "FLEXIBILITY", "BALANCE"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                className="form-input"
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
              >
                {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Muscle Group</label>
              <select
                className="form-input"
                value={form.muscleGroupId}
                onChange={(e) =>
                  setForm({ ...form, muscleGroupId: e.target.value })
                }
              >
                <option value="">— None —</option>
                {muscleGroups.map((mg) => (
                  <option key={mg.muscleGroupId} value={mg.muscleGroupId}>
                    {mg.groupName ?? mg.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleCreate} disabled={!form.name}>
              Create
            </Button>
          </div>
        </div>
      )}

      <div className="admin-table">
        <div className="admin-table-head">
          <div>ID</div>
          <div>Name</div>
          <div>Type</div>
          <div>Difficulty</div>
          <div>Muscle Group</div>
          <div>Actions</div>
        </div>
        {exercises.map((e) => {
          const id = e.exerciseid ?? e.id;
          return (
            <div key={id} className="admin-table-row">
              <div className="td-id">#{id}</div>
              <div className="td-bold">{e.name}</div>
              <div className="td-muted">{e.type}</div>
              <div>
                <span
                  className={`badge ${DIFF_CLS[e.difficulty] ?? "badge-neutral"}`}
                >
                  {e.difficulty}
                </span>
              </div>
              <div className="td-muted">
                {e.muscleGroup?.name ?? e.muscleGroup?.groupName ?? "—"}
              </div>
              <div>
                <button
                  className="action-btn danger"
                  onClick={() => setDeleting({ id, name: e.name })}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {deleting && (
        <Confirm
          message={`Delete exercise "${deleting.name}"?`}
          onConfirm={() => handleDelete(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

// FOOD TAB
function FoodTab() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    foodName: "",
    caloriesPer100g: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
  });

  useEffect(() => {
    api
      .get("/food")
      .then((r) => setFoods(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    try {
      const res = await api.post("/food", {
        ...form,
        caloriesPer100g: Number(form.caloriesPer100g),
        proteinG: Number(form.proteinG),
        carbsG: Number(form.carbsG),
        fatG: Number(form.fatG),
      });
      setFoods((prev) => [...prev, res.data]);
      setForm({
        foodName: "",
        caloriesPer100g: "",
        proteinG: "",
        carbsG: "",
        fatG: "",
      });
      setShowCreate(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/food/${id}`);
      setFoods((prev) => prev.filter((f) => f.foodId !== id));
    } catch (e) {
      console.error(e);
    }
    setDeleting(null);
  };

  if (loading) return <div className="tab-loading">Loading foods…</div>;

  return (
    <div>
      <div className="tab-toolbar">
        <div className="tab-count-label">{foods.length} food items</div>
        <Button onClick={() => setShowCreate(!showCreate)}>+ Add Food</Button>
      </div>

      {showCreate && (
        <div className="create-form">
          <div className="create-form-title">New Food Item</div>
          <div className="create-form-fields">
            {[
              {
                key: "foodName",
                label: "Name",
                placeholder: "e.g. Chicken Breast",
                type: "text",
              },
              {
                key: "caloriesPer100g",
                label: "Calories/100g",
                placeholder: "165",
                type: "number",
              },
              {
                key: "proteinG",
                label: "Protein (g/100g)",
                placeholder: "31",
                type: "number",
              },
              {
                key: "carbsG",
                label: "Carbs (g/100g)",
                placeholder: "0",
                type: "number",
              },
              {
                key: "fatG",
                label: "Fat (g/100g)",
                placeholder: "3.6",
                type: "number",
              },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key} className="form-group">
                <label className="form-label">{label}</label>
                <input
                  className="form-input"
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <Button
              onClick={handleCreate}
              disabled={!form.foodName || !form.caloriesPer100g}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      <div className="admin-table">
        <div className="admin-table-head">
          <div>ID</div>
          <div>Name</div>
          <div>Kcal/100g</div>
          <div>Protein</div>
          <div>Carbs</div>
          <div>Fat</div>
          <div>Actions</div>
        </div>
        {foods.map((f) => (
          <div key={f.foodId} className="admin-table-row">
            <div className="td-id">#{f.foodId}</div>
            <div className="td-bold">{f.foodName}</div>
            <div>{f.caloriesPer100g}</div>
            <div className="td-muted">{f.proteinG ?? "—"}g</div>
            <div className="td-muted">{f.carbsG ?? "—"}g</div>
            <div className="td-muted">{f.fatG ?? "—"}g</div>
            <div>
              <button
                className="action-btn danger"
                onClick={() => setDeleting(f)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleting && (
        <Confirm
          message={`Delete "${deleting.foodName}" from food database?`}
          onConfirm={() => handleDelete(deleting.foodId)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

// MAIN ADMIN PAGE
const TABS = [
  { key: "overview", label: "📊 Overview" },
  { key: "users", label: "👥 Users" },
  { key: "competitions", label: "🏆 Competitions" },
  { key: "exercises", label: "🏋️ Exercises" },
  { key: "food", label: "🥗 Food" },
];

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({});

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      api.get("/users"),
      api.get("/competitions"),
      api.get("/exercise"),
      api.get("/food"),
    ])
      .then(([u, c, e, f]) => {
        setStats({
          users: u.data.length,
          competitions: c.data.length,
          exercises: e.data.length,
          food: f.data.length,
        });
      })
      .catch(console.error);
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="access-denied">
          <div className="ad-icon">🔒</div>
          <div className="ad-title">Access Denied</div>
          <div className="ad-sub">This area is for administrators only.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <div className="page-title">Admin Panel</div>
          <div className="page-sub">
            Logged in as <strong>{user?.username}</strong> · ADMIN
          </div>
        </div>
        <span className="admin-badge">ADMIN</span>
      </div>

      {/* Sidebar tabs + content */}
      <div className="admin-layout">
        <div className="admin-sidebar">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`admin-tab-btn${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="admin-content">
          {tab === "overview" && (
            <div>
              <div className="section-title" style={{ marginBottom: 16 }}>
                System Overview
              </div>
              <div className="stats-grid">
                <StatCard
                  icon="👥"
                  label="Total Users"
                  value={stats.users}
                  color="#e0f2fe"
                />
                <StatCard
                  icon="🏆"
                  label="Competitions"
                  value={stats.competitions}
                  color="#fef9c3"
                />
                <StatCard
                  icon="🏋️"
                  label="Exercises"
                  value={stats.exercises}
                  color="#dcfce7"
                />
                <StatCard
                  icon="🥗"
                  label="Food Items"
                  value={stats.food}
                  color="#fce7f3"
                />
              </div>
              <div className="overview-hint">
                <div className="hint-title">Quick Actions</div>
                <div className="hint-list">
                  {[
                    { icon: "👥", label: "Manage users & roles", tab: "users" },
                    {
                      icon: "🏆",
                      label: "Create & manage competitions",
                      tab: "competitions",
                    },
                    {
                      icon: "🏋️",
                      label: "Add & remove exercises",
                      tab: "exercises",
                    },
                    { icon: "🥗", label: "Manage food database", tab: "food" },
                  ].map((h) => (
                    <div
                      key={h.tab}
                      className="hint-item"
                      onClick={() => setTab(h.tab)}
                    >
                      <span className="hint-icon">{h.icon}</span>
                      <span>{h.label}</span>
                      <span className="hint-arrow">→</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === "users" && <UsersTab />}
          {tab === "competitions" && <CompetitionsTab />}
          {tab === "exercises" && <ExercisesTab />}
          {tab === "food" && <FoodTab />}
        </div>
      </div>
    </div>
  );
}
