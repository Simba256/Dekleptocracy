import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Reports from './pages/Reports';
import DistrictReport from './pages/DistrictReport';
import Insights from './pages/Insights';
import Chatbot from './pages/Chatbot';
import ChatbotDebug from './pages/ChatbotDebug';
import CreateAccount from './pages/CreateAccount';
import Login from './pages/Login';
import Survey from './pages/Survey';
import Topics from './pages/Topics';
import HouseholdExpense from './pages/HouseholdExpense';
import Dashboard from './pages/Dashboard';
import ContactUs from './pages/ContactUs';

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
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/district-report" element={<DistrictReport />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/insights/articles" element={<Insights />} />
        <Route path="/insights/research" element={<Insights />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/chatbot/debug" element={<ChatbotDebug />} />
        <Route path="/chatbot/create-account" element={<CreateAccount />} />
        <Route path="/chatbot/login" element={<Login />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/household-expense" element={<HouseholdExpense />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contact" element={<ContactUs />} />
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
