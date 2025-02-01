import { DataProvider } from './DataProvider'
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import Home from './Home'
import Navbar from './components/Navbar'
import Register from './Register'

function App() {
  return (
    <>
      <Router>
        <Navbar/>
        <DataProvider>
            <Routes>
              <Route path={"/"} element={<Home/>}/> 
              <Route path={"/register"} element={<Register/>}/>
            </Routes>
        </DataProvider>
      </Router>
    </>
  )
}

export default App
