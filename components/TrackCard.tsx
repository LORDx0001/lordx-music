import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, PlusCircle } from 'lucide-react';
import { Track } from '../types';
import { usePlayerStore } from '../store/playerStore';
import AddToPlaylistModal from './AddToPlaylistModal';

interface TrackCardProps {
  track: Track;
}

const TrackCard: React.FC<TrackCardProps> = ({ track }) => {
  const { currentTrack, setCurrentTrack, setPlaylist, playlist, isPlaying } = usePlayerStore();
  const [showModal, setShowModal] = useState(false);
  const isActive = currentTrack?.id === track.id;
  const lastClickRef = React.useRef<number>(0);

  const handleTrackClick = () => {
    const now = Date.now();
    // Debounce: prevent clicks within 500ms
    if (now - lastClickRef.current < 500) {
      console.log('[TrackCard] Click debounced');
      return;
    }
    lastClickRef.current = now;

    // Set playlist context if track is not in current playlist
    const trackInPlaylist = playlist.some(t => t.id === track.id);
    if (!trackInPlaylist) {
      console.log('[TrackCard] Setting new playlist context');
      setPlaylist([track]);
    }

    setCurrentTrack(track);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.95 }}
        className="group flex flex-col gap-3 transition-all"
      >
        <div
          onClick={handleTrackClick}
          className={`relative aspect-square overflow-hidden rounded-lg bg-black border-2 transition-all duration-500 cursor-pointer ${isActive ? 'border-neon-pink shadow-[0_0_15px_#ff006e,0_0_30px_#ff006e] hover:shadow-[0_0_25px_#ff006e,0_0_40px_#ff006e]' : 'border-neon-cyan/50 shadow-[0_0_10px_#00f5ff] hover:shadow-[0_0_20px_#00f5ff,0_0_30px_#00f5ff]'}`}
        >
          <motion.img
            src={track.thumbnail || 'https://picsum.photos/seed/music/400/400'}
            alt={track.title}
            animate={{ scale: isActive && isPlaying ? 1.1 : 1 }}
            className="w-full h-full object-cover transition-transform duration-700 sm:group-hover:scale-110"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/music/400/400'; }}
          />

          <motion.div
            initial={false}
            animate={{ opacity: isActive && isPlaying ? 1 : 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] sm:group-hover:opacity-100 transition-opacity"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded-lg p-4 shadow-lg transition-all ${isActive ? 'bg-neon-pink text-black shadow-neon-pink' : 'bg-neon-cyan text-black'}`}
            >
              <Play className="w-6 h-6 fill-current" />
            </motion.div>
          </motion.div>

          {isActive && (
            <div className="absolute top-4 right-4 flex gap-0.5 items-end h-3">
              <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-neon-pink rounded-full" />
              <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-neon-cyan rounded-full h-2" />
              <motion.div animate={{ height: [12, 6, 12] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-neon-purple rounded-full h-3" />
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-3 px-2">
          <div className="min-w-0 flex-1" onClick={handleTrackClick}>
            <h3 className={`font-black truncate text-sm sm:text-base leading-tight transition-colors ${isActive ? 'text-neon-pink drop-shadow-[0_0_10px_#ff006e,0_0_20px_#ff006e]' : 'text-neon-cyan drop-shadow-[0_0_10px_#00f5ff,0_0_20px_#00f5ff]'}`}>
              {track.title}
            </h3>
            <p className="text-neon-purple text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] truncate mt-1 drop-shadow-[0_0_8px_#b537f2,0_0_15px_#b537f2]">
              {track.artist}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.2, color: '#ff006e' }}
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="p-1.5 text-neon-pink transition-all border-2 border-neon-pink rounded-lg hover:bg-neon-pink/20 hover:shadow-[0_0_12px_#ff006e]"
          >
            <PlusCircle className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.div>

      {showModal && <AddToPlaylistModal track={track} onClose={() => setShowModal(false)} />}
    </>
  );
};

export default TrackCard;