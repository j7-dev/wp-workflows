# HLS.js v1.x Complete API Reference

> Source: https://github.com/video-dev/hls.js/blob/master/docs/API.md | hls.js ^1.6.x

## Table of Contents

- [Getting Started](#getting-started)
- [Static Methods & Properties](#static-methods)
- [Instance Methods](#instance-methods)
- [Instance Properties (Getters/Setters)](#instance-properties)
- [Events (Hls.Events)](#events)
- [Error Types](#error-types)
- [Configuration Reference](#configuration)
- [Loading Policies](#loading-policies)
- [ABR Configuration](#abr-configuration)
- [DRM Configuration](#drm-configuration)
- [Caption/Subtitle Configuration](#caption-config)
- [Advanced Configuration](#advanced-config)

---

## Getting Started {#getting-started}

```ts
import Hls from 'hls.js';

// Step 1: Check support
if (Hls.isSupported()) {
  const hls = new Hls({
    // optional config
    maxBufferLength: 30,
    maxBufferSize: 60 * 1000 * 1000,
  });

  // Step 2: Attach to video element
  const video = document.getElementById('video') as HTMLVideoElement;
  hls.attachMedia(video);

  // Step 3: Load source
  hls.on(Hls.Events.MEDIA_ATTACHED, () => {
    hls.loadSource('https://example.com/stream.m3u8');
  });

  // Step 4: Wait for manifest
  hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
    console.log(`${data.levels.length} quality levels found`);
    video.play();
  });

  // Step 5: Handle errors
  hls.on(Hls.Events.ERROR, (event, data) => {
    if (data.fatal) {
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          hls.startLoad(); // retry
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          hls.recoverMediaError();
          break;
        default:
          hls.destroy();
          break;
      }
    }
  });
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  // Native HLS support (Safari)
  video.src = 'https://example.com/stream.m3u8';
}
```

---

## Static Methods & Properties {#static-methods}

| Method/Property | Description |
|----------------|-------------|
| `Hls.isSupported()` | Check if MSE/MMS is available for HLS playback |
| `Hls.isMSESupported()` | Check MediaSource Extensions support |
| `Hls.version` | Library version string |
| `Hls.Events` | Event name constants enum |
| `Hls.ErrorTypes` | Error type constants |
| `Hls.ErrorDetails` | Error detail constants |

---

## Instance Methods {#instance-methods}

### Media Attachment

| Method | Signature | Description |
|--------|-----------|-------------|
| `attachMedia` | `(media: HTMLMediaElement \| MediaAttachingData) => void` | Bind video element, create MediaSource |
| `detachMedia` | `() => void` | Unbind element, reset source |
| `transferMedia` | `() => MediaAttachingData` | Detach non-destructively, return MediaSource for reuse |

### Playback Control

| Method | Signature | Description |
|--------|-----------|-------------|
| `loadSource` | `(url: string) => void` | Load HLS manifest/playlist |
| `startLoad` | `(startPosition?: number, skipSeek?: boolean) => void` | Start/resume fragment loading |
| `stopLoad` | `() => void` | Stop fragment loading |
| `pauseBuffering` | `() => void` | Pause fragment buffering |
| `resumeBuffering` | `() => void` | Resume fragment buffering |
| `destroy` | `() => void` | Clean up, release all resources |

### Error Recovery

| Method | Signature | Description |
|--------|-----------|-------------|
| `recoverMediaError` | `() => void` | Reset MediaSource, restart playback after MEDIA_ERROR |
| `swapAudioCodec` | `() => void` | Switch audio codec (deprecated, use for compatibility fallback) |

### Quality/Track Control

| Method | Signature | Description |
|--------|-----------|-------------|
| `removeLevel` | `(levelIndex: number) => void` | Remove quality level from available options |
| `setAudioOption` | `(audioOption: MediaPlaylist) => void` | Select matching audio track |
| `setSubtitleOption` | `(subtitleOption: MediaPlaylist) => void` | Select matching subtitle track |

### Event Handling

| Method | Signature | Description |
|--------|-----------|-------------|
| `on` | `(event: string, handler: Function) => void` | Subscribe to event |
| `off` | `(event: string, handler: Function) => void` | Unsubscribe from event |
| `once` | `(event: string, handler: Function) => void` | Subscribe once |

---

## Instance Properties (Getters/Setters) {#instance-properties}

### Read-Only Properties

| Property | Type | Description |
|----------|------|-------------|
| `media` | `HTMLMediaElement \| null` | Currently bound video element |
| `url` | `string \| null` | Current HLS manifest URL |
| `levels` | `Level[]` | Available quality levels |
| `bandwidthEstimate` | `number` | Current bandwidth estimate (bits/s) |
| `allAudioTracks` | `MediaPlaylist[]` | All audio tracks across groups |
| `allSubtitleTracks` | `MediaPlaylist[]` | All subtitle tracks across groups |
| `latestLevelDetails` | `LevelDetails \| null` | Last loaded level playlist details |
| `interstitialsManager` | `InterstitialsManager \| null` | Interstitials playback manager |
| `sessionId` | `string` | Unique session UUID |

### Read/Write Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentLevel` | `number` | Current quality level index. Set to change quality. Set `-1` for auto |
| `nextLevel` | `number` | Next quality level to load. Set to change. Set `-1` for auto |
| `loadLevel` | `number` | Quality level for next fragment load |
| `nextAutoLevel` | `number` | Next auto-selected quality level |
| `startLevel` | `number` | Initial quality level (-1 for auto) |
| `autoLevelEnabled` | `boolean` | Whether ABR is active |
| `capLevelToPlayerSize` | `boolean` | Limit quality to player dimensions |
| `audioTrack` | `number` | Current audio track index |
| `audioTracks` | `MediaPlaylist[]` | Available audio tracks |
| `subtitleTrack` | `number` | Current subtitle track index (-1 for none) |
| `subtitleTracks` | `MediaPlaylist[]` | Available subtitle tracks |
| `subtitleDisplay` | `boolean` | Show/hide subtitles |
| `maxAutoLevel` | `number` | Maximum auto-selectable quality level |
| `minAutoLevel` | `number` | Minimum auto-selectable quality level |
| `firstAutoLevel` | `number` | First auto-selected level after manifest parse |

### Live Stream Properties

| Property | Type | Description |
|----------|------|-------------|
| `liveSyncPosition` | `number \| null` | Target live sync position |
| `latency` | `number` | Current latency from live edge (seconds) |
| `maxLatency` | `number` | Maximum allowed latency |
| `targetLatency` | `number \| null` | Target latency for catchup |
| `drift` | `number` | Live edge drift rate |

---

## Events (Hls.Events) {#events}

### Lifecycle Events

| Event | Data | Description |
|-------|------|-------------|
| `MEDIA_ATTACHING` | `{ media }` | Before MediaSource attaches |
| `MEDIA_ATTACHED` | `{ media }` | MediaSource attached successfully |
| `MEDIA_DETACHING` | `{}` | Before detaching |
| `MEDIA_DETACHED` | `{}` | After detaching |
| `DESTROYING` | `{}` | Before instance destruction |

### Manifest/Level Events

| Event | Data | Description |
|-------|------|-------------|
| `MANIFEST_LOADING` | `{ url }` | Manifest loading started |
| `MANIFEST_LOADED` | `{ levels, audioTracks, subtitles, url, stats }` | Manifest loaded |
| `MANIFEST_PARSED` | `{ levels, firstLevel, audioTracks, subtitleTracks }` | Manifest parsed, levels available |
| `LEVEL_SWITCHING` | `{ level, attrs, ... }` | Quality level switch initiated |
| `LEVEL_SWITCHED` | `{ level }` | Quality level switch completed |
| `LEVEL_LOADING` | `{ url, level, id }` | Level playlist loading |
| `LEVEL_LOADED` | `{ details, level, id, stats }` | Level playlist loaded |
| `LEVEL_UPDATED` | `{ details, level }` | Level playlist updated (live) |
| `LEVEL_PTS_UPDATED` | `{ details, level, drift }` | PTS updated for level |
| `LEVELS_UPDATED` | `{ levels }` | Level list modified |

### Fragment Events

| Event | Data | Description |
|-------|------|-------------|
| `FRAG_LOADING` | `{ frag }` | Fragment loading started |
| `FRAG_LOAD_EMERGENCY_ABORTED` | `{ frag, stats }` | Fragment load aborted for emergency |
| `FRAG_LOADED` | `{ frag, payload, stats }` | Fragment loaded |
| `FRAG_DECRYPTED` | `{ frag }` | Fragment decrypted |
| `FRAG_PARSING_INIT_SEGMENT` | `{ frag, tracks }` | Init segment parsed |
| `FRAG_PARSING_USERDATA` | `{ frag, samples }` | SEI user data parsed |
| `FRAG_PARSING_METADATA` | `{ frag, samples }` | ID3 metadata parsed |
| `FRAG_PARSED` | `{ frag }` | Fragment fully parsed |
| `FRAG_BUFFERED` | `{ frag, stats }` | Fragment buffered |
| `FRAG_CHANGED` | `{ frag }` | Playing fragment changed |

### Buffer Events

| Event | Data | Description |
|-------|------|-------------|
| `BUFFER_RESET` | `{}` | Buffer reset |
| `BUFFER_CODECS` | `{ tracks }` | Codec info available |
| `BUFFER_CREATED` | `{ tracks }` | SourceBuffers created |
| `BUFFER_APPENDING` | `{ type, data, frag }` | Data appending to buffer |
| `BUFFER_APPENDED` | `{ type, timeRanges, frag }` | Data appended |
| `BUFFER_EOS` | `{ type }` | End of stream signaled |
| `BUFFER_FLUSHING` | `{ startOffset, endOffset, type }` | Buffer flush started |
| `BUFFER_FLUSHED` | `{ type }` | Buffer flushed |

### Audio Track Events

| Event | Data | Description |
|-------|------|-------------|
| `AUDIO_TRACKS_UPDATED` | `{ audioTracks }` | Audio tracks list updated |
| `AUDIO_TRACK_SWITCHING` | `{ id }` | Audio track switch initiated |
| `AUDIO_TRACK_SWITCHED` | `{ id }` | Audio track switched |
| `AUDIO_TRACK_LOADING` | `{ url, id }` | Audio track playlist loading |
| `AUDIO_TRACK_LOADED` | `{ details, id, stats }` | Audio track playlist loaded |

### Subtitle Events

| Event | Data | Description |
|-------|------|-------------|
| `SUBTITLE_TRACKS_UPDATED` | `{ subtitleTracks }` | Subtitle tracks updated |
| `SUBTITLE_TRACKS_CLEARED` | `{}` | Subtitle tracks cleared |
| `SUBTITLE_TRACK_SWITCH` | `{ id }` | Subtitle track switch |
| `SUBTITLE_TRACK_LOADING` | `{ url, id }` | Subtitle track loading |
| `SUBTITLE_TRACK_LOADED` | `{ details, id, stats }` | Subtitle track loaded |
| `SUBTITLE_FRAG_PROCESSED` | `{ frag, success }` | Subtitle fragment processed |
| `CUES_PARSED` | `{ type, cues, track }` | Cues parsed from subtitle |
| `NON_NATIVE_TEXT_TRACKS_FOUND` | `{ tracks }` | Non-native tracks found |

### Performance Events

| Event | Data | Description |
|-------|------|-------------|
| `FPS_DROP` | `{ currentDropped, currentDecoded, totalDropped }` | Frame drop detected |
| `FPS_DROP_LEVEL_CAPPING` | `{ level, droppedLevel }` | Quality capped due to FPS drops |

### Key System / DRM Events

| Event | Data | Description |
|-------|------|-------------|
| `KEY_LOADING` | `{ frag }` | Decryption key loading |
| `KEY_LOADED` | `{ frag }` | Decryption key loaded |
| `CERT_LOADING` | `{ url }` | Server certificate loading |
| `CERT_LOADED` | `{ cert }` | Server certificate loaded |

### Error Event

| Event | Data | Description |
|-------|------|-------------|
| `ERROR` | `{ type, details, fatal, ... }` | Error occurred. Check `fatal` to determine if recovery needed |

---

## Error Types {#error-types}

### Hls.ErrorTypes

| Type | Description |
|------|-------------|
| `NETWORK_ERROR` | Network-related error (timeout, HTTP error) |
| `MEDIA_ERROR` | Media/decoding error |
| `KEY_SYSTEM_ERROR` | DRM/key system error |
| `MUX_ERROR` | Muxing/demuxing error |
| `OTHER_ERROR` | Other errors |

### Error Recovery Pattern

```ts
hls.on(Hls.Events.ERROR, (event, data) => {
  if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        console.error('Fatal network error', data.details);
        hls.startLoad(); // retry loading
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        console.error('Fatal media error', data.details);
        hls.recoverMediaError(); // try to recover
        break;
      default:
        console.error('Unrecoverable error');
        hls.destroy();
        break;
    }
  } else {
    // Non-fatal error, hls.js will try to recover automatically
    console.warn('Non-fatal error:', data.type, data.details);
  }
});
```

### Common Error Details (Hls.ErrorDetails)

**Network:** `MANIFEST_LOAD_ERROR`, `MANIFEST_LOAD_TIMEOUT`, `MANIFEST_PARSING_ERROR`, `LEVEL_EMPTY_ERROR`, `LEVEL_LOAD_ERROR`, `LEVEL_LOAD_TIMEOUT`, `LEVEL_PARSING_ERROR`, `AUDIO_TRACK_LOAD_ERROR`, `AUDIO_TRACK_LOAD_TIMEOUT`, `SUBTITLE_LOAD_ERROR`, `SUBTITLE_TRACK_LOAD_TIMEOUT`, `FRAG_LOAD_ERROR`, `FRAG_LOAD_TIMEOUT`, `KEY_LOAD_ERROR`, `KEY_LOAD_TIMEOUT`

**Media:** `MANIFEST_INCOMPATIBLE_CODECS_ERROR`, `FRAG_DECRYPT_ERROR`, `FRAG_PARSING_ERROR`, `FRAG_GAP`, `BUFFER_ADD_CODEC_ERROR`, `BUFFER_INCOMPATIBLE_CODECS_ERROR`, `BUFFER_APPEND_ERROR`, `BUFFER_APPENDING_ERROR`, `BUFFER_STALLED_ERROR`, `BUFFER_FULL_ERROR`, `BUFFER_SEEK_OVER_HOLE`, `BUFFER_NUDGE_ON_STALL`

---

## Configuration Reference {#configuration}

### Core Playback Config

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `autoStartLoad` | `boolean` | `true` | Auto-load after manifest parse |
| `startPosition` | `number` | `-1` | Initial position (-1 = default) |
| `defaultAudioCodec` | `string` | `undefined` | Override audio codec |
| `initialLiveManifestSize` | `number` | `1` | Segments before live playback |

### Buffer Config

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxBufferLength` | `number` | `30` | Target buffer length (seconds) |
| `maxMaxBufferLength` | `number` | `600` | Absolute max buffer (seconds) |
| `maxBufferSize` | `number` | `60000000` | Max buffer size (bytes, ~60MB) |
| `maxBufferHole` | `number` | `0.1` | Max inter-fragment gap tolerance (seconds) |
| `backBufferLength` | `number` | `Infinity` | Max played buffer to keep |
| `frontBufferFlushThreshold` | `number` | `Infinity` | Forward buffer before eviction |

### Stall Detection

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxStarvationDelay` | `number` | `4` | ABR starvation avoidance window (seconds) |
| `maxLoadingDelay` | `number` | `4` | Max loading delay for start level (seconds) |
| `detectStallWithCurrentTimeMs` | `number` | `1250` | Stall detection interval (ms) |
| `highBufferWatchdogPeriod` | `number` | `3` | Gap jump delay (seconds) |
| `nudgeOffset` | `number` | `0.1` | Playhead nudge per retry (seconds) |
| `nudgeMaxRetry` | `number` | `3` | Max nudge retries |
| `nudgeOnVideoHole` | `boolean` | `true` | Nudge on video gaps |

### Live Streaming Config

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `liveSyncMode` | `string` | `'edge'` | Live sync mode |
| `liveSyncDurationCount` | `number` | `3` | Live delay in segment multiples |
| `liveSyncDuration` | `number` | `undefined` | Live delay in seconds (overrides count) |
| `liveMaxLatencyDurationCount` | `number` | `Infinity` | Max live delay in segments |
| `liveMaxLatencyDuration` | `number` | `undefined` | Max live delay in seconds |
| `liveSyncOnStallIncrease` | `number` | `1` | Latency increase on stall (seconds) |
| `maxLiveSyncPlaybackRate` | `number` | `1` | Max speed for catchup (1-2) |
| `liveMaxUnchangedPlaylistRefresh` | `number` | `Infinity` | Max unchanged reloads before error |
| `liveDurationInfinity` | `boolean` | `false` | Set duration to Infinity for live |

### Quality Config

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `startLevel` | `number` | `undefined` | Initial quality level |
| `capLevelToPlayerSize` | `boolean` | `false` | Limit quality by player dimensions |
| `capLevelOnFPSDrop` | `boolean` | `false` | Cap quality on frame drops |
| `ignoreDevicePixelRatio` | `boolean` | `false` | Ignore DPR in size calculations |
| `maxDevicePixelRatio` | `number` | `Infinity` | Cap DPR |
| `testBandwidth` | `boolean` | `true` | Download test fragment for bandwidth |

### Worker Config

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enableWorker` | `boolean` | `true` | WebWorker for demuxing/remuxing |
| `workerPath` | `string` | `null` | Custom worker.js path |
| `enableSoftwareAES` | `boolean` | `true` | JS AES decryption fallback |

### Loader Config

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `loader` | `class` | XHR loader | Custom URL loader class |
| `fLoader` | `class` | `undefined` | Custom fragment loader |
| `pLoader` | `class` | `undefined` | Custom playlist loader |
| `xhrSetup` | `Function` | `undefined` | XHR customization callback |
| `fetchSetup` | `Function` | `undefined` | Fetch customization callback |

**xhrSetup example:**
```ts
new Hls({
  xhrSetup: (xhr: XMLHttpRequest, url: string) => {
    xhr.setRequestHeader('Authorization', 'Bearer YOUR_TOKEN');
  },
});
```

**fetchSetup example:**
```ts
new Hls({
  fetchSetup: (context: any, initParams: RequestInit) => {
    initParams.headers = {
      ...initParams.headers,
      Authorization: 'Bearer YOUR_TOKEN',
    };
    return new Request(context.url, initParams);
  },
});
```

### Preference Config

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `videoPreference` | `object` | `undefined` | HDR selection and VIDEO-RANGE values |
| `audioPreference` | `object` | `undefined` | Preferred audio track matching |
| `subtitlePreference` | `object` | `undefined` | Preferred subtitle track matching |

### Misc Config

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `debug` | `boolean \| object` | `false` | Enable debug logs or custom logger |
| `progressive` | `boolean` | `false` | Stream segment data with fetch |
| `lowLatencyMode` | `boolean` | `true` | Low-Latency HLS support |
| `appendErrorMaxRetry` | `number` | `3` | Max appendBuffer retries |
| `appendTimeout` | `number` | `Infinity` | appendBuffer timeout (ms) |
| `startFragPrefetch` | `boolean` | `false` | Prefetch start fragment |
| `preferManagedMediaSource` | `boolean` | `true` | Use ManagedMediaSource if available |
| `useMediaCapabilities` | `boolean` | `true` | Use MediaCapabilities API |

---

## Loading Policies {#loading-policies}

Each policy controls timeout and retry behavior:

| Policy | Applies to |
|--------|-----------|
| `manifestLoadPolicy` | Multivariant Playlist |
| `playlistLoadPolicy` | Media Playlist |
| `fragLoadPolicy` | Segments and Parts |
| `keyLoadPolicy` | Decryption keys |
| `certLoadPolicy` | Server certificates |
| `steeringManifestLoadPolicy` | Content Steering |

### LoaderConfig Structure

```ts
{
  default: {
    maxTimeToFirstByteMs: number,  // Max TTFB
    maxLoadTimeMs: number,         // Max total load time
    timeoutRetry: RetryConfig | null,
    errorRetry: RetryConfig | null,
  }
}
```

### RetryConfig Structure

```ts
{
  maxNumRetry: number,         // Max retries
  retryDelayMs: number,        // Initial retry delay (ms)
  maxRetryDelayMs: number,     // Max retry delay (ms)
  backoff: 'exponential' | 'linear',
  shouldRetry?: (retryConfig, retryCount, isTimeout, httpStatus) => boolean,
}
```

---

## ABR Configuration {#abr-configuration}

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `abrEwmaFastLive` | `number` | `3.0` | Fast EWMA half-life (live) |
| `abrEwmaSlowLive` | `number` | `9.0` | Slow EWMA half-life (live) |
| `abrEwmaFastVoD` | `number` | `3.0` | Fast EWMA half-life (VoD) |
| `abrEwmaSlowVoD` | `number` | `9.0` | Slow EWMA half-life (VoD) |
| `abrEwmaDefaultEstimate` | `number` | `500000` | Default bandwidth (bits/s) |
| `abrEwmaDefaultEstimateMax` | `number` | `5000000` | Max bandwidth estimate |
| `abrBandWidthFactor` | `number` | `0.95` | Scale factor for level maintenance |
| `abrBandWidthUpFactor` | `number` | `0.7` | Scale factor for level upgrade |
| `abrMaxWithRealBitrate` | `boolean` | `false` | Use measured vs signaled bitrate |
| `abrSwitchInterval` | `number` | `0` | Min seconds between switches |
| `minAutoBitrate` | `number` | `0` | Min auto-selection bitrate (bits/s) |

---

## DRM Configuration {#drm-configuration}

```ts
new Hls({
  emeEnabled: true,
  drmSystems: {
    'com.widevine.alpha': {
      licenseUrl: 'https://license-server.com/widevine',
      serverCertificateUrl: 'https://license-server.com/cert',
    },
    'com.apple.fps': {
      licenseUrl: 'https://license-server.com/fairplay',
      serverCertificateUrl: 'https://license-server.com/fps-cert',
    },
  },
  licenseXhrSetup: (xhr, url, keyContext, licenseChallenge) => {
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
  },
  licenseResponseCallback: (xhr, url, keyContext) => {
    return xhr.response; // or transform the response
  },
});
```

| Property | Type | Default |
|----------|------|---------|
| `emeEnabled` | `boolean` | `false` |
| `drmSystems` | `Record<string, DrmSystemConfig>` | `{}` |
| `drmSystemOptions` | `object` | `{}` |
| `licenseXhrSetup` | `Function` | `undefined` |
| `licenseResponseCallback` | `Function` | `undefined` |
| `requestMediaKeySystemAccessFunc` | `Function` | native |

---

## Caption/Subtitle Configuration {#caption-config}

| Property | Type | Default |
|----------|------|---------|
| `enableWebVTT` | `boolean` | `true` |
| `enableIMSC1` | `boolean` | `true` |
| `enableCEA708Captions` | `boolean` | `true` |
| `captionsTextTrack1Label` | `string` | `'English'` |
| `captionsTextTrack1LanguageCode` | `string` | `'en'` |
| `captionsTextTrack2Label` | `string` | `'Spanish'` |
| `captionsTextTrack2LanguageCode` | `string` | `'es'` |
| `captionsTextTrack3Label` | `string` | `'Unknown CC'` |
| `captionsTextTrack3LanguageCode` | `string` | `''` |
| `captionsTextTrack4Label` | `string` | `'Unknown CC'` |
| `captionsTextTrack4LanguageCode` | `string` | `''` |
| `renderTextTracksNatively` | `boolean` | `true` |
| `enableDateRangeMetadataCues` | `boolean` | `true` |
| `enableEmsgMetadataCues` | `boolean` | `true` |
| `enableID3MetadataCues` | `boolean` | `true` |

---

## Advanced Configuration {#advanced-config}

### Custom Controllers

| Property | Type | Description |
|----------|------|-------------|
| `abrController` | `class` | Custom ABR controller |
| `bufferController` | `class` | Custom buffer controller |
| `capLevelController` | `class` | Custom level capping controller |
| `fpsController` | `class` | Custom FPS controller |
| `errorController` | `class` | Custom error recovery controller |
| `timelineController` | `class` | Custom text track controller |

### FPS Monitoring

| Property | Type | Default |
|----------|------|---------|
| `fpsDroppedMonitoringPeriod` | `number` | `5000` (ms) |
| `fpsDroppedMonitoringThreshold` | `number` | `0.2` |

### CMCD (Common Media Client Data)

```ts
new Hls({
  cmcd: {
    sessionId: 'unique-session-id',
    contentId: 'content-id',
    useHeaders: false, // send as query params (default) or headers
  },
});
```

### Interstitials

| Property | Type | Default |
|----------|------|---------|
| `enableInterstitialPlayback` | `boolean` | `true` |
| `interstitialAppendInPlace` | `boolean` | `true` |
| `interstitialLiveLookAhead` | `number` | `10` (seconds) |

### Muxing

| Property | Type | Default |
|----------|------|---------|
| `stretchShortVideoTrack` | `boolean` | `false` |
| `maxAudioFramesDrift` | `number` | `1` |
| `forceKeyFrameOnDiscontinuity` | `boolean` | `true` |
| `handleMpegTsVideoIntegrityErrors` | `string` | `'process'` |

### Quality Level Control

```ts
// Get available levels
console.log(hls.levels); // Level[]
// Each level: { bitrate, width, height, codecSet, url, ... }

// Set specific quality
hls.currentLevel = 2; // switch immediately

// Set next quality (smooth)
hls.nextLevel = 2; // switch on next fragment

// Enable auto quality
hls.currentLevel = -1;
hls.nextLevel = -1;

// Check auto mode
console.log(hls.autoLevelEnabled); // boolean

// Cap to player size
hls.capLevelToPlayerSize = true;
```

### Audio Track Control

```ts
// List audio tracks
console.log(hls.audioTracks); // MediaPlaylist[]
// Each: { id, name, lang, default, ... }

// Switch audio track
hls.audioTrack = 1; // index

// All tracks across groups
console.log(hls.allAudioTracks);
```

### Subtitle Track Control

```ts
// List subtitle tracks
console.log(hls.subtitleTracks); // MediaPlaylist[]

// Enable subtitle track
hls.subtitleTrack = 0; // index, -1 to disable

// Toggle display
hls.subtitleDisplay = true; // show/hide
```
