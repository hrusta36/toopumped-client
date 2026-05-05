import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import Button from "../components/ui/Button";
import "../components/css/WorkoutPlanner.css";

const DIFFICULTY_VARIANT = {
  BEGINNER: "green",
  INTERMEDIATE: "orange",
  ADVANCED: "red",
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ActiveWorkout({
  workout,
  plan,
  userId,
  onFinish,
  onCancel,
}) {
  const [sessionId, setSessionId] = useState(null);
  const [exercises, setExercises] = useState([]); // workout exercises with details
  const [sessionExercises, setSessionExercises] = useState({}); // weId -> sessionExercise
  const [completedSets, setCompletedSets] = useState({}); // weId -> number of completed sets
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const timerRef = useRef(null);

  const wpId = plan?.wpId ?? plan?.id ?? plan?.wp_id;
  const workoutId = workout?.workoutId ?? workout?.id;

  // Start session on mount
  useEffect(() => {
    startSession();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const startSession = async () => {
    console.log("PLAN OBJECT:", JSON.stringify(plan));
    try {
      const res = await api.post(`/sessions/start/${wpId}`, {
        workoutId,
        userId,
      });
      const sid = res.data.sessionId;
      setSessionId(sid);
      await loadExercises(sid);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async (sid) => {
    // Load workout exercises
    const weRes = await api.get(`/workout-exercises/workout/${workoutId}`);
    const wes = weRes.data;
    console.log("WE response:", JSON.stringify(wes[0])); // log first exercise

    // Load exercise details for each
    const details = {};
    await Promise.all(
      wes.map(async (we) => {
        try {
          const ex = await api.get(`/exercise/${we.exerciseId}`);
          details[we.exerciseId] = ex.data;
        } catch {}
      }),
    );
    setExerciseDetails(details);

    // Create session exercise entries for each workout exercise
    const seMap = {};
    await Promise.all(
      wes.map(async (we) => {
        try {
          const seRes = await api.post("/session-exercises", {
            sessionId: sid,
            workoutExerciseId: we.weId ?? we.id ?? we.workoutExerciseId,
            completed: false,
          });
          seMap[we.weId ?? we.exerciseId] = seRes.data;
        } catch {}
      }),
    );
    setSessionExercises(seMap);
    setExercises(wes);
    // Initialize completed sets tracking
    const initSets = {};
    wes.forEach((we) => {
      initSets[we.weId ?? we.exerciseId] = 0;
    });
    setCompletedSets(initSets);
  };

  const handleLogSet = async (we) => {
    const weKey = we.weId ?? we.exerciseId;
    const current = completedSets[weKey] ?? 0;
    if (current >= we.sets) return;

    const next = current + 1;
    setCompletedSets((prev) => ({ ...prev, [weKey]: next }));

    // If all sets done, mark session exercise complete
    if (next === we.sets) {
      const se = sessionExercises[weKey];
      if (se?.id) {
        try {
          await api.patch(`/session-exercises/${se.id}/complete`);
        } catch {}
      }
    }
  };

  const handleFinish = async () => {
    if (!sessionId) return;
    setFinishing(true);
    try {
      const completedCount = exercises.filter((we) => {
        const key = we.weId ?? we.exerciseId;
        return (completedSets[key] ?? 0) >= we.sets;
      }).length;
      const xp = completedCount * 10 + Math.floor(elapsed / 60);
      const res = await api.post(`/sessions/end/${sessionId}?xp=${xp}`);
      onFinish(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setFinishing(false);
    }
  };

  const totalExercises = exercises.length;
  const fullyCompleted = exercises.filter((we) => {
    const key = we.weId ?? we.exerciseId;
    return (completedSets[key] ?? 0) >= we.sets;
  }).length;

  if (loading) {
    return (
      <div className="workout-planner">
        <div style={{ padding: 32, color: "var(--text2)" }}>
          Starting workout…
        </div>
      </div>
    );
  }

  return (
    <div className="workout-planner">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onCancel}>
          ✕ Cancel
        </button>
        <div>
          <div className="page-title">{workout.name}</div>
          <div className="page-sub">
            {fullyCompleted}/{totalExercises} exercises · ⏱{" "}
            {formatTime(elapsed)}
          </div>
        </div>
        <Button onClick={handleFinish} disabled={finishing}>
          {finishing ? "Saving…" : "Finish 🏁"}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="session-progress-bar">
        <div
          className="session-progress-fill"
          style={{
            width: totalExercises
              ? `${(fullyCompleted / totalExercises) * 100}%`
              : "0%",
          }}
        />
      </div>

      {/* Exercise cards */}
      {exercises.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏋️</div>
          <div className="empty-title">No exercises in this workout</div>
          <div className="empty-sub">Add exercises to your workout first</div>
        </div>
      ) : (
        <div className="exercise-grid">
          {exercises.map((we, i) => {
            const ex = exerciseDetails[we.exerciseId];
            const weKey = we.weId ?? we.exerciseId;
            const done = completedSets[weKey] ?? 0;
            const isComplete = done >= we.sets;

            return (
              <div
                key={weKey || i}
                className={`exercise-card${isComplete ? " exercise-card-done" : ""}`}
              >
                <div className="ex-top">
                  <span className="ex-order">#{i + 1}</span>
                  {isComplete && <span className="ex-done-badge">✓ Done</span>}
                </div>
                <div className="ex-name">
                  {ex?.name || `Exercise #${we.exerciseId}`}
                </div>
                <div className="ex-detail">
                  {we.sets} sets × {we.reps} reps
                </div>

                {/* Set tracker */}
                <div className="set-tracker">
                  {Array.from({ length: we.sets }).map((_, si) => (
                    <div
                      key={si}
                      className={`set-dot${si < done ? " set-dot-done" : ""}`}
                    />
                  ))}
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
                    {ex.muscleGroup?.name && (
                      <span className="badge badge-neutral">
                        {ex.muscleGroup.name}
                      </span>
                    )}
                  </div>
                )}

                <button
                  className={`log-set-btn${isComplete ? " log-set-btn-done" : ""}`}
                  onClick={() => handleLogSet(we)}
                  disabled={isComplete}
                >
                  {isComplete
                    ? "✓ All Sets Done"
                    : `Log Set (${done}/${we.sets})`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
