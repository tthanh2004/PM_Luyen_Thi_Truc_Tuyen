import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // backend NestJS
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // SỬA Ở ĐÂY: Đổi thành 'accessToken' cho khớp với ảnh bạn gửi
  const token = localStorage.getItem('accessToken'); 
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gọi API đăng ký
export async function registerUser(data: {
  email: string;
  password: string;
  fullName: string;
}) {
  const res = await api.post('/auth/register', data);
  return res.data; // { user, accessToken }
}

// Gọi API đăng nhập
export async function loginUser(data: {
  email: string;
  password: string;
}) {
  const res = await api.post('/auth/login', data);
  return res.data; // { user, accessToken }
}

// Lấy danh sách đề thi
export async function fetchExams() {
  const res = await api.get('/exams');
  return res.data; // array exams
}

export async function fetchExamQuestions(examId: number) {
  // Gọi vào ExamController (nơi trả về đầy đủ info đề thi)
  const res = await api.get(`/exams/${examId}`);
  const data = res.data;

  return {
    exam: {
      id: data.id,
      title: data.title,
      durationMin: data.durationMin, // Quan trọng: Phải có dòng này
      description: data.description,
    },
    questions: data.questions || [],
  };
}


export async function startAttempt(examId: number) {
  const res = await api.post('/attempts/start', {
    examId,
  });
  return res.data;
}
export async function submitAttempt(
  attemptId: number,
  answers: { questionId: number; selectedOptionId: number | null }[],
) {
  const res = await api.post('/attempts/submit', {
    attemptId,
    answers,
  });
  return res.data;
}


export type CreateExamPayload = {
  title: string;
  durationMin: number;
  questions: {
    content: string;
    type: 'MCQ' | 'ESSAY';
    options: {
      text: string;
      isCorrect: boolean; // Quan trọng: đánh dấu đáp án đúng
    }[];
  }[];
};

export const createExam = async (data: CreateExamPayload) => {
  // Gọi POST /exams (Bạn cần đảm bảo Backend NestJS đã có endpoint này)
  const res = await api.post('/exams', data);
  return res.data;
};

// 1. Lấy chi tiết đề thi (để điền vào form sửa)
// Lưu ý: Endpoint này dùng cho Admin (lấy cả đáp án đúng)
export async function fetchExamDetailForAdmin(id: number) {
  const res = await api.get(`/exams/${id}`);
  return res.data;
}

// 2. Cập nhật đề thi
export type UpdateExamPayload = Partial<CreateExamPayload>;
export async function updateExam(id: number, data: UpdateExamPayload) {
  const res = await api.patch(`/exams/${id}`, data);
  return res.data;
}
// 3. Xóa đề thi
export async function deleteExam(id: number) {
  const res = await api.delete(`/exams/${id}`);
  return res.data;
}

export async function uploadExamPdf(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post('/exams/upload-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data; // { success: true, questions: [...] }
}

export default api;
