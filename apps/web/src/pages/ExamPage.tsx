import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  startAttempt,
  fetchExamQuestions,
  submitAttempt,
} from '../api';

type Option = {
  id: number;
  text: string;
};

type Question = {
  id: number;
  content: string;
  type: string; // "MCQ" | "ESSAY"
  options: Option[];
};

type LoadedExam = {
  exam: {
    id: number;
    title: string;
    durationMin: number;
  };
  questions: Question[];
};

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [data, setData] = useState<LoadedExam | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // chống auto-submit lặp nhiều lần khi vừa hết giờ
  const autoSubmittedRef = useRef(false);

  // hiển thị mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // chọn đáp án cho 1 câu hỏi
  const handleSelectOption = (questionId: number, optionId: number) => {
    if (submittedScore !== null || submitting) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // nộp bài
  const handleSubmitExam = useCallback(
    async (auto = false) => {
      if (!attemptId || !data || submitting || submittedScore !== null) {
        return;
      }

      // build mảng answer gửi BE
      const payloadAnswers = data.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId:
          answers[q.id] !== undefined ? answers[q.id] : null,
      }));

      // nếu user bấm nút "Nộp bài" khi vẫn còn giờ
      // => bắt buộc làm hết tất cả câu
      if (!auto) {
        const hasBlank = payloadAnswers.some(
          (a) => a.selectedOptionId === null,
        );
        if (hasBlank) {
          setSubmitError(
            'Bạn chưa trả lời hết tất cả câu hỏi. Không thể nộp bài trước khi hết giờ.',
          );
          return;
        }
      }

      setSubmitting(true);
      setSubmitError(null);

      try {
        const result = await submitAttempt(attemptId, payloadAnswers);
        // { attemptId, score }
        setSubmittedScore(result.score);
      } catch (err) {
        console.error('Lỗi nộp bài:', err);

        if (auto) {
          // Hết giờ mà BE lỗi -> vẫn kết thúc, cho điểm tạm 0
          setSubmittedScore(0);
          setSubmitError(
            'Bài đã tự động nộp khi hết giờ nhưng hệ thống không chấm được điểm chính xác.',
          );
        } else {
          // Nộp tay mà fail (network / BE crash)
          setSubmitError('Nộp bài thất bại, vui lòng thử lại.');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [attemptId, data, answers, submitting, submittedScore],
  );

  // load đề thi + tạo attempt + set thời gian
  useEffect(() => {
    if (!examId) return;

    (async () => {
      try {
        const attemptRes = await startAttempt(Number(examId));
        setAttemptId(attemptRes.id);

        const examData = await fetchExamQuestions(Number(examId));
        setData(examData);

        setTimeLeft(
          examData?.exam?.durationMin
            ? examData.exam.durationMin * 60
            : 15 * 60,
        );
      } catch (err) {
        console.error('Lỗi load đề thi:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  // đếm ngược + auto submit lúc hết giờ
  useEffect(() => {
    if (!timeLeft || submittedScore !== null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            void handleSubmitExam(true); // auto submit, cho phép thiếu câu
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submittedScore, handleSubmitExam]);

  // cảnh báo khi còn 1 phút
  useEffect(() => {
    if (timeLeft === 60) {
      alert('⏰ Còn 1 phút cuối, hãy kiểm tra lại đáp án!');
    }
  }, [timeLeft]);

  // ==== UI GIAI ĐOẠN KHÁC NHAU ====

  // 1. Đang tải đề
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

  // 2. Không load được đề
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

  // 3. Đã nộp bài -> hiện kết quả
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

        {submitError && (
          <p style={{ color: '#b91c1c', fontSize: 14 }}>{submitError}</p>
        )}

        <button
          style={styles.primaryBtn}
          onClick={() => navigate('/dashboard')}
        >
          Về Dashboard
        </button>
      </div>
    );
  }

  // 4. Đang làm bài
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <button
            style={styles.backBtn}
            onClick={() => navigate('/dashboard')}
            disabled={submitting}
          >
            ← Quay lại
          </button>
          <h2 style={{ marginTop: 12 }}>{data.exam.title}</h2>
        </div>

        <div style={styles.timerBox}>
          <div style={styles.timerLabel}>Thời gian còn lại</div>
          <div style={styles.timerValue}>⏰ {formatTime(timeLeft)}</div>
        </div>
      </div>

      <ol style={styles.questionList}>
        {data.questions.map((q) => (
          <li key={q.id} style={styles.questionItem}>
            <div style={styles.questionText}>{q.content}</div>

            {q.type === 'MCQ' ? (
              <ul style={styles.optionList}>
                {q.options.map((op) => (
                  <li key={op.id} style={styles.optionItem}>
                    <label style={styles.optionLabel}>
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={op.id}
                        checked={answers[q.id] === op.id}
                        disabled={submitting}
                        onChange={() => handleSelectOption(q.id, op.id)}
                      />
                      <span style={{ marginLeft: 8 }}>{op.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <textarea
                style={styles.textAnswer}
                placeholder="Nhập câu trả lời tự luận..."
                disabled // essay lock vì backend chưa chấm essay
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
        onClick={() => void handleSubmitExam(false)} // manual submit (must answer all)
        disabled={submitting}
      >
        {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
      </button>
    </div>
  );
}

// styles
const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '800px',
    margin: '40px auto',
    fontFamily: 'sans-serif',
    lineHeight: 1.5,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  timerBox: {
    minWidth: '140px',
    textAlign: 'right',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
  },
  timerLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: 4,
  },
  timerValue: {
    fontWeight: 600,
    fontSize: '16px',
    color: '#1f2937',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #ccc',
    borderRadius: 6,
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  questionList: { marginTop: '16px', paddingLeft: '20px' },
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
  optionList: { listStyleType: 'none', paddingLeft: 0, margin: 0 },
  optionItem: { marginBottom: '8px' },
  optionLabel: { cursor: 'pointer', fontSize: '15px' },
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
