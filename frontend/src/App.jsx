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
import { JobsListProvider } from "./contexts/JobsListContext.jsx";
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
  return (
    <Router>
      {/* <AuthProvider> */}
        <SideNavbar />
        {/* <DataProvider> */}

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

                  <Route path="/job-postings" element={
                    <JobsListProvider>
                      <JobPostingsList /> 
                    </JobsListProvider>
                  }/>
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
            {/* </ResumeProvider> */}


          </SocketProvider>
          
        {/* </DataProvider> */}
      {/* </AuthProvider> */}
    </Router>
  );
}


function AppRoutes() {
  const user = useAuthStore(state => state.user);

  return user ? <Dashboard /> : <LandingPage />;
}

export default App;
