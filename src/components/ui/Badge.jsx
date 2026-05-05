const variants = {
  green:  { background: 'var(--green-light)',  color: 'var(--green)' },
  orange: { background: 'var(--accent-light)', color: 'var(--accent-dark)' },
  blue:   { background: 'var(--blue-light)',   color: 'var(--blue)' },
  LANDLORD_TIPPER:   { background: '#FFF3DC',             color: 'var(--LANDLORD_TIPPER)' },
};

export default function Badge({ children, variant = 'orange' }) {
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10, fontWeight: 600,
      padding: '3px 9px',
      borderRadius: 20,
      ...variants[variant]
    }}>{children}</span>
  );
}