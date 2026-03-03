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
export const getTrendingAlbums = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/search/albums`, {
      params: { query: '2026 Hits', limit: 10 }
    });
    return response.data.success ? response.data.data.results : [];
  } catch (error) {
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