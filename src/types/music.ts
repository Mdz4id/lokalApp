export interface Resource {
  quality: string;
  url: string;
  link?: string; // Some APIs might return 'link' instead of 'url'
}

export interface Song {
  id: string;
  name: string;      // Note: Some API responses use 'title' instead
  title?: string;
  album: {
    id: string;
    name: string;
    url: string;
  };
  artists: {
    primary: {
      id: string;
      name: string;
      role: string;
      type: string;
      image: Resource[];
      url: string;
    }[];
  };
  image: Resource[];
  downloadUrl: Resource[];
  duration: number;
}