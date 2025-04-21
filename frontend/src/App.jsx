import { DataProvider } from "./DataProvider";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SideNavbar from "./components/SideNavbar";
import Register from "./pages/Register";
import SignIn from "./pages/SignIn";
import MultiStepForm from "./pages/MultiStepForm";
import Dashboard from "./pages/Dashboard";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import CreateJobPosting from "./pages/CreateJob";
import JobPostingsList from "./pages/JobPostingsList";
import JobDetailPage from "./components/JobDetailPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <SideNavbar />
        <DataProvider>
          <Routes>
            
            <Route path="/" element={<AppRoutes />} />

            <Route path="/register" element={<Register />} />
            <Route path="/sign-in" element={<SignIn />} />

            <Route path="/get-started" element={<MultiStepForm />} />

            <Route path="/create-job-posting" element={<CreateJobPosting/>} />
            <Route path="/job-postings" element={<JobPostingsList/>} />
            <Route path="/job-postings/:jobId" element={<JobDetailPage />} />

          </Routes>
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
