# Vidstack React Components Reference

> Source: https://vidstack.io/docs/player/components | @vidstack/react ^1.12.x

## Table of Contents

- [Core: Player](#core-player)
- [Core: Provider](#core-provider)
- [Layouts: DefaultVideoLayout / DefaultAudioLayout](#layouts)
- [Layouts: Plyr Layout](#plyr-layout)
- [Display: Poster](#display-poster)
- [Display: Captions](#display-captions)
- [Display: Controls](#display-controls)
- [Display: Gesture](#display-gesture)
- [Display: Track](#display-track)
- [Display: Thumbnail](#display-thumbnail)
- [Display: Time](#display-time)
- [Display: Title / ChapterTitle](#display-title)
- [Display: Buffering Indicator](#display-buffering-indicator)
- [Display: Announcer](#display-announcer)
- [Display: Icons](#display-icons)
- [Buttons](#buttons)
- [Sliders: TimeSlider](#time-slider)
- [Sliders: VolumeSlider](#volume-slider)
- [Sliders: SpeedSlider / QualitySlider / AudioGainSlider](#other-sliders)
- [Menus: Menu](#menu)
- [Menus: RadioGroup](#radio-group)

---

## Core: Player {#core-player}

```tsx
import { MediaPlayer, type MediaPlayerProps, type MediaPlayerInstance } from '@vidstack/react';
```

### Complete Props

| Prop | Type | Default |
|------|------|---------|
| `src` | `PlayerSrc` | `undefined` |
| `autoPlay` | `boolean` | `false` |
| `controls` | `boolean` | `false` |
| `muted` | `boolean` | `false` |
| `volume` | `number` | `1` |
| `playbackRate` | `number` | `1` |
| `paused` | `boolean` | `true` |
| `currentTime` | `number` | `0` |
| `duration` | `number` | `-1` |
| `loop` | `boolean` | `false` |
| `poster` | `string` | `''` |
| `posterLoad` | `'eager'\|'idle'\|'visible'` | - |
| `preload` | `string` | `'metadata'` |
| `playsInline` | `boolean` | `false` |
| `crossOrigin` | `boolean\|string\|null` | `null` |
| `fullscreenOrientation` | `'landscape'\|'portrait'\|'none'` | `'landscape'` |
| `controlsDelay` | `number` | `2000` |
| `load` | `'eager'\|'idle'\|'visible'\|'play'\|'custom'` | `'visible'` |
| `logLevel` | `LogLevel` | env-dependent |
| `viewType` | `'audio'\|'video'` | auto |
| `streamType` | `'on-demand'\|'live'\|'live:dvr'\|'ll-live'\|'ll-live:dvr'` | auto |
| `liveEdgeTolerance` | `number` | `10` |
| `minLiveDVRWindow` | `number` | `60` |
| `keyTarget` | `'document'\|'player'` | `'player'` |
| `keyShortcuts` | `MediaKeyShortcuts` | defaults |
| `clipStartTime` | `number` | - |
| `clipEndTime` | `number` | - |
| `title` | `string` | - |
| `artist` | `string` | - |
| `artwork` | `MediaImage[]` | - |
| `storage` | `MediaStorage\|string` | - |
| `children` | `ReactNode` | - |

### Complete Event Callbacks

**Playback:**
`onPlay`, `onPause`, `onPlaying`, `onEnded`, `onTimeUpdate`, `onTimeChange`, `onDurationChange`, `onRateChange`, `onVolumeChange`, `onMute`, `onUnmute`, `onWaiting`, `onStalled`, `onSuspend`

**Loading:**
`onLoadStart`, `onProgress`, `onLoadedMetadata`, `onLoadedData`, `onCanPlay`, `onCanPlayThrough`, `onAbort`, `onEmptied`

**Seeking:**
`onSeeking`, `onSeeked`

**User Interaction:**
`onControlsChange`, `onAutoPlayChange`, `onAutoPlayFail`, `onPlayFail`

**Fullscreen/PiP:**
`onFullscreenChange`, `onFullscreenError`, `onPictureInPictureChange`, `onPictureInPictureError`

**Source/Provider:**
`onSourceChange`, `onSourcesChange`, `onProviderChange`, `onProviderLoaderChange`, `onProviderSetup`

**Quality/Tracks:**
`onQualityChange`, `onQualitiesChange`, `onAutoQualityChange`, `onAudioTrackChange`, `onAudioTracksChange`, `onTextTrackChange`, `onTextTracksChange`

**Error:**
`onError`

**HLS-specific** (when HLS provider active):
`onHlsManifestParsed`, `onHlsManifestLoaded`, `onHlsLevelSwitched`, `onHlsLevelSwitching`, `onHlsLevelLoaded`, `onHlsLevelUpdated`, `onHlsError`, `onHlsFragLoaded`, `onHlsFragLoading`, `onHlsFragParsed`, `onHlsFragChanged`, `onHlsAudioTrackSwitched`, `onHlsAudioTrackSwitching`, `onHlsAudioTrackLoaded`, `onHlsSubtitleTrackSwitch`, `onHlsSubtitleTrackLoaded`, `onHlsBufferAppended`, `onHlsBufferFlushing`, `onHlsBufferReset`, `onHlsMediaAttached`, `onHlsMediaDetaching`, `onHlsLibLoadStart`, `onHlsLibLoaded`, `onHlsLibLoadError`

### Instance Methods

```tsx
const playerRef = useRef<MediaPlayerInstance>(null);
// Access: playerRef.current.play()
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `play` | `() => Promise<void>` | Start/resume playback |
| `pause` | `() => Promise<void>` | Pause playback |
| `enterFullscreen` | `(target?) => Promise<void>` | Enter fullscreen (`target: 'prefer-media'\|'provider'`) |
| `exitFullscreen` | `() => Promise<void>` | Exit fullscreen |
| `enterPictureInPicture` | `() => Promise<void>` | Enter PiP |
| `exitPictureInPicture` | `() => Promise<void>` | Exit PiP |
| `seekToLiveEdge` | `() => void` | Seek to live edge |
| `setAudioGain` | `(gain: number) => void` | Set audio gain (1 = normal, 2 = double) |
| `startLoading` | `() => void` | Start media loading (for `load="custom"`) |
| `startLoadingPoster` | `() => void` | Start poster loading |
| `subscribe` | `(callback) => Unsubscribe` | Subscribe to state updates |
| `requestAirPlay` | `() => Promise<void>` | Request AirPlay |
| `requestGoogleCast` | `() => Promise<void>` | Request Google Cast |

### Data Attributes

Applied on the `<media-player>` DOM element:

`data-paused`, `data-playing`, `data-muted`, `data-volume-low`, `data-volume-high`, `data-fullscreen`, `data-pip`, `data-seeking`, `data-waiting`, `data-buffering`, `data-ended`, `data-controls`, `data-canplay`, `data-error`, `data-live`, `data-live-edge`, `data-loop`, `data-autoplay`, `data-autoplay-error`, `data-captions`, `data-ios-controls`, `data-view-type`, `data-stream-type`, `data-started`, `data-user-idle`

---

## Core: Provider {#core-provider}

```tsx
import { MediaProvider, type MediaProviderProps, type MediaProviderInstance } from '@vidstack/react';
```

### Props

| Prop | Type | Default |
|------|------|---------|
| `loaders` | `object` | `undefined` |
| `iframeProps` | `IframeHTMLAttributes` | `undefined` |
| `mediaProps` | `HTMLAttributes<HTMLMediaElement>` | `undefined` |
| `children` | `ReactNode` | `null` |

Place `<Poster>` and `<Track>` components as children of `<MediaProvider>`:

```tsx
<MediaPlayer src="...">
  <MediaProvider>
    <Poster className="vds-poster" />
    <Track src="/subs.vtt" kind="subtitles" label="English" lang="en" />
  </MediaProvider>
</MediaPlayer>
```

---

## Layouts {#layouts}

```tsx
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
  DefaultAudioLayout,
} from '@vidstack/react/player/layouts/default';
```

**Required CSS imports:**
```tsx
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css'; // for video
import '@vidstack/react/player/styles/default/layouts/audio.css'; // for audio
```

### Props (shared by DefaultVideoLayout & DefaultAudioLayout)

| Prop | Type | Default |
|------|------|---------|
| `icons` | `DefaultLayoutIcons` | required |
| `colorScheme` | `'light'\|'dark'` | system pref |
| `thumbnails` | `ThumbnailSrc` | - |
| `translations` | `Partial<DefaultLayoutTranslations>` | - |
| `showTooltipDelay` | `number` | `700` |
| `showMenuDelay` | `number` | `0` |
| `smallLayoutWhen` | `boolean\|((ctx)=>boolean)` | `width<576\|\|height<380` |
| `playbackRates` | `object` | - |
| `seekStep` | `number` | - |
| `menuContainer` | `string` | `document.body` |
| `noModal` | `boolean` | - |
| `noGestures` | `boolean` | - |
| `noKeyboardAnimations` | `boolean` | - |
| `disableTimeSlider` | `boolean` | - |
| `hideQualityBitrate` | `boolean` | `false` |
| `download` | `FileDownloadInfo` | - |
| `audioGains` | `object` | - |
| `sliderChaptersMinWidth` | `number` | - |
| `slots` | `Record<string, ReactNode>` | - |

### Slot Names (40+)

**Display:** `bufferingIndicator`, `title`, `captions`, `chapterTitle`, `currentTime`, `endTime`

**Buttons:** `playButton`, `muteButton`, `fullscreenButton`, `captionButton`, `pipButton`, `airPlayButton`, `googleCastButton`, `liveButton`, `loadButton`, `seekBackwardButton`, `seekForwardButton`

**Controls:** `timeSlider`, `volumeSlider`

**Menus:** `chaptersMenu`, `settingsMenu`, `settingsMenuItemsStart`, `settingsMenuItemsEnd`, `playbackMenuItemsStart`, `playbackMenuItemsEnd`, `playbackMenuItemsLoop`, `accessibilityMenuItemsStart`, `accessibilityMenuItemsEnd`, `audioMenuItemsStart`, `audioMenuItemsEnd`, `captionsMenuItemsStart`, `captionsMenuItemsEnd`

**Positional prefixes:** Add `before` or `after` to any slot (e.g., `beforePlayButton`, `afterCaptionButton`).

### Data Attributes

`data-match` (layout active), `data-sm` (small layout), `data-lg` (large layout), `data-size` (`sm`/`lg`)

---

## Plyr Layout {#plyr-layout}

```tsx
import { PlyrLayout, plyrLayoutIcons } from '@vidstack/react/player/layouts/plyr';
import '@vidstack/react/player/styles/plyr/theme.css';
```

Lightweight layout mimicking Plyr player. Same props as Default Layout.

---

## Display: Poster {#display-poster}

```tsx
import { Poster, type PosterProps } from '@vidstack/react';
```

| Prop | Type | Default |
|------|------|---------|
| `src` | `string` | `null` |
| `alt` | `string` | `undefined` |
| `crossOrigin` | `string\|null` | `null` |
| `asChild` | `boolean` | `false` |

**Data Attributes:** `data-visible`, `data-loading`, `data-error`, `data-hidden`

```tsx
<MediaProvider>
  <Poster className="vds-poster" src="/poster.jpg" alt="Video poster" />
</MediaProvider>
```

---

## Display: Captions {#display-captions}

```tsx
import { Captions, type CaptionsProps } from '@vidstack/react';
```

| Prop | Type | Default |
|------|------|---------|
| `exampleText` | `string` | `'Captions look like this.'` |
| `textDir` | `'ltr'\|'rtl'` | `'ltr'` |
| `asChild` | `boolean` | `false` |

Renders overlay for video, box for audio. Falls back to native captions on iOS Safari.

---

## Display: Controls {#display-controls}

```tsx
import { Controls } from '@vidstack/react';
```

### Controls.Root Props

| Prop | Type | Default |
|------|------|---------|
| `hideDelay` | `number` | `2000` |
| `hideOnMouseLeave` | `boolean` | `false` |
| `asChild` | `boolean` | `false` |

**Callback:** `onChange` (visibility state change)
**Data Attributes:** `data-visible`, `data-pip`, `data-fullscreen`

### Controls.Group

Container for grouping control elements. Props: `asChild`, `children`.

```tsx
<Controls.Root>
  <Controls.Group>{/* top controls */}</Controls.Group>
  <Controls.Group>{/* bottom controls */}</Controls.Group>
</Controls.Root>
```

---

## Display: Gesture {#display-gesture}

```tsx
import { Gesture, type GestureProps } from '@vidstack/react';
```

| Prop | Type | Description |
|------|------|-------------|
| `event` | `string` | DOM event type. Prefix with `dbl` for double (e.g., `dblpointerup`) |
| `action` | `string` | Media action (e.g., `toggle:paused`, `toggle:fullscreen`, `seek:10`, `seek:-10`) |
| `disabled` | `boolean` | Disable gesture |

**Callbacks:** `onWillTrigger` (cancelable), `onTrigger`

```tsx
<Gesture event="pointerup" action="toggle:paused" />
<Gesture event="dblpointerup" action="toggle:fullscreen" />
<Gesture event="pointerup" action="seek:10" />   {/* seek forward 10s */}
<Gesture event="pointerup" action="seek:-10" />  {/* seek backward 10s */}
```

---

## Display: Track {#display-track}

```tsx
import { Track } from '@vidstack/react';
```

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Track file URL |
| `kind` | `'subtitles'\|'captions'\|'chapters'\|'descriptions'\|'metadata'` | Track kind |
| `label` | `string` | Human-readable label |
| `lang` | `string` | BCP 47 language code |
| `type` | `'vtt'\|'srt'\|'ssa'\|'ass'\|'json'` | Track format |
| `default` | `boolean` | Default track |

```tsx
<MediaProvider>
  <Track src="/en.vtt" kind="subtitles" label="English" lang="en" type="vtt" />
  <Track src="/chapters.vtt" kind="chapters" label="Chapters" lang="en" type="vtt" default />
</MediaProvider>
```

---

## Display: Thumbnail {#display-thumbnail}

```tsx
import { Thumbnail, type ThumbnailProps } from '@vidstack/react';
```

| Prop | Type |
|------|------|
| `src` | `ThumbnailSrc` (VTT URL, JSON, or storyboard object) |
| `time` | `number` (seconds) |
| `crossOrigin` | `string\|null` |

**Data Attributes:** `data-loading`, `data-error`, `data-hidden`

---

## Display: Time {#display-time}

```tsx
import { Time, type TimeProps } from '@vidstack/react';
```

| Prop | Type | Default |
|------|------|---------|
| `type` | `'current'\|'buffered'\|'duration'` | `'current'` |
| `showHours` | `boolean` | `false` |
| `padHours` | `boolean\|null` | `null` |
| `padMinutes` | `boolean\|null` | `null` |
| `remainder` | `boolean` | `false` |

Displays "LIVE" for non-seekable live streams.

---

## Display: Title / ChapterTitle {#display-title}

```tsx
import { Title, ChapterTitle } from '@vidstack/react';
```

`<Title />` displays the media title. `<ChapterTitle />` displays current chapter name.

---

## Display: Buffering Indicator {#display-buffering-indicator}

```tsx
import { BufferingIndicator } from '@vidstack/react';
```

Shows loading spinner when media is buffering.

---

## Display: Announcer {#display-announcer}

Screen reader announcements for media state changes (play, pause, volume, etc.).

---

## Display: Icons {#display-icons}

```tsx
import { PlayIcon, PauseIcon, MuteIcon, VolumeHighIcon, ... } from '@vidstack/react/icons';
```

Full icon set available for custom UIs.

---

## Buttons {#buttons}

All button components share common patterns:

```tsx
import {
  PlayButton, MuteButton, CaptionButton, FullscreenButton,
  PIPButton, SeekButton, LiveButton, AirPlayButton,
  GoogleCastButton, ToggleButton, Tooltip,
} from '@vidstack/react';
```

### PlayButton
Toggles play/pause. **Data Attributes:** `data-paused`, `data-ended`

### MuteButton
Toggles mute. **Data Attributes:** `data-muted`, `data-volume` (`low`/`high`)

### CaptionButton
Toggles captions. **Data Attributes:** `data-active`

### FullscreenButton
Toggles fullscreen. **Data Attributes:** `data-active`, `data-hidden` (not supported)

### PIPButton
Toggles PiP. **Data Attributes:** `data-active`, `data-hidden` (not supported)

### SeekButton
Seek by offset. **Props:** `seconds` (number, positive = forward, negative = backward)

```tsx
<SeekButton seconds={-10} /> {/* Seek backward 10s */}
<SeekButton seconds={10} />  {/* Seek forward 10s */}
```

### LiveButton
Seek to live edge. **Data Attributes:** `data-live`, `data-live-edge`

### AirPlayButton / GoogleCastButton
Remote playback buttons. **Data Attributes:** `data-active`, `data-hidden`

### Tooltip
```tsx
import { Tooltip } from '@vidstack/react';

<Tooltip.Root>
  <Tooltip.Trigger asChild>
    <PlayButton />
  </Tooltip.Trigger>
  <Tooltip.Content>Play</Tooltip.Content>
</Tooltip.Root>
```

---

## Sliders: TimeSlider {#time-slider}

```tsx
import { TimeSlider } from '@vidstack/react';
```

### Subcomponents
`TimeSlider.Root`, `TimeSlider.Track`, `TimeSlider.TrackFill`, `TimeSlider.Progress`, `TimeSlider.Thumb`, `TimeSlider.Preview`, `TimeSlider.Value`, `TimeSlider.Chapters`, `TimeSlider.ChapterTitle`, `TimeSlider.Video`, `TimeSlider.Steps`

### Root Props

| Prop | Type | Default |
|------|------|---------|
| `disabled` | `boolean` | - |
| `keyStep` | `number` | `5` |
| `shiftKeyMultiplier` | `number` | `2` |
| `step` | `number` | `0.1` |
| `pauseWhileDragging` | `boolean` | `false` |
| `seekingRequestThrottle` | `number` | `100` |
| `noSwipeGesture` | `boolean` | `false` |
| `orientation` | `SliderOrientation` | - |

**Callbacks:** `onDragStart`, `onDragEnd`, `onDragValueChange`, `onValueChange`, `onPointerValueChange`

**CSS Variables:** `--slider-fill`, `--slider-pointer`, `--slider-progress`
**Data Attributes:** `data-dragging`, `data-pointing`, `data-active`, `data-focus`

### Basic Usage
```tsx
<TimeSlider.Root>
  <TimeSlider.Track>
    <TimeSlider.TrackFill />
    <TimeSlider.Progress />
  </TimeSlider.Track>
  <TimeSlider.Thumb />
</TimeSlider.Root>
```

### With Preview
```tsx
<TimeSlider.Root>
  <TimeSlider.Track>
    <TimeSlider.TrackFill />
    <TimeSlider.Progress />
  </TimeSlider.Track>
  <TimeSlider.Preview>
    <TimeSlider.Value />
  </TimeSlider.Preview>
  <TimeSlider.Thumb />
</TimeSlider.Root>
```

### With Chapters
```tsx
<TimeSlider.Root>
  <TimeSlider.Chapters>
    {(cues, forwardRef) =>
      cues.map((cue) => (
        <div key={cue.startTime} ref={forwardRef}>
          <TimeSlider.Track>
            <TimeSlider.TrackFill />
            <TimeSlider.Progress />
          </TimeSlider.Track>
        </div>
      ))
    }
  </TimeSlider.Chapters>
</TimeSlider.Root>
```

### TimeSlider.Video (preview video)
```tsx
<TimeSlider.Preview>
  <TimeSlider.Video src="/low-res-preview.mp4" />
</TimeSlider.Preview>
```

### TimeSlider.Value Props

| Prop | Type | Default |
|------|------|---------|
| `type` | `'pointer'\|'current'` | `'pointer'` |
| `format` | `'time'\|'percent'\|null` | `null` |
| `showHours` | `boolean` | `false` |
| `padHours` | `boolean\|null` | `null` |

---

## Sliders: VolumeSlider {#volume-slider}

```tsx
import { VolumeSlider } from '@vidstack/react';
```

Same subcomponent pattern as TimeSlider: `VolumeSlider.Root`, `.Track`, `.TrackFill`, `.Thumb`, `.Preview`, `.Value`, `.Steps`.

**Root Props:** `disabled`, `keyStep` (default 5), `shiftKeyMultiplier` (default 2), `orientation`
**CSS Variables:** `--slider-fill`, `--slider-pointer`
**Data Attributes:** `data-dragging`, `data-pointing`, `data-active`, `data-focus`, `data-supported`

```tsx
<VolumeSlider.Root>
  <VolumeSlider.Track>
    <VolumeSlider.TrackFill />
  </VolumeSlider.Track>
  <VolumeSlider.Thumb />
</VolumeSlider.Root>
```

---

## Other Sliders {#other-sliders}

### SpeedSlider
```tsx
import { SpeedSlider } from '@vidstack/react';
```
Controls playback rate. Same subcomponent pattern.

### QualitySlider
```tsx
import { QualitySlider } from '@vidstack/react';
```
Controls video quality level. Same subcomponent pattern.

### AudioGainSlider
```tsx
import { AudioGainSlider } from '@vidstack/react';
```
Controls audio gain amplification. Same subcomponent pattern.

---

## Menus: Menu {#menu}

```tsx
import { Menu } from '@vidstack/react';
```

### Menu.Root
```tsx
<Menu.Root>
  <Menu.Button>Settings</Menu.Button>
  <Menu.Items placement="top end">
    {/* content */}
  </Menu.Items>
</Menu.Root>
```

**Props:** `showDelay` (number, default 0)
**Callbacks:** `onOpen`, `onClose`
**Data Attributes:** `data-open`, `data-keyboard`, `data-root`, `data-submenu`, `data-disabled`

### Menu.Button
**Props:** `disabled` (boolean)
**Data Attributes:** `data-open`, `data-focus`, `data-hocus`

### Menu.Items
**Props:** `placement` (MenuPlacement), `offset` (number), `alignOffset` (number)
**Data Attributes:** `data-placement`, `data-open`, `data-transition`

### Menu.Item
**Props:** `disabled` (boolean)
**Callback:** `onSelect`

### Menu.Portal
**Props:** `container` (string), `disabled` (boolean)

---

## Menus: RadioGroup {#radio-group}

```tsx
<Menu.RadioGroup value={currentValue} onChange={handleChange}>
  <Menu.Radio value="720">720p</Menu.Radio>
  <Menu.Radio value="1080">1080p</Menu.Radio>
</Menu.RadioGroup>
```

### Menu.RadioGroup
**Props:** `value` (string)
**Callback:** `onChange`

### Menu.Radio
**Props:** `value` (string)
**Callbacks:** `onChange`, `onSelect`
**Data Attributes:** `data-checked`, `data-focus`, `data-hocus`

**CSS Variable:** `--menu-height` (for smooth height transitions)
