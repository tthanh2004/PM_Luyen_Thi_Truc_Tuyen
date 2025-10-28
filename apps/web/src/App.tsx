import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashBoardPage';
import ExamPage from './pages/ExamPage';

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
      </Routes>
    </BrowserRouter>
  );
}
