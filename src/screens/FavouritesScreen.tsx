import React, { useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/usePlayerStore';
import { Song } from '../types/music';
import { useTheme, Theme } from '../theme';

const BOTTOM_BAR_HEIGHT = 60;

const getUrl = (resources?: { url?: string; link?: string }[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

const FavouritesScreen = () => {
  const theme = useTheme();
  const styles = getStyles(theme);

  const favourites = usePlayerStore((state) => state.favourites);
  const loadFavourites = usePlayerStore((state) => state.loadFavourites);
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);
  const removeFromFavourites = usePlayerStore((state) => state.removeFromFavourites);

  useEffect(() => {
    loadFavourites();
  }, []);

  const renderItem = ({ item }: { item: Song }) => (
    <TouchableOpacity style={styles.row} onPress={() => setCurrentSong(item)}>
      <Image source={{ uri: getUrl(item.image) }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.name || item.title || 'Unknown'}</Text>
        <Text style={styles.artist} numberOfLines={1}>
          {item.artists?.primary?.[0]?.name || 'Unknown Artist'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removeFromFavourites(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.removeIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Favourites</Text>
      </View>
      <FlatList
        data={favourites}
        keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_HEIGHT + 80 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No favourites yet. Tap ♥ on a song to save it.</Text>
        }
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { padding: 20, paddingBottom: 8 },
  heading: { fontSize: 28, fontWeight: '700', color: theme.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  thumbnail: { width: 52, height: 52, borderRadius: 8, backgroundColor: theme.border },
  info: { flex: 1, marginLeft: 14 },
  title: { fontSize: 15, fontWeight: '600', color: theme.text },
  artist: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  removeIcon: { fontSize: 16, color: theme.textMuted, paddingLeft: 8 },
  emptyText: { textAlign: 'center', marginTop: 60, color: theme.textMuted, paddingHorizontal: 32 },
});

export default FavouritesScreen;
