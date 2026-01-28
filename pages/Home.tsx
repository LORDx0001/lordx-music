import React, { useRef, useState } from 'react';
import { Music, Play, Upload, ChevronRight, ListMusic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TrackCard from '../components/TrackCard';
import { demoTracks } from '../data/demoTracks';
import { usePlayerStore } from '../store/playerStore';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { setCurrentTrack, setPlaylist, userPlaylists, userTracks, addUserTrack } = usePlayerStore();

  const handlePlayAll = () => {
    const tracksToPlay = demoTracks.length > 0 ? demoTracks : userTracks;
    if (tracksToPlay.length > 0) {
      setPlaylist(tracksToPlay);
      setCurrentTrack(tracksToPlay[0]);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|flac|ogg)$/i)
    );

    const importPromises = audioFiles.map(file => 
      new Promise<void>(async (resolve) => {
        try {
          const fileName = `${Date.now()}-${Math.random()}-${file.name.replace(/\s+/g, '_')}`;
          const reader = new FileReader();
          
          reader.onload = async () => {
            try {
              const base64Data = (reader.result as string).split(',')[1];
              await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Data
              });
              
              // Get the proper URI from Capacitor
              const stats = await Filesystem.getUri({
                path: fileName,
                directory: Directory.Data
              });
              
              const track = {
                id: Math.random().toString(36).substr(2, 9),
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Imported',
                source: stats.uri,
                thumbnail: undefined
              };
              addUserTrack(track);
              resolve();
            } catch (err) {
              console.error('[Home] Error importing track:', file.name, err);
              resolve();
            }
          };
          reader.onerror = () => {
            console.error('[Home] Error reading file:', file.name);
            resolve();
          };
          reader.readAsDataURL(file);
        } catch (err) {
          console.error('[Home] Error processing track:', err);
          resolve();
        }
      })
    );

    await Promise.all(importPromises);
    setIsImporting(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-40 px-4 sm:px-6 pt-10 sm:pt-14 max-w-7xl mx-auto"
    >
      <motion.header variants={itemVariants} className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-neon-pink font-bold mb-2">
            <Music className="w-5 h-5" />
            <span className="text-xs tracking-widest uppercase text-neon-pink drop-shadow-[0_0_10px_#ff006e]">LORDx NEXUS</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink leading-tight">NEURAL</h1>
          <p className="text-neon-cyan mt-2 text-sm sm:text-base max-w-md font-bold drop-shadow-[0_0_15px_#00f5ff]">
            IMMERSIVE SONIC MATRIX // LOAD YOUR TRACK COLLECTION
          </p>
        </div>

        <div className="flex gap-3 sm:gap-4 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px #00f5ff, 0 0 60px #00f5ff' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-transparent text-neon-cyan font-black px-6 py-4 rounded-xl transition-all border-2 border-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            {isImporting ? 'IMPORTING...' : 'ADD SONGS'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px #b537f2, 0 0 60px #b537f2' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/library')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-transparent text-neon-purple font-black px-6 py-4 rounded-xl transition-all border-2 border-neon-purple hover:bg-neon-purple/10"
          >
            LIBRARY
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px #ff006e, 0 0 60px #ff006e' }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neon-pink text-black font-black px-6 py-4 rounded-xl transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            PLAY
          </motion.button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </motion.header>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mb-10">
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px #00f5ff, 0 0 60px #00f5ff' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/library?view=imported')}
          className="p-5 rounded-xl bg-black border-2 border-neon-cyan flex flex-col gap-3 cursor-pointer transition-all group hover:bg-neon-cyan/5"
        >
          <div className="bg-neon-cyan/20 w-fit p-3 rounded-lg">
            <Music className="w-8 h-8 text-neon-cyan" />
          </div>
          <div className="text-sm font-black uppercase tracking-wider text-neon-cyan drop-shadow-[0_0_8px_#00f5ff]">LOCAL TRACKS</div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px #b537f2, 0 0 60px #b537f2' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/library?view=playlists')}
          className="p-5 rounded-xl bg-black border-2 border-neon-purple flex items-center justify-between cursor-pointer transition-all group hover:bg-neon-purple/5"
        >
          <div className="flex flex-col gap-3">
            <div className="bg-neon-purple/20 w-fit p-3 rounded-lg">
              <ListMusic className="w-8 h-8 text-neon-purple" />
            </div>
            <div className="text-sm font-black uppercase tracking-wider text-neon-purple drop-shadow-[0_0_8px_#b537f2]">PLAYLISTS</div>
          </div>
          <ChevronRight className="w-5 h-5 text-neon-purple group-hover:text-neon-pink transition-colors" />
        </motion.div>
      </motion.div>


      {userPlaylists.length > 0 && (
        <motion.section variants={itemVariants} className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-black text-white">Recently Created</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            {userPlaylists.map(playlist => (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={playlist.id}
                onClick={() => navigate(`/library?playlist=${playlist.id}`)}
                className="flex-shrink-0 w-36 sm:w-48 cursor-pointer transition-all"
              >
                <div className="aspect-square bg-neon-purple/10 rounded-3xl flex items-center justify-center border-2 border-neon-purple/50 mb-2 hover:border-neon-purple hover:shadow-[0_0_20px_#b537f2]">
                  <ListMusic className="w-10 h-10 text-neon-purple" />
                </div>
                <h3 className="font-bold text-sm text-neon-purple truncate px-1">{playlist.name}</h3>
                <p className="text-neon-purple/50 text-[10px] uppercase tracking-widest px-1">{playlist.tracks.length} tracks</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {demoTracks.length > 0 && (
        <motion.section variants={itemVariants} className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white">Recommended</h2>
            <button onClick={() => navigate('/library')} className="text-neon-cyan font-bold text-xs uppercase tracking-widest hover:text-neon-pink">See all</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {demoTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </motion.section>
      )}

      {userTracks.length > 0 && (
        <motion.section variants={itemVariants} className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white">Your Music</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {userTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
};

export default Home;
