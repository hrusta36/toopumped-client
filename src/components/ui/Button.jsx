export default function Button({
  children,
  variant = "primary",
  onClick,
  style,
}) {
  const styles = {
    primary: { background: "var(--accent)", color: "#fff", border: "none" },
    ghost: {
      background: "transparent",
      color: "var(--text2)",
      border: "1px solid var(--border)",
    },
  };
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "DM Sans",
        transition: "all 0.15s",
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
