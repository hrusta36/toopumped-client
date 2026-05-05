export default function MetricCard({ label, value, badge, badgeType = "up" }) {
  const colors = {
    up: "var(--green)",
    warn: "var(--accent)",
    neutral: "var(--text2)",
  };
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px 18px",
        boxShadow: "var(--shadow)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--text2)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 36, lineHeight: 1 }}>
        {value}
      </div>
      {badge && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            marginTop: 4,
            color: colors[badgeType],
          }}
        >
          {badge}
        </div>
      )}
    </div>
  );
}
