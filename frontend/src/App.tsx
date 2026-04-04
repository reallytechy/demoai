import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import SampleReport from './pages/SampleReport'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Health from './pages/Health'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/report/get" element={<SampleReport />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/health" element={<Health />} />
      </Routes>
    </BrowserRouter>
  )
}
