import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutChangeEvent,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTheme, Theme } from '../theme';

const getUrl = (resources?: { url?: string; link?: string }[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

const formatMs = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const FullPlayerScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = getStyles(theme);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const soundObj = usePlayerStore((state) => state.soundObj);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlayPause = usePlayerStore((state) => state.togglePlayPause);
  const favourites = usePlayerStore((state) => state.favourites);
  const addToFavourites = usePlayerStore((state) => state.addToFavourites);
  const removeFromFavourites = usePlayerStore((state) => state.removeFromFavourites);
  const loadFavourites = usePlayerStore((state) => state.loadFavourites);

  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1);
  const [trackWidth, setTrackWidth] = useState(1);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const dragStartRatioRef = useRef(0);
  const dragRatioRef = useRef(0);
  const progressRatioRef = useRef(0);

  useEffect(() => {
    loadFavourites();
  }, []);

  const isFavourited = currentSong ? !!favourites.find(s => s.id === currentSong.id) : false;

  const handleFavouriteToggle = () => {
    if (!currentSong) return;
    isFavourited ? removeFromFavourites(currentSong.id) : addToFavourites(currentSong);
  };

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const syncStatus = async () => {
      if (isScrubbing) return;
      if (!soundObj) return;
      const status = await soundObj.getStatusAsync();
      if (!mounted || !status.isLoaded) return;
      setPositionMillis(status.positionMillis ?? 0);
      setDurationMillis(status.durationMillis ?? 1);
    };

    syncStatus();
    timer = setInterval(syncStatus, 500);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [soundObj, isScrubbing]);

  const progressRatio = useMemo(() => {
    if (!durationMillis) return 0;
    const r = Math.min(1, Math.max(0, positionMillis / durationMillis));
    progressRatioRef.current = r;
    return r;
  }, [positionMillis, durationMillis]);

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(Math.max(1, event.nativeEvent.layout.width));
  };

  const seekToRatio = async (ratio: number) => {
    if (!soundObj) return;
    const next = Math.floor(Math.min(1, Math.max(0, ratio)) * durationMillis);
    await soundObj.setPositionAsync(next);
    setPositionMillis(next);
  };

  const seekBy = async (deltaMs: number) => {
    if (!soundObj) return;
    const next = Math.max(0, Math.min(durationMillis, positionMillis + deltaMs));
    await soundObj.setPositionAsync(next);
    setPositionMillis(next);
  };

  const thumbLeft = useMemo(() => {
    const rawLeft = progressRatio * trackWidth - 9;
    return Math.max(0, Math.min(trackWidth - 18, rawLeft));
  }, [progressRatio, trackWidth]);

  // PanResponder sits on the thumb only (Spotify-style drag).
  // progressRatioRef keeps the latest ratio without being a dep,
  // so the responder is never recreated mid-drag.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsScrubbing(true);
          dragStartRatioRef.current = progressRatioRef.current;
          dragRatioRef.current = progressRatioRef.current;
        },
        onPanResponderMove: (_, gestureState) => {
          const ratio = Math.max(0, Math.min(1, dragStartRatioRef.current + gestureState.dx / trackWidth));
          dragRatioRef.current = ratio;
          setPositionMillis(Math.floor(ratio * durationMillis));
        },
        onPanResponderRelease: async () => {
          const ratio = dragRatioRef.current;
          setIsScrubbing(false);
          await seekToRatio(ratio);
        },
        onPanResponderTerminate: async () => {
          const ratio = dragRatioRef.current;
          setIsScrubbing(false);
          await seekToRatio(ratio);
        },
      }),
    [durationMillis, trackWidth]
  );

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={theme.iconPrimary} />
        </TouchableOpacity>
        <Text style={styles.emptyText}>No song selected</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={32} color={theme.iconPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Queue' as never)}>
            <Ionicons name="list-outline" size={26} color={theme.iconPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFavouriteToggle}>
            <Ionicons
              name={isFavourited ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavourited ? '#E0334C' : theme.iconPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Image source={{ uri: getUrl(currentSong.image) }} style={styles.cover} />

      <Text style={styles.title} numberOfLines={1}>
        {currentSong.name || currentSong.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {currentSong.artists?.primary?.map((item) => item.name).join(', ') || 'Unknown Artist'}
      </Text>

      <View style={styles.progressTrack} onLayout={onTrackLayout}>
        <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
        <View style={[styles.seekThumbHitArea, { left: thumbLeft - 14 }]} {...panResponder.panHandlers}>
          <View style={styles.seekThumb} />
        </View>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatMs(positionMillis)}</Text>
        <Text style={styles.timeText}>{formatMs(durationMillis)}</Text>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.seekButton} onPress={() => seekBy(-10000)}>
          <MaterialIcons name="replay-10" size={40} color={theme.iconPrimary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={40}
            color="#FFF"
            style={{ marginLeft: isPlaying ? 0 : 4 }}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.seekButton} onPress={() => seekBy(10000)}>
          <MaterialIcons name="forward-10" size={40} color={theme.iconPrimary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
  },
  header: {
    height: 56,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: theme.border,
    marginTop: 12,
  },
  title: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    color: theme.text,
  },
  artist: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 18,
    color: theme.textSecondary,
  },
  progressTrack: {
    marginTop: 28,
    height: 10,
    backgroundColor: theme.progressTrack,
    borderRadius: 8,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.accent,
  },
  // Large transparent hit area so the thumb is easy to grab
  seekThumbHitArea: {
    position: 'absolute',
    top: -18,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.accent,
  },
  timeRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 15,
    color: theme.text,
    fontWeight: '500',
  },
  controlsRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  seekButton: {
    width: 72,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyText: {
    marginTop: 24,
    fontSize: 18,
    color: theme.textSecondary,
  },
});

export default FullPlayerScreen;
