import { useEffect, useState } from 'react';
import { fetchExamQuestions } from '../api';
import { useParams, useNavigate } from 'react-router-dom';

type Option = {
  id: number;
  text: string;
  isCorrect: boolean; // tạm thời hiện luôn để bạn debug
};

type Question = {
  id: number;
  content: string;
  type: string;
  options: Option[];
};

type ExamData = {
  exam: { id: number; title: string };
  questions: Question[];
};

export default function ExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;

    (async () => {
      try {
        const res = await fetchExamQuestions(Number(examId));
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  if (loading) return <div style={styles.page}>Đang tải đề thi...</div>;

  if (!data) {
    return (
      <div style={styles.page}>
        <p>Không tìm thấy đề thi.</p>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
        ← Quay lại
      </button>

      <h2>{data.exam.title}</h2>

      {data.questions.length === 0 ? (
        <p>Đề này chưa có câu hỏi.</p>
      ) : (
        <ol style={styles.questionList}>
          {data.questions.map((q) => (
            <li key={q.id} style={styles.questionItem}>
              <div style={styles.questionContent}>{q.content}</div>

              {q.type === 'MCQ' && (
                <ul style={styles.optionList}>
                  {q.options.map((op) => (
                    <li key={op.id} style={styles.optionItem}>
                      <label>
                        <input type="radio" name={`q-${q.id}`} />
                        <span style={{ marginLeft: 8 }}>{op.text}</span>
                        <span style={styles.debugCorrect}>
                          {op.isCorrect ? '(đúng)' : ''}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              {q.type !== 'MCQ' && (
                <textarea
                  placeholder="Nhập câu trả lời..."
                  style={styles.textAnswer}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '700px',
    margin: '40px auto',
    fontFamily: 'sans-serif',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #ccc',
    borderRadius: 6,
    padding: '6px 10px',
    marginBottom: '16px',
    cursor: 'pointer',
  },
  questionList: {
    marginTop: '24px',
  },
  questionItem: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  questionContent: {
    fontWeight: 600,
    marginBottom: '8px',
  },
  optionList: {
    listStyle: 'none',
    paddingLeft: 0,
    margin: 0,
  },
  optionItem: {
    marginBottom: '6px',
  },
  debugCorrect: {
    marginLeft: 8,
    fontSize: '12px',
    color: '#10b981',
    fontWeight: 500,
  },
  textAnswer: {
    width: '100%',
    minHeight: '80px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    padding: '8px',
    fontSize: '14px',
  },
};
