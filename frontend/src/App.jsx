import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing.jsx';
import AuthenticationPage from './pages/authentication.jsx';
import HomePage from './pages/home.jsx';
import './App.css'; // Assuming you have a CSS file for styles
import { AuthProvider } from './contexts/AuthContext.jsx';
import VideoMeet from './pages/videoMeet.jsx';
import History from './pages/history.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthenticationPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/history" element={<History />} />
          <Route path="/:url" element={<VideoMeet />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
