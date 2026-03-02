import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/app/Dashboard';
import Patients from './pages/app/Patients';
import UploadScan from './pages/app/UploadScan';
import AnalysisStudio from './pages/app/AnalysisStudio';
import Reports from './pages/app/Reports';
import Compare from './pages/app/Compare';
import ShareCase from './pages/app/ShareCase';
import Annotation from './pages/app/Annotation';
import Analytics from './pages/app/Analytics';
import Admin from './pages/app/Admin';
import Settings from './pages/app/Settings';
import Notifications from './pages/app/Notifications';
import Help from './pages/app/Help';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="upload" element={<UploadScan />} />
          <Route path="analysis" element={<AnalysisStudio />} />
          <Route path="reports" element={<Reports />} />
          <Route path="compare" element={<Compare />} />
          <Route path="share" element={<ShareCase />} />
          <Route path="annotation" element={<Annotation />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="admin" element={<Admin />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<Help />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
