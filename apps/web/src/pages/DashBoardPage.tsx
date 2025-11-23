import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
// Nhớ import deleteExam vừa thêm
import { fetchExams, deleteExam } from '../api';

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

  // Load danh sách đề
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

  // --- HÀM XỬ LÝ XÓA ---
  const handleDelete = async (id: number) => {
    const confirm = window.confirm(
      '⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa?\nHành động này sẽ xóa cả câu hỏi và lịch sử làm bài liên quan!'
    );
    if (!confirm) return;

    try {
      await deleteExam(id);
      // Xóa xong thì lọc bỏ item đó khỏi state để giao diện tự cập nhật
      setExams((prev) => prev.filter((e) => e.id !== id));
      alert('Đã xóa thành công! ✅');
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi xóa đề thi.');
    }
  };

  const notLoggedInUI = (
    <>
      <p>Bạn chưa đăng nhập.</p>
      <button style={styles.loginBtn} onClick={() => navigate('/login')}>
        Về trang đăng nhập
      </button>
    </>
  );

  const loggedInUI = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Danh sách đề thi quản lý</h3>
        <button 
          onClick={() => navigate('/admin/create-exam')}
          style={styles.createBtn}
        >
          + Tạo đề thi mới
        </button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : exams.length === 0 ? (
        <p>Chưa có đề thi nào.</p>
      ) : (
        <ul style={styles.examList}>
          {exams.map((exam) => (
            <li key={exam.id} style={styles.examCard}>
              <div style={{ flex: 1 }}>
                <div style={styles.examTitle}>{exam.title}</div>
                <div style={styles.examDesc}>{exam.description || 'Không có mô tả'}</div>
                <div style={styles.examMeta}>⏳ Thời lượng: {exam.durationMin} phút</div>
              </div>
              
              {/* Nhóm nút hành động */}
              <div style={styles.actionGroup}>
                <button
                  style={styles.takeBtn}
                  onClick={() => navigate(`/exam/${exam.id}`)}
                >
                  Test thử
                </button>

                <button
                  style={styles.editBtn}
                  onClick={() => navigate(`/admin/edit-exam/${exam.id}`)}
                >
                  Sửa
                </button>

                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(exam.id)}
                >
                  Xóa
                </button>
              </div>
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
      <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: 10 }}>Dashboard</h2>
      {token ? loggedInUI : notLoggedInUI}
    </div>
  );
}

// CSS đã được bổ sung đầy đủ
const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' },
  loginBtn: { backgroundColor: '#2563eb', color: 'white', padding: '10px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
  createBtn: { backgroundColor: '#10b981', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  
  examList: { listStyle: 'none', padding: 0, margin: '16px 0' },
  examCard: { 
    border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px', backgroundColor: '#fff',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px'
  },
  examTitle: { fontWeight: 600, fontSize: '16px', marginBottom: '4px' },
  examDesc: { fontSize: '14px', color: '#4b5563', marginBottom: '4px' },
  examMeta: { fontSize: '13px', color: '#6b7280' },

  // Style cho nhóm nút
  actionGroup: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '100px' },
  takeBtn:   { backgroundColor: '#3b82f6', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  editBtn:   { backgroundColor: '#f59e0b', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  deleteBtn: { backgroundColor: '#ef4444', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  
  logoutBtn: { backgroundColor: '#6b7280', color: 'white', padding: '10px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginTop: '20px' },
};