// Entry point that registers the RNTP playback service BEFORE the Expo Router root is loaded.
import 'expo-router/entry';
import TrackPlayer from 'react-native-track-player';
import playbackService from './src/audio/playbackService';

TrackPlayer.registerPlaybackService(() => playbackService);
