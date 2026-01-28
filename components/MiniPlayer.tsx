
import React from 'react';
import { Play, Pause, SkipForward, SkipBack, X } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useNavigate, useLocation } from 'react-router-dom';

const MiniPlayer: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, progress, status, closePlayer } = usePlayerStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentTrack || location.pathname === '/player') return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 safe-pb animate-in slide-in-from-bottom-full duration-700">
      <div className="bg-black/95 backdrop-blur-2xl border-2 border-neon-cyan rounded-lg h-20 flex items-center px-4 gap-4 shadow-neon-cyan relative overflow-hidden active-scale transition-all">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan">
          <div className="h-full bg-neon-pink transition-all" style={{ width: `${progress * 100}%` }} />
        </div>

        <div onClick={() => navigate('/player')} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
          <div className="relative flex-shrink-0">
            <img src={currentTrack.thumbnail} className={`w-12 h-12 rounded-lg object-cover shadow-neon-cyan ${status === 'loading' ? 'animate-pulse opacity-50' : ''}`} alt="" />
            {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-neon-pink border-t-transparent rounded-full animate-spin" /></div>}
          </div>
          <div className="min-w-0">
            <h4 className="text-neon-cyan text-sm font-black truncate leading-tight drop-shadow-[0_0_8px_#00f5ff]">{currentTrack.title}</h4>
            <p className="text-neon-pink text-[10px] font-black uppercase tracking-widest truncate mt-0.5 drop-shadow-[0_0_5px_#ff006e]">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); closePlayer(); }}
            className="w-7 h-7 bg-neon-pink/20 text-neon-pink rounded-lg flex items-center justify-center z-10 border border-neon-pink hover:bg-neon-pink/40 transition-all"
            aria-label="Close player"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prevTrack(); }}
            className="p-3 text-neon-cyan active:text-neon-pink active-scale border border-neon-cyan rounded-lg hover:bg-neon-cyan/10 transition-all"
            aria-label="Previous track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-12 h-12 bg-gradient-to-br from-neon-pink to-neon-purple rounded-lg flex items-center justify-center text-black active-scale shadow-neon-pink font-black"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextTrack(); }}
            className="p-3 text-neon-cyan active:text-neon-pink active-scale border border-neon-cyan rounded-lg hover:bg-neon-cyan/10 transition-all"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
