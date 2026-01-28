
import React, { useState, useRef } from 'react';
import { Music, ChevronDown, SkipBack, SkipForward, Play, Pause, Volume2, Shuffle, Repeat, Plus, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { usePlayerStore } from '../store/playerStore';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

const Player: React.FC = () => {
  const navigate = useNavigate();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const startYRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const {
    currentTrack, isPlaying, togglePlay, nextTrack, prevTrack,
    progress, volume, setVolume, currentTime, totalDuration, status,
    isShuffle, repeatMode, toggleShuffle, toggleRepeat, seek
  } = usePlayerStore();

  const handleDragStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleDragEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const diff = endY - startYRef.current;
    setIsDragging(false);
    
    // Swipe down at least 50px to close
    if (diff > 50) {
      navigate(-1);
    }
  };

  if (!currentTrack) {
    return (
      <div className="h-screen flex items-center justify-center bg-black p-10 text-center">
        <div>
          <Music className="w-16 h-16 mx-auto mb-4 text-neon-pink" />
          <h2 className="text-xl font-black text-neon-cyan">No track playing</h2>
          <button onClick={() => navigate('/')} className="mt-6 bg-neon-pink text-black font-black px-6 py-3 rounded-2xl active-scale hover:shadow-[0_0_20px_#ff006e]">Back Home</button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[60] bg-zinc-950 overflow-hidden flex flex-col safe-pt safe-pb"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        <div className="absolute inset-0 opacity-40 blur-3xl scale-125 -z-10 transition-all duration-1000">
          <img src={currentTrack.thumbnail} className="w-full h-full object-cover" alt="" />
        </div>

      <header className="px-6 py-8 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-neon-cyan active-scale"><ChevronDown className="w-10 h-10" /></button>
        <div className="text-center min-w-0 px-4">
          <p className="text-[10px] tracking-widest text-neon-pink font-black uppercase mb-0.5 drop-shadow-[0_0_10px_#ff006e]">Now Playing</p>
          <p className="text-xs text-neon-cyan/50 font-bold truncate drop-shadow-[0_0_8px_#00f5ff]">LORDx NEXUS v3.0</p>
        </div>
        <button className="p-2 -mr-2 text-neon-cyan active-scale"><MoreVertical className="w-6 h-6" /></button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-[min(80vw,400px)] aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-2 border-neon-cyan relative bg-black group transition-transform duration-700 hover:border-neon-pink hover:shadow-[0_0_30px_#ff006e,0_0_50px_#ff006e]">
          <img
            src={currentTrack.thumbnail}
            className={`w-full h-full object-cover transition-transform duration-[3000ms] ${isPlaying ? 'scale-110' : 'scale-100'}`}
            alt=""
          />
          {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><div className="w-10 h-10 border-4 border-neon-pink border-t-transparent rounded-full animate-spin" /></div>}
        </div>

        <div className="mt-10 text-left w-full max-w-[400px]">
          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0">
              <h2 className="text-3xl sm:text-4xl font-black text-neon-pink truncate leading-tight drop-shadow-[0_0_15px_#ff006e]">{currentTrack.title}</h2>
              <p className="text-xl text-neon-cyan mt-1 truncate font-bold drop-shadow-[0_0_10px_#00f5ff]">{currentTrack.artist}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-8 pt-6 pb-14 w-full max-w-2xl mx-auto space-y-10">
        <div className="space-y-3 px-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={progress}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neon-cyan/10 rounded-full appearance-none cursor-pointer accent-neon-pink hover:accent-neon-cyan transition-all [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full"
          />
          <div className="flex justify-between text-[10px] text-neon-cyan/50 font-black uppercase tracking-widest">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={toggleShuffle}
            className={clsx(
              "active-scale p-3 rounded-full transition-all",
              isShuffle ? "text-neon-cyan bg-neon-cyan/10 shadow-[0_0_20px_#00f5ff,0_0_40px_#00f5ff]" : "text-gray-500 hover:text-neon-cyan"
            )}
          >
            <Shuffle className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-10">
            <button onClick={prevTrack} className="text-neon-cyan active-scale hover:text-neon-pink transition-colors"><SkipBack className="w-10 h-10 fill-current" /></button>
            <button onClick={togglePlay} className="w-24 h-24 bg-neon-pink rounded-full flex items-center justify-center text-black active-scale shadow-[0_0_30px_#ff006e] hover:scale-105 transition-transform hover:shadow-[0_0_50px_#ff006e]">
              {isPlaying ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-neon-cyan active-scale hover:text-neon-pink transition-colors"><SkipForward className="w-10 h-10 fill-current" /></button>
          </div>

          <button
            onClick={toggleRepeat}
            className={clsx(
              "active-scale p-3 rounded-full transition-all relative",
              repeatMode !== 'none' ? "text-neon-purple bg-neon-purple/10 shadow-[0_0_20px_#b537f2,0_0_40px_#b537f2]" : "text-gray-500 hover:text-neon-purple"
            )}
          >
            <Repeat className="w-6 h-6" />
            {repeatMode === 'one' && <span className="absolute top-2 right-2 text-[8px] font-black bg-neon-purple text-black px-1 rounded-full">1</span>}
          </button>
        </div>

        <div className="flex items-center gap-4 px-2 w-full">
          <Volume2 className="w-5 h-5 text-neon-cyan flex-shrink-0" />
          <input
            type="range" min="0" max="1" step="0.01" value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-neon-pink"
          />
          <button 
            onClick={() => setShowPlaylistModal(true)}
            className="p-3 text-neon-purple bg-neon-purple/10 border border-neon-purple rounded-lg hover:bg-neon-purple/20 transition-all active-scale flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </footer>
      {showPlaylistModal && currentTrack && (
        <AddToPlaylistModal track={currentTrack} onClose={() => setShowPlaylistModal(false)} />
      )}
    </motion.div>
    </AnimatePresence>
  );
};

export default Player;
