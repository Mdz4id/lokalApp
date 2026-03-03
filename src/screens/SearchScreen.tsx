import React, { useState } from 'react';
import { 
  View, TextInput, FlatList, Text, Image, 
  TouchableOpacity, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { searchSongs } from '../services/api';
import { usePlayerStore } from '../store/usePlayerStore';
import { Song } from '../types/music';

const getUrl = (resources?: { url?: string; link?: string }[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

const SearchScreen = () => {
  const navigation = useNavigation();
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

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      const data = await searchSongs(text);
      setResults(data);
      return;
    }
    setResults([]);
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
          <Text style={styles.backText}>← </Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists..."
          value={query}
          onChangeText={handleSearch}
          autoFocus
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Start typing to find music</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  searchBarContainer: { padding: 20 },
  backButton: { marginBottom: 8,marginTop:8, alignSelf: 'flex-start' },
  backText: { fontSize: 22, fontWeight: '600', color: '#111' },
  searchInput: {
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  resultItem: { 
    flexDirection: 'row', 
    padding: 15, 
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE'
  },
  thumbnail: { width: 50, height: 50, borderRadius: 5 },
  info: { marginLeft: 15, flex: 1 },
  title: { fontWeight: 'bold', fontSize: 16 },
  artist: { color: '#666' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default SearchScreen;