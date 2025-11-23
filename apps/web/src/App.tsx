import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashBoardPage';
import ExamPage from './pages/ExamPage';
import AdminExamPage from './pages/AdminExamPage';
import EditExamPage from './pages/EditExamPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* dashboard */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* xem / làm đề thi */}
        <Route path="/exam/:examId" element={<ExamPage />} />

        <Route path="/admin/edit-exam/:id" element={<EditExamPage />} />

        <Route path="/admin/create-exam" element={<AdminExamPage />} />
      </Routes>
    </BrowserRouter>
  );
}
