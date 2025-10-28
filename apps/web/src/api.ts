import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // backend NestJS
  headers: {
    'Content-Type': 'application/json',
  },
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
  const res = await api.get(`/questions/exam/${examId}`);
  return res.data; // { exam, questions: [...] }
}

export default api;
