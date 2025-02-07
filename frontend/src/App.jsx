import { DataProvider, useData } from './DataProvider';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import MultiStepForm from './pages/MultiStepForm';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Navbar />
      <DataProvider>
        <Routes>
          <Route path={"/"} element={<AppRoutes />}/>
          <Route path={"/register"} element={<Register />} />
          <Route path={"/get-started"} element={<MultiStepForm />} />
        </Routes>
      </DataProvider>
    </Router>
  );
}

function AppRoutes() {
  const { user } = useData(); // Destructure here inside the DataProvider context

  return user ? <Dashboard /> : <LandingPage />;
}

export default App;