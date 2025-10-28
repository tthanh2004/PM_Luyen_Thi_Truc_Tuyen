import { useState } from 'react';
import { loginUser } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { saveToken } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const result = await loginUser({
        email,
        password,
      });

      // result = { user, accessToken }
      saveToken(result.accessToken);

      navigate('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Đăng nhập thất bại';
      setError(msg);
    }
  }

  return (
    <div style={styles.container}>
      <h2>Đăng nhập</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <input
          style={styles.input}
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.button} type="submit">
          Đăng nhập
        </button>
      </form>

      <p style={styles.switchText}>
        Chưa có tài khoản?{' '}
        <button style={styles.linkBtn} onClick={() => navigate('/register')}>
          Đăng ký
        </button>
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '360px',
    margin: '40px auto',
    fontFamily: 'sans-serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '8px 10px',
    borderRadius: '4px',
    fontSize: '13px',
  },
  switchText: {
    marginTop: '16px',
    fontSize: '14px',
    textAlign: 'center',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: '#2563eb',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
  },
};
