import React, { useEffect, useRef, useState } from 'react';
import {
  View, TextInput, FlatList, Text, Image,
  TouchableOpacity, StyleSheet, Animated, PanResponder,
  Modal, Keyboard, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchSongs, getCategoryPlaylists } from '../services/api';
import { usePlayerStore } from '../store/usePlayerStore';
import { Song } from '../types/music';
import { useTheme, Theme } from '../theme';
import { SearchStackParamList } from '../types/navigation';

const CATEGORIES = ['Indie', 'Rap', 'Desi', 'Lo-fi', 'Workout', 'Party'];

const CATEGORY_COLORS: Record<string, string> = {
  'Indie':   '#7B52AB',
  'Rap':     '#C0392B',
  'Desi':    '#E67E22',
  'Lo-fi':   '#006450',
  'Workout': '#E84393',
  'Party':   '#1565C0',
};

interface CategorySection {
  category: string;
  playlists: any[];
}

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
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) * 2 && g.dx > 5,
      onPanResponderMove: (_, g) => {
        if (g.dx > 0) translateX.setValue(Math.min(g.dx, MAX_SWIPE));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) onAddToQueue();
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start();
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeBg}>
        <Ionicons name="add-circle" size={28} color="#FFF" />
        <Text style={styles.swipeBgLabel}>Queue</Text>
      </View>
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
  const navigation = useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  const theme = useTheme();
  const styles = getStyles(theme);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [menuSong, setMenuSong] = useState<Song | null>(null);
  const [categorySections, setCategorySections] = useState<CategorySection[]>([]);
  // Selected category whose playlists are shown in the picker modal
  const [pickerCategory, setPickerCategory] = useState<CategorySection | null>(null);

  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);
  const addToQueue = usePlayerStore((state) => state.addToQueue);

  // Load playlists for all categories in parallel on mount
  useEffect(() => {
    Promise.all(
      CATEGORIES.map(async (cat) => {
        try {
          const playlists = await getCategoryPlaylists(cat);
          return { category: cat, playlists };
        } catch {
          return { category: cat, playlists: [] };
        }
      })
    ).then(setCategorySections);
  }, []);

  // Reset search whenever the screen loses focus (back button, tab switch, etc.)
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setQuery('');
      setResults([]);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    });
    return unsubscribe;
  }, [navigation]);

  const handleBack = () => {
    if (navigation.canGoBack()) { navigation.goBack(); return; }
    (navigation as any).navigate('Home');
    setQuery('');
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
      onPress={() => { setCurrentSong(item); Keyboard.dismiss(); }}
      onAddToQueue={() => addToQueue(item)}
      onMenuPress={() => setMenuSong(item)}
      styles={styles}
      theme={theme}
    />
  );

  // Split categorySections into rows of 2 for the grid
  const categoryRows: CategorySection[][] = [];
  for (let i = 0; i < categorySections.length; i += 2) {
    categoryRows.push(categorySections.slice(i, i + 2));
  }

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

      {query.length === 0 ? (
        /* ── Browse category grid ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.browseContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.browseHeading}>Browse Categories</Text>
          {categoryRows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map(({ category, playlists }) => {
                const cardColor = CATEGORY_COLORS[category] ?? theme.accent;
                const coverUrl = playlists[0] ? getUrl(playlists[0].image) : null;
                const section = categorySections.find((s) => s.category === category)!;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryCard, { backgroundColor: cardColor }]}
                    onPress={() => setPickerCategory(section)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.categoryCardTitle}>{category}</Text>
                    <Text style={styles.categoryCardSub}>
                      {playlists.length > 0
                        ? `${playlists.length} playlist${playlists.length > 1 ? 's' : ''}`
                        : 'Loading...'}
                    </Text>
                    {coverUrl && (
                      <Image
                        source={{ uri: coverUrl }}
                        style={styles.categoryCardThumb}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Per-category playlist rows */}
          {categorySections.map(({ category, playlists }) =>
            playlists.length === 0 ? null : (
              <View key={category} style={styles.playlistSection}>
                <Text style={styles.playlistSectionTitle}>{category}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {playlists.map((pl: any, i: number) => (
                    <TouchableOpacity
                      key={pl.id ?? i}
                      style={styles.playlistCard}
                      onPress={() =>
                        navigation.navigate('Playlist', {
                          playlistId: pl.id,
                          playlistName: pl.name || pl.title,
                        })
                      }
                    >
                      <Image
                        source={{ uri: getUrl(pl.image) }}
                        style={styles.playlistThumb}
                      />
                      <Text style={styles.playlistName} numberOfLines={2}>
                        {pl.name || pl.title}
                      </Text>
                      <Text style={styles.playlistMeta} numberOfLines={1}>
                        {pl.songCount ? `${pl.songCount} songs` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )
          )}
        </ScrollView>
      ) : (
        /* ── Song search results ── */
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={results}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {query.length > 2 ? 'No results found' : 'Keep typing to search…'}
            </Text>
          }
        />
      )}

      {/* Category playlist picker modal */}
      <Modal
        visible={!!pickerCategory}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerCategory(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerCategory(null)}
        />
        <View style={styles.actionSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetSongTitle}>{pickerCategory?.category}</Text>
          <Text style={[styles.sheetArtist, { marginBottom: 8 }]}>
            {pickerCategory?.playlists.length ?? 0} playlists
          </Text>
          {pickerCategory?.playlists.map((pl: any, i: number) => (
            <TouchableOpacity
              key={pl.id ?? i}
              style={styles.pickerRow}
              onPress={() => {
                setPickerCategory(null);
                navigation.navigate('Playlist', {
                  playlistId: pl.id,
                  playlistName: pl.name || pl.title,
                });
              }}
            >
              <Image source={{ uri: getUrl(pl.image) }} style={styles.pickerThumb} />
              <View style={styles.pickerInfo}>
                <Text style={styles.pickerName} numberOfLines={1}>
                  {pl.name || pl.title}
                </Text>
                <Text style={styles.pickerMeta} numberOfLines={1}>
                  {pl.songCount ? `${pl.songCount} songs` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

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

  // ── Browse grid ──
  browseContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  browseHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    padding: 14,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  categoryCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  categoryCardSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  categoryCardThumb: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 72,
    height: 72,
    borderRadius: 8,
    transform: [{ rotate: '20deg' }],
  },

  // ── Per-category playlist rows ──
  playlistSection: {
    marginTop: 24,
  },
  playlistSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  playlistCard: {
    width: 130,
    marginRight: 14,
  },
  playlistThumb: {
    width: 130,
    height: 130,
    borderRadius: 10,
    backgroundColor: theme.border,
  },
  playlistName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  playlistMeta: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },

  // ── Swipeable row ──
  swipeContainer: { overflow: 'hidden' },
  swipeBg: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
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

  // ── Action sheet ──
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

  // ── Playlist picker rows (inside category modal) ──
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: theme.border,
    gap: 12,
  },
  pickerThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.border,
  },
  pickerInfo: { flex: 1 },
  pickerName: { fontSize: 14, fontWeight: '600', color: theme.text },
  pickerMeta: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
});

export default SearchScreen;
