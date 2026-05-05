import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import "../components/css/WorkoutPlanner.css";
import ActiveWorkout from "./ActiveWorkout";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const DAY_LABELS = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};
const DIFFICULTY_VARIANT = {
  BEGINNER: "green",
  INTERMEDIATE: "orange",
  ADVANCED: "red",
};

// Modal: Create Workout Plan
function CreatePlanModal({ onClose, onCreated, userId }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(4);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/workout-plan", {
        userId,
        name,
        duration,
        days: [],
      });
      onCreated(res.data);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">New Workout Plan</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Plan Name</label>
            <input
              className="form-input"
              placeholder="e.g. Push Day A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Duration (weeks)</label>
            <input
              className="form-input"
              type="number"
              min={1}
              max={52}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? "Creating…" : "Create Plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Modal: Create Workout (inside a plan)
function CreateWorkoutModal({ onClose, onCreated, userId }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/workout", { name, userId });
      onCreated(res.data);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">New Workout</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Workout Name</label>
            <input
              className="form-input"
              placeholder="e.g. Push Day A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Modal: Add Exercise to Workout
function AddExerciseModal({ workoutId, onClose, onAdded }) {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/exercise")
      .then((r) => setExercises(r.data))
      .catch(console.error);
  }, []);

  const filtered = exercises.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await api.post("/workout-exercises", {
        workoutId,
        exerciseId: selected.exerciseid,
        sets,
        reps,
        orderIndex: 0,
      });
      onAdded({ ...res.data, exercise: selected });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Add Exercise</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <input
            className="form-input"
            placeholder="Search exercises…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="exercise-list">
            {filtered.map((ex) => (
              <div
                key={ex.exerciseid}
                className={`exercise-list-item${selected?.exerciseid === ex.exerciseid ? " selected" : ""}`}
                onClick={() => setSelected(ex)}
              >
                <div>
                  <div className="exercise-list-name">{ex.name}</div>
                  <div className="exercise-list-meta">
                    {ex.type} · {ex.difficulty}
                    {ex.muscleGroup?.name ? ` · ${ex.muscleGroup.name}` : ""}
                  </div>
                </div>
                {selected?.exerciseid === ex.exerciseid && (
                  <span className="check">✓</span>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text2)",
                  fontSize: 13,
                }}
              >
                No exercises found
              </div>
            )}
          </div>
          {selected && (
            <div className="sets-reps-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Sets</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={10}
                  value={sets}
                  onChange={(e) => setSets(Number(e.target.value))}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Reps</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={100}
                  value={reps}
                  onChange={(e) => setReps(Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selected || loading}>
            {loading ? "Adding…" : "Add Exercise"}
          </Button>
        </div>
      </div>
    </div>
  );
}

//  Workout Detail View
function WorkoutDetail({ workout, onBack, userId }) {
  const [exercises, setExercises] = useState([]);
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, [workout]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/workout-exercises/workout/${workout.workoutId || workout.id}`,
      );
      setExercises(res.data);
      // tyler durden - fetch exercise details for each
      const details = {};
      await Promise.all(
        res.data.map(async (we) => {
          try {
            const ex = await api.get(`/exercise/${we.exerciseId}`);
            details[we.exerciseId] = ex.data;
          } catch {}
        }),
      );
      setExerciseDetails(details);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (weId) => {
    try {
      await api.delete(`/workout-exercises/${weId}`);
      setExercises((prev) => prev.filter((e) => e.id !== weId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdded = (we) => {
    setExercises((prev) => [...prev, we]);
    if (we.exercise) {
      setExerciseDetails((prev) => ({ ...prev, [we.exerciseId]: we.exercise }));
    }
  };

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <div>
          <div className="page-title">{workout.name}</div>
          <div className="page-sub">
            {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>+ Add Exercise</Button>
      </div>

      {loading ? (
        <div style={{ padding: 32, color: "var(--text2)" }}>Loading…</div>
      ) : exercises.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏋️</div>
          <div className="empty-title">No exercises yet</div>
          <div className="empty-sub">Add exercises to build this workout</div>
          <Button onClick={() => setShowAddModal(true)}>+ Add Exercise</Button>
        </div>
      ) : (
        <div className="exercise-grid">
          {exercises.map((we, i) => {
            const ex = exerciseDetails[we.exerciseId];
            return (
              <div key={we.id || i} className="exercise-card">
                <div className="ex-top">
                  <span className="ex-order">#{i + 1}</span>
                  <button
                    className="ex-delete"
                    onClick={() => handleDelete(we.id)}
                  >
                    ✕
                  </button>
                </div>
                <div className="ex-name">
                  {ex?.name || `Exercise #${we.exerciseId}`}
                </div>
                <div className="ex-detail">
                  {we.sets} sets × {we.reps} reps
                </div>
                {ex && (
                  <div className="ex-tags">
                    {ex.difficulty && (
                      <span
                        className={`badge badge-${DIFFICULTY_VARIANT[ex.difficulty] || "neutral"}`}
                      >
                        {ex.difficulty}
                      </span>
                    )}
                    {ex.type && (
                      <span className="badge badge-blue">{ex.type}</span>
                    )}
                    {ex.muscleGroup?.name && (
                      <span className="badge badge-neutral">
                        {ex.muscleGroup.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddExerciseModal
          workoutId={workout.workoutId || workout.id}
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}

// Plan Detail View
function PlanDetail({ plan, onBack, userId }) {
  const [workouts, setWorkouts] = useState([]);
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeWorkout, setActiveWorkout] = useState(null);

  useEffect(() => {
    fetchWorkouts();
  }, [plan]);

  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/workout");
      console.log("All workouts:", res.data);
      console.log("userId filter:", userId);
      const myWorkouts = res.data.filter(
        (w) => String(w.userId) === String(userId),
      );
      console.log("My workouts:", myWorkouts);
      setWorkouts(myWorkouts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (activeWorkout) {
    return (
      <ActiveWorkout
        workout={activeWorkout}
        plan={plan}
        userId={userId}
        onFinish={() => setActiveWorkout(null)}
        onCancel={() => setActiveWorkout(null)}
      />
    );
  }

  if (selectedWorkout) {
    return (
      <WorkoutDetail
        workout={selectedWorkout}
        onBack={() => setSelectedWorkout(null)}
        userId={userId}
      />
    );
  }

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <div>
          <div className="page-title">{plan.name}</div>
          <div className="page-sub">
            {plan.duration} weeks · {workouts.length} workouts
          </div>
        </div>
        <Button onClick={() => setShowCreateWorkout(true)}>
          + New Workout
        </Button>
      </div>

      {loading ? (
        <div style={{ padding: 32, color: "var(--text2)" }}>Loading…</div>
      ) : workouts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No workouts yet</div>
          <div className="empty-sub">
            Create your first workout for this plan
          </div>
          <Button onClick={() => setShowCreateWorkout(true)}>
            + New Workout
          </Button>
        </div>
      ) : (
        <div className="plans-grid">
          {workouts.map((w) => (
            <div
              key={w.workoutId || w.id}
              className="plan-card"
              onClick={() => setSelectedWorkout(w)}
            >
              <div className="plan-card-name">{w.name}</div>
              <div className="plan-card-meta">
                {w.exercises?.length ?? 0} exercises
              </div>
              <div className="plan-card-footer">
                <Button variant="ghost" style={{ width: "100%", fontSize: 12 }}>
                  View Exercises →
                </Button>
                <Button
                  style={{ flex: 1, fontSize: 12 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveWorkout(w);
                  }}
                >
                  ▶ Start
                </Button>
              </div>
            </div>
          ))}
          <div
            className="plan-card plan-card-add"
            onClick={() => setShowCreateWorkout(true)}
          >
            <div className="plan-card-add-inner">
              <div style={{ fontSize: 28, marginBottom: 6 }}>+</div>
              <div style={{ fontSize: 13 }}>New Workout</div>
            </div>
          </div>
        </div>
      )}

      {showCreateWorkout && (
        <CreateWorkoutModal
          userId={userId}
          onClose={() => setShowCreateWorkout(false)}
          onCreated={(w) => {
            setWorkouts((prev) => [...prev, w]);
            setShowCreateWorkout(false);
          }}
        />
      )}
    </div>
  );
}

// Sessions / History Tab
function HistoryTab({ userId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/sessions/user/${userId}`)
      .then((r) => setSessions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading)
    return <div style={{ padding: 32, color: "var(--text2)" }}>Loading…</div>;

  if (sessions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <div className="empty-title">No sessions yet</div>
        <div className="empty-sub">Start a workout to track your history</div>
      </div>
    );
  }

  return (
    <div className="history-list">
      {sessions.map((s, i) => (
        <div key={s.id || i} className="history-item">
          <div className="history-dot" />
          <div className="history-content">
            <div className="history-name">Session #{s.id}</div>
            <div className="history-meta">
              {s.startTime && (
                <span>{new Date(s.startTime).toLocaleDateString()}</span>
              )}
              {s.xp && <span className="history-xp">+{s.xp} XP</span>}
            </div>
          </div>
          <span
            className={`badge ${s.endTime ? "badge-green" : "badge-orange"}`}
          >
            {s.endTime ? "Done" : "Active"}
          </span>
        </div>
      ))}
    </div>
  );
}

// Main Workout Planner
export default function WorkoutPlanner() {
  const { user } = useAuth();
  const [tab, setTab] = useState("plans");
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const uid = user?.userId ?? user?.id;

  useEffect(() => {
    if (!uid) return;

    setLoading(true);

    api
      .get(`/workout-plan/user/${uid}`)
      .then((r) => setPlans(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [uid]);

  useEffect(() => {
    if (location.state?.openPlan && plans.length > 0) {
      const target = plans.find(
        (p) =>
          (p.wpId ?? p.id) ===
          (location.state.openPlan.wpId ?? location.state.openPlan.id),
      );
      if (target) setSelectedPlan(target);
    }
  }, [plans, location.state]);

  useEffect(() => {
    if (!location.state?.openPlan || plans.length === 0) return;

    const target = plans.find(
      (p) =>
        (p.wpId ?? p.id) ===
        (location.state.openPlan.wpId ?? location.state.openPlan.id),
    );
    if (target) setSelectedPlan(target);
  }, [plans, location.state]);

  const handleDeletePlan = async (planId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/workout-plan/${planId}`);
      setPlans((prev) => prev.filter((p) => (p.id ?? p.wpId) !== planId));
    } catch (err) {
      console.error(err);
    }
  };

  if (selectedPlan) {
    return (
      <div className="workout-planner">
        <PlanDetail
          plan={selectedPlan}
          onBack={() => setSelectedPlan(null)}
          userId={uid}
        />
      </div>
    );
  }

  return (
    <div className="workout-planner">
      <div className="wp-header">
        <div>
          <div className="page-title">Workout Planner</div>
          <div className="page-sub">Build and manage your training plans</div>
        </div>
        <Button onClick={() => setShowCreatePlan(true)}>+ New Plan</Button>
      </div>

      <div className="tab-bar">
        <button
          className={`tab-btn${tab === "plans" ? " active" : ""}`}
          onClick={() => setTab("plans")}
        >
          My Plans
        </button>
        <button
          className={`tab-btn${tab === "history" ? " active" : ""}`}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </div>

      {tab === "plans" && (
        <>
          {loading ? (
            <div style={{ padding: 32, color: "var(--text2)" }}>Loading…</div>
          ) : (
            <div className="plans-grid">
              {plans.map((plan, index) => {
                const planId = plan.id ?? plan.wpId ?? `fallback-${index}`;

                return (
                  <div
                    key={planId}
                    className="plan-card"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <button
                      className="plan-card-delete"
                      onClick={(e) => handleDeletePlan(planId, e)}
                    >
                      ✕
                    </button>

                    <div className="plan-card-name">{plan.name}</div>
                    <div className="plan-card-meta">{plan.duration} weeks</div>

                    <div className="plan-card-footer">
                      <Button
                        variant="ghost"
                        style={{ width: "100%", fontSize: 12 }}
                      >
                        Open Plan →
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div
                className="plan-card plan-card-add"
                onClick={() => setShowCreatePlan(true)}
              >
                <div className="plan-card-add-inner">
                  <div style={{ fontSize: 28 }}>+</div>
                  <div style={{ fontSize: 13 }}>New Plan</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "history" && <HistoryTab userId={uid} />}

      {showCreatePlan && (
        <CreatePlanModal
          userId={uid}
          onClose={() => setShowCreatePlan(false)}
          onCreated={(plan) => {
            setPlans((prev) => [...prev, plan]);
            setShowCreatePlan(false);
          }}
        />
      )}
    </div>
  );
}
