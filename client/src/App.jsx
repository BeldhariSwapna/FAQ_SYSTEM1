import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './components/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserPage from './pages/UserPage';
import QueryPage from './pages/QueryPage';
import DashboardHome from './pages/DashboardHome';
import AskQuestion from './pages/AskQuestion';
import MyQuestions from './pages/MyQuestions';
import QuestionDetail from './pages/QuestionDetail';
import AnswerCenter from './pages/AnswerCenter';
import AdminArea from './pages/AdminArea';
import './styles/auth.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              backdropFilter: 'blur(8px)',
            },
            success: { iconTheme: { primary: 'var(--success)', secondary: 'white' } },
            error: { iconTheme: { primary: 'var(--error)', secondary: 'white' } },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />

          {/* Standalone pages */}
          <Route path="/user" element={<ProtectedRoute><UserPage /></ProtectedRoute>} />
          <Route path="/query" element={<ProtectedRoute><QueryPage /></ProtectedRoute>} />

          {/* Dashboard layout routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/ask-question" element={<AskQuestion />} />
            <Route path="/my-questions" element={<MyQuestions />} />
            <Route path="/questions/:id" element={<QuestionDetail />} />
            <Route path="/answer-center" element={<AnswerCenter />} />
            <Route path="/admin" element={<AdminArea />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/user" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}