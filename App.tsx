
import React from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import MemberDirectory from './views/MemberDirectory';
import VisitReport from './views/VisitReport';
import MemberProfile from './views/MemberProfile';
import ChatBot from './components/ChatBot';
import Login from './views/Login';
import Routines from './views/Routines';
import Maintenance from './views/Maintenance'; // Added Maintenance import
import CalendarView from './views/CalendarView';
import MemberMap from './views/MemberMap';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/RequireAuth';

import BottomNav from './components/BottomNav';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-background-light dark:bg-background-dark text-[#0d121b] dark:text-gray-100 font-display transition-colors">
      <Sidebar />
      <main className="flex-1 relative flex flex-col h-full overflow-hidden pb-16 lg:pb-0">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
        <ChatBot />
      </main>
      <BottomNav />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<MemberDirectory />} />
            <Route path="/members/:id" element={<MemberProfile />} />
            <Route path="/reports" element={<VisitReport />} />
            <Route path="/routines" element={<Routines />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/map" element={<MemberMap />} />
            <Route path="/maintenance" element={<Maintenance />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
