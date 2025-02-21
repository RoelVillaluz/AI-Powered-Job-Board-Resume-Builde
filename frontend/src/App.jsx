import { DataProvider } from "./DataProvider";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import MultiStepForm from "./pages/MultiStepForm";
import Dashboard from "./pages/Dashboard";
import { AuthProvider, useAuth } from "./components/AuthProvider";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <DataProvider>
          <Routes>
            <Route path="/" element={<AppRoutes />} />
            <Route path="/register" element={<Register />} />
            <Route path="/get-started" element={<MultiStepForm />} />
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
