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
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '../theme';

const getUrl = (resources: Resource[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = getStyles(theme);

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
      await store.initAudio();
      await store.loadHistory();
    };
    setup();
  }, []);

  useEffect(() => {
    const initHome = async () => {
      await loadHistory();
      const [artistData, albumData] = await Promise.all([
        getArtists('A'),
        getTrendingAlbums('HINDI')
      ]);
      setApiSections({
        artists: artistData,
        mostPlayed: albumData,
      });
    };
    initHome();
  }, []);

  const displaySections = [
    { title: 'Recently Played', data: recentlyPlayed, type: 'song' },
    { title: 'Artists', data: apiSections.artists, type: 'artist' },
    { title: 'Albums', data: apiSections.mostPlayed, type: 'album' },
  ];

  const renderAlbumCard = (sectionType: string) => ({ item }: { item: Song }) => {
    const handlePress = () => {
      if (sectionType === 'song') {
        setCurrentSong(item);
      } else if (sectionType === 'artist') {
        console.log('clicked artist:', item);
      } else {
        navigation.navigate('Album' as never, { albumId: item.id } as never);
      }
    };
    return (
      <TouchableOpacity style={styles.albumCard} onPress={handlePress}>
        <Image source={{ uri: getUrl(item.image) }} style={styles.albumArt} />
        <Text style={styles.songTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artistSubtitle} numberOfLines={1}>
          {item.artists?.primary?.[0]?.name || 'Unknown'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderArtistCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.artistCard} onPress={() => {
      console.log('clicked artist:', item);
    }}>
      <Image source={{ uri: getUrl(item.image) }} style={styles.artistImage} />
      <Text style={styles.artistName} numberOfLines={1}>{item.name || item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>Mume</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search' as never)}>
          <Ionicons name="search" size={24} color={theme.iconPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {displaySections.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <TouchableOpacity><Text style={styles.seeAll}></Text></TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={section.data}
              keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
              renderItem={section.type === 'artist' ? renderArtistCard : renderAlbumCard(section.type)}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    alignItems: 'center',
  },
  logoText: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  sectionContainer: { marginBottom: 25 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  seeAll: { color: theme.accent, fontWeight: '600' },
  albumCard: { width: 160, marginLeft: 18 },
  albumArt: { width: 140, height: 140, borderRadius: 20 },
  songTitle: { marginTop: 10, fontWeight: 'bold', fontSize: 14, color: theme.text },
  artistSubtitle: { color: theme.textSecondary, fontSize: 12 },
  artistCard: { alignItems: 'center', marginLeft: 20, width: 110 },
  artistImage: { width: 110, height: 110, borderRadius: 55 },
  artistName: { marginTop: 8, fontWeight: '500', color: theme.text },
});

export default HomeScreen;
