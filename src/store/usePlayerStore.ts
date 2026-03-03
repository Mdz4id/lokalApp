import { Audio } from "expo-av";
import { Song } from "../types/music";
import { create } from "zustand";




interface PlayerState {
    currentSong: Song | null;
    isPlaying: boolean;
    soundObj :Audio.Sound | null;
    queue: Song[];
    setCurrentSong: (song: Song) => void;
    togglePlayPause: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set,get) => ({
    currentSong: null,
    isPlaying: false,
    soundObj: null,
    queue: [],
    
    setCurrentSong: async(song)=>{
        const{soundObj}=get();
        if(soundObj){
            await soundObj.unloadAsync();
        }
        const {sound}= await Audio.Sound.createAsync({uri: song.downloadUrl[song.downloadUrl.length - 1].url},
        {shouldPlay: true}
        );
        set({ currentSong: song, soundObj: sound, isPlaying: true });
    },
    togglePlayPause: async () => {
    const { soundObj, isPlaying } = get();
    if (!soundObj) return;

    if (isPlaying) {
      await soundObj.pauseAsync();
    } else {
      await soundObj.playAsync();
    }
    set({ isPlaying: !isPlaying });
  },
}));