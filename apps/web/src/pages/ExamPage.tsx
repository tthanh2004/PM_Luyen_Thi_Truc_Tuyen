import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  startAttempt,
  fetchExamQuestions,
  submitAttempt,
} from '../api';

type Option = {
  id: number;
  text: string;
  isCorrect?: boolean; // chỉ để debug, không cần show cho học viên
};

type Question = {
  id: number;
  content: string;
  type: string; // "MCQ" or "ESSAY"
  options: Option[];
};

type LoadedExam = {
  exam: {
    id: number;
    title: string;
  };
  questions: Question[];
};

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [data, setData] = useState<LoadedExam | null>(null);

  // state lưu câu trả lời học viên
  // answers[questionId] = selectedOptionId
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // sau khi nộp bài
  const [submitting, setSubmitting] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // examId lấy từ URL /exam/:examId
    if (!examId) {
      return;
    }

    // gọi API để:
    // 1. start attempt (lấy attemptId)
    // 2. fetch questions
    (async () => {
      try {
        // 1. tạo attempt
        const attemptRes = await startAttempt(Number(examId));
        // attemptRes = { id, examId, status, startedAt }
        setAttemptId(attemptRes.id);

        // 2. lấy đề thi + câu hỏi
        const examData = await fetchExamQuestions(Number(examId));
        // examData = { exam, questions: [...] }
        setData(examData);
      } catch (err) {
        console.error('Lỗi load đề thi:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  // handle chọn đáp án cho 1 câu hỏi
  function handleSelectOption(questionId: number, optionId: number) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  }

  // handle nộp bài
  async function handleSubmitExam() {
    if (!attemptId) {
      setSubmitError('Không tìm thấy attemptId');
      return;
    }
    if (!data) {
      setSubmitError('Không có câu hỏi để chấm');
      return;
    }

    // build mảng answers để gửi backend
    const payloadAnswers = data.questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: answers[q.id],
    }));

    // kiểm tra xem có câu nào chưa chọn
    const notAnswered = payloadAnswers.some(
      (a) => a.selectedOptionId === undefined || a.selectedOptionId === null,
    );
    if (notAnswered) {
      const confirmLeaveBlank = window.confirm(
        'Bạn còn câu chưa chọn đáp án. Vẫn nộp bài chứ?',
      );
      if (!confirmLeaveBlank) return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitAttempt(attemptId, payloadAnswers);
      // result = { attemptId, score }
      setSubmittedScore(result.score);
    } catch (err) {
      console.error('Lỗi nộp bài:', err);
      setSubmitError('Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  // UI đang tải đề
  if (loading) {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Quay lại
        </button>
        <p>Đang tải đề thi...</p>
      </div>
    );
  }

  // Nếu không có đề / lỗi tải
  if (!data) {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Quay lại
        </button>
        <p>Không tìm thấy đề thi hoặc không load được dữ liệu.</p>
      </div>
    );
  }

  // Nếu đã nộp thành công -> hiển thị điểm
  if (submittedScore !== null) {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Quay lại
        </button>

        <h2>Kết quả bài thi</h2>
        <p>
          Bạn được <b>{submittedScore.toFixed(2)}</b> điểm 🎉
        </p>

        <button
          style={styles.primaryBtn}
          onClick={() => navigate('/dashboard')}
        >
          Về Dashboard
        </button>
      </div>
    );
  }

  // UI làm bài
  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
        ← Quay lại
      </button>

      <h2>{data.exam.title}</h2>

      <ol style={styles.questionList}>
        {data.questions.map((q) => (
          <li key={q.id} style={styles.questionItem}>
            <div style={styles.questionText}>{q.content}</div>

            {q.type === 'MCQ' && (
              <ul style={styles.optionList}>
                {q.options.map((op) => (
                  <li key={op.id} style={styles.optionItem}>
                    <label style={styles.optionLabel}>
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={op.id}
                        checked={answers[q.id] === op.id}
                        onChange={() => handleSelectOption(q.id, op.id)}
                      />
                      <span style={{ marginLeft: 8 }}>{op.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            {q.type !== 'MCQ' && (
              <textarea
                style={styles.textAnswer}
                placeholder="Nhập câu trả lời tự luận..."
                disabled
              />
            )}
          </li>
        ))}
      </ol>

      {submitError && (
        <div style={styles.errorBox}>{submitError}</div>
      )}

      <button
        style={styles.submitBtn}
        onClick={handleSubmitExam}
        disabled={submitting}
      >
        {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '800px',
    margin: '40px auto',
    fontFamily: 'sans-serif',
    lineHeight: 1.5,
  },
  backBtn: {
    background: 'none',
    border: '1px solid #ccc',
    borderRadius: 6,
    padding: '6px 10px',
    marginBottom: '16px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  questionList: {
    marginTop: '24px',
    paddingLeft: '20px',
  },
  questionItem: {
    marginBottom: '24px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '16px',
  },
  questionText: {
    fontWeight: 600,
    marginBottom: '10px',
    fontSize: '16px',
  },
  optionList: {
    listStyleType: 'none',
    paddingLeft: 0,
    margin: 0,
  },
  optionItem: {
    marginBottom: '8px',
  },
  optionLabel: {
    cursor: 'pointer',
    fontSize: '15px',
  },
  textAnswer: {
    width: '100%',
    minHeight: '80px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    padding: '8px',
    fontSize: '14px',
    resize: 'vertical',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #ef4444',
    borderRadius: 8,
    padding: '12px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    fontSize: '15px',
    border: 'none',
    borderRadius: 8,
    padding: '12px 16px',
    cursor: 'pointer',
    minWidth: '120px',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    border: 'none',
    borderRadius: 8,
    padding: '10px 14px',
    cursor: 'pointer',
    minWidth: '120px',
    fontSize: '14px',
  },
};
