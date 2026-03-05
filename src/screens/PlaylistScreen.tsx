import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getPlaylistDetails } from '../services/api';
import { usePlayerStore } from '../store/usePlayerStore';
import { Resource, Song } from '../types/music';
import { useTheme, Theme } from '../theme';
import { SearchStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const getUrl = (resources: Resource[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const PlaylistScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  const route = useRoute();
  const { playlistId, playlistName } = route.params as { playlistId: string; playlistName?: string };

  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    getPlaylistDetails(playlistId).then((data) => {
      setPlaylist(data);
      setLoading(false);
    });
  }, [playlistId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.iconPrimary} />
        </TouchableOpacity>
        <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.iconPrimary} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Playlist not found.</Text>
      </SafeAreaView>
    );
  }

  const songs: Song[] = playlist.songs ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color={theme.iconPrimary} />
      </TouchableOpacity>

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Image source={{ uri: getUrl(playlist.image) }} style={styles.coverArt} />
            <Text style={styles.playlistName}>{playlist.name || playlistName}</Text>
            {!!playlist.description && (
              <Text style={styles.description} numberOfLines={2}>
                {playlist.description}
              </Text>
            )}
            <Text style={styles.meta}>
              {playlist.songCount ?? songs.length} song{(playlist.songCount ?? songs.length) !== 1 ? 's' : ''}
            </Text>

            {songs.length > 0 && (
              <TouchableOpacity
                style={styles.playAllBtn}
                onPress={() => {
                  setCurrentSong(songs[0]);
                  songs.slice(1).forEach((song) => addToQueue(song));
                }}
              >
                <Ionicons name="play" size={18} color="#FFF" style={{ marginLeft: 2 }} />
                <Text style={styles.playAllText}>Play All</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.songRow}
            onPress={() => setCurrentSong(item)}
            onLongPress={() => addToQueue(item)}
            delayLongPress={350}
          >
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
  coverArt: { width: 220, height: 220, borderRadius: 16, marginBottom: 16, backgroundColor: theme.border },
  playlistName: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 6, color: theme.text },
  description: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: 4, paddingHorizontal: 12 },
  meta: { fontSize: 12, color: theme.textMuted, marginBottom: 16 },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.accent,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  playAllText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  trackNum: { width: 24, fontSize: 13, color: theme.textMuted, textAlign: 'center' },
  songThumb: { width: 48, height: 48, borderRadius: 8, marginHorizontal: 12, backgroundColor: theme.border },
  songInfo: { flex: 1 },
  songName: { fontSize: 14, fontWeight: '600', color: theme.text },
  songArtist: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  duration: { fontSize: 12, color: theme.textMuted, marginLeft: 8 },
});

export default PlaylistScreen;
