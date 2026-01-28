import { create } from 'zustand';
import { PlayerState, Track, Playlist } from '../types';

const PLAYLISTS_KEY = 'hybrid-music-playlists';
const TRACKS_KEY = 'hybrid-music-user-tracks';

const getSavedPlaylists = (): Playlist[] => {
  const saved = localStorage.getItem(PLAYLISTS_KEY);
  return saved ? JSON.parse(saved) : [];
};

const savePlaylists = (playlists: Playlist[]) => {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
};

const getSavedUserTracks = (): Track[] => {
  const saved = localStorage.getItem(TRACKS_KEY);
  return saved ? JSON.parse(saved) : [];
};

const saveUserTracks = (tracks: Track[]) => {
  localStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  playlist: [],
  userPlaylists: getSavedPlaylists(),
  userTracks: getSavedUserTracks(),
  isPlaying: false,
  status: 'idle',
  volume: 0.8,
  progress: 0,
  currentTime: 0,
  totalDuration: 0,
  seekTo: null,
  playSessionId: 0,
  isShuffle: false,
  repeatMode: 'none',

  setPlaylist: (tracks) => set({ playlist: tracks }),

  setCurrentTrack: (track) => {
    set((state) => ({
      currentTrack: track,
      isPlaying: true,
      status: 'loading',
      progress: 0,
      currentTime: 0,
      playSessionId: state.playSessionId + 1
    }));
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  nextTrack: () => {
    const { currentTrack, playlist, isShuffle, repeatMode } = get();
    if (!currentTrack || playlist.length === 0) return;

    if (repeatMode === 'one') {
      get().setCurrentTrack(currentTrack);
      return;
    }

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    let nextIndex;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
      // Try to avoid playing the same track again if possible
      if (nextIndex === currentIndex && playlist.length > 1) {
        nextIndex = (nextIndex + 1) % playlist.length;
      }
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    // Always allow cycling through playlist when user clicks next
    // The stop-on-end behavior is handled in AudioEngine.onend callback
    get().setCurrentTrack(playlist[nextIndex]);
  },

  prevTrack: () => {
    const { currentTrack, playlist } = get();
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    get().setCurrentTrack(playlist[prevIndex]);
  },

  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

  toggleRepeat: () => set((state) => {
    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
    return { repeatMode: nextMode };
  }),

  setVolume: (volume) => set({ volume }),

  seek: (progress) => {
    const { totalDuration } = get();
    if (totalDuration > 0) {
      set({ seekTo: progress * totalDuration });
    }
  },

  seekToTime: (time) => set({ seekTo: time }),

  setStatus: (status) => set({ status }),

  updateProgress: (currentTime, totalDuration) => {
    set({
      currentTime,
      totalDuration,
      progress: totalDuration > 0 ? currentTime / totalDuration : 0
    });
  },

  createPlaylist: (name) => {
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      tracks: []
    };
    const updated = [...get().userPlaylists, newPlaylist];
    set({ userPlaylists: updated });
    savePlaylists(updated);
  },

  addTrackToPlaylist: (playlistId, track) => {
    const updated = get().userPlaylists.map(pl => {
      if (pl.id === playlistId) {
        if (pl.tracks.find(t => t.id === track.id)) return pl;
        return { ...pl, tracks: [...pl.tracks, track] };
      }
      return pl;
    });
    set({ userPlaylists: updated });
    savePlaylists(updated);
  },

  removeTrackFromPlaylist: (playlistId, trackId) => {
    const updated = get().userPlaylists.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, tracks: pl.tracks.filter(t => t.id !== trackId) };
      }
      return pl;
    });
    set({ userPlaylists: updated });
    savePlaylists(updated);
  },

  addUserTrack: (track) => {
    const updated = [track, ...get().userTracks];
    set({ userTracks: updated });
    saveUserTracks(updated);
  },

  removeUserTrack: (trackId) => {
    const updated = get().userTracks.filter(t => t.id !== trackId);
    set({ userTracks: updated });
    saveUserTracks(updated);
  }
  ,

  // Stop playback and clear current track (increments session to cancel engine work)
  closePlayer: () => set((state) => ({
    isPlaying: false,
    status: 'idle',
    currentTrack: null,
    progress: 0,
    currentTime: 0,
    totalDuration: 0,
    playSessionId: state.playSessionId + 1
  }))
}));