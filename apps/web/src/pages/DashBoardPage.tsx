import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchExams } from '../api';

type Exam = {
  id: number;
  title: string;
  description?: string | null;
  durationMin: number;
  createdAt: string;
};

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await fetchExams();
        setExams(data);
      } catch (e) {
        console.error('Lỗi load exam', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const notLoggedInUI = (
    <>
      <p>Bạn chưa đăng nhập.</p>
      <button
        style={styles.loginBtn}
        onClick={() => navigate('/login')}
      >
        Về trang đăng nhập
      </button>
    </>
  );

  const loggedInUI = (
    <>
      <p>Đăng nhập thành công 🎉</p>

      <div style={styles.tokenBox}>
        <div>Access Token:</div>
        <code style={styles.code}>{token}</code>
      </div>

      <h3>Danh sách đề thi có sẵn</h3>
      {loading ? (
        <p>Đang tải đề thi...</p>
      ) : exams.length === 0 ? (
        <p>Chưa có đề thi nào.</p>
      ) : (
        <ul style={styles.examList}>
          {exams.map((exam) => (
            <li key={exam.id} style={styles.examCard}>
              <div style={styles.examTitle}>{exam.title}</div>
              <div style={styles.examDesc}>
                {exam.description || 'Không có mô tả'}
              </div>
              <div style={styles.examMeta}>
                Thời lượng: {exam.durationMin} phút
              </div>

              <button
                style={styles.takeBtn}
                onClick={() => navigate(`/exam/${exam.id}`)}
              >
                Làm bài →
              </button>
            </li>
          ))}
        </ul>
      )}

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
  );

  return (
    <div style={styles.container}>
      <h2>Dashboard</h2>
      {token ? loggedInUI : notLoggedInUI}
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
  examList: {
    listStyle: 'none',
    padding: 0,
    margin: '16px 0',
  },
  examCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
    backgroundColor: '#fff',
  },
  examTitle: {
    fontWeight: 600,
    marginBottom: '4px',
  },
  examDesc: {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '4px',
  },
  examMeta: {
    fontSize: '13px',
    color: '#6b7280',
  },
  takeBtn: {
    marginTop: '8px',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '8px 10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '10px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    marginTop: '16px',
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
