import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// SỬA LỖI 1: Thêm từ khóa 'type' trước CreateExamPayload
import { createExam, type CreateExamPayload } from '../api';

// Type nội bộ cho form
type DraftOption = {
  text: string;
  isCorrect: boolean;
};

// Định nghĩa type cho loại câu hỏi để tái sử dụng
type QuestionType = 'MCQ' | 'ESSAY';

type DraftQuestion = {
  id: number;
  content: string;
  type: QuestionType;
  options: DraftOption[];
};

export default function AdminExamPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // --- STATE ĐỀ THI ---
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number>(15);
  const [addedQuestions, setAddedQuestions] = useState<DraftQuestion[]>([]);

  // --- STATE CHO CÂU HỎI ĐANG NHẬP ---
  const [currentContent, setCurrentContent] = useState('');
  
  // SỬA LỖI 2 (Gián tiếp): Khai báo state rõ ràng với type QuestionType
  const [currentType, setCurrentType] = useState<QuestionType>('MCQ');
  
  const [currentOptions, setCurrentOptions] = useState<DraftOption[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  // ... (Giữ nguyên các hàm handleOptionChange, handleSetCorrect, addOptionField, removeOptionField) ...
  const handleOptionChange = (index: number, val: string) => {
    const newOpts = [...currentOptions];
    newOpts[index].text = val;
    setCurrentOptions(newOpts);
  };

  const handleSetCorrect = (index: number) => {
    const newOpts = currentOptions.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setCurrentOptions(newOpts);
  };

  const addOptionField = () => {
    setCurrentOptions([...currentOptions, { text: '', isCorrect: false }]);
  };

  const removeOptionField = (index: number) => {
    if (currentOptions.length <= 2) return;
    setCurrentOptions(currentOptions.filter((_, i) => i !== index));
  };

  // ... (Giữ nguyên logic handleAddQuestion) ...
  const handleAddQuestion = () => {
    if (!currentContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    if (currentType === 'MCQ') {
      const hasCorrect = currentOptions.some((o) => o.isCorrect);
      const hasEmpty = currentOptions.some((o) => !o.text.trim());
      
      if (hasEmpty) {
        alert('Vui lòng điền đủ nội dung các đáp án');
        return;
      }
      if (!hasCorrect) {
        alert('Vui lòng chọn một đáp án đúng');
        return;
      }
    }

    const newQuestion: DraftQuestion = {
      id: Date.now(),
      content: currentContent,
      type: currentType,
      options: currentType === 'MCQ' ? [...currentOptions] : [],
    };

    setAddedQuestions([...addedQuestions, newQuestion]);

    setCurrentContent('');
    setCurrentOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]);
  };

  const handleDeleteQuestion = (id: number) => {
    setAddedQuestions(addedQuestions.filter((q) => q.id !== id));
  };

  const handleSubmitExam = async () => {
    if (!title.trim()) {
      alert('Chưa nhập tên đề thi');
      return;
    }
    if (addedQuestions.length === 0) {
      alert('Đề thi phải có ít nhất 1 câu hỏi');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateExamPayload = {
        title,
        durationMin: duration,
        questions: addedQuestions.map((q) => ({
          content: q.content,
          type: q.type,
          options: q.options,
        })),
      };

      await createExam(payload);
      alert('🎉 Tạo đề thi thành công!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi tạo đề');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
        ← Quay lại Dashboard
      </button>

      <h1 style={{ marginBottom: 20 }}>Tạo đề thi mới</h1>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>1. Thông tin chung</h3>
        <div style={styles.formGroup}>
          <label>Tên đề thi:</label>
          <input
            style={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Kiểm tra 15 phút Toán"
          />
        </div>
        <div style={styles.formGroup}>
          <label>Thời gian (phút):</label>
          <input
            type="number"
            style={styles.input}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>2. Thêm câu hỏi</h3>
        
        <div style={styles.formGroup}>
          <label>Nội dung câu hỏi:</label>
          <textarea
            style={styles.textarea}
            value={currentContent}
            onChange={(e) => setCurrentContent(e.target.value)}
            placeholder="Nhập câu hỏi..."
          />
        </div>

        <div style={styles.formGroup}>
          <label>Loại câu hỏi: </label>
          <select
            style={styles.select}
            value={currentType}
            // SỬA LỖI 2: Ép kiểu từ string sang 'MCQ' | 'ESSAY' thay vì dùng 'any'
            onChange={(e) => setCurrentType(e.target.value as QuestionType)}
          >
            <option value="MCQ">Trắc nghiệm (MCQ)</option>
            <option value="ESSAY">Tự luận (Essay)</option>
          </select>
        </div>

        {currentType === 'MCQ' && (
          <div style={{ marginLeft: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 'bold' }}>Các phương án:</p>
            {currentOptions.map((opt, idx) => (
              <div key={idx} style={styles.optionRow}>
                <input
                  type="radio"
                  name="correct-opt"
                  checked={opt.isCorrect}
                  onChange={() => handleSetCorrect(idx)}
                  style={{ marginRight: 10, cursor: 'pointer' }}
                  title="Chọn làm đáp án đúng"
                />
                <input
                  style={styles.inputOption}
                  value={opt.text}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Đáp án ${idx + 1}`}
                />
                <button
                  style={styles.delOptBtn}
                  onClick={() => removeOptionField(idx)}
                >
                  ×
                </button>
              </div>
            ))}
            <button style={styles.addOptBtn} onClick={addOptionField}>
              + Thêm phương án
            </button>
          </div>
        )}

        <button style={styles.addQuestionBtn} onClick={handleAddQuestion}>
          Thêm câu hỏi này vào đề
        </button>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          3. Danh sách câu hỏi ({addedQuestions.length})
        </h3>
        {addedQuestions.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>Chưa có câu hỏi nào.</p>
        ) : (
          <ul style={styles.qList}>
            {addedQuestions.map((q, index) => (
              <li key={q.id} style={styles.qItem}>
                <div style={{ flex: 1 }}>
                  <strong>Câu {index + 1}:</strong> {q.content} 
                  <span style={styles.badge}>{q.type}</span>
                  {q.type === 'MCQ' && (
                    <ul style={{ marginTop: 5, fontSize: 14, color: '#555' }}>
                      {q.options.map((o, i) => (
                        <li key={i} style={o.isCorrect ? { color: 'green', fontWeight: 'bold' } : {}}>
                          {o.text} {o.isCorrect && '✔'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  style={styles.delBtn}
                  onClick={() => handleDeleteQuestion(q.id)}
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ textAlign: 'right' }}>
        <button
          style={styles.submitBtn}
          onClick={handleSubmitExam}
          disabled={submitting}
        >
          {submitting ? 'Đang lưu...' : '💾 LƯU ĐỀ THI'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif' },
  backBtn: { marginBottom: 20, cursor: 'pointer', background: 'none', border: 'none', color: '#666' },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 20, backgroundColor: '#fff' },
  cardTitle: { marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: 10 },
  formGroup: { marginBottom: 15 },
  input: { width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' },
  textarea: { width: '100%', height: 60, padding: 8, borderRadius: 4, border: '1px solid #ccc' },
  select: { padding: 8, borderRadius: 4, border: '1px solid #ccc' },
  optionRow: { display: 'flex', alignItems: 'center', marginBottom: 8 },
  inputOption: { flex: 1, padding: 6, borderRadius: 4, border: '1px solid #ccc' },
  delOptBtn: { marginLeft: 8, background: '#fee2e2', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '4px 8px', color: '#b91c1c' },
  addOptBtn: { fontSize: 13, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  addQuestionBtn: { backgroundColor: '#e5e7eb', border: '1px solid #ccc', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, marginTop: 10 },
  qList: { listStyle: 'none', padding: 0 },
  qItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid #eee', padding: '10px 0' },
  badge: { fontSize: 10, backgroundColor: '#eee', padding: '2px 6px', borderRadius: 4, marginLeft: 8 },
  delBtn: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  submitBtn: { backgroundColor: '#2563eb', color: '#fff', fontSize: 16, fontWeight: 'bold', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer' },
};