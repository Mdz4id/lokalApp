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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTheme, Theme } from '../theme';
import { useThemeStore } from '../store/useThemeStore';
import { RootStackParamList } from '../types/navigation';

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

const formatRemaining = (remainingMs: number) => {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `-${min}:${sec.toString().padStart(2, '0')}`;
};

const FullPlayerScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const isDark = useThemeStore((s) => s.isDark);
  const styles = getStyles(theme, isDark);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const soundObj = usePlayerStore((s) => s.soundObj);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const favourites = usePlayerStore((s) => s.favourites);
  const addToFavourites = usePlayerStore((s) => s.addToFavourites);
  const removeFromFavourites = usePlayerStore((s) => s.removeFromFavourites);
  const loadFavourites = usePlayerStore((s) => s.loadFavourites);
  const queue = usePlayerStore((s) => s.queue);
  const playFromQueue = usePlayerStore((s) => s.playFromQueue);
  const recentlyPlayed = usePlayerStore((s) => s.recentlyPlayed);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);

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
  // recentlyPlayed[0] is the current song; [1] is the previous one
  const hasPrev = recentlyPlayed.length > 1;
  const hasNext = queue.length > 0;

  const handleFavouriteToggle = () => {
    if (!currentSong) return;
    isFavourited ? removeFromFavourites(currentSong.id) : addToFavourites(currentSong);
  };

  const handlePrev = () => {
    if (hasPrev) setCurrentSong(recentlyPlayed[1]);
  };

  const handleNext = () => {
    if (hasNext) playFromQueue(queue[0]);
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
    const rawLeft = progressRatio * trackWidth - 7;
    return Math.max(0, Math.min(trackWidth - 14, rawLeft));
  }, [progressRatio, trackWidth]);

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
    [durationMillis, trackWidth],
  );

  const coverUrl = getUrl(currentSong?.image);

  if (!currentSong) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.emptyContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={theme.iconPrimary} />
          </TouchableOpacity>
          <Text style={styles.emptyText}>No song selected</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Blurred album art background */}
      <Image
        source={{ uri: coverUrl }}
        style={StyleSheet.absoluteFillObject}
        blurRadius={28}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-down" size={28} color={styles.iconColor.color} />
          </TouchableOpacity>
        </View>

        {/* Album Art */}
        <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />

        {/* Song Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoText}>
            <Text style={styles.title} numberOfLines={1}>
              {currentSong.name || currentSong.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentSong.artists?.primary?.map((item) => item.name).join(', ') || 'Unknown Artist'}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack} onLayout={onTrackLayout}>
          <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
          <View style={[styles.seekThumbHitArea, { left: thumbLeft - 16 }]} {...panResponder.panHandlers}>
            <View style={styles.seekThumb} />
          </View>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatMs(positionMillis)}</Text>
          <Text style={styles.timeText}>{formatRemaining(durationMillis - positionMillis)}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          {/* Previous */}
          <TouchableOpacity
            style={[styles.sideControl, !hasPrev && styles.controlDisabled]}
            onPress={handlePrev}
            disabled={!hasPrev}
          >
            <Ionicons name="play-skip-back" size={28} color={styles.iconColor.color} />
          </TouchableOpacity>

          {/* Seek back 10s */}
          <TouchableOpacity style={styles.sideControl} onPress={() => seekBy(-10000)}>
            <MaterialIcons name="replay-10" size={34} color={styles.iconColor.color} />
          </TouchableOpacity>

          {/* Play / Pause */}
          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color={styles.playButtonIcon.color}
              style={{ marginLeft: isPlaying ? 0 : 3 }}
            />
          </TouchableOpacity>

          {/* Seek forward 10s */}
          <TouchableOpacity style={styles.sideControl} onPress={() => seekBy(10000)}>
            <MaterialIcons name="forward-10" size={34} color={styles.iconColor.color} />
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity
            style={[styles.sideControl, !hasNext && styles.controlDisabled]}
            onPress={handleNext}
            disabled={!hasNext}
          >
            <Ionicons name="play-skip-forward" size={28} color={styles.iconColor.color} />
          </TouchableOpacity>
        </View>

        {/* Bottom Row — Like & Queue */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.bottomPill} onPress={handleFavouriteToggle}>
            <Ionicons
              name={isFavourited ? 'heart' : 'heart-outline'}
              size={17}
              color={isFavourited ? '#E0334C' : styles.iconColor.color}
            />
            <Text style={[styles.bottomPillText, isFavourited && { color: '#E0334C' }]}>
              {isFavourited ? 'Liked' : 'Like'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomPill} onPress={() => navigation.navigate('Queue')}>
            <Ionicons name="list-outline" size={17} color={styles.iconColor.color} />
            <Text style={styles.bottomPillText}>Queue List</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const getStyles = (theme: Theme, isDark: boolean) => {
  const overlayColor = isDark ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.68)';
  const iconColor = theme.iconPrimary;
  const textColor = theme.text;
  const textSecondary = theme.textSecondary;
  const timeColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
  const progressTrackColor = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.14)';
  const thumbColor = isDark ? '#FFF' : theme.accent;
  const playBtnBg = isDark ? '#FFF' : theme.accent;
  const playBtnIcon = isDark ? '#111' : '#FFF';
  const pillBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)';
  const pillBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: overlayColor,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
    },
    cover: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 18,
      marginTop: 10,
      backgroundColor: theme.border,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 18,
    },
    infoText: {
      flex: 1,
    },
    title: {
      fontSize: 21,
      fontWeight: '700',
      color: textColor,
    },
    artist: {
      fontSize: 14,
      color: textSecondary,
      marginTop: 3,
    },
    progressTrack: {
      marginTop: 18,
      height: 3,
      backgroundColor: progressTrackColor,
      borderRadius: 2,
      overflow: 'visible',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.accent,
      borderRadius: 2,
    },
    seekThumbHitArea: {
      position: 'absolute',
      top: -20,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    seekThumb: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: thumbColor,
    },
    timeRow: {
      marginTop: 7,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    timeText: {
      fontSize: 12,
      color: timeColor,
      fontWeight: '500',
    },
    controlsRow: {
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
    },
    sideControl: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    controlDisabled: {
      opacity: 0.3,
    },
    playButton: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: playBtnBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Dummy style objects used to pass computed colors into JSX
    iconColor: {
      color: iconColor,
    },
    playButtonIcon: {
      color: playBtnIcon,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
    },
    bottomPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: pillBg,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: pillBorder,
    },
    bottomPillText: {
      color: textColor,
      fontSize: 13,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    emptyText: {
      marginTop: 24,
      fontSize: 18,
      color: theme.textSecondary,
    },
  });
};

export default FullPlayerScreen;
