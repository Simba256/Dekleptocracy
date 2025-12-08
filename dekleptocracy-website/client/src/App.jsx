import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Reports from './pages/Reports';
import DistrictReport from './pages/DistrictReport';
import Insights from './pages/Insights';
import Chatbot from './pages/Chatbot';
import CreateAccount from './pages/CreateAccount';
import Login from './pages/Login';
import Survey from './pages/Survey';
import Topics from './pages/Topics';
import HouseholdExpense from './pages/HouseholdExpense';
import Dashboard from './pages/Dashboard';
import ContactUs from './pages/ContactUs';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CopyrightPolicy from './pages/CopyrightPolicy';
import DataPolicy from './pages/DataPolicy';
import Accessibility from './pages/Accessibility';
import Help from './pages/Help';
import Services from './pages/Services';

function AppContent() {
  const location = useLocation();
  const hiddenFooterRoutes = ['/chatbot', '/chatbot/debug'];
  const shouldHideFooter = hiddenFooterRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/services" element={<Services />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/district-report" element={<DistrictReport />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/insights/articles" element={<Insights />} />
        <Route path="/insights/research" element={<Insights />} />
        <Route 
          path="/chatbot" 
          element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          } 
        />
        <Route path="/chatbot/debug" element={<Navigate to="/chatbot" replace />} />
        <Route path="/chatbot/create-account" element={<CreateAccount />} />
        <Route path="/chatbot/login" element={<Login />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/household-expense" element={<HouseholdExpense />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/copyright-policy" element={<CopyrightPolicy />} />
        <Route path="/data-policy" element={<DataPolicy />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="/help" element={<Help />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
      </Routes>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
