import { DataProvider } from './DataProvider'
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import Home from './Home'

function App() {
  return (
    <>
      <Router>
        <DataProvider>
            <Routes>
              <Route path={"/"} element={<Home/>}/> 
            </Routes>
        </DataProvider>
      </Router>
    </>
  )
}

export default App
