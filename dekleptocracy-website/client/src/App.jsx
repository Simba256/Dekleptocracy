import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import { SkipLink } from './components/common/ScreenReaderOnly';

// Lazy load all pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Reports = lazy(() => import('./pages/Reports'));
const StateReport = lazy(() => import('./pages/StateReport'));
const Insights = lazy(() => import('./pages/Insights'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const CreateAccount = lazy(() => import('./pages/CreateAccount'));
const Login = lazy(() => import('./pages/Login'));
const Survey = lazy(() => import('./pages/Survey'));
const Topics = lazy(() => import('./pages/Topics'));
const HouseholdExpense = lazy(() => import('./pages/HouseholdExpense'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Profile = lazy(() => import('./pages/Profile'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CopyrightPolicy = lazy(() => import('./pages/CopyrightPolicy'));
const DataPolicy = lazy(() => import('./pages/DataPolicy'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const Help = lazy(() => import('./pages/Help'));
const Services = lazy(() => import('./pages/Services'));

function AppContent() {
  const location = useLocation();
  const hiddenFooterRoutes = ['/chatbot', '/chatbot/debug'];
  const shouldHideFooter = hiddenFooterRoutes.some((route) => location.pathname.startsWith(route));

  return (
    <>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main id="main-content" role="main">
          <Suspense fallback={<LoadingSpinner fullPage message="Loading..." />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/services" element={<Services />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/state-report" element={<StateReport />} />
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
          </Suspense>
        </main>
        {!shouldHideFooter && <Footer />}
      </div>
    </>
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
