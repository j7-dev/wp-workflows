---
name: vidstack-hls-v1
description: >
  Vidstack Player (@vidstack/react v1.x) + HLS.js (hls.js v1.x) complete technical reference.
  Covers all React components (MediaPlayer, MediaProvider, DefaultVideoLayout, DefaultAudioLayout),
  all hooks (useMediaState, useMediaStore, useMediaPlayer, useMediaRemote, useMediaProvider),
  HLS streaming configuration, quality management, text tracks/captions, fullscreen, PiP,
  event system, styling via data attributes, and HLS.js direct API.
  Use this skill whenever code imports from @vidstack/react, @vidstack/react/player/layouts/default,
  @vidstack/react/icons, or hls.js. Also use when the task involves video player implementation,
  HLS streaming, media playback, video quality switching, caption/subtitle rendering,
  MediaPlayer component, MediaProvider, DefaultVideoLayout, time slider, volume slider,
  poster images, autoplay handling, live streaming, DVR, AirPlay, Google Cast, gesture handling,
  or any video/audio player UI in React. This skill covers @vidstack/react ^1.12.x and hls.js ^1.6.x.
  Do NOT search the web for Vidstack or HLS.js docs; use this skill instead.
---

# Vidstack Player + HLS.js

> **Versions**: @vidstack/react ^1.12.x, hls.js ^1.6.x | **Docs**: https://vidstack.io/docs/player , https://github.com/video-dev/hls.js | **Updated**: 2026-03-15

Vidstack Player is a React media player framework with 30+ components, 22+ hooks, and built-in HLS/DASH/YouTube/Vimeo provider support. HLS.js is the underlying library that enables HLS streaming via MediaSource Extensions (MSE). Vidstack automatically manages hls.js when an HLS source is provided.

## Quick Start

```tsx
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
  DefaultAudioLayout,
} from '@vidstack/react/player/layouts/default';

function Player() {
  return (
    <MediaPlayer
      src="https://example.com/video.m3u8"
      viewType="video"
      streamType="on-demand"
      crossOrigin
      playsInline
      poster="https://example.com/poster.jpg"
    >
      <MediaProvider>
        <Poster className="vds-poster" />
        <Track src="/subs-en.vtt" kind="subtitles" label="English" lang="en" type="vtt" />
      </MediaProvider>
      <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme="dark" />
    </MediaPlayer>
  );
}
```

## Core Components

### MediaPlayer (top-level wrapper)

```tsx
import { MediaPlayer, type MediaPlayerInstance } from '@vidstack/react';
```

**Key Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `PlayerSrc` | `undefined` | Source URL or object. HLS: `.m3u8`, Video: `.mp4/.webm`, YouTube/Vimeo URLs |
| `autoPlay` | `boolean` | `false` | Auto-start playback (muted recommended for reliability) |
| `muted` | `boolean` | `false` | Mute audio |
| `volume` | `number` | `1` | Volume level 0-1 |
| `currentTime` | `number` | `0` | Current playback position in seconds |
| `playbackRate` | `number` | `1` | Playback speed multiplier |
| `loop` | `boolean` | `false` | Loop playback |
| `poster` | `string` | `''` | Poster image URL |
| `posterLoad` | `'eager'\|'idle'\|'visible'` | - | When to load poster |
| `playsInline` | `boolean` | `false` | Inline playback on mobile (IMPORTANT for iOS) |
| `crossOrigin` | `boolean\|string` | `null` | CORS attribute |
| `controls` | `boolean` | `false` | Show native controls |
| `paused` | `boolean` | `true` | Paused state |
| `viewType` | `'audio'\|'video'` | auto | Force layout type |
| `streamType` | `'on-demand'\|'live'\|'live:dvr'\|'ll-live'` | auto | Stream type |
| `load` | `'eager'\|'idle'\|'visible'\|'play'\|'custom'` | `'visible'` | When to load media |
| `logLevel` | `'silent'\|'error'\|'warn'\|'info'\|'debug'` | env | Log verbosity |
| `controlsDelay` | `number` | `2000` | ms before controls auto-hide |
| `fullscreenOrientation` | `'landscape'\|'portrait'\|'none'` | `'landscape'` | Orientation lock in fullscreen |
| `duration` | `number` | `-1` | Override media duration |

**Key Event Callbacks:**

| Callback | Fires when |
|----------|-----------|
| `onPlay` | Playback requested |
| `onPause` | Playback paused |
| `onPlaying` | Playback actually begins/resumes |
| `onEnded` | Media reaches end |
| `onTimeUpdate` | Time position updates |
| `onVolumeChange` | Volume changes |
| `onSeeking` / `onSeeked` | Seek start / complete |
| `onCanPlay` | Media ready for playback |
| `onError` | Playback error |
| `onAutoPlayFail` | Autoplay was blocked |
| `onFullscreenChange` | Fullscreen toggled |
| `onQualityChange` | Video quality changed |
| `onSourceChange` | Source changed |
| `onProviderChange` | Provider changed |
| `onProviderSetup` | Provider ready |
| `onHlsError` | HLS-specific error (from hls.js) |
| `onHlsManifestParsed` | HLS manifest loaded |
| `onHlsLevelSwitched` | HLS quality level changed |

**Instance Methods** (via `useRef<MediaPlayerInstance>`):

| Method | Description |
|--------|-------------|
| `play()` / `pause()` | Playback control |
| `enterFullscreen()` / `exitFullscreen()` | Fullscreen |
| `enterPictureInPicture()` / `exitPictureInPicture()` | PiP |
| `seekToLiveEdge()` | Jump to live edge |
| `setAudioGain(value)` | Audio amplification |
| `startLoading()` / `startLoadingPoster()` | Manual load (for `load="custom"`) |
| `subscribe(listener)` | Subscribe to state changes |

### MediaProvider (render target)

```tsx
import { MediaProvider } from '@vidstack/react';
// Always nest inside MediaPlayer. Place Poster and Track as children.
<MediaProvider>
  <Poster className="vds-poster" />
</MediaProvider>
```

### DefaultVideoLayout / DefaultAudioLayout

```tsx
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
  DefaultAudioLayout,
} from '@vidstack/react/player/layouts/default';
```

**Key Props:**

| Prop | Type | Default |
|------|------|---------|
| `icons` | `DefaultLayoutIcons` | required |
| `colorScheme` | `'light'\|'dark'` | system |
| `thumbnails` | `ThumbnailSrc` | - |
| `translations` | `Partial<DefaultLayoutTranslations>` | - |
| `smallLayoutWhen` | `boolean\|({width,height})=>boolean` | `width<576\|\|height<380` |
| `playbackRates` | `object` | - |
| `seekStep` | `number` | - |
| `noGestures` | `boolean` | - |
| `noModal` | `boolean` | - |
| `download` | `FileDownloadInfo` | - |
| `slots` | `Record<string, ReactNode>` | - |

**40+ Slot Names:** `playButton`, `muteButton`, `fullscreenButton`, `captionButton`, `pipButton`, `airPlayButton`, `googleCastButton`, `liveButton`, `seekBackwardButton`, `seekForwardButton`, `timeSlider`, `volumeSlider`, `chaptersMenu`, `settingsMenu`, `currentTime`, `endTime`, `title`, `captions`, `chapterTitle`, `bufferingIndicator`. Prefix with `before`/`after` (e.g., `afterCaptionButton`).

## React Hooks

```tsx
import { useMediaState, useMediaStore, useMediaPlayer, useMediaProvider, useMediaRemote } from '@vidstack/react';
```

| Hook | Returns | Purpose |
|------|---------|---------|
| `useMediaState(prop)` | state value | Subscribe to single state property (triggers re-render) |
| `useMediaStore(Instance, ref?)` | store | Subscribe to multiple state properties |
| `useMediaPlayer()` | `MediaPlayerInstance` | Access player instance (inside `<MediaPlayer>` children) |
| `useMediaProvider()` | provider instance | Access current provider (HLS, Video, etc.) |
| `useMediaRemote()` | `MediaRemoteControl` | Dispatch media requests |
| `useSliderState(prop)` | value | Subscribe to slider state |
| `useChapterTitle()` | string | Current chapter title |
| `useThumbnails(src)` | thumbnails | Load thumbnail data |
| `useTextCues(track)` | cues | Subscribe to text track cues |
| `useActiveTextCues(track)` | cues | Currently active cues |
| `useActiveTextTrack(kind)` | track | Currently active text track |
| `useAudioOptions()` | options | Audio track selection menu data |
| `useCaptionOptions()` | options | Caption selection menu data |
| `useVideoQualityOptions()` | options | Quality selection menu data |
| `usePlaybackRateOptions()` | options | Playback rate menu data |
| `useChapterOptions()` | options | Chapter selection menu data |

**useMediaState example:**
```tsx
function PlayingIndicator() {
  const playing = useMediaState('playing');        // inside <MediaPlayer>
  // const playing = useMediaState('playing', playerRef); // outside <MediaPlayer>
  return <div>{playing ? 'Playing' : 'Paused'}</div>;
}
```

**MediaRemoteControl methods:** `play()`, `pause()`, `togglePaused()`, `mute()`, `unmute()`, `toggleMuted()`, `changeVolume(0-1)`, `seek(time)`, `seeking(time)`, `enterFullscreen()`, `exitFullscreen()`, `toggleFullscreen()`, `enterPictureInPicture()`, `exitPictureInPicture()`, `togglePictureInPicture()`, `seekToLiveEdge()`, `changeQuality(index|-1)`, `requestAutoQuality()`, `changeAudioTrack(index)`, `changeTextTrackMode(index)`, `toggleCaptions()`, `disableCaptions()`, `changePlaybackRate(rate)`, `requestAirPlay()`, `requestGoogleCast()`, `pauseControls()`, `resumeControls()`, `startLoading()`, `startLoadingPoster()`.

## Media State Properties

Key properties available via `useMediaState()` or player instance:

| Property | Type | Description |
|----------|------|-------------|
| `paused` | `boolean` | Is playback paused |
| `playing` | `boolean` | Is actively playing |
| `currentTime` | `number` | Current time in seconds |
| `duration` | `number` | Total duration |
| `buffered` | `TimeRanges` | Buffered ranges |
| `volume` | `number` | Volume 0-1 |
| `muted` | `boolean` | Is muted |
| `ended` | `boolean` | Has ended |
| `seeking` | `boolean` | Is seeking |
| `waiting` | `boolean` | Buffering/waiting |
| `canPlay` | `boolean` | Ready to play |
| `fullscreen` | `boolean` | Fullscreen active |
| `pictureInPicture` | `boolean` | PiP active |
| `live` | `boolean` | Is live stream |
| `liveEdge` | `boolean` | At live edge |
| `qualities` | `VideoQuality[]` | Available quality levels |
| `quality` | `VideoQuality\|null` | Current quality |
| `autoQuality` | `boolean` | Auto quality selection |
| `audioTracks` | `AudioTrack[]` | Available audio tracks |
| `textTracks` | `TextTrack[]` | Available text tracks |
| `textTrack` | `TextTrack\|null` | Active caption/subtitle track |
| `playbackRate` | `number` | Current playback speed |
| `error` | `MediaError\|null` | Current error |
| `streamType` | `string` | Stream type |
| `viewType` | `string` | View type (audio/video) |
| `canFullscreen` | `boolean` | Fullscreen supported |
| `canPictureInPicture` | `boolean` | PiP supported |
| `canSetQuality` | `boolean` | Manual quality switching supported |

## Data Attributes for Styling

All applied on `<MediaPlayer>` element, usable in CSS selectors:

`data-paused`, `data-playing`, `data-muted`, `data-fullscreen`, `data-pip`, `data-seeking`, `data-waiting`, `data-buffering`, `data-ended`, `data-controls`, `data-canplay`, `data-error`, `data-live`, `data-live-edge`, `data-loop`, `data-autoplay`, `data-captions`, `data-view-type`, `data-stream-type`

## HLS.js Integration with Vidstack

Vidstack automatically loads and manages hls.js when an HLS source (`.m3u8`) is provided. To configure hls.js or access its instance:

```tsx
<MediaPlayer
  src="https://example.com/video.m3u8"
  onProviderSetup={(provider) => {
    if (provider.type === 'hls') {
      // Access hls.js instance
      const hlsInstance = provider.instance; // Hls object
      // Configure hls.js
      provider.config = {
        maxBufferLength: 30,
        maxBufferSize: 60 * 1000 * 1000,
        capLevelToPlayerSize: true,
        xhrSetup: (xhr: XMLHttpRequest, url: string) => {
          xhr.setRequestHeader('Authorization', 'Bearer token');
        },
      };
    }
  }}
  onHlsError={(detail) => {
    // HLS-specific error handling
    if (detail.fatal) {
      console.error('Fatal HLS error:', detail.type, detail.details);
    }
  }}
/>
```

**HLS events on Vidstack player** are prefixed with `onHls` in camelCase: `onHlsManifestParsed`, `onHlsLevelSwitched`, `onHlsError`, `onHlsFragLoaded`, `onHlsAudioTrackSwitched`, etc. (50+ events).

## Source Formats

| Media | Extensions | MIME Types |
|-------|-----------|------------|
| HLS | `.m3u8` | `application/vnd.apple.mpegurl`, `application/x-mpegurl` |
| Video | `.mp4`, `.webm`, `.ogg`, `.mov` | `video/mp4`, `video/webm`, `video/ogg` |
| Audio | `.mp3`, `.wav`, `.m4a`, `.ogg` | `audio/mpeg`, `audio/wav`, `audio/mp4` |
| DASH | `.mpd` | `application/dash+xml` |
| YouTube | `youtube/{id}` or full URL | auto-detected |
| Vimeo | `vimeo/{id}` or full URL | auto-detected |

**Source with type hint** (when URL has no extension):
```tsx
<MediaPlayer src={{ src: "https://example.com/video", type: "video/mp4" }} />
```

## Common Patterns

### Subtitle/Caption Tracks
```tsx
<MediaProvider>
  <Track src="/subs-en.vtt" kind="subtitles" label="English" lang="en" type="vtt" />
  <Track src="/subs-zh.srt" kind="subtitles" label="Chinese" lang="zh" type="srt" />
  <Track src="/chapters.vtt" kind="chapters" label="Chapters" lang="en" type="vtt" default />
</MediaProvider>
```

### Custom Load Strategy
```tsx
<MediaPlayer src="..." load="custom">
  {/* Call player.startLoading() or remote.startLoading() when ready */}
</MediaPlayer>
```

### Clipping Media
```tsx
<MediaPlayer src="..." clipStartTime={10} clipEndTime={60} />
```

## Pitfalls & Warnings

1. **Autoplay**: Browsers block unmuted autoplay. Always use `muted` with `autoPlay` for reliable autoplay. Listen to `onAutoPlayFail` for fallback.
2. **playsInline**: Required on iOS to prevent fullscreen takeover. Always set `playsInline` for video players.
3. **crossOrigin**: Required when loading captions/subtitles from different origins. Set `crossOrigin` or `crossOrigin="anonymous"`.
4. **HLS native vs hls.js**: Vidstack prefers hls.js over native HLS (Safari). This ensures consistent behavior across browsers. Safari will still use hls.js when available.
5. **Source detection**: URLs without file extensions need explicit type hints via `{ src, type }` object.
6. **Load strategy**: Default is `'visible'` (lazy). Use `'eager'` only when media must be interactive immediately.
7. **DefaultVideoLayout import**: Must import from `@vidstack/react/player/layouts/default`, not from `@vidstack/react`.
8. **CSS imports**: Must import both theme and layout CSS files for DefaultVideoLayout to render correctly.

## References Guide

| Need | File |
|------|------|
| Complete Vidstack component API (all 30+ components) | `references/vidstack-components.md` |
| HLS.js complete API (config, events, methods, error handling) | `references/hlsjs-api.md` |
| Integration patterns, examples, and best practices | `references/examples-and-patterns.md` |
