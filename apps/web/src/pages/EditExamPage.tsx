import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// Lưu ý: Dùng fetchExamDetailForAdmin để lấy được cả đáp án đúng (isCorrect)
import { fetchExamDetailForAdmin, updateExam } from '../api';

// --- TYPE CHO FORM (Dữ liệu đang sửa) ---
type DraftOption = {
  text: string;
  isCorrect: boolean;
};

type DraftQuestion = {
  content: string;
  type: 'MCQ' | 'ESSAY';
  options: DraftOption[];
};

// --- TYPE CHO API RESPONSE (Dữ liệu từ Backend trả về) ---
// Định nghĩa cái này để thay thế cho 'any'
type ApiOption = {
  text: string;
  isCorrect: boolean;
};

type ApiQuestion = {
  content: string;
  type: 'MCQ' | 'ESSAY';
  options: ApiOption[];
};

export default function EditExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State lưu dữ liệu form
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  // 1. LOAD DỮ LIỆU CŨ
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        // Gọi API lấy chi tiết
        const data = await fetchExamDetailForAdmin(Number(id));
        
        setTitle(data.title);
        setDuration(data.durationMin);

        // Map dữ liệu từ API về cấu trúc form
        // SỬA LỖI TẠI ĐÂY: Thay 'any' bằng 'ApiQuestion' và 'ApiOption'
        const mappedQuestions = data.questions.map((q: ApiQuestion) => ({
          content: q.content,
          type: q.type,
          options: q.options.map((opt: ApiOption) => ({
            text: opt.text,
            isCorrect: opt.isCorrect
          }))
        }));

        setQuestions(mappedQuestions);
      } catch (err: unknown) {
        console.error(err);
        alert('Không tìm thấy đề thi hoặc lỗi tải dữ liệu!');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  // --- CÁC HÀM XỬ LÝ FORM CÂU HỎI ---

  const addNewQuestion = () => {
    setQuestions([
      ...questions,
      {
        content: '',
        type: 'MCQ',
        options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }]
      }
    ]);
  };

  const removeQuestion = (idx: number) => {
    const newQ = [...questions];
    newQ.splice(idx, 1);
    setQuestions(newQ);
  };

  const changeQuestionContent = (idx: number, val: string) => {
    const newQ = [...questions];
    newQ[idx].content = val;
    setQuestions(newQ);
  };

  const changeOptionText = (qIdx: number, optIdx: number, val: string) => {
    const newQ = [...questions];
    newQ[qIdx].options[optIdx].text = val;
    setQuestions(newQ);
  };

  const setCorrectOption = (qIdx: number, optIdx: number) => {
    const newQ = [...questions];
    newQ[qIdx].options.forEach((o, i) => o.isCorrect = (i === optIdx));
    setQuestions(newQ);
  };

  const addOption = (qIdx: number) => {
    const newQ = [...questions];
    newQ[qIdx].options.push({ text: '', isCorrect: false });
    setQuestions(newQ);
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    const newQ = [...questions];
    if (newQ[qIdx].options.length <= 2) return;
    newQ[qIdx].options.splice(optIdx, 1);
    setQuestions(newQ);
  };

  // 2. XỬ LÝ LƯU (GỬI API)
  const handleSave = async () => {
    if (!title.trim()) return alert('Thiếu tên đề thi');
    if (questions.length === 0) return alert('Cần ít nhất 1 câu hỏi');

    for (const q of questions) {
       if (!q.content.trim()) return alert('Có câu hỏi chưa nhập nội dung');
       if (q.type === 'MCQ') {
         if (q.options.some(o => !o.text.trim())) return alert('Có đáp án bị trống');
         if (!q.options.some(o => o.isCorrect)) return alert(`Câu hỏi "${q.content}" chưa chọn đáp án đúng`);
       }
    }

    setSubmitting(true);
    try {
      await updateExam(Number(id), {
        title,
        durationMin: Number(duration),
        questions: questions,
      });
      alert('Cập nhật thành công! ✅');
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      alert('Lỗi khi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: 50}}>Đang tải dữ liệu...</div>;

  return (
    <div style={styles.page}>
      <h2 style={{ textAlign: 'center' }}>✏️ Chỉnh sửa đề thi</h2>
      
      {/* THÔNG TIN CHUNG */}
      <div style={styles.card}>
        <div style={{ marginBottom: 15 }}>
          <label style={styles.label}>Tên đề thi:</label>
          <input 
            style={styles.input}
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
        </div>
        <div style={{ marginBottom: 0 }}>
          <label style={styles.label}>Thời gian (phút):</label>
          <input 
            type="number"
            style={styles.input}
            value={duration} 
            onChange={e => setDuration(Number(e.target.value))} 
          />
        </div>
      </div>

      {/* DANH SÁCH CÂU HỎI */}
      <h3 style={{ marginTop: 30 }}>Danh sách câu hỏi ({questions.length})</h3>
      
      {questions.map((q, qIdx) => (
        <div key={qIdx} style={styles.questionCard}>
          <div style={styles.qHeader}>
            <strong>Câu {qIdx + 1}</strong>
            <button style={styles.delBtn} onClick={() => removeQuestion(qIdx)}>Xóa câu này</button>
          </div>

          <textarea
            style={styles.textarea}
            placeholder="Nhập nội dung câu hỏi..."
            value={q.content}
            onChange={(e) => changeQuestionContent(qIdx, e.target.value)}
          />

          {q.type === 'MCQ' && (
            <div style={{ marginTop: 15 }}>
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} style={styles.optionRow}>
                  <input 
                    type="radio" 
                    name={`correct-${qIdx}`}
                    checked={opt.isCorrect}
                    onChange={() => setCorrectOption(qIdx, optIdx)}
                    style={{ marginRight: 10, cursor: 'pointer' }}
                    title="Chọn đáp án đúng"
                  />
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    placeholder={`Đáp án ${optIdx + 1}`}
                    value={opt.text}
                    onChange={(e) => changeOptionText(qIdx, optIdx, e.target.value)}
                  />
                  <button style={styles.delOptBtn} onClick={() => removeOption(qIdx, optIdx)}>×</button>
                </div>
              ))}
              <button style={styles.addOptBtn} onClick={() => addOption(qIdx)}>+ Thêm đáp án</button>
            </div>
          )}
        </div>
      ))}

      <button style={styles.addQBtn} onClick={addNewQuestion}>
        + Thêm câu hỏi mới
      </button>

      {/* FOOTER */}
      <div style={styles.footer}>
        <button onClick={() => navigate('/dashboard')} style={styles.cancelBtn}>
          Hủy bỏ
        </button>
        <button onClick={handleSave} disabled={submitting} style={styles.saveBtn}>
          {submitting ? 'Đang lưu...' : '💾 Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
}

// STYLES
const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' },
  card: { border: '1px solid #ddd', padding: 20, borderRadius: 8, background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  label: { display: 'block', marginBottom: 6, fontWeight: 'bold' },
  input: { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: '14px' },
  textarea: { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', minHeight: 70, fontFamily: 'inherit' },
  questionCard: { border: '1px solid #e5e7eb', padding: 20, borderRadius: 8, marginBottom: 20, background: '#f9fafb' },
  qHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  optionRow: { display: 'flex', alignItems: 'center', marginBottom: 8 },
  delBtn: { background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: '12px' },
  delOptBtn: { marginLeft: 8, background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold' },
  addOptBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, marginTop: 5, fontWeight: 500 },
  addQBtn: { width: '100%', padding: 15, border: '2px dashed #ccc', background: 'none', color: '#666', cursor: 'pointer', fontWeight: 'bold', borderRadius: 8, fontSize: '15px' },
  footer: { display: 'flex', gap: 15, marginTop: 40, justifyContent: 'flex-end' },
  saveBtn: { padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
  cancelBtn: { padding: '12px 24px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '15px' },
};