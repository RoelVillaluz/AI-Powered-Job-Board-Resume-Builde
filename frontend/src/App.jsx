import { DataProvider } from "./DataProvider";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SideNavbar from "./components/SideNavbar";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
import GetStartedForm from "./pages/GetStartedForm";
import Dashboard from "./pages/Dashboard";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import CreateJobForm from "./pages/CreateJobForm";
import JobPostingsList from "./pages/JobPostingsList";
import JobDetailPage from "./components/JobDetailPage";
import { useEffect } from "react";
import ChangePasswordForm from "./pages/ChangePasswordForm";
import ChatsPage from "./pages/ChatsPage";
import { SocketProvider } from "./hooks/SocketContext.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname])

  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SideNavbar />
        <DataProvider>

          <SocketProvider>
            {/* Scroll to top on every route change */}
            <ScrollToTop />

            <Routes>
              <Route path="/" element={<AppRoutes />} />
              <Route path="/register" element={<Register />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/get-started" element={<GetStartedForm />} />
              <Route path="/create-job-posting" element={<CreateJobForm />} />
              <Route path="/job-postings" element={<JobPostingsList />} />
              <Route path="/job-postings/:jobId" element={<JobDetailPage />} />
              <Route path="/change-password" element={<ChangePasswordForm />} />
              <Route path="/messages" element={<ChatsPage/>}/>

            </Routes>
          </SocketProvider>
          
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}


function AppRoutes() {
  const { user } = useAuth(); // Access user state from AuthProvider

  return user ? <Dashboard /> : <LandingPage />;
}

export default App;
