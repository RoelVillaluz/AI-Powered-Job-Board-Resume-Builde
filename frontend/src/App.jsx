import { SocketProvider } from "./contexts/SocketContext.jsx";
import { ChatProvider } from "./contexts/chats/ChatContext.jsx";
import { useAuthStore } from "./stores/authStore.js";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SideNavbar from "./components/SideNavbar";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
import GetStartedForm from "./pages/GetStartedForm";
import Dashboard from "./pages/Dashboard";
import CreateJobForm from "./pages/CreateJobForm";
import JobPostingsList from "./pages/JobPostingsList";
import JobDetailPage from "./pages/JobDetailPage.jsx";
import { useEffect } from "react";
import ChangePasswordForm from "./pages/ChangePasswordForm";
import ChatsPage from "./pages/ChatsPage";
import JobApplicantsPage from "./pages/JobApplicantsPage.jsx";
import JobCandidatesPage from "./pages/JobCandidatesPage.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname])

  return null;
}

function App() {
  const restoreSession = useAuthStore(state => state.restoreSession);

  // Restore session when app loads
  useEffect(() => {
    restoreSession();
  }, []);
  
  return (
    <Router>
        <SideNavbar />
          <SocketProvider>
            {/* <ResumeProvider> */}
              {/* Scroll to top on every route change */}
                  <ScrollToTop />

                  <Routes>
                  <Route path="/" element={<AppRoutes />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route path="/get-started" element={<GetStartedForm />} />
                  <Route path="/create-job-posting" element={<CreateJobForm />} />

                  <Route path="/job-postings" element={<JobPostingsList /> }/>
                  <Route path="/job-postings/:jobId" element={<JobDetailPage />} />
                  <Route path="/job-postings/:jobId/applicants" element={<JobApplicantsPage />} />
                  <Route path="/job-postings/:jobId/candidates" element={<JobCandidatesPage />} />

                  <Route path="/change-password" element={<ChangePasswordForm />} />

                  <Route path="/messages" element={
                    <ChatProvider>
                      <ChatsPage />
                    </ChatProvider>
                } />
              </Routes>
          </SocketProvider>
    </Router>
  );
}


function AppRoutes() {
    const user = useAuthStore(state => state.user);

    // Check if the user exists and if they have a role assigned
    if (user) {
      // If user has role already and has at least one resume or has company, redirect to dashboard
      if (user.role && (user.resumes.length > 0 || user.company)) {
          return <Dashboard />;
      } else {
          return <GetStartedForm />;
      }
    } else {
        return <LandingPage />;
    }
}


export default App;
