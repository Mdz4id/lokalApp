export interface Song {
  id: string;
  name: string;
  album: {
    name: string;
  };
  image: { quality: string; url: string }[];
  downloadUrl: { quality: string; url: string }[];
  duration: number;
  primaryArtists: string;
}