import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types/music';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  soundObj: Audio.Sound | null;
  recentlyPlayed: Song[];
  setCurrentSong: (song: Song) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  loadHistory: () => Promise<void>;
  initAudio: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  soundObj: null,
  recentlyPlayed: [],

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
    
    // 1. Handle Audio Cleanup
    if (soundObj) {
      await soundObj.unloadAsync();
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
  
}));