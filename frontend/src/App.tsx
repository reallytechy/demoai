import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import SampleReport from './pages/SampleReport'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/report/get" element={<SampleReport />} />
      </Routes>
    </BrowserRouter>
  )
}
