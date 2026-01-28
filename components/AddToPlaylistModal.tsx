
import React, { useState } from 'react';
import { X, Plus, ListMusic } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { Track } from '../types';

interface AddToPlaylistModalProps {
  track: Track;
  onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ track, onClose }) => {
  const { userPlaylists, createPlaylist, addTrackToPlaylist } = usePlayerStore();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreate(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Add to Playlist</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-2">
          {userPlaylists.length === 0 && !showCreate && (
            <p className="text-center text-gray-500 py-4">No playlists yet.</p>
          )}
          
          {userPlaylists.map(playlist => (
            <button
              key={playlist.id}
              onClick={() => {
                addTrackToPlaylist(playlist.id, track);
                onClose();
              }}
              className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors text-left group"
            >
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                <ListMusic className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-white">{playlist.name}</div>
                <div className="text-xs text-gray-500">{playlist.tracks.length} tracks</div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 bg-white/5">
          {showCreate ? (
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500 transition-colors"
              />
              <button 
                type="submit"
                className="bg-emerald-500 text-black font-bold px-4 py-2 rounded-xl hover:bg-emerald-400 transition-all"
              >
                Create
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-white/10 hover:border-emerald-500/50 hover:text-emerald-400 rounded-2xl transition-all text-gray-400"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Playlist</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
