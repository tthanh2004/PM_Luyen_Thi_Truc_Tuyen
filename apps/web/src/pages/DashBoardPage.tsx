import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h2>Dashboard</h2>

      {token ? (
        <>
          <p>Đăng nhập thành công 🎉</p>
          <div style={styles.tokenBox}>
            <div>Access Token:</div>
            <code style={styles.code}>{token}</code>
          </div>

          <button
            style={styles.logoutBtn}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Đăng xuất
          </button>
        </>
      ) : (
        <>
          <p>Bạn chưa đăng nhập.</p>
          <button
            style={styles.loginBtn}
            onClick={() => navigate('/login')}
          >
            Về trang đăng nhập
          </button>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    fontFamily: 'sans-serif',
  },
  tokenBox: {
    backgroundColor: '#f3f4f6',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    wordBreak: 'break-all',
    marginBottom: '16px',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '10px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  loginBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
  },
};
