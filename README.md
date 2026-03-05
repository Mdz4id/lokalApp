# Mume — Music Streaming App

A full-featured music streaming mobile app built with React Native (Expo) and TypeScript. Mume streams high-quality audio, persists your queue and favourites locally, and supports background playback so the music never stops when you leave the app.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| Navigation | React Navigation (Native Stack) |
| State Management | Zustand |
| Local Persistence | AsyncStorage |
| Audio Engine | expo-av |
| API Client | Axios |
| Icons | @expo/vector-icons (Ionicons, MaterialIcons) |

---

## Features

### Background Playback

Audio continues playing when the user switches apps, locks the screen, or navigates away from the app. This is implemented via `expo-av`'s `Audio.setAudioModeAsync` with `staysActiveInBackground: true`, `playsInSilentModeIOS: true`, and proper interruption modes for both iOS and Android.

---

### Home Screen

- **Recently Played** — horizontal scroll strip of the last 7 songs you listened to, loaded from AsyncStorage on every launch.
- **Artists** — discovery strip of popular artists fetched from the API using randomised seed queries.
- **Albums** — trending album collection (Hindi charts) shown as scrollable cards.
- **Long-press context sheet** — hold any song in "Recently Played" to open a bottom sheet with options to add to Favourites or add to Queue.
- Tapping an artist card navigates to the Artist Profile. Tapping an album card navigates to the Album detail screen.

---

### Search Screen

- **Debounced live search** — queries fire after a 300 ms debounce once the user has typed more than 2 characters, showing up to 20 song results.
- **Swipe-to-queue** — swipe a search result row to the right to instantly add it to the queue (green "Queue" reveal animation).
- **3-dot action menu** — tap the ellipsis on any result to open an action sheet with "Add to Queue" and "Play Now" options.
- **Browse Categories grid** — when the search bar is empty, a coloured 2-column grid shows 6 categories: Indie, Rap, Desi, Lo-fi, Workout, and Party.
- **Category playlists** — each category card shows the number of associated playlists. Tapping opens a bottom sheet listing all playlists; tapping a playlist navigates to its detail screen.
- **Horizontal playlist rows** — below the grid, each category has its own horizontal playlist scroll strip with cover art, name, and song count.
- Search state is automatically cleared when leaving the screen (blur listener).

---

### Full Player Screen

- **Blurred album art background** — the current song's cover is rendered full-screen with a `blurRadius` overlay, adapting its tint to the active theme.
- **Scrubbbable progress bar** — a custom PanResponder-powered seek bar lets you drag to any position; the thumb has an enlarged hit area for comfortable use.
- **Live position tracking** — position and duration poll the audio engine every 500 ms. Display shows elapsed time on the left and remaining time (negative) on the right.
- **Playback controls**
  - Previous — plays the previous song from the recently played history.
  - Seek back 10 s — jumps back 10 seconds.
  - Play / Pause — large central button.
  - Seek forward 10 s — jumps forward 10 seconds.
  - Next — plays the next song from the queue (button is disabled when queue is empty).
- **Like / Favourite toggle** — heart button in the bottom row; turns red when the song is liked and persists the change to AsyncStorage.
- **Queue shortcut** — "Queue List" pill button navigates directly to the Queue screen.

---

### Mini Player

A persistent floating player bar that appears above the bottom navigation bar whenever a song is loaded. It shows the album art, song title, and artist name, and provides a play/pause button without needing to open the full player. Tapping the mini player navigates to the Full Player screen.

---

### Queue Screen

- Displays all songs added to the "Up Next" queue.
- **Drag-to-reorder** — each row has a drag handle (hamburger icon) powered by a native PanResponder. Dragging provides live visual reordering feedback; releasing commits the new order to the store and AsyncStorage.
- **Remove from queue** — tap the X button on any row to remove a song.
- **Play from queue** — tap any row to immediately start playing that song (it is removed from the queue as it begins).
- **Auto-play** — if no song is currently playing when the screen mounts, the first item in the queue starts automatically.
- Queue state persists across app restarts via AsyncStorage.
- Empty state shows a friendly prompt reminding the user how to add songs.

---

### Favourites Screen

- Lists all liked songs in a clean vertical list with album art, title, and artist.
- Tap any row to play the song immediately.
- Remove a song by tapping the X on the right.
- Favourites persist to AsyncStorage and are restored on every launch.
- Empty state guides the user to tap the heart icon on any song.

---

### Artist Profile Screen

- **Hero section** — large circular artist photo, name, dominant language, and fan count.
- **Play All button** — queues all of the artist's top songs and starts playback immediately.
- **Albums row** — horizontal scrollable list of the artist's albums; tapping an album navigates to the Album detail screen.
- **Top Songs list** — numbered list of up to 10 top tracks with thumbnail, name, artist, and duration. Tap any row to play.

---

### Album Screen

- Displays album cover, title, artist, and year.
- Lists all songs in the album with track numbers, thumbnails, and durations.
- Tap any song to start playback.
- "Play All" enqueues the entire album.

---

### Playlist Screen

- Shows playlist cover, name, and song count header.
- Lists all songs in the playlist.
- Tap any song to play it immediately.

---

### Settings Screen

- **Dark Mode toggle** — a single Switch that flips between the light and dark theme. The selected preference is persisted via AsyncStorage under the `'theme'` key and applied on the next launch automatically.

---

### Theme System

- Two complete themes: **Light** and **Dark**.
- Every screen and component uses a `getStyles(theme)` factory that regenerates `StyleSheet` objects whenever the theme changes, ensuring zero hardcoded colours outside of the accent (`#FF982D`).
- Theme state is managed by `useThemeStore` (Zustand) and loaded asynchronously in the app root before the first render.

---

### Local Persistence

All user data is stored on-device using AsyncStorage:

| Key | Contents |
|---|---|
| `recently_played` | Last 7 played songs (LIFO, deduped) |
| `favourites` | All liked songs |
| `queue` | Current playback queue |
| `theme` | Last selected theme (`'dark'` or `'light'`) |

---

### Navigation Structure

```
Root Stack
├── Home (tab)
├── Search (tab)
│   └── Playlist
├── Favourites (tab)
├── Settings (tab)
├── FullPlayer
├── Queue
├── Album
└── Artist
```

The bottom navigation bar is a custom component (`BottomBar`) — not the React Navigation tab navigator — giving full control over appearance and animation. It floats above the Mini Player.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or a physical device with Expo Go)

### Installation

```bash
git clone <repo-url>
cd lokalApp
npm install
```

### Running the App

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Building

The project is configured for EAS Build. Run `eas build` after configuring your `eas.json` credentials for production builds.

---

## Project Structure

```
lokalApp/
├── App.tsx                  # Root: stack navigator, BottomBar, MiniPlayer
├── src/
│   ├── components/
│   │   ├── BottomBar.tsx    # Custom 4-tab bottom navigation
│   │   └── MiniPlayer.tsx   # Persistent floating player
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── FavouritesScreen.tsx
│   │   ├── FullPlayerScreen.tsx
│   │   ├── QueueScreen.tsx
│   │   ├── AlbumScreen.tsx
│   │   ├── PlaylistScreen.tsx
│   │   ├── ArtistScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── store/
│   │   ├── usePlayerStore.ts  # Audio, queue, history, favourites
│   │   └── useThemeStore.ts   # Dark/light toggle + persistence
│   ├── services/
│   │   └── api.ts             # Axios API client (JioSaavn-compatible)
│   ├── theme/
│   │   └── index.ts           # lightTheme, darkTheme, useTheme()
│   └── types/
│       ├── music.ts           # Song, Resource, etc.
│       └── navigation.ts      # Stack param lists
```
