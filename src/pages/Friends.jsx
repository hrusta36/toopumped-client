import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Button from "../components/ui/Button";
import "../components/css/Friends.css";

const STATUS_BADGE = {
  ACCEPTED: { label: "Friends", cls: "badge-green" },
  PENDING: { label: "Pending", cls: "badge-orange" },
  BLOCKED: { label: "Blocked", cls: "badge-red" },
};

function Avatar({ username }) {
  return <div className="avatar">{username?.[0]?.toUpperCase() ?? "?"}</div>;
}

// Add Friend Modal 
function AddFriendModal({ userId, onClose, onSent }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/users")
      .then((r) => setUsers(r.data))
      .catch(console.error);
  }, []);

  const filtered = users.filter((u) => {
    const uId = u.userId ?? u.id;
    if (uId == userId) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      u.username?.toLowerCase().includes(q) ||
      u.firstname?.toLowerCase().includes(q) ||
      u.lastname?.toLowerCase().includes(q)
    );
  });

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    setError("");
    try {
      const res = await api.post(`/friends/${userId}/request`, {
        friendUserId: selected.userId ?? selected.id,
      });
      onSent(res.data);
      onClose();
    } catch (e) {
      setError(
        e.response?.data?.message ?? "Request already sent or user not found.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Add Friend</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <input
            className="form-input"
            placeholder="Search by username or name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
            }}
            autoFocus
          />
          <div className="user-search-list">
            {filtered.length === 0 && (
              <div className="user-search-empty">No users found</div>
            )}
            {filtered.map((u, i) => (
              <div
                key={u.userId ?? u.id ?? i}
                className={`user-search-item${selected === u ? " selected" : ""}`}
                onClick={() => setSelected(u)}
              >
                <Avatar username={u.username} />
                <div className="user-search-info">
                  <div className="user-search-name">{u.username}</div>
                  <div className="user-search-sub">
                    {u.firstname} {u.lastname}
                  </div>
                </div>
                {selected === u && <span className="check">✓</span>}
              </div>
            ))}
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!selected || sending}>
            {sending ? "Sending…" : "Send Request"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Friends Page 
export default function Friends() {
  const { user } = useAuth();
  const uid = user?.userId ?? user?.id;

  const [tab, setTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]); // incoming
  const [sent, setSent] = useState([]); // outgoing
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [friendsRes, pendingRes, sentRes] = await Promise.all([
        api.get(`/friends/${uid}`),
        api.get(`/friends/${uid}/pending`),
        api.get(`/friends/${uid}/sent`),
      ]);
      setFriends(friendsRes.data);
      setPending(pendingRes.data);
      setSent(sentRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAccept = async (friendId) => {
    try {
      await api.patch(`/friends/${friendId}/accept`);
      fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (friendId) => {
    try {
      await api.delete(`/friends/${friendId}`);
      setFriends((prev) => prev.filter((f) => f.friendId !== friendId));
      setPending((prev) => prev.filter((f) => f.friendId !== friendId));
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCount = pending.length;

  return (
    <div className="friends-page">
      {/* Header */}
      <div className="friends-header">
        <div>
          <div className="page-title">Friends</div>
          <div className="page-sub">
            {friends.length} friend{friends.length !== 1 ? "s" : ""}
            {pendingCount > 0 && ` · ${pendingCount} incoming`}
            {sent.length > 0 && ` · ${sent.length} sent`}
          </div>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Add Friend</Button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn${tab === "friends" ? " active" : ""}`}
          onClick={() => setTab("friends")}
        >
          Friends
          {friends.length > 0 && (
            <span className="tab-count">{friends.length}</span>
          )}
        </button>
        <button
          className={`tab-btn${tab === "pending" ? " active" : ""}`}
          onClick={() => setTab("pending")}
        >
          Incoming
          {pendingCount > 0 && (
            <span className="tab-count tab-count-orange">{pendingCount}</span>
          )}
        </button>
        <button
          className={`tab-btn${tab === "sent" ? " active" : ""}`}
          onClick={() => setTab("sent")}
        >
          Sent
          {sent.length > 0 && <span className="tab-count">{sent.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="friends-loading">Loading…</div>
      ) : (
        <>
          {/* Friends Tab */}
          {tab === "friends" && (
            <>
              {friends.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <div className="empty-title">No friends yet</div>
                  <div className="empty-sub">
                    Send a friend request to get started
                  </div>
                  <Button onClick={() => setShowModal(true)}>
                    + Add Friend
                  </Button>
                </div>
              ) : (
                <div className="friends-grid">
                  {friends.map((f) => (
                    <div key={f.friendId} className="friend-card">
                      <Avatar username={f.friendUsername} />
                      <div className="friend-info">
                        <div className="friend-username">
                          {f.friendUsername}
                        </div>
                        <div className="friend-since">
                          Since{" "}
                          {f.createdAt
                            ? new Date(f.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </div>
                      </div>
                      <div className="friend-actions">
                        <span className={`badge ${STATUS_BADGE.ACCEPTED.cls}`}>
                          {STATUS_BADGE.ACCEPTED.label}
                        </span>
                        <button
                          className="friend-remove"
                          onClick={() => handleRemove(f.friendId)}
                          title="Remove friend"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Sent Tab */}
          {tab === "sent" && (
            <>
              {sent.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📤</div>
                  <div className="empty-title">No sent requests</div>
                  <div className="empty-sub">
                    Send a request to connect with someone
                  </div>
                  <Button onClick={() => setShowModal(true)}>
                    + Add Friend
                  </Button>
                </div>
              ) : (
                <div className="friends-grid">
                  {sent.map((f) => (
                    <div key={f.friendId} className="friend-card">
                      <Avatar username={f.friendUsername} />
                      <div className="friend-info">
                        <div className="friend-username">
                          {f.friendUsername}
                        </div>
                        <div className="friend-since">
                          Sent{" "}
                          {f.createdAt
                            ? new Date(f.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </div>
                      </div>
                      <div className="friend-actions">
                        <span className="badge badge-orange">Pending</span>
                        <button
                          className="friend-remove"
                          onClick={() => handleRemove(f.friendId)}
                          title="Cancel request"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pending Tab */}
          {tab === "pending" && (
            <>
              {pending.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📬</div>
                  <div className="empty-title">No pending requests</div>
                  <div className="empty-sub">You're all caught up!</div>
                </div>
              ) : (
                <div className="friends-grid">
                  {pending.map((f) => (
                    <div key={f.friendId} className="friend-card">
                      <Avatar username={f.friendUsername} />
                      <div className="friend-info">
                        <div className="friend-username">
                          {f.friendUsername}
                        </div>
                        <div className="friend-since">
                          {f.createdAt
                            ? new Date(f.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </div>
                      </div>
                      <div className="friend-actions">
                        <Button
                          onClick={() => handleAccept(f.friendId)}
                          style={{ fontSize: 12, padding: "5px 12px" }}
                        >
                          Accept
                        </Button>
                        <button
                          className="friend-remove"
                          onClick={() => handleRemove(f.friendId)}
                          title="Decline"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {showModal && (
        <AddFriendModal
          userId={uid}
          onClose={() => setShowModal(false)}
          onSent={() => fetchAll()}
        />
      )}
    </div>
  );
}
