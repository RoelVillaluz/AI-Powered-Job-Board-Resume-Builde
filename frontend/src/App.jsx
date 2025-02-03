import { DataProvider } from './DataProvider'
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import LandingPage from './pages/LandingPage'
import Navbar from './components/Navbar'
import Register from './pages/Register'
import MultiStepForm from './pages/MultiStepForm'
import Dashboard from './pages/Dashboard'
import { useState, useEffect } from 'react'

function App() {
  const [user, setUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user"); // Fetch from localStorage
    if (storedUser) {
        setUser(JSON.parse(storedUser)); // Parse and set user state
    }
  }, []);


  return (
    <>
      <Router>
        <Navbar/>
        <DataProvider>
            <Routes>
              <Route path={"/"} element={user ? <Dashboard/> : <LandingPage/>}/> 
              <Route path={"/register"} element={<Register/>}/>
              <Route path={"/get-started"} element={<MultiStepForm/>}/>
            </Routes>
        </DataProvider>
      </Router>
    </>
  )
}

export default App
