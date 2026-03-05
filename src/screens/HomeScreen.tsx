import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ScrollView, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/usePlayerStore';
import { getArtists, getTrendingAlbums } from '../services/api';
import { Song, Resource } from '../types/music';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '../theme';
import { HomeScreenNavigationProp } from '../types/navigation';

const getUrl = (resources: Resource[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const theme = useTheme();
  const styles = getStyles(theme);

  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const recentlyPlayed = usePlayerStore((s) => s.recentlyPlayed);
  const loadHistory = usePlayerStore((s) => s.loadHistory);
  const favourites = usePlayerStore((s) => s.favourites);
  const loadFavourites = usePlayerStore((s) => s.loadFavourites);
  const addToFavourites = usePlayerStore((s) => s.addToFavourites);
  const removeFromFavourites = usePlayerStore((s) => s.removeFromFavourites);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const artistQueries = [ 'A', 'S', 'R', 'K'];
const randomArtistQuery = artistQueries[Math.floor(Math.random() * artistQueries.length)];

  const [apiSections, setApiSections] = useState({ artists: [], mostPlayed: [] });
  const [contextSong, setContextSong] = useState<Song | null>(null);

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
      await loadFavourites();
      const [artistData, albumData] = await Promise.all([
        getArtists(randomArtistQuery),
        getTrendingAlbums('HINDI'),
      ]);
      setApiSections({ artists: artistData, mostPlayed: albumData });
    };
    initHome();
  }, []);

  const isFavourited = contextSong
    ? !!favourites.find((s) => s.id === contextSong.id)
    : false;

  const handleFavouriteToggle = () => {
    if (!contextSong) return;
    isFavourited ? removeFromFavourites(contextSong.id) : addToFavourites(contextSong);
    setContextSong(null);
  };

  const handleAddToQueue = () => {
    if (!contextSong) return;
    addToQueue(contextSong);
    setContextSong(null);
  };

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
        navigation.navigate('Artist', { artistId: item.id });
      } else {
        navigation.navigate('Album', { albumId: item.id });
      }
    };
    return (
      <TouchableOpacity
        style={styles.albumCard}
        onPress={handlePress}
        onLongPress={sectionType === 'song' ? () => setContextSong(item) : undefined}
        delayLongPress={350}
      >
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
      navigation.navigate('Artist', { artistId: item.id });
    }}>
      <Image source={{ uri: getUrl(item.image) }} style={styles.artistImage} />
      <Text style={styles.artistName} numberOfLines={1}>{item.name || item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>Mume</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
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

      {/* Long-press context sheet */}
      <Modal
        visible={!!contextSong}
        transparent
        animationType="slide"
        onRequestClose={() => setContextSong(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setContextSong(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {/* Song preview */}
            <View style={styles.sheetSongRow}>
              {contextSong && (
                <Image
                  source={{ uri: getUrl(contextSong.image) }}
                  style={styles.sheetThumb}
                />
              )}
              <View style={styles.sheetSongInfo}>
                <Text style={styles.sheetSongTitle} numberOfLines={1}>
                  {contextSong?.name || contextSong?.title}
                </Text>
                <Text style={styles.sheetSongArtist} numberOfLines={1}>
                  {contextSong?.artists?.primary?.[0]?.name || 'Unknown Artist'}
                </Text>
              </View>
            </View>

            <View style={styles.sheetDivider} />

            {/* Add to Favourites */}
            <TouchableOpacity style={styles.sheetAction} onPress={handleFavouriteToggle}>
              <View style={[styles.sheetActionIcon, isFavourited && styles.sheetActionIconActive]}>
                <Ionicons
                  name={isFavourited ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavourited ? '#FFF' : theme.iconPrimary}
                />
              </View>
              <Text style={styles.sheetActionText}>
                {isFavourited ? 'Remove from Favourites' : 'Add to Favourites'}
              </Text>
            </TouchableOpacity>

            {/* Add to Queue */}
            <TouchableOpacity style={styles.sheetAction} onPress={handleAddToQueue}>
              <View style={styles.sheetActionIcon}>
                <Ionicons name="list" size={20} color={theme.iconPrimary} />
              </View>
              <Text style={styles.sheetActionText}>Add to Queue</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.sectionText },
  seeAll: { color: theme.accent, fontWeight: '600' },
  albumCard: { width: 160, marginLeft: 18 },
  albumArt: { width: 140, height: 140, borderRadius: 20 },
  songTitle: { marginTop: 10, fontWeight: 'bold', fontSize: 14, color: theme.text },
  artistSubtitle: { color: theme.textSecondary, fontSize: 12 },
  artistCard: { alignItems: 'center', marginLeft: 20, width: 110 },
  artistImage: { width: 110, height: 110, borderRadius: 55 },
  artistName: { marginTop: 8, fontWeight: '500', color: theme.text },

  // Context sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  sheetSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: theme.border,
  },
  sheetSongInfo: {
    flex: 1,
    marginLeft: 14,
  },
  sheetSongTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  sheetSongArtist: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 3,
  },
  sheetDivider: {
    height: 0.5,
    backgroundColor: theme.border,
    marginBottom: 8,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  sheetActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionIconActive: {
    backgroundColor: '#E0334C',
  },
  sheetActionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
  },
});

export default HomeScreen;
