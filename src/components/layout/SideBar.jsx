import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  {
    section: "Main",
    roles: ["STANDARD", "COMPETITOR", "ADMIN"],
    items: [
      {
        to: "/",
        label: "Dashboard",
        icon: "⊞",
        roles: ["STANDARD", "COMPETITOR", "ADMIN"],
      },
      {
        to: "/workout",
        label: "Workout Planner",
        icon: "🏋️",
        roles: ["STANDARD", "COMPETITOR", "ADMIN"],
      },
      {
        to: "/workout-library",
        label: "Workout Library",
        icon: "📚",
        roles: ["STANDARD", "COMPETITOR", "ADMIN"],
      },
      {
        to: "/calories",
        label: "Calorie Tracker",
        icon: "🥗",
        roles: ["STANDARD", "COMPETITOR", "ADMIN"],
      },
    ],
  },
  {
    section: "Social",
    roles: ["COMPETITOR", "ADMIN"],
    items: [
      {
        to: "/competitions",
        label: "Competitions",
        icon: "📊",
        roles: ["COMPETITOR", "ADMIN"],
      },
      {
        to: "/friends",
        label: "Friends",
        icon: "👥",
        roles: ["STANDARD", "COMPETITOR", "ADMIN"],
      },
    ],
  },
  {
    section: "Account",
    roles: ["STANDARD", "COMPETITOR", "ADMIN"],
    items: [
      {
        to: "/profile",
        label: "Profile",
        icon: "👤",
        roles: ["STANDARD", "COMPETITOR", "ADMIN"],
      },
      { to: "/admin", label: "Admin Panel", icon: "⚙️", roles: ["ADMIN"] },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "STANDARD";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || "??";

  return (
    <aside
      style={{
        width: "var(--sidebar-w)",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 26, fontWeight: 700 }}>⚡ 2Pumped</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {navItems.map((section) => {
          const visibleItems = section.items.filter((i) =>
            i.roles.includes(role)
          );
          if (!visibleItems.length) return null;

          return (
            <div key={section.section}>
              <div style={{ padding: "10px 20px", fontSize: 10, opacity: 0.6 }}>
                {section.section}
              </div>

              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  style={({ isActive }) => ({
                    display: "flex",
                    gap: 10,
                    padding: "10px 20px",
                    textDecoration: "none",
                    color: isActive ? "var(--accent)" : "var(--text2)",
                    background: isActive ? "var(--accent-light)" : "transparent",
                  })}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User */}
    <div
      style={{
        padding: "16px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600 }}>
        {user?.username}
      </div>

      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text2)",
          fontSize: 12,
          cursor: "pointer",
          transition: "0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--accent-light)";
          e.currentTarget.style.color = "var(--accent)";
          e.currentTarget.style.borderColor = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text2)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        Sign Out
      </button>
    </div>
    </aside>
  );
}