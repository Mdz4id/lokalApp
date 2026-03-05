import axios from 'axios';

const BASE_URL = 'https://saavn.sumit.co';

// For the "Artists" Section
export const getArtists = async (query: string = 'Top Artists') => {
  try {
    const response = await axios.get(`${BASE_URL}/api/search/artists`, {
      params: { query, limit: 10 }
    });
    return response.data.success ? response.data.data.results : [];
  } catch (error) {
    return [];
  }
};

// For the "Most Played" Section (Using Albums as a proxy for trending collections)
export const getTrendingAlbums = async (query:string = 'Gangster') => {
  try {
    const response = await axios.get(`${BASE_URL}/api/search/albums`, {
      params: { query, limit: 10 }
    });
    return response.data.success ? response.data.data.results : [];
  } catch (error) {
    return [];
  }
};

export const getAlbumDetails = async (albumId: string) => {
  try {
    
    const response = await axios.get(`${BASE_URL}/api/albums`,{
        params: {id:albumId} 
    });
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error("Album Details API Error:", error);
    return null;
  }};

  

export const getCategoryPlaylists = async (category: string) => {
  const response = await axios.get(`${BASE_URL}/api/search/playlists`, {
    params: { query: category, limit: 5 }
  });
  return response.data.success ? response.data.data.results : [];
};

export const getPlaylistDetails = async (playlistId: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/playlists`, {
      params: { id: playlistId },
    });
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error('Playlist Details API Error:', error);
    return null;
  }
};

export const getArtistDetails = async (artistId: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/artists/${artistId}`);
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error('Artist Details API Error:', error);
    return null;
  }
};

export const getArtistAlbums = async (artistId: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/artists/${artistId}/albums`);
    return response.data.success ? response.data.data.results ?? response.data.data : [];
  } catch (error) {
    console.error('Artist Albums API Error:', error);
    return [];
  }
};

// Global search for the "Suggested" or "Songs" tabs
export const searchSongs = async (query: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/search/songs`, {
      params: { query, limit: 20 }
    });
    // The API returns { success: true, data: { results: [] } }
    return response.data.success ? response.data.data.results : [];
  } catch (error) {
    console.error("Search API Error:", error);
    return [];
  }
};