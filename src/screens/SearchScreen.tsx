import React, { useRef, useState } from 'react';
import {
  View, TextInput, FlatList, Text, Image,
  TouchableOpacity, StyleSheet
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

const SearchScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = getStyles(theme);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
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
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => setCurrentSong(item)}
    >
      <Image
        source={{ uri: getUrl(item.image) }}
        style={styles.thumbnail}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.name || item.title || 'Unknown'}</Text>
        <Text style={styles.artist}>{item.artists?.primary?.[0]?.name || 'Unknown Artist'}</Text>
      </View>
    </TouchableOpacity>
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
    </SafeAreaView>
  );
};

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
  resultItem: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  thumbnail: { width: 50, height: 50, borderRadius: 5 },
  info: { marginLeft: 15, flex: 1 },
  title: { fontWeight: 'bold', fontSize: 16, color: theme.text },
  artist: { color: theme.textSecondary },
  emptyText: { textAlign: 'center', marginTop: 50, color: theme.textMuted },
});

export default SearchScreen;
