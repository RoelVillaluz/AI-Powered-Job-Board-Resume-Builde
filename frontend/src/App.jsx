import { DataProvider } from './DataProvider'
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import LandingPage from './LandingPage'
import Navbar from './components/Navbar'
import Register from './Register'
import MultiStepForm from './MultiStepForm'

function App() {
  return (
    <>
      <Router>
        <Navbar/>
        <DataProvider>
            <Routes>
              <Route path={"/"} element={<LandingPage/>}/> 
              <Route path={"/register"} element={<Register/>}/>
              <Route path={"/get-started"} element={<MultiStepForm/>}/>
            </Routes>
        </DataProvider>
      </Router>
    </>
  )
}

export default App
