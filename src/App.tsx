import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedLayout from './components/ProtectedLayout';
import LoadingBar from './components/LoadingBar';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Dashboard from './pages/app/Dashboard';
import Patients from './pages/app/Patients';
import PatientDetail from './pages/app/PatientDetail';
import UploadScan from './pages/app/UploadScan';
import AnalysisStudio from './pages/app/AnalysisStudio';
import Reports from './pages/app/Reports';
import ReportDetail from './pages/app/ReportDetail';
import Compare from './pages/app/Compare';
import ShareCase from './pages/app/ShareCase';
import Annotation from './pages/app/Annotation';
import Analytics from './pages/app/Analytics';
import Admin from './pages/app/Admin';
import Settings from './pages/app/Settings';
import Notifications from './pages/app/Notifications';
import Help from './pages/app/Help';
import NotFound from './pages/NotFound';
import SearchPage from './pages/app/Search';
import Status from './pages/app/Status';
import SkipLink from './components/SkipLink';

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
    <BrowserRouter>
              <OfflineBanner />
              <LoadingBar />
              <SkipLink />
              <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/app" element={<ProtectedLayout />}>
          <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="upload" element={<UploadScan />} />
          <Route path="analysis" element={<AnalysisStudio />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<ReportDetail />} />
          <Route path="compare" element={<Compare />} />
          <Route path="share" element={<ShareCase />} />
          <Route path="annotation" element={<Annotation />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="admin" element={<Admin />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<Help />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="status" element={<Status />} />
        </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
            </AuthProvider>
    </ConfirmProvider>
    </ToastProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
