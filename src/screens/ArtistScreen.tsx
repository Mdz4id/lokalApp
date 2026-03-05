import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getArtistDetails, getArtistAlbums } from '../services/api';
import { usePlayerStore } from '../store/usePlayerStore';
import { Resource } from '../types/music';
import { useTheme, Theme } from '../theme';
import { HomeScreenNavigationProp } from '../types/navigation';

const getUrl = (resources: Resource[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || (item as any)?.link || '';
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ArtistScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute();
  const { artistId } = route.params as { artistId: string };
  const theme = useTheme();
  const styles = getStyles(theme);

  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const [artist, setArtist] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [artistData, albumData] = await Promise.all([
        getArtistDetails(artistId),
        getArtistAlbums(artistId),
      ]);
      setArtist(artistData);
      setAlbums(albumData);
      setLoading(false);
    };
    load();
  }, [artistId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!artist) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.iconPrimary} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Artist not found.</Text>
      </SafeAreaView>
    );
  }

  const topSongs = artist.topSongs ?? [];

  const handlePlayAll = () => {
    if (topSongs.length === 0) return;
    setCurrentSong(topSongs[0]);
    topSongs.slice(1).forEach((song: any) => addToQueue(song));
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color={theme.iconPrimary} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: getUrl(artist.image) }} style={styles.artistImage} />
          <Text style={styles.artistName}>{artist.name}</Text>
          {artist.dominantLanguage ? (
            <Text style={styles.artistMeta}>{artist.dominantLanguage}</Text>
          ) : null}
          {artist.fanCount ? (
            <Text style={styles.fanCount}>{Number(artist.fanCount).toLocaleString()} fans</Text>
          ) : null}
          <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll}>
            <Ionicons name="play" size={18} color="#FFF" style={{ marginLeft: 2 }} />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
        </View>

        {/* Albums row */}
        {albums.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Albums</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={albums}
              keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.albumCard}
                  onPress={() => navigation.navigate('Album', { albumId: item.id })}
                >
                  <Image source={{ uri: getUrl(item.image) }} style={styles.albumArt} />
                  <Text style={styles.albumName} numberOfLines={1}>{item.name}</Text>
                  {item.year ? <Text style={styles.albumYear}>{item.year}</Text> : null}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Top Songs */}
        {topSongs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Songs</Text>
            {topSongs.slice(0, 10).map((song: any, index: number) => (
              <TouchableOpacity
                key={song.id}
                style={styles.songRow}
                onPress={() => setCurrentSong(song)}
              >
                <Text style={styles.trackNum}>{index + 1}</Text>
                <Image source={{ uri: getUrl(song.image) }} style={styles.songThumb} />
                <View style={styles.songInfo}>
                  <Text style={styles.songName} numberOfLines={1}>{song.name}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {song.artists?.primary?.[0]?.name || ''}
                  </Text>
                </View>
                <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loader: { flex: 1 },
  backButton: { padding: 16, paddingBottom: 4 },
  errorText: { padding: 20, color: theme.textSecondary },

  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  artistImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    marginBottom: 16,
  },
  artistName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
  },
  artistMeta: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  fanCount: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.accent,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 24,
    marginTop: 16,
  },
  playAllText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.sectionText,
    paddingHorizontal: 20,
    marginBottom: 14,
  },

  albumCard: { width: 150, marginLeft: 18 },
  albumArt: { width: 140, height: 140, borderRadius: 16 },
  albumName: {
    marginTop: 8,
    fontWeight: '600',
    fontSize: 13,
    color: theme.text,
  },
  albumYear: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },

  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  trackNum: { width: 24, fontSize: 13, color: theme.textMuted, textAlign: 'center' },
  songThumb: { width: 48, height: 48, borderRadius: 8, marginHorizontal: 12 },
  songInfo: { flex: 1 },
  songName: { fontSize: 14, fontWeight: '600', color: theme.text },
  songArtist: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  duration: { fontSize: 12, color: theme.textMuted, marginLeft: 8 },
});

export default ArtistScreen;
