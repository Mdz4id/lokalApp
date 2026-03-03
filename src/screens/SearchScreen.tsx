import React, { useRef, useState } from 'react';
import {
  View, TextInput, FlatList, Text, Image,
  TouchableOpacity, StyleSheet, Animated, PanResponder, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { searchSongs } from '../services/api';
import { usePlayerStore } from '../store/usePlayerStore';
import { Song } from '../types/music';
import { useTheme, Theme } from '../theme';

const getUrl = (resources?: { url?: string; link?: string }[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

// ─── Swipeable row ────────────────────────────────────────────────────────────
interface SwipeableRowProps {
  item: Song;
  onPress: () => void;
  onAddToQueue: () => void;
  onMenuPress: () => void;
  styles: ReturnType<typeof getStyles>;
  theme: ReturnType<typeof useTheme>;
}

const SWIPE_THRESHOLD = 55;
const MAX_SWIPE = 72;

const SwipeableRow = ({ item, onPress, onAddToQueue, onMenuPress, styles, theme }: SwipeableRowProps) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      // Only claim clearly horizontal right-swipes
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) * 2 && g.dx > 5,
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) translateX.setValue(Math.min(g.dx, MAX_SWIPE));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          onAddToQueue();
        }
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start();
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      {/* Green "add" background revealed on swipe */}
      <View style={styles.swipeBg}>
        <Ionicons name="add-circle" size={28} color="#FFF" />
        <Text style={styles.swipeBgLabel}>Queue</Text>
      </View>

      {/* Sliding row */}
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.resultItem} onPress={onPress} activeOpacity={0.7}>
          <Image source={{ uri: getUrl(item.image) }} style={styles.thumbnail} />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{item.name || item.title || 'Unknown'}</Text>
            <Text style={styles.artist}>{item.artists?.primary?.[0]?.name || 'Unknown Artist'}</Text>
          </View>
          <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────
const SearchScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = getStyles(theme);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [menuSong, setMenuSong] = useState<Song | null>(null);

  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);
  const addToQueue = usePlayerStore((state) => state.addToQueue);

  const handleBack = () => {
    if (navigation.canGoBack()) { navigation.goBack(); return; }
    navigation.navigate('Home' as never);
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length > 2) {
      debounceRef.current = setTimeout(async () => {
        const data = await searchSongs(text);
        setResults(data);
      }, 300);
    } else {
      setResults([]);
    }
  };

  const renderItem = ({ item }: { item: Song }) => (
    <SwipeableRow
      item={item}
      onPress={() => setCurrentSong(item)}
      onAddToQueue={() => addToQueue(item)}
      onMenuPress={() => setMenuSong(item)}
      styles={styles}
      theme={theme}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.iconPrimary} />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists..."
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoFocus
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Start typing to find music</Text>}
      />

      {/* 3-dot action sheet modal */}
      <Modal
        visible={!!menuSong}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuSong(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuSong(null)} />
        <View style={styles.actionSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetSongTitle} numberOfLines={1}>{menuSong?.name}</Text>
          <Text style={styles.sheetArtist} numberOfLines={1}>
            {menuSong?.artists?.primary?.[0]?.name || 'Unknown Artist'}
          </Text>

          <TouchableOpacity
            style={styles.sheetAction}
            onPress={() => { if (menuSong) addToQueue(menuSong); setMenuSong(null); }}
          >
            <Ionicons name="list" size={22} color={theme.accent} style={{ marginRight: 14 }} />
            <Text style={styles.sheetActionText}>Add to Queue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetAction}
            onPress={() => { if (menuSong) setCurrentSong(menuSong); setMenuSong(null); }}
          >
            <Ionicons name="play-circle-outline" size={22} color={theme.iconPrimary} style={{ marginRight: 14 }} />
            <Text style={styles.sheetActionText}>Play Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.sheetAction, styles.sheetCancel]} onPress={() => setMenuSong(null)}>
            <Text style={[styles.sheetActionText, { color: theme.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  searchBarContainer: { padding: 20 },
  backButton: { marginBottom: 8, marginTop: 8, alignSelf: 'flex-start' },
  searchInput: {
    backgroundColor: theme.surface,
    color: theme.text,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  // Swipeable row
  swipeContainer: { overflow: 'hidden' },
  swipeBg: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MAX_SWIPE,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  swipeBgLabel: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  resultItem: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    backgroundColor: theme.background,
  },
  thumbnail: { width: 50, height: 50, borderRadius: 5 },
  info: { marginLeft: 15, flex: 1 },
  title: { fontWeight: 'bold', fontSize: 16, color: theme.text },
  artist: { color: theme.textSecondary },
  menuBtn: { paddingHorizontal: 6 },
  emptyText: { textAlign: 'center', marginTop: 50, color: theme.textMuted },
  // Modal action sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  actionSheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetSongTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
  sheetArtist: { fontSize: 13, color: theme.textSecondary, marginBottom: 16 },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: theme.border,
  },
  sheetCancel: { justifyContent: 'center' },
  sheetActionText: { fontSize: 16, color: theme.text },
});

export default SearchScreen;
