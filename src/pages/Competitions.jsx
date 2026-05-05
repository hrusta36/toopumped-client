import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Button from "../components/ui/Button";
import "../components/css/Competitions.css";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatus(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

const STATUS_CONFIG = {
  active: { label: "Live", cls: "status-live" },
  upcoming: { label: "Upcoming", cls: "status-upcoming" },
  ended: { label: "Ended", cls: "status-ended" },
};

// Competition Detail / Leaderboard 
function CompetitionDetail({ competition, userId, onBack, onJoined }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const isParticipant = leaderboard.some((p) => p.userId === userId);
  const myEntry = leaderboard.find((p) => p.userId === userId);
  const status = getStatus(competition.startDate, competition.endDate);
  const statusCfg = STATUS_CONFIG[status];

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/competitions/${competition.competitionId}/leaderboard`,
      );
      setLeaderboard(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [competition.competitionId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleJoin = async () => {
    setJoining(true);
    setJoinError("");
    try {
      await api.post(`/competitions/${competition.competitionId}/join`);
      await fetchLeaderboard();
      onJoined?.();
    } catch (e) {
      setJoinError(
        e.response?.data?.message ??
          "Already joined or competition unavailable.",
      );
    } finally {
      setJoining(false);
    }
  };

  const medalIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="comp-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div className="page-title">{competition.name}</div>
          <div className="page-sub">
            {formatDate(competition.startDate)} →{" "}
            {formatDate(competition.endDate)}
            &nbsp;·&nbsp;{leaderboard.length} participant
            {leaderboard.length !== 1 ? "s" : ""}
          </div>
        </div>
        <span className={`status-pill ${statusCfg.cls}`}>
          {statusCfg.label}
        </span>
        {!isParticipant && status !== "ended" && (
          <Button onClick={handleJoin} disabled={joining}>
            {joining ? "Joining…" : "⚡ Join"}
          </Button>
        )}
        {isParticipant && (
          <div className="my-rank-badge">
            {medalIcon(myEntry?.ranking ?? "?")} My Rank
          </div>
        )}
      </div>

      {joinError && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          {joinError}
        </div>
      )}

      {/* My stats bar */}
      {isParticipant && myEntry && (
        <div className="my-stats-bar">
          <div className="my-stats-item">
            <div className="my-stats-val">{medalIcon(myEntry.ranking)}</div>
            <div className="my-stats-label">Rank</div>
          </div>
          <div className="my-stats-divider" />
          <div className="my-stats-item">
            <div className="my-stats-val">{myEntry.score ?? 0}</div>
            <div className="my-stats-label">Score</div>
          </div>
          <div className="my-stats-divider" />
          <div className="my-stats-item">
            <div className="my-stats-val">{leaderboard.length}</div>
            <div className="my-stats-label">Competitors</div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="leaderboard-card">
        <div className="leaderboard-title">Leaderboard</div>
        {loading ? (
          <div className="comp-loading">Loading…</div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏁</div>
            <div className="empty-title">No participants yet</div>
            <div className="empty-sub">Be the first to join!</div>
          </div>
        ) : (
          <div className="leaderboard-list">
            {leaderboard.map((p, i) => {
              const rank = p.ranking ?? i + 1;
              const isMe = p.userId === userId;
              return (
                <div
                  key={p.id ?? i}
                  className={`lb-row${isMe ? " lb-row-me" : ""}`}
                >
                  <div className="lb-rank">{medalIcon(rank)}</div>
                  <div className="lb-avatar">
                    {p.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="lb-username">
                    {p.username}
                    {isMe && <span className="lb-you">you</span>}
                  </div>
                  <div className="lb-score">
                    {p.score ?? 0} <span className="lb-pts">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Competitions Page 
export default function Competitions() {
  const { user } = useAuth();
  const uid = user?.userId ?? user?.id;
  const role = user?.role;

  const [competitions, setCompetitions] = useState([]);
  const [myComps, setMyComps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const isCompetitor = role === "COMPETITOR" || role === "ADMIN";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, myRes] = await Promise.all([
        api.get("/competitions"),
        api.get(`/competitions/leaderboard/global`), // to check participation
      ]);
      setCompetitions(allRes.data);

      // tyler durden - Check which competitions user joined
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (!isCompetitor) {
    return (
      <div className="competitions-page">
        <div className="page-title">Competitions</div>
        <div className="not-competitor">
          <div className="nc-icon">🏆</div>
          <div className="nc-title">Competitors Only</div>
          <div className="nc-sub">
            Change your role to <strong>Competitor</strong> in your Profile to
            join competitions.
          </div>
          <Button onClick={() => (window.location.href = "/profile")}>
            Go to Profile →
          </Button>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="competitions-page">
        <CompetitionDetail
          competition={selected}
          userId={uid}
          onBack={() => setSelected(null)}
          onJoined={fetchAll}
        />
      </div>
    );
  }

  const now = new Date();
  const active = competitions.filter(
    (c) => getStatus(c.startDate, c.endDate) === "active",
  );
  const upcoming = competitions.filter(
    (c) => getStatus(c.startDate, c.endDate) === "upcoming",
  );
  const ended = competitions.filter(
    (c) => getStatus(c.startDate, c.endDate) === "ended",
  );

  return (
    <div className="competitions-page">
      {/* Header */}
      <div className="comp-header">
        <div>
          <div className="page-title">Competitions</div>
          <div className="page-sub">
            {active.length} live · {upcoming.length} upcoming · {ended.length}{" "}
            ended
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { key: "all", label: "All", count: competitions.length },
          { key: "active", label: "Live", count: active.length },
          { key: "upcoming", label: "Upcoming", count: upcoming.length },
          { key: "ended", label: "Ended", count: ended.length },
        ].map((t) => (
          <button
            key={t.key}
            className={`tab-btn${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count > 0 && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="comp-loading">Loading competitions…</div>
      ) : (
        (() => {
          const list =
            tab === "all"
              ? competitions
              : tab === "active"
                ? active
                : tab === "upcoming"
                  ? upcoming
                  : ended;

          if (list.length === 0) {
            return (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <div className="empty-title">No competitions here</div>
                <div className="empty-sub">Check back later</div>
              </div>
            );
          }

          return (
            <div className="comp-grid">
              {list.map((c) => {
                const status = getStatus(c.startDate, c.endDate);
                const cfg = STATUS_CONFIG[status];
                return (
                  <div
                    key={c.competitionId}
                    className="comp-card"
                    onClick={() => setSelected(c)}
                  >
                    <div className="comp-card-top">
                      <span className={`status-pill ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="comp-card-name">{c.name}</div>
                    <div className="comp-card-dates">
                      <span>{formatDate(c.startDate)}</span>
                      <span className="comp-card-arrow">→</span>
                      <span>{formatDate(c.endDate)}</span>
                    </div>
                    <div className="comp-card-footer">
                      <Button
                        variant="ghost"
                        style={{ width: "100%", fontSize: 12 }}
                      >
                        {status === "ended"
                          ? "View Results →"
                          : "View & Join →"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()
      )}
    </div>
  );
}
