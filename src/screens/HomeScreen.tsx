import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, 
  StyleSheet, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/usePlayerStore';
import { getArtists, getTrendingAlbums } from '../services/api';
import { Song, Resource } from '../types/music';
import { useNavigation } from '@react-navigation/native';

const getUrl = (resources: Resource[]) => {
  const item = resources?.[resources.length - 1]; // Get highest quality [cite: 58, 78, 119]
  return item?.url || item?.link || '';
};


const HomeScreen = () => {
    const navigation = useNavigation();
  // Access the "Brain" 
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);
  const recentlyPlayed = usePlayerStore((state) => state.recentlyPlayed);
  const loadHistory = usePlayerStore((state) => state.loadHistory);
  const [apiSections, setApiSections] = useState({
    artists: [],
    mostPlayed: [],
  });
  useEffect(() => {
  const setup = async () => {
    const store = usePlayerStore.getState();
    await store.initAudio(); // Initialize audio settings
    await store.loadHistory(); // Load your AsyncStorage history
  };
  
  setup();
}, []);

useEffect(() => {
  const initHome = async () => {
    // Load local history first [cite: 143]
    await loadHistory();
    
    // Then fetch remote API data
    const [artistData, albumData] = await Promise.all([
      getArtists('Popular'),
      getTrendingAlbums()
    ]);

    setApiSections({
      artists: artistData,
      mostPlayed: albumData,
    });
  };

  initHome();
}, []);

  // Helper to structure sections for the .map() loop 
  const displaySections = [
    { title: "Recently Played", data: recentlyPlayed, type: 'album' },
    { title: "Artists", data: apiSections.artists, type: 'artist' },
    { title: "Albums ", data: apiSections.mostPlayed, type: 'album' }
  ];

  const renderAlbumCard = ({ item }: { item: Song }) => (
    <TouchableOpacity style={styles.albumCard} onPress={() => setCurrentSong(item)}>
      <Image source={{ uri: getUrl(item.image) }} style={styles.albumArt} />
      <Text style={styles.songTitle} numberOfLines={1}>{item.name }</Text>
      <Text style={styles.artistSubtitle} numberOfLines={1}>
        {item.artists?.primary?.[0]?.name  || 'Unknown'}
      </Text>
    </TouchableOpacity>
  );

  const renderArtistCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.artistCard}>
      <Image source={{ uri: getUrl(item.image) }} style={styles.artistImage} />
      <Text style={styles.artistName} numberOfLines={1}>{item.name || item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>Mume</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search' as never)}>
          <Text style={{fontSize: 24}}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {displaySections.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
            </View>
            
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={section.data}
              keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
              renderItem={section.type === "artist" ? renderArtistCard : renderAlbumCard}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// ... keep your existing styles
const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#FFF' },

  header: { 

    flexDirection: 'row', 

    justifyContent: 'space-between', 

    padding: 20, 

    alignItems: 'center' 

  },

  logoText: { fontSize: 28, fontWeight: 'bold', color: '#000' },

  sectionContainer: { marginBottom: 25 },

  sectionHeader: { 

    flexDirection: 'row', 

    justifyContent: 'space-between', 

    paddingHorizontal: 20, 

    marginBottom: 15 

  },

  sectionTitle: { fontSize: 20, fontWeight: 'bold' },

  seeAll: { color: '#FF7A00', fontWeight: '600' },

  albumCard: { width: 160, marginLeft: 20 },

  albumArt: { width: 160, height: 160, borderRadius: 20 },

  songTitle: { marginTop: 10, fontWeight: 'bold', fontSize: 14 },

  artistSubtitle: { color: '#666', fontSize: 12 },

  artistCard: { alignItems: 'center', marginLeft: 20, width: 110 },

  artistImage: { width: 110, height: 110, borderRadius: 55 },

  artistName: { marginTop: 8, fontWeight: '500' }

});

export default HomeScreen;