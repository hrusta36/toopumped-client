import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', firstname: '', lastname: '', email: '', password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch {
      setError('Registration failed. Username or email may already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'username',        label: 'USERNAME',        placeholder: 'Choose a username' },
    { key: 'firstname',       label: 'FIRST NAME',      placeholder: 'Enter first name' },
    { key: 'lastname',        label: 'LAST NAME',       placeholder: 'Enter last name' },
    { key: 'email',           label: 'EMAIL',           placeholder: 'Enter email address' },
    { key: 'password',        label: 'PASSWORD',        placeholder: 'Choose a password',        type: 'password' },
    { key: 'confirmPassword', label: 'CONFIRM PASSWORD',placeholder: 'Repeat your password',     type: 'password' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)'
    }}>
      <div style={{
        background: 'var(--surface)', padding: 36,
        borderRadius: 'var(--radius)', width: 420,
        boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--accent)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: '#fff', fontSize: 18 }}>⚡</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, letterSpacing: 1.5, lineHeight: 1 }}>2Pumped</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Create your account</div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--accent-light)', color: 'var(--accent-dark)',
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16
          }}>
            {error}
          </div>
        )}

        {fields.map(field => (
          <div key={field.key} style={{ marginBottom: 14 }}>
            <label style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text2)',
              display: 'block', marginBottom: 6, letterSpacing: 0.5
            }}>
              {field.label}
            </label>
            <input
              type={field.type || 'text'}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={e => setForm({ ...form, [field.key]: e.target.value })}
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid var(--border)', borderRadius: 8,
                fontSize: 13, fontFamily: 'DM Sans',
                outline: 'none', color: 'var(--text)',
                background: 'var(--surface)'
              }}
            />
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '11px',
            background: loading ? 'var(--text2)' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans', marginTop: 6
          }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
          Already have an account?{' '}
          <span
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate('/login')}
          >
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
}