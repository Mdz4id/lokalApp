import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types/music';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  soundObj: Audio.Sound | null;
  recentlyPlayed: Song[];
  favourites: Song[];
  queue: Song[];
  setCurrentSong: (song: Song) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  loadHistory: () => Promise<void>;
  initAudio: () => Promise<void>;
  addToFavourites: (song: Song) => Promise<void>;
  removeFromFavourites: (songId: string) => Promise<void>;
  loadFavourites: () => Promise<void>;
  addToQueue: (song: Song) => Promise<void>;
  removeFromQueue: (songId: string) => Promise<void>;
  reorderQueue: (fromIndex: number, toIndex: number) => Promise<void>;
  loadQueue: () => Promise<void>;
  playFromQueue: (song: Song) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  soundObj: null,
  recentlyPlayed: [],
  favourites: [],
  queue: [],

  // Requirement: Queue/History persisted locally [cite: 143]
  loadHistory: async () => {
    const history = await AsyncStorage.getItem('recently_played');
    if (history) {
      set({ recentlyPlayed: JSON.parse(history) });
    }
  },
  initAudio: async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true, // Required for background play
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error("Audio Mode Error:", error);
    }
  },

  setCurrentSong: async (song: Song) => {
    // Before loading the song, ensure the mode is set
    const { initAudio } = get();
    await initAudio();

    const { soundObj, recentlyPlayed } = get();

    // 1. Handle Audio Cleanup — stop then unload; clear state immediately so
    //    nothing can interact with the stale instance while the new sound loads.
    if (soundObj) {
      try { await soundObj.stopAsync(); } catch (_) {}
      try { await soundObj.unloadAsync(); } catch (_) {}
      set({ soundObj: null, isPlaying: false });
    }

    // 2. Update Recently Played (Local Persistence) [cite: 143]
    // Remove duplicate if song already exists
    const deduped = recentlyPlayed.filter(s => s.id !== song.id);
    // Add new song at the front (LIFO)
    deduped.unshift(song);
    // If over capacity, remove the oldest entry (last item)
    if (deduped.length > 7) deduped.pop();
    const updatedHistory = deduped;

    set({ recentlyPlayed: updatedHistory });
    await AsyncStorage.setItem('recently_played', JSON.stringify(updatedHistory));

    // 3. Start Playback (Using highest quality URL) [cite: 78, 126]
    const { sound } = await Audio.Sound.createAsync(
      { uri: song.downloadUrl[song.downloadUrl.length - 1].url },
      { shouldPlay: true }
    );

    set({ currentSong: song, soundObj: sound, isPlaying: true });
  },

  togglePlayPause: async () => {
    const { soundObj, isPlaying } = get();
    if (!soundObj) return;
    isPlaying ? await soundObj.pauseAsync() : await soundObj.playAsync();
    set({ isPlaying: !isPlaying });
  },

  loadFavourites: async () => {
    const stored = await AsyncStorage.getItem('favourites');
    if (stored) set({ favourites: JSON.parse(stored) });
  },

  addToFavourites: async (song: Song) => {
    const { favourites } = get();
    if (favourites.find(s => s.id === song.id)) return; // already saved
    const updated = [song, ...favourites];
    set({ favourites: updated });
    await AsyncStorage.setItem('favourites', JSON.stringify(updated));
  },

  removeFromFavourites: async (songId: string) => {
    const { favourites } = get();
    const updated = favourites.filter(s => s.id !== songId);
    set({ favourites: updated });
    await AsyncStorage.setItem('favourites', JSON.stringify(updated));
  },

  loadQueue: async () => {
    const stored = await AsyncStorage.getItem('queue');
    if (stored) set({ queue: JSON.parse(stored) });
  },

  addToQueue: async (song: Song) => {
    const { queue } = get();
    if (queue.find(s => s.id === song.id)) return;
    const updated = [...queue, song];
    set({ queue: updated });
    await AsyncStorage.setItem('queue', JSON.stringify(updated));
  },

  removeFromQueue: async (songId: string) => {
    const { queue } = get();
    const updated = queue.filter(s => s.id !== songId);
    set({ queue: updated });
    await AsyncStorage.setItem('queue', JSON.stringify(updated));
  },

  reorderQueue: async (fromIndex: number, toIndex: number) => {
    const { queue } = get();
    const updated = [...queue];
    const [item] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, item);
    set({ queue: updated });
    await AsyncStorage.setItem('queue', JSON.stringify(updated));
  },

  playFromQueue: async (song: Song) => {
    const { removeFromQueue, setCurrentSong } = get();
    await removeFromQueue(song.id);
    await setCurrentSong(song);
  },

}));