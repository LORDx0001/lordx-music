export const demoTracks: Track[] = [];

export interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail?: string;             // URL or local asset path
  source: string;                 // MP3 path, remote URL, or local URI
  duration?: string;              // UI helper string
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'loading' | 'error';

export interface PlayerState {
  currentTrack: Track | null;
  playlist: Track[]; // Current playing queue
  userPlaylists: Playlist[]; // User created playlists
  userTracks: Track[]; // Tracks imported from local storage
  isPlaying: boolean;
  status: PlaybackStatus;
  volume: number;
  progress: number; // 0 to 1
  currentTime: number; // seconds
  totalDuration: number; // seconds
  seekTo: number | null; // seconds
  playSessionId: number; // Increment to force engine restart
  isShuffle: boolean;
  repeatMode: 'none' | 'all' | 'one';

  // Actions
  setPlaylist: (tracks: Track[]) => void;
  setCurrentTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number) => void;
  seek: (progress: number) => void;
  seekToTime: (time: number) => void;
  setStatus: (status: PlaybackStatus) => void;
  updateProgress: (currentTime: number, totalDuration: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;

  // Playlist Management
  createPlaylist: (name: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;

  // Local File Management
  addUserTrack: (track: Track) => void;
  removeUserTrack: (trackId: string) => void;
  // UI / Playback control
  closePlayer: () => void;
}