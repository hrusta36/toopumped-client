import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../components/css/Dashboard.css";

function formatRank(rank) {
  if (!rank) return "";
  return rank
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Dashboard() {
  const { user } = useAuth();
  const uid = user?.userId ?? user?.id;

  const [rankData, setRankData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!uid) return;

    // Rank
    api.get(`/rank/${uid}`).then((r) => setRankData(r.data));

    // Friends (limit 3)
    api.get(`/friends/${uid}`).then((r) =>
      setFriends(r.data.slice(0, 3))
    );

    // Competitions (limit 3 active)
    api.get("/competitions").then((r) =>
      setCompetitions(r.data.slice(0, 3))
    );

    // Plans (limit 3)
    api.get(`/workout-plan/user/${uid}`).then((r) =>
      setPlans(r.data.slice(0, 3))
    );
  }, [uid]);

  return (
    <div className="dashboard">
      {/* Welcome */}
      <div className="dashboard-header">
        <div>
          <div className="welcome-title">
            Welcome back, {user?.username}
          </div>
          <div className="welcome-sub">
            Ready to keep pushing today?
          </div>
        </div>
      </div>

      {/* Rank Progress */}
      {rankData && (
        <div className="rank-card">
          <div className="rank-top">
            <div className="rank-name">
              {formatRank(rankData.rank)}
            </div>
            <div className="rank-xp">
              {rankData.totalXp} XP
            </div>
          </div>

          <div className="rank-bar">
            <div
              className="rank-bar-fill"
              style={{
                width: `${rankData.progressPercent}%`,
              }}
            />
          </div>

          <div className="rank-bottom">
            <span>
              Progress to next rank: {rankData.nextRankXp} XP
            </span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Calories */}
        <div
          className="card clickable"
          onClick={() => (window.location.href = "/calories")}
        >
          <div className="card-title">Calories</div>
          <div className="calorie-wheel">
            <div className="calorie-inner">🔥</div>
          </div>
          <div className="card-hint">
            Click the wheel to track calories
          </div>
        </div>

        {/* Friends */}
        <div
          className="card clickable"
          onClick={() => (window.location.href = "/friends")}
        >
          <div className="card-title">Friends</div>

          <div className="mini-list">
            {friends.length === 0 ? (
              <div className="empty">No friends yet</div>
            ) : (
              friends.map((f, i) => (
                <div key={i} className="mini-item">
                  <div className="avatar">
                    {f.friendUsername?.[0]?.toUpperCase()}
                  </div>
                  <span>{f.friendUsername}</span>
                </div>
              ))
            )}
          </div>

          <div className="card-hint">View all friends →</div>
        </div>

        {/* Competitions */}
        <div
          className="card clickable"
          onClick={() => (window.location.href = "/competitions")}
        >
          <div className="card-title">Competitions</div>

          <div className="mini-list">
            {competitions.length === 0 ? (
              <div className="empty">No competitions</div>
            ) : (
              competitions.map((c, i) => (
                <div key={i} className="mini-item">
                  🏆 {c.name}
                </div>
              ))
            )}
          </div>

          <div className="card-hint">View competitions →</div>
        </div>

        {/* Workout Plans */}
        <div
          className="card clickable"
          onClick={() => (window.location.href = "/workout-planner")}
        >
          <div className="card-title">Workout Plans</div>

          <div className="mini-list">
            {plans.length === 0 ? (
              <div className="empty">No plans yet</div>
            ) : (
              plans.map((p, i) => (
                <div key={i} className="mini-item">
                  📋 {p.name}
                </div>
              ))
            )}
          </div>

          <div className="card-hint">Manage plans →</div>
        </div>
      </div>
    </div>
  );
}