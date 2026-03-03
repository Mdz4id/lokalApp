import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAlbumDetails } from '../services/api';
import { usePlayerStore } from '../store/usePlayerStore';
import { Resource, Song } from '../types/music';
import { useTheme, Theme } from '../theme';

const getUrl = (resources: Resource[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const AlbumScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { albumId } = route.params as { albumId: string };
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    getAlbumDetails(albumId).then((data) => {
      setAlbum(data);
      setLoading(false);
    });
  }, [albumId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!album) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.iconPrimary} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Album not found.</Text>
      </SafeAreaView>
    );
  }

  const primaryArtists = album.artists?.primary?.map((a: any) => a.name).join(', ') || 'Unknown';

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color={theme.iconPrimary} />
      </TouchableOpacity>

      <FlatList
        data={album.songs as Song[]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Image source={{ uri: getUrl(album.image) }} style={styles.albumArt} />
            <Text style={styles.albumName}>{album.name}</Text>
            <Text style={styles.artistNames}>{primaryArtists}</Text>
            <Text style={styles.meta}>
              {album.year} · {album.language} · {album.songCount} song{album.songCount !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.songRow} onPress={() => setCurrentSong(item)}>
            <Text style={styles.trackNum}>{index + 1}</Text>
            <Image source={{ uri: getUrl(item.image) }} style={styles.songThumb} />
            <View style={styles.songInfo}>
              <Text style={styles.songName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {item.artists?.primary?.[0]?.name || ''}
              </Text>
            </View>
            <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loader: { flex: 1 },
  backButton: { padding: 16, paddingBottom: 4 },
  errorText: { padding: 20, color: theme.textSecondary },
  header: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  albumArt: { width: 220, height: 220, borderRadius: 16, marginBottom: 16 },
  albumName: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 6, color: theme.text },
  artistNames: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 4 },
  meta: { fontSize: 12, color: theme.textMuted },
  songRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  trackNum: { width: 24, fontSize: 13, color: theme.textMuted, textAlign: 'center' },
  songThumb: { width: 48, height: 48, borderRadius: 8, marginHorizontal: 12 },
  songInfo: { flex: 1 },
  songName: { fontSize: 14, fontWeight: '600', color: theme.text },
  songArtist: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  duration: { fontSize: 12, color: theme.textMuted, marginLeft: 8 },
});

export default AlbumScreen;
