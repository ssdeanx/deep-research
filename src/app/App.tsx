import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './Layout'
import { Home } from './pages/Home'
import { Research } from './pages/Research'
import { Agents } from './pages/Agents'
import { Workflows } from './pages/Workflows'

export function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research" element={<Research />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/workflows" element={<Workflows />} />
        </Routes>
      </Layout>
    </Router>
  )
}
