import React, { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from '../store/playerStore';
import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@capgo/capacitor-media-session';

const AudioEngine: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    nextTrack,
    prevTrack,
    togglePlay,
    setStatus,
    updateProgress,
    seekTo,
    playSessionId
  } = usePlayerStore();

  const howlRef = useRef<Howl | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const activeSessionRef = useRef<number>(0);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Seeking with safety checks
  useEffect(() => {
    if (howlRef.current && seekTo !== null) {
      // Clear any pending seek
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }

      // Only seek if audio is loaded
      const state = howlRef.current.state();
      if (state === 'loaded' || state === 'playing' || state === 'ended') {
        howlRef.current.seek(seekTo);
      } else {
        // Retry seek when ready (up to 500ms)
        seekTimeoutRef.current = setTimeout(() => {
          if (howlRef.current && seekTo !== null) {
            howlRef.current.seek(seekTo);
          }
          seekTimeoutRef.current = null;
        }, 50);
      }
      usePlayerStore.setState({ seekTo: null });
    }

    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = null;
      }
    };
  }, [seekTo]);

  // Initialize Media Session Handlers ONCE
  useEffect(() => {
    MediaSession.setActionHandler({ action: 'play' }, () => usePlayerStore.getState().togglePlay());
    MediaSession.setActionHandler({ action: 'pause' }, () => usePlayerStore.getState().togglePlay());
    MediaSession.setActionHandler({ action: 'previoustrack' }, () => usePlayerStore.getState().prevTrack());
    MediaSession.setActionHandler({ action: 'nexttrack' }, () => usePlayerStore.getState().nextTrack());

    // Seek handlers for notification scrubbing
    MediaSession.setActionHandler({ action: 'seekto' }, (details) => {
      if (details.seekTime !== undefined && details.seekTime !== null) {
        // Cancel any previous seeking to avoid conflicts
        const state = usePlayerStore.getState();
        usePlayerStore.getState().seekToTime(details.seekTime);
      }
    });

    MediaSession.setActionHandler({ action: 'seekbackward' }, () => {
      const state = usePlayerStore.getState();
      if (state.currentTime !== null && state.currentTime !== undefined) {
        const newTime = Math.max(0, state.currentTime - 10);
        state.seekToTime(newTime);
      }
    });

    MediaSession.setActionHandler({ action: 'seekforward' }, () => {
      const state = usePlayerStore.getState();
      if (state.currentTime !== null && state.currentTime !== undefined) {
        const newTime = Math.min(state.totalDuration, state.currentTime + 10);
        state.seekToTime(newTime);
      }
    });

    // Cleanup handlers on unmount
    return () => {
      MediaSession.setActionHandler({ action: 'play' }, () => { });
      MediaSession.setActionHandler({ action: 'pause' }, () => { });
      MediaSession.setActionHandler({ action: 'previoustrack' }, () => { });
      MediaSession.setActionHandler({ action: 'nexttrack' }, () => { });
      MediaSession.setActionHandler({ action: 'seekto' }, () => { });
      MediaSession.setActionHandler({ action: 'seekbackward' }, () => { });
      MediaSession.setActionHandler({ action: 'seekforward' }, () => { });
    };
  }, []);

  // Main Playback Effect: supports preloading local files fully (via fetch -> Blob URL)
  useEffect(() => {
    let mounted = true;
    if (currentTrack) {
      // Increment session counter - invalidates any previous pending operations
      activeSessionRef.current = playSessionId;
      const currentSession = playSessionId;

      // Cleanup previous howl and blob immediately
      if (howlRef.current) {
        try { howlRef.current.stop(); } catch (e) { /* ignore */ }
        try { howlRef.current.unload(); } catch (e) { /* ignore */ }
        howlRef.current = null;
      }
      if (currentBlobUrlRef.current) {
        try { URL.revokeObjectURL(currentBlobUrlRef.current); } catch (e) { /* ignore */ }
        currentBlobUrlRef.current = null;
      }
      
      // Cancel any pending seek
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = null;
      }
      usePlayerStore.setState({ seekTo: null });

      const setupHowl = async () => {
        let audioSource: string | undefined;

        const isLocal = currentTrack.source.startsWith('file://') || currentTrack.source.startsWith('/');

        if (isLocal) {
          // Convert Capacitor file URI to accessible URL and fetch fully into memory
          setStatus('loading');
          try {
            const accessible = Capacitor.convertFileSrc(currentTrack.source);
            const res = await fetch(accessible);
            if (!mounted || activeSessionRef.current !== currentSession) return;
            const blob = await res.blob();
            if (!mounted || activeSessionRef.current !== currentSession) return;
            const blobUrl = URL.createObjectURL(blob);
            currentBlobUrlRef.current = blobUrl;
            audioSource = blobUrl;
          } catch (err) {
            console.error('[AudioEngine] Failed to preload local file', err);
            if (activeSessionRef.current === currentSession) setStatus('error');
            return;
          }
        } else {
          audioSource = currentTrack.source;
        }

        if (!audioSource) return;

        console.log(`[AudioEngine] [Session ${playSessionId}] Playing:`, currentTrack.title);

        // Try to infer audio format (mp3, m4a, wav...) from original source
        const extMatch = currentTrack.source && currentTrack.source.match(/\.([a-z0-9]+)(?:\?.*)?$/i);
        const inferredFormat = extMatch ? extMatch[1].toLowerCase() : undefined;

        console.log('[AudioEngine] source:', currentTrack.source, 'inferredFormat:', inferredFormat, 'isLocal:', isLocal, 'audioSource:', audioSource);

        const newHowl = new Howl({
          src: [audioSource],
          html5: true,
          format: inferredFormat ? [inferredFormat] : undefined,
          volume: volume,
          autoplay: false, // CRITICAL: Never auto-play without explicit state
          onplay: () => {
            console.log(`[AudioEngine] [Session ${currentSession}] onplay triggered`);
            if (activeSessionRef.current === currentSession && howlRef.current === newHowl) {
              setStatus('playing');
              updateMediaState('playing');
            } else {
              console.warn(`[AudioEngine] Ghost onplay detected! Stopping. Session ${currentSession}, Active: ${activeSessionRef.current}`);
              newHowl.stop();
            }
          },
          onpause: () => {
            console.log(`[AudioEngine] [Session ${currentSession}] onpause triggered`);
            if (activeSessionRef.current === currentSession && howlRef.current === newHowl) {
              setStatus('paused');
              updateMediaState('paused');
            }
          },
          onend: () => {
            console.log(`[AudioEngine] Track ended. Session ${currentSession}, Active: ${activeSessionRef.current}`);
            if (howlRef.current === newHowl && activeSessionRef.current === currentSession) {
              const state = usePlayerStore.getState();
              const { playlist, currentTrack, repeatMode, isShuffle } = state;
              
              // If repeat is 'none' and we're at the end of playlist (and not shuffling), stop playback
              if (repeatMode === 'none' && !isShuffle && currentTrack) {
                const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
                if (currentIndex === playlist.length - 1) {
                  // Stop playback at end of playlist
                  setStatus('paused');
                  usePlayerStore.setState({ isPlaying: false });
                  return;
                }
              }
              // Otherwise move to next track
              nextTrack();
            } else {
              console.warn(`[AudioEngine] Ghost onend detected! Ignoring.`);
            }
          },
          onload: () => {
            console.log(`[AudioEngine] [Session ${currentSession}] Track loaded`);
            if (howlRef.current === newHowl && activeSessionRef.current === currentSession) {
              setStatus(isPlaying ? 'playing' : 'paused');
              if (isPlaying) {
                console.log(`[AudioEngine] [Session ${currentSession}] Starting playback`);
                newHowl.play();
              }
            } else {
              console.warn(`[AudioEngine] Ghost onload detected! Session ${currentSession}, Active: ${activeSessionRef.current}`);
            }
          },
          onloaderror: (id, err) => {
            console.error('[AudioEngine] Load Error:', err);
            if (howlRef.current === newHowl && activeSessionRef.current === currentSession) setStatus('error');
          },
          onplayerror: (id, err) => {
            console.error('[AudioEngine] Play Error:', err);
            if (howlRef.current === newHowl && activeSessionRef.current === currentSession) {
              setStatus('error');
              newHowl.once('unlock', () => {
                if (howlRef.current === newHowl && activeSessionRef.current === currentSession) newHowl.play();
              });
            }
          }
        });

        howlRef.current = newHowl;

        // Update Metadata
        MediaSession.setMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: 'LORDx Music',
          artwork: [
            { src: currentTrack.thumbnail || 'https://picsum.photos/seed/music/512/512', sizes: '512x512', type: 'image/jpeg' }
          ]
        });
      };

      setupHowl();
    }

    return () => {
      mounted = false;
      if (howlRef.current) {
        try { howlRef.current.stop(); } catch (e) { /* ignore */ }
        try { howlRef.current.unload(); } catch (e) { /* ignore */ }
        howlRef.current = null;
      }
      if (currentBlobUrlRef.current) {
        try { URL.revokeObjectURL(currentBlobUrlRef.current); } catch (e) { /* ignore */ }
        currentBlobUrlRef.current = null;
      }
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
        seekTimeoutRef.current = null;
      }
    };
  }, [currentTrack?.id, playSessionId]);

  const updateMediaState = (state: 'playing' | 'paused') => {
    MediaSession.setPlaybackState({ playbackState: state });
  };

  useEffect(() => {
    if (howlRef.current) {
      if (isPlaying) {
        if (!howlRef.current.playing()) howlRef.current.play();
      } else {
        if (howlRef.current.playing()) howlRef.current.pause();
      }
      updateMediaState(isPlaying ? 'playing' : 'paused');
    }
  }, [isPlaying]);

  useEffect(() => {
    if (howlRef.current) howlRef.current.volume(volume);
  }, [volume]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (howlRef.current && isPlaying) {
        const current = howlRef.current.seek();
        const duration = howlRef.current.duration();
        
        if (typeof current === 'number' && typeof duration === 'number') {
          updateProgress(current, duration);

          // Sync position state for scrubbing
          if (duration > 0) {
            MediaSession.setPositionState({
              duration: duration,
              playbackRate: 1,
              position: current
            });
          }
        }
      }
    }, 500); // Update every 500ms for smoother response
    return () => clearInterval(interval);
  }, [isPlaying, updateProgress]);

  return <div className="hidden" aria-hidden="true" />;
};

export default AudioEngine;