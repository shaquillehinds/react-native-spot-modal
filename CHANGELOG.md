# Changelog

## 0.1.0

### Breaking changes

- `mountDefault` is removed from `SpotModalProps`. It started an unmount timer
  on first render whenever `showModal` was `false`, so it could never work with
  a controlled flag.
- `@shaquillehinds/react-native-essentials` is now a required peer dependency
  with a floor of `1.15.0`. It was previously optional with a floor of `1.8.0`.
- `react-native-reanimated` (`>=3.0.0`) and `react-native-gesture-handler`
  (`>=2.7.0`) are now declared peer dependencies. Both were already required
  at runtime but were undeclared.
- `setShowModal` is typed as `(show: boolean) => void`. A `useState` setter is
  still assignable.

### Added

- `disableBackdropPress` stops a backdrop tap from closing the modal.
- `disableAndroidBackButton` swallows the Android hardware back press without
  closing. By default, back now closes the modal on every rendering path.
- `rules/AGENT_RULES.md` and the `npx rnsm-rules` installer for AI coding
  agents.

### Fixed

- `pageX` / `pageY` changes while open now move the modal. Previously they were
  read once on mount.
- Rotating the device repositions the modal even when the content size does
  not change.
- Empty content (zero width or height) is no longer positioned and faded in.
- `unMountDelayInMilliSeconds={0}` is honoured instead of falling back to 250.
- The fade-out lasts exactly `unMountDelayInMilliSeconds` instead of a fixed
  300 ms.
- The backdrop colour fades in and out with the content.
- Reopening during the fade-out fades the same instance back in instead of
  force-closing it.
- Content on the right half of the screen sits flush with the point, matching
  the vertical placement.
