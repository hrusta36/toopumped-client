import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Button from "../components/ui/Button";
import "../components/css/CalorieTracker.css";

function toDateParam(date) {
  return date.toISOString().split("T")[0];
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// tyler durden - Circular progress ring
function CalorieRing({ consumed, goal }) {
  const R = 44;
  const circ = 2 * Math.PI * R;
  const pct = Math.min(consumed / (goal || 2000), 1);
  const offset = circ * (1 - pct);
  const over = consumed > goal;

  return (
    <svg
      width="110"
      height="110"
      viewBox="0 0 110 110"
      className="calorie-ring"
    >
      <circle
        cx="55"
        cy="55"
        r={R}
        fill="none"
        stroke="var(--bg2)"
        strokeWidth="10"
      />
      <circle
        cx="55"
        cy="55"
        r={R}
        fill="none"
        stroke={over ? "#dc2626" : "var(--accent)"}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s" }}
        transform="rotate(-90 55 55)"
      />
    </svg>
  );
}

// tyler durden - Macro progress bar
function MacroBar({ label, current, goal, color }) {
  const pct = Math.min((current / (goal || 1)) * 100, 100);
  return (
    <div className="macro-bar">
      <div className="macro-info">
        <span className="macro-label">{label}</span>
        <span className="macro-val">
          {Number(current).toFixed(0)} / {goal}g
        </span>
      </div>
      <div className="progress-wrap">
        <div
          className="progress-bar"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// tyler durden - Edit Goals Modal
function EditGoalsModal({ tracker, userId, date, onClose, onUpdated }) {
  const [calories, setCalories] = useState(
    Number(tracker?.caloriesGoal || 2000),
  );
  const [protein, setProtein] = useState(Number(tracker?.proteinGoal || 180));
  const [carbs, setCarbs] = useState(Number(tracker?.carbsGoal || 200));
  const [fat, setFat] = useState(Number(tracker?.fatGoal || 60));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/calories/${userId}/goals?date=${date}`, {
        caloriesGoal: calories,
        proteinGoal: protein,
        carbsGoal: carbs,
        fatGoal: fat,
      });
      onUpdated(res.data);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Edit Goals</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="goals-grid">
            <div className="form-group">
              <label className="form-label">🔥 Calories (kcal)</label>
              <input
                className="form-input"
                type="number"
                min={500}
                max={10000}
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">🥩 Protein (g)</label>
              <input
                className="form-input"
                type="number"
                min={0}
                max={500}
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">🌾 Carbs (g)</label>
              <input
                className="form-input"
                type="number"
                min={0}
                max={1000}
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">🥑 Fat (g)</label>
              <input
                className="form-input"
                type="number"
                min={0}
                max={300}
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="goals-preview">
            <div className="goals-preview-title">Macro split</div>
            <div className="goals-preview-bars">
              {[
                { label: "P", val: protein * 4, color: "var(--blue)" },
                { label: "C", val: carbs * 4, color: "var(--green)" },
                { label: "F", val: fat * 9, color: "var(--accent)" },
              ].map((m) => {
                const total = protein * 4 + carbs * 4 + fat * 9 || 1;
                const pct = Math.round((m.val / total) * 100);
                return (
                  <div key={m.label} className="goals-preview-row">
                    <span className="goals-preview-label">{m.label}</span>
                    <div className="progress-wrap" style={{ flex: 1 }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${pct}%`,
                          background: m.color,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                    <span className="goals-preview-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="goals-preview-note">
              {protein * 4 + carbs * 4 + fat * 9} kcal from macros
              {Math.abs(protein * 4 + carbs * 4 + fat * 9 - calories) > 50 && (
                <span className="goals-preview-warn">
                  {" "}
                  ⚠ doesn't match calorie goal
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Goals"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// tyler durden - Log Food Modal
function LogFoodModal({ userId, date, onClose, onAdded }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searchTimer, setSearchTimer] = useState(null);

  // tyler durden - Load all foods on mount for instant browsing
  useEffect(() => {
    api
      .get("/food")
      .then((r) => setResults(r.data))
      .catch(console.error);
  }, []);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      // tyler durden - reset to all foods
      api
        .get("/food")
        .then((r) => setResults(r.data))
        .catch(console.error);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/food/search?query=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch (e) {
      setResults((prev) =>
        prev.filter((f) => f.foodName?.toLowerCase().includes(q.toLowerCase())),
      );
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => search(val), 400));
  };

  const estimatedCals = selected
    ? Math.round((selected.caloriesPer100g * quantity) / 100)
    : 0;

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    try {
      let foodId = selected.foodId;

      // tyler durden - USDA result (not yet in DB) — import it first to get a local foodId
      if (!foodId && selected.fdcId) {
        const importRes = await api.post(`/food/import/${selected.fdcId}`);
        foodId = importRes.data.foodId;
      }

      if (!foodId) throw new Error("Could not resolve foodId");

      const res = await api.post(
        `/calories/${userId}/add?date=${toDateParam(date)}`,
        { foodId, quantity },
      );
      //tyler durden - backend returns CalorieLogDto with pre-calculated macros
      onAdded(res.data);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Log Food</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Search food</label>
            <input
              className="form-input"
              placeholder="e.g. chicken breast, oatmeal…"
              value={query}
              onChange={handleQueryChange}
              autoFocus
            />
          </div>

          {searching && (
            <div className="search-status">Searching USDA database…</div>
          )}

          {results.length > 0 && (
            <div className="food-search-list">
              {results.map((f) => (
                <div
                  key={f.foodId ?? f.fdcId ?? f.foodName}
                  className={`food-search-item${selected === f ? " selected" : ""}`}
                  onClick={() => setSelected(f)}
                >
                  <div>
                    <div className="food-search-name">{f.foodName}</div>
                    <div className="food-search-meta">
                      {f.caloriesPer100g} kcal/100g
                      {f.proteinG != null &&
                        ` · P: ${Number(f.proteinG).toFixed(0)}g`}
                      {f.carbsG != null &&
                        ` · C: ${Number(f.carbsG).toFixed(0)}g`}
                      {f.fatG != null && ` · F: ${Number(f.fatG).toFixed(0)}g`}
                    </div>
                  </div>
                  {selected === f && <span className="check">✓</span>}
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="quantity-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Quantity (g)</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={2000}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="calorie-preview">
                <div className="calorie-preview-val">{estimatedCals}</div>
                <div className="calorie-preview-label">kcal</div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selected || adding}>
            {adding ? "Logging…" : "Log Food"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main CalorieTracker
export default function CalorieTracker() {
  const { user } = useAuth();
  const uid = user?.userId ?? user?.id;

  const [date, setDate] = useState(new Date());
  const [tracker, setTracker] = useState(null); // CalorieTracker entity
  const [logs, setLogs] = useState([]); // local log state
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditGoals, setShowEditGoals] = useState(false);
  const [weekData, setWeekData] = useState([]);

  const fetchTracker = useCallback(
    async (d) => {
      if (!uid) return;
      setLoading(true);
      try {
        const dateParam = toDateParam(d);
        const [trackerRes, logsRes] = await Promise.all([
          api.get(`/calories/${uid}?date=${dateParam}`),
          api.get(`/calories/${uid}/logs?date=${dateParam}`),
        ]);
        setTracker(trackerRes.data);

        setLogs(logsRes.data);
      } catch (e) {
        console.error("[CalorieTracker] fetchTracker error:", e);
        setTracker(null);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [uid],
  );

  const fetchWeek = useCallback(async () => {
    if (!uid) return;
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    const results = await Promise.allSettled(
      days.map((d) =>
        api
          .get(`/calories/${uid}?date=${toDateParam(d)}`)
          .then((r) => ({ date: d, calories: r.data.totalCalories || 0 }))
          .catch(() => ({ date: d, calories: 0 })),
      ),
    );
    setWeekData(results.map((r) => r.value || { calories: 0 }));
  }, [uid]);

  useEffect(() => {
    fetchTracker(date);
  }, [date, fetchTracker]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  const handleAdded = (log) => {
    setLogs((prev) => [...prev, log]);

    fetchTracker(date);
    fetchWeek();
  };

  const handleRemove = async (logId) => {
    try {
      await api.delete(`/calories/${uid}/remove/${logId}`);
      setLogs((prev) => prev.filter((l) => l.clId !== logId));
      // Re-fetch tracker so totals reflect backend subtraction
      fetchTracker(date);
      fetchWeek();
    } catch (e) {
      console.error(e);
    }
  };

  const goDay = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    if (d <= new Date()) setDate(d);
  };

  const consumed = Number(tracker?.totalCalories || 0);
  const goal = Number(tracker?.caloriesGoal || 2000);
  const remaining = goal - consumed;
  const totalProtein = Number(tracker?.totalProtein || 0);
  const totalCarbs = Number(tracker?.totalCarbs || 0);
  const totalFat = Number(tracker?.totalFat || 0);
  const proteinGoal = Number(tracker?.proteinGoal || 180);
  const carbsGoal = Number(tracker?.carbsGoal || 200);
  const fatGoal = Number(tracker?.fatGoal || 60);

  const isToday = toDateParam(date) === toDateParam(new Date());
  const maxWeekCal = Math.max(
    ...weekData.map((d) => Number(d.calories)),
    goal,
    1,
  );

  return (
    <div className="calorie-tracker">
      {/* Header */}
      <div className="ct-header">
        <div>
          <div className="page-title">Calorie Tracker</div>
          <div className="page-sub">
            {formatDate(date)} · Goal: {goal.toLocaleString()} kcal
          </div>
        </div>
        <div className="ct-header-right">
          <div className="date-nav">
            <button className="date-nav-btn" onClick={() => goDay(-1)}>
              ‹
            </button>
            <span className="date-nav-label">
              {isToday
                ? "Today"
                : date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
            </span>
            <button
              className="date-nav-btn"
              onClick={() => goDay(1)}
              disabled={isToday}
            >
              ›
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" onClick={() => setShowEditGoals(true)}>
              ✎ Goals
            </Button>
            <Button onClick={() => setShowModal(true)}>+ Log Food</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="ct-loading">Loading…</div>
      ) : (
        <>
          {/* Top row: overview + meals */}
          <div className="ct-row-2">
            {/* Daily Overview card */}
            <div className="ct-card">
              <div className="ct-card-title">Daily Overview</div>
              <div className="calorie-center">
                <div
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CalorieRing consumed={consumed} goal={goal} />
                  <div className="ring-label">
                    <div className="ring-val">{consumed.toLocaleString()}</div>
                    <div className="ring-sub">kcal</div>
                  </div>
                </div>
                <div className="calorie-stats">
                  <div className="stat-row">
                    <span className="stat-label">Goal</span>
                    <span className="stat-val">{goal.toLocaleString()}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Consumed</span>
                    <span className="stat-val accent">
                      {consumed.toLocaleString()}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">
                      {remaining >= 0 ? "Remaining" : "Over"}
                    </span>
                    <span
                      className={`stat-val ${remaining >= 0 ? "green" : "red"}`}
                    >
                      {Math.abs(remaining).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="macros">
                <MacroBar
                  label="Protein"
                  current={totalProtein}
                  goal={proteinGoal}
                  color="var(--blue)"
                />
                <MacroBar
                  label="Carbs"
                  current={totalCarbs}
                  goal={carbsGoal}
                  color="var(--green)"
                />
                <MacroBar
                  label="Fat"
                  current={totalFat}
                  goal={fatGoal}
                  color="var(--accent)"
                />
              </div>
            </div>

            {/* Today's Meals card */}
            <div className="ct-card">
              <div className="ct-card-title">Today's Meals</div>
              {logs.length === 0 ? (
                <div className="empty-meals">
                  <div className="empty-icon">🥗</div>
                  <div className="empty-title">Nothing logged yet</div>
                  <div className="empty-sub">
                    Tap "+ Log Food" to add what you ate
                  </div>
                </div>
              ) : (
                <div className="food-list">
                  {logs.map((log, i) => (
                    <div key={log.clId ?? i} className="food-item">
                      <div className="food-item-info">
                        <div className="food-name">{log.foodName}</div>
                        <div className="food-qty">{log.quantity}g</div>
                      </div>
                      <div className="food-item-right">
                        <span className="food-kcal">{log.calories}</span>
                        <button
                          className="food-remove"
                          onClick={() => handleRemove(log.clId)}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="food-total">
                    <span>Total</span>
                    <span className="food-total-val">
                      {consumed.toLocaleString()} kcal
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Weekly bar chart */}
          <div className="ct-card">
            <div className="ct-card-title">Weekly Calories</div>
            <div className="week-chart">
              {weekData.map((d, i) => {
                const cal = Number(d.calories);
                const heightPct = (cal / maxWeekCal) * 100;
                const isOver = cal > goal;
                const dayLabel = ["S", "M", "T", "W", "T", "F", "S"][
                  d.date?.getDay() ?? i
                ];
                return (
                  <div key={i} className="week-bar-col">
                    <div className="week-bar-wrap">
                      <div
                        className="week-bar"
                        style={{
                          height: `${Math.max(heightPct, cal > 0 ? 4 : 0)}%`,
                          background: isOver ? "#dc2626" : "var(--accent)",
                          opacity: i === weekData.length - 1 ? 1 : 0.65,
                        }}
                        title={`${cal.toLocaleString()} kcal`}
                      />
                    </div>
                    <div className="week-bar-label">{dayLabel}</div>
                    {cal > 0 && (
                      <div className="week-bar-val">
                        {cal > 999 ? `${(cal / 1000).toFixed(1)}k` : cal}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* goal line */}
              <div
                className="week-goal-line"
                style={{ bottom: `${(goal / maxWeekCal) * 100}%` }}
                title={`Goal: ${goal} kcal`}
              />
            </div>
          </div>
        </>
      )}

      {showEditGoals && (
        <EditGoalsModal
          tracker={tracker}
          userId={uid}
          date={toDateParam(date)}
          onClose={() => setShowEditGoals(false)}
          onUpdated={(updated) => {
            setTracker(updated);
            setShowEditGoals(false);
          }}
        />
      )}

      {showModal && (
        <LogFoodModal
          userId={uid}
          date={date}
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
