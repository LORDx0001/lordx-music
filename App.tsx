import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import Player from './pages/Player';
import Library from './pages/Library';
import MiniPlayer from './components/MiniPlayer';
import AudioEngine from './components/AudioEngine';
import { usePlayerStore } from './store/playerStore';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const backButtonListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then(l => l.remove());
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neon-pink/30 overflow-x-hidden">
      {/* Cyberpunk grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, #00f5ff 25%, #00f5ff 26%, transparent 27%, transparent 74%, #00f5ff 75%, #00f5ff 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #ff006e 25%, #ff006e 26%, transparent 27%, transparent 74%, #ff006e 75%, #ff006e 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px'
        }} />
      </div>
      <AudioEngine />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <Home />
            </motion.div>
          } />
          <Route path="/player" element={
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              <Player />
            </motion.div>
          } />
          <Route path="/library" element={
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <Library />
            </motion.div>
          } />
        </Routes>
      </AnimatePresence>

      <MiniPlayer />

      {/* Navigation Indicator */}
      <div className="fixed bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/10 rounded-full pointer-events-none z-[100] sm:hidden" />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;