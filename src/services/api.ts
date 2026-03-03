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
    const response = await axios.get(`${BASE_URL}/api/albums/`,{
        params: { id: albumId }
    });
    return response.data.success ? response.data.data : null;
  } catch (error) {
    console.error("Album Details API Error:", error);
    return null;
  }};

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