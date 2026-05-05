import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Button from "../components/ui/Button";
import "../components/css/WorkoutLibrary.css";

function AddToPlanModal({ workout, userId, onClose }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    api
      .get(`/workout-plan/user/${userId}`)
      .then((r) => setPlans(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAdd = async (plan) => {
    const planId = plan.wpId ?? plan.id;
    setAdding(planId);
    try {
      // 1. Create a new workout under the user (linked to this plan context)
      const newWorkoutRes = await api.post("/workout", {
        name: workout.name,
        userId,
      });
      const newWorkoutId =
        newWorkoutRes.data.workoutId ?? newWorkoutRes.data.id;

      // 2. Fetch the source workout's exercises
      const sourceWorkoutId = workout.workoutId ?? workout.id;
      const weRes = await api.get(
        `/workout-exercises/workout/${sourceWorkoutId}`,
      );
      const exercises = weRes.data;

      // 3. Copy each exercise into the new workout
      await Promise.all(
        exercises.map((ex) =>
          api.post("/workout-exercises", {
            workoutId: newWorkoutId,
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            orderIndex: ex.orderIndex ?? 0,
          }),
        ),
      );

      onClose(true, plan);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Add "{workout.name}" to Plan</div>
          <button className="modal-close" onClick={() => onClose(false)}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div style={{ color: "var(--text2)", padding: 16 }}>
              Loading plans…
            </div>
          ) : plans.length === 0 ? (
            <div style={{ color: "var(--text2)", padding: 16 }}>
              You have no plans yet. Create one in the Workout Planner first.
            </div>
          ) : (
            <div className="exercise-list">
              {plans.map((plan) => {
                const planId = plan.wpId ?? plan.id;
                return (
                  <div
                    key={planId}
                    className="exercise-list-item"
                    style={{ justifyContent: "space-between" }}
                  >
                    <div>
                      <div className="exercise-list-name">{plan.name}</div>
                      <div className="exercise-list-meta">
                        {plan.duration} weeks
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAdd(plan)}
                      disabled={adding === planId}
                      style={{ fontSize: 12 }}
                    >
                      {adding === planId ? "Adding…" : "Add"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={() => onClose(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WorkoutLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const uid = user?.userId ?? user?.id;

  useEffect(() => {
    api
      .get("/workout")
      .then((r) => setWorkouts(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = workouts.filter((w) =>
    (w.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleModalClose = (success, plan) => {
    setSelectedWorkout(null);
    if (success && plan) {
      navigate("/workout", { state: { openPlan: plan } });
    } else if (success) {
      setSuccessMsg("Workout added to plan!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  if (loading) return <div className="wl-loading">Loading workouts...</div>;

  return (
    <div className="wl-container">
      <div className="wl-header">
        <h1>Workout Library</h1>
        <input
          className="wl-search"
          placeholder="Search workouts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {successMsg && (
        <div
          style={{
            background: "var(--green, #22c55e)",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      <div className="wl-grid">
        {filtered.map((workout, index) => {
          const id = workout.workoutId || workout.id || index;
          return (
            <div key={id} className="wl-card">
              <div className="wl-card-title">
                {workout.name || "Unnamed Workout"}
              </div>
              <div className="wl-card-meta">
                Created by User #{workout.userId ?? "unknown"}
              </div>
              <div className="wl-card-footer">
                <Button onClick={() => setSelectedWorkout(workout)}>
                  Add to Plan
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="wl-empty">No workouts found</div>
      )}

      {selectedWorkout && (
        <AddToPlanModal
          workout={selectedWorkout}
          userId={uid}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
