import { DataProvider } from './DataProvider'
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import LandingPage from './LandingPage'
import Navbar from './components/Navbar'
import Register from './Register'

function App() {
  return (
    <>
      <Router>
        <Navbar/>
        <DataProvider>
            <Routes>
              <Route path={"/"} element={<LandingPage/>}/> 
              <Route path={"/register"} element={<Register/>}/>
            </Routes>
        </DataProvider>
      </Router>
    </>
  )
}

export default App
