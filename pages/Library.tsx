import React, { useState, useRef } from 'react';
import { ListMusic, Grid, Search, Play, Trash2, ChevronLeft, Plus, Upload, Music as MusicIcon, Link as LinkIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { usePlayerStore } from '../store/playerStore';
import TrackCard from '../components/TrackCard';
import { Track } from '../types';

const Library: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    userPlaylists,
    userTracks,
    setPlaylist,
    setCurrentTrack,
    removeTrackFromPlaylist,
    addUserTrack,
    removeUserTrack,
    createPlaylist
  } = usePlayerStore();

  const [search, setSearch] = useState('');
  const initialViewParam = searchParams.get('view');
  const initialView = (initialViewParam === 'playlists' || initialViewParam === 'imported' || initialViewParam === 'links')
    ? initialViewParam as any
    : 'all';
  const initialPlaylistId = searchParams.get('playlist');

  const [view, setView] = useState<'all' | 'playlists' | 'imported' | 'links'>(initialView);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(initialPlaylistId);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTracks = [...userTracks];

  const filteredTracks = allTracks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.artist.toLowerCase().includes(search.toLowerCase())
  );

  const activePlaylist = userPlaylists.find(p => p.id === activePlaylistId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const files = e.target.files;
    console.log('[Library] File upload triggered, count:', files?.length);
    if (!files || files.length === 0) return;

    setIsImporting(true);

    try {
      for (const file of Array.from(files)) {
        console.log('[Library] Processing file:', file.name, 'size:', file.size);
        try {
          const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
          const CHUNK_SIZE = 1024 * 300; // 300KB - Multiple of 3 for safe Base64 appending
          let offset = 0;
          let isFirstChunk = true;

          console.log('[Library] Starting chunked write for:', fileName);

          while (offset < file.size) {
            const chunk = file.slice(offset, offset + CHUNK_SIZE);
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const res = reader.result as string;
                if (!res.includes(',')) {
                  reject(new Error('Invalid File Data: No base64 separator found'));
                  return;
                }
                resolve(res.split(',')[1]); // Strip prefix
              };
              reader.onerror = () => reject(new Error('FileReader Error'));
              reader.readAsDataURL(chunk);
            });

            if (isFirstChunk) {
              await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Data
              });
              isFirstChunk = false;
              console.log('[Library] Created file and wrote first chunk');
            } else {
              await Filesystem.appendFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Data
              });
              console.log('[Library] Appended chunk at offset:', offset);
            }

            offset += CHUNK_SIZE;
          }

          const stats = await Filesystem.getUri({
            path: fileName,
            directory: Directory.Data
          });
          console.log('[Library] File saved successfully, URI:', stats.uri);

          const track: Track = {
            id: `local-${Math.random().toString(36).substr(2, 9)}`,
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: "Imported File",
            source: stats.uri,
            thumbnail: `https://picsum.photos/seed/${file.name}/400/400`,
            duration: "Local"
          };
          addUserTrack(track);
        } catch (err: any) {
          console.error('[Library] Error saving file:', file.name, err);
          alert(`Failed to save ${file.name}: ${err.message || err}`);
        }
      }
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setView('imported');
      setActivePlaylistId(null);
    }
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
      setView('playlists');
    }
  };

  const [urlInput, setUrlInput] = React.useState('');
  const [urlTitle, setUrlTitle] = React.useState('');

  const handleUrlAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const track: Track = {
      id: `url-${Math.random().toString(36).substr(2, 9)}`,
      title: urlTitle.trim() || "Remote Audio",
      artist: "Web Stream",
      source: urlInput.trim(),
      thumbnail: `https://picsum.photos/seed/${urlInput.trim()}/400/400`,
      duration: "Stream"
    };

    addUserTrack(track);
    setUrlInput('');
    setUrlTitle('');
    setView('imported'); // Changed to 'imported' as per instruction, assuming imported tracks include URL tracks
    setActivePlaylistId(null);
  };

  return (
    <div className="pb-40 px-4 sm:px-6 pt-10 sm:pt-14 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 text-neon-cyan hover:text-neon-pink transition-colors active-scale">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight">Library</h1>
          </div>
          <div className="flex gap-4 mt-4 overflow-x-auto no-scrollbar pb-2">
            {(['all', 'imported', 'playlists'] as const).map((v) => (
              <button
                key={v}
                onClick={() => { setView(v); setActivePlaylistId(null); }}
                className={clsx(
                  "flex-shrink-0 pb-2 font-bold transition-all text-xs uppercase tracking-[0.2em]",
                  (view === v && !activePlaylistId) ? "text-neon-cyan border-b-2 border-neon-cyan" : "text-gray-500 hover:text-neon-cyan"
                )}
              >
                {v === 'all' ? 'Everything' : v === 'imported' ? 'Local Files' : 'Playlists'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {view === 'imported' && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 font-bold px-6 py-4 rounded-2xl active-scale transition-all disabled:opacity-50 hover:shadow-[0_0_15px_#00f5ff]"
            >
              <Upload className="w-5 h-5" />
              {isImporting ? 'Importing...' : 'Add Files'}
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="audio/*"
            multiple
          />
        </div>
      </header>

      {activePlaylistId && activePlaylist ? (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => setActivePlaylistId(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Library
          </button>
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 pb-6 border-b border-white/5">
            <div className="w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-[2.5rem] flex items-center justify-center text-emerald-500 border border-white/10 shadow-2xl mx-auto sm:mx-0">
              <ListMusic className="w-20 h-20" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Collection</p>
              <h2 className="text-5xl font-black text-white mb-2">{activePlaylist.name}</h2>
              <p className="text-gray-500 text-sm font-medium">{activePlaylist.tracks.length} tracks • Mastered locally</p>
            </div>
            <button
              onClick={() => { setPlaylist(activePlaylist.tracks); setCurrentTrack(activePlaylist.tracks[0]); }}
              className="w-full sm:w-auto bg-emerald-500 text-black font-black px-10 py-5 rounded-2xl active-scale flex items-center justify-center gap-3 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]"
            >
              <Play className="w-6 h-6 fill-current" />
              PLAY ALL
            </button>
          </div>

          <div className="space-y-1">
            {activePlaylist.tracks.map((track, idx) => (
              <div key={track.id + idx} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-3xl group active-scale transition-all border border-transparent hover:border-white/5">
                <div className="w-6 text-gray-600 font-mono text-xs">{idx + 1}</div>
                <div className="relative w-14 h-14 flex-shrink-0 cursor-pointer" onClick={() => { setPlaylist(activePlaylist.tracks); setCurrentTrack(track); }}>
                  <img src={track.thumbnail} className="w-full h-full object-cover rounded-2xl" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity">
                    <Play className="w-5 h-5 fill-white text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0" onClick={() => { setPlaylist(activePlaylist.tracks); setCurrentTrack(track); }}>
                  <div className="text-white font-bold truncate text-base">{track.title}</div>
                  <div className="text-gray-500 text-xs truncate uppercase tracking-widest mt-0.5">{track.artist}</div>
                </div>
                <button
                  onClick={() => removeTrackFromPlaylist(activePlaylist.id, track.id)}
                  className="p-3 text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : view === 'playlists' ? (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          <div
            onClick={() => setShowCreatePlaylist(true)}
            className="aspect-[4/5] bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer active-scale transition-all hover:border-emerald-500/50 group"
          >
            <div className="bg-white/5 p-4 rounded-2xl group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
              <Plus className="w-10 h-10 text-gray-500" />
            </div>
            <span className="font-bold text-xs uppercase tracking-widest text-gray-400">New Collection</span>
          </div>

          {userPlaylists.map(playlist => (
            <div
              key={playlist.id}
              onClick={() => setActivePlaylistId(playlist.id)}
              className="bg-white/5 p-5 rounded-[2rem] border border-white/10 cursor-pointer active-scale transition-all hover:border-emerald-500/30 group"
            >
              <div className="aspect-square bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl flex items-center justify-center text-emerald-500 mb-5 shadow-2xl border border-white/5 group-hover:scale-[1.02] transition-transform">
                <ListMusic className="w-16 h-16" />
              </div>
              <h3 className="text-base font-bold text-white truncate px-1">{playlist.name}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1 px-1">{playlist.tracks.length} tracks</p>
            </div>
          ))}
        </section>
      ) : view === 'imported' ? (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {userTracks.filter(t => !t.source.startsWith('http')).length === 0 ? (
            <div className="col-span-full py-32 text-center space-y-6 bg-white/5 rounded-[3rem] border border-white/5 border-dashed">
              <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <MusicIcon className="w-10 h-10 text-gray-600" />
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 font-bold text-lg">No local files yet</p>
                <p className="text-gray-600 text-sm max-w-xs mx-auto">Import your favorite MP3s to take them anywhere.</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-500 text-black font-black px-8 py-4 rounded-2xl active-scale text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
              >
                Import Music
              </button>
            </div>
          ) : (
            userTracks.filter(t => !t.source.startsWith('http')).map(track => (
              <div key={track.id} className="relative group">
                <TrackCard track={track} />
                <button
                  onClick={(e) => { e.stopPropagation(); removeUserTrack(track.id); }}
                  className="absolute top-6 left-6 p-2.5 bg-black/80 backdrop-blur-md rounded-full text-white active-scale shadow-2xl border border-white/10 ring-4 ring-black/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </section>
      ) : view === 'links' ? (
        <section className="space-y-10">
          <div className="bg-gradient-to-br from-purple-500/20 via-white/5 to-transparent p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-2">Connect Stream</h2>
            <p className="text-gray-400 text-sm mb-2">Add direct audio file URLs (MP3, M4A, OGG, WAV, etc.) to your library.</p>
            <p className="text-gray-500 text-xs mb-8">⚠️ Note: YouTube links require audio extraction service (not supported yet)</p>
            <form onSubmit={handleUrlAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Track Name</label>
                <input
                  type="text" placeholder="e.g. Synthwave Station" value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Stream URL</label>
                <div className="flex gap-3">
                  <input
                    type="url" placeholder="https://..." value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-purple-500/50 transition-all font-mono text-sm"
                  />
                  <button type="submit" className="bg-purple-500 text-white font-black px-8 rounded-2xl active-scale shadow-lg shadow-purple-500/20">
                    ADD
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userTracks.filter(t => t.source.startsWith('http')).map(track => (
              <div key={track.id} className="relative group">
                <TrackCard track={track} />
                <button
                  onClick={(e) => { e.stopPropagation(); removeUserTrack(track.id); }}
                  className="absolute top-6 left-6 p-2.5 bg-black/80 backdrop-blur-md rounded-full text-white active-scale shadow-2xl border border-white/10 ring-4 ring-black/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredTracks.map(track => <TrackCard key={track.id} track={track} />)}
        </section>
      )}

      {showCreatePlaylist && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreatePlaylist(false)} />
          <div className="relative w-full max-w-md bg-zinc-950 border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-16 sm:pb-8">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8 sm:hidden" />
            <h2 className="text-2xl font-black mb-6">Create Playlist</h2>
            <form onSubmit={handleCreatePlaylist} className="space-y-6">
              <input
                autoFocus type="text" placeholder="Name your playlist..." value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white text-lg outline-none focus:border-emerald-500"
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowCreatePlaylist(false)} className="flex-1 py-4 font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-500 text-black font-black py-4 rounded-2xl active-scale">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
