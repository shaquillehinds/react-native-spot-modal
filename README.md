# @shaquillehinds/react-native-spot-modal

[![npm version](https://img.shields.io/npm/v/@shaquillehinds/react-native-spot-modal.svg)](https://www.npmjs.com/package/@shaquillehinds/react-native-spot-modal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<img src="https://raw.githubusercontent.com/shaquillehinds/react-native-spot-modal/master/assets/spotmodal.gif" alt="example" height="500"/>

A modal that renders its content at a screen coordinate you supply and keeps it
inside the screen. Built for context menus, anchored dropdowns and tooltips.

This document describes `@shaquillehinds/react-native-spot-modal` 0.1.0 running on
`@shaquillehinds/react-native-essentials` 1.15.0 or later, which supplies the
portal, the mount/unmount timing and the backdrop press. Behaviour described as
"derived from source" has not been run on a device.

## Table of contents

- [Installation](#installation)
- [Setup](#setup)
- [Quick start](#quick-start)
- [Coordinates](#coordinates)
- [Placement](#placement)
- [Rendering modes and the portal](#rendering-modes-and-the-portal)
- [Context inside the modal](#context-inside-the-modal)
- [Opening, closing and timing](#opening-closing-and-timing)
- [Backdrop and touches](#backdrop-and-touches)
- [Sizing and styling the content](#sizing-and-styling-the-content)
- [Rotation](#rotation)
- [Android back button](#android-back-button)
- [API reference](#api-reference)
- [Recipes](#recipes)
- [Troubleshooting](#troubleshooting)
- [Known issues](#known-issues)
- [Upgrading from 0.0.x](#upgrading-from-00x)
- [AI agent rules](#ai-agent-rules)
- [License](#license)

## Installation

```sh
npm install @shaquillehinds/react-native-spot-modal @shaquillehinds/react-native-essentials
npm install react-native-reanimated react-native-gesture-handler
```

All three companions are required peer dependencies:

| Package                                   | Range      | Why                                                                                                      |
| ----------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `@shaquillehinds/react-native-essentials` | `>=1.15.0` | Portal, `ComponentMounter` (with `keepMountedOnReopen`), `ModalWrapper`, `Press`, `useDeviceOrientation` |
| `react-native-reanimated`                 | `>=3.0.0`  | Fade and position                                                                                        |
| `react-native-gesture-handler`            | `>=2.7.0`  | Used by essentials' `ModalWrapper`                                                                       |

Finish the Reanimated setup for your platform (Babel plugin, cache reset).

## Setup

Mount one portal provider near the root, under `GestureHandlerRootView`.

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SpotModalPortalProvider } from '@shaquillehinds/react-native-spot-modal';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SpotModalPortalProvider>
        <RootNavigator />
      </SpotModalPortalProvider>
    </GestureHandlerRootView>
  );
}
```

`SpotModalPortalProvider` is `PortalProvider` from essentials under another
name. Other `@shaquillehinds` packages re-export the same component
(`BottomSheetPortalProvider` and so on) and they all share one React context. If
your app already mounts one of them, `SpotModal` uses it. A second provider is
unnecessary.

Where you put the provider decides which context the modal's children can see.
Read [Context inside the modal](#context-inside-the-modal) before choosing
between inside and outside `NavigationContainer`.

The provider is optional. Without one, `SpotModal` falls back to React Native's
`Modal` with no warning. See [Rendering modes](#rendering-modes-and-the-portal).

## Quick start

```tsx
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { SpotModal } from '@shaquillehinds/react-native-spot-modal';

export function Example() {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const open = (e: GestureResponderEvent) => {
    setPos({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
    setShow(true);
  };

  return (
    <View style={styles.screen}>
      <Pressable onPress={open} style={styles.button}>
        <Text>Open</Text>
      </Pressable>

      <SpotModal
        showModal={show}
        setShowModal={setShow}
        pageX={pos.x}
        pageY={pos.y}
        backgroundColor="rgba(0,0,0,0.4)"
      >
        <View style={styles.card}>
          <Text>Rendered at the tap point</Text>
        </View>
      </SpotModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: { padding: 16, borderRadius: 8, backgroundColor: '#007AFF' },
  card: {
    maxWidth: 280,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 5,
  },
});
```

Two details in that example matter. The position and the visibility are set in
the same handler, so the modal never shows at a stale spot. The card has its own
background and `maxWidth`, because the package supplies neither.

## Coordinates

`pageX` and `pageY` are root-view coordinates.

| Source          | Use                                                      |
| --------------- | -------------------------------------------------------- |
| Touch event     | `e.nativeEvent.pageX`, `e.nativeEvent.pageY`             |
| Element         | `ref.current.measure((x, y, w, h, pageX, pageY) => ...)` |
| Gesture Handler | `e.absoluteX`, `e.absoluteY`                             |

`locationX` / `locationY` and RNGH `x` / `y` are relative to the touched view and
will put the modal in the wrong place.

The modal follows the props while it is open. Changing `pageX` / `pageY` moves
it, without animation. Set the position in the same handler that sets
`showModal` to `true`. If the position arrives later, the modal fades in at the
previous position and then jumps. When the position comes from an async
`measure`, open inside the callback.

## Placement

The direction is chosen from the half of the screen the point is in. There is no
prop to override it.

| Point is in | Result                                                      |
| ----------- | ----------------------------------------------------------- |
| Top half    | Top edge of the content at `pageY`. Content extends down.   |
| Bottom half | Bottom edge of the content at `pageY`. Content extends up.  |
| Left half   | Left edge of the content at `pageX`. Content extends right. |
| Right half  | Right edge of the content at `pageX`. Content extends left. |

If the content would cross an edge it is pushed back to 5% of the screen width
from the left or right, or 5% of the screen height from the top or bottom.

The content is measured with `onLayout`, positioned, then faded in. It is
invisible until positioned, so there is no jump on open. It is repositioned,
without animation, when its size changes, when the coordinates change and when
the device rotates. Content with zero width or height is never shown.

Screen size comes from `Dimensions.get('screen')`.

## Rendering modes and the portal

| Path          | Taken when                                           | What renders                                                                                                     |
| ------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Portal        | A provider is mounted and `disablePortal` is unset   | An absolute-fill `View` inside the provider's overlay, above the app                                             |
| Native modal  | `disablePortal` is `true`, or no provider is mounted | React Native `Modal` with `transparent` and `statusBarTranslucent`, children wrapped in `GestureHandlerRootView` |
| In-place view | Native modal path plus `disableNativeModal`          | An absolute-fill `View` with a very high `zIndex` inside the parent                                              |

- `disablePortal` on its own renders in a native `Modal`, which sits above
  everything. Stacking problems only arise when you add `disableNativeModal`.
- `disableNativeModal` has no effect on the portal path. The overlay is already
  above the app, so that path never uses a native `Modal`.
- A missing provider is not an error. You get the native modal path.

Toggling `disablePortal` at runtime is safe. The copy on the old path unmounts
and a fresh one mounts on the new path, so the content's local state resets.

Inside a React Native `<Modal>`, or a native modal or form-sheet screen, use
`disablePortal`. The portal overlay lives in the window underneath, so a portal
spot modal opens out of sight. (Derived from how native presentation works.)

### Cost of the portal path

Each render of a component that contains `<SpotModal>` sends a fresh element to
the provider with `portal.update`, open or closed. That is one `setState` on the
root provider per host render. Keep `<SpotModal>` out of components that render
at a high rate, and keep one instance per screen in place of one per list row.

## Context inside the modal

On the portal path the children are rendered by the provider, so they resolve
React context from the provider's position in the tree.

| Children can use                            | Children cannot use                               |
| ------------------------------------------- | ------------------------------------------------- |
| Providers mounted above the portal provider | `useRoute()`                                      |
| Module-level stores and singletons          | The screen's own `useNavigation()`                |
| Props and closures from the wrapper         | Any context provided by the screen or its parents |

With the provider inside `NavigationContainer`, container-level hooks such as
`useTheme` work and `useNavigation` resolves to the root navigator. With the
provider outside it, no navigation hook works. Screen-level context is
unavailable in both cases.

The reliable pattern is to read what you need in the component that renders
`<SpotModal>` and pass it to the content as props. When that is not practical,
`disablePortal` keeps the children in the local tree.

## Opening, closing and timing

Mounting is handled by essentials' `ComponentMounter`.

| Step                                           | What happens                                                                                                                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `showModal` → `true`                           | After `mountDelayInMilliSeconds` (default 0) the inner modal mounts and `onComponentShow` fires. The content lays out, is positioned, then fades in over 300 ms together with the backdrop colour. |
| `showModal` → `false`                          | Content and backdrop fade out over `unMountDelayInMilliSeconds` (default 250). Then the inner modal unmounts and `onComponentClose` fires.                                                         |
| `showModal` → `true` again during the fade-out | The pending unmount is cancelled. The same instance fades back in. Content state is kept and `onComponentShow` does not fire again.                                                                |

- `unMountDelayInMilliSeconds` is the length of the close animation. `0` is
  honoured and removes the view at once.
- `onComponentShow` fires at mount, before the fade-in starts.
- Callbacks and delays are read when they are used. Inline functions that read
  current state work as expected, and changing a delay between opens takes
  effect.
- The children unmount on every completed close. Local state in them resets.

## Backdrop and touches

The backdrop is a full-screen essentials `Press`. Tapping it calls
`setShowModal(false)` after a 50 ms activation delay. Set `disableBackdropPress`
to stop that.

- `backgroundColor` colours it. The default is `undefined`, which is transparent.
  It still swallows every touch. Pass-through tooltips are not possible.
- The colour fades in and out with the content.
- The backdrop stays for the whole unmount delay. Nothing underneath can be
  pressed during that time, so keep the delay at or below 300.
- Touches that end inside the content are stopped before they reach the
  backdrop. Buttons inside the content need to call `setShowModal(false)`
  themselves.

## Sizing and styling the content

The package wraps your children in an absolutely positioned `Animated.View` with
`maxHeight` set to 85% of the screen height and nothing else. You supply the
background, padding, radius, shadow and width.

- Set a `maxWidth` on the content. There is no width cap, and content wider than
  the screen minus padding runs off the edge.
- Put long content in a `ScrollView` so the height cap clips it.
- There is no `style` prop on `SpotModal`.

## Rotation

On rotation the point is rescaled proportionally (`pageX / oldWidth * newWidth`,
same for Y) and the modal is repositioned, whether or not the content changed
size. If you pass new coordinates after rotating, they are taken as coordinates
in the new orientation. (Derived from source.)

## Android back button

Hardware back closes the modal on every rendering path while `showModal` is
`true`. The native modal path uses `Modal`'s `onRequestClose`. The portal and
in-place paths register a `BackHandler` listener. Back does not reach the
navigator underneath.

Set `disableAndroidBackButton` to make back do nothing while the modal is open.
You do not need your own `BackHandler` listener.

## API reference

### Exports

| Export                        | Kind      | Notes                                                                           |
| ----------------------------- | --------- | ------------------------------------------------------------------------------- |
| `SpotModal`                   | component | Named and default export                                                        |
| `SpotModalProps`              | type      | All props                                                                       |
| `_SpotModalProps`             | type      | Props without the mounter options                                               |
| `SpotModalPortalProvider`     | component | `PortalProvider` from essentials                                                |
| `useSpotModalPortal`          | hook      | `usePortal`. Returns `{ mount, update, unmount }` or `null` without a provider. |
| `useSpotModalPortalComponent` | hook      | `usePortalComponent({ name, Component, disable?, CustomPortalContext? })`       |
| `PortalItem`                  | type      | `{ key: string \| number; element: ReactNode }`                                 |

### `SpotModal` props

| Prop                         | Type                          | Required | Default     | Notes                                                             |
| ---------------------------- | ----------------------------- | -------- | ----------- | ----------------------------------------------------------------- |
| `showModal`                  | `boolean`                     | yes      |             |                                                                   |
| `setShowModal`               | `(show: boolean) => void`     | yes      |             | Only ever called with `false`. A `useState` setter is assignable. |
| `pageX`                      | `number`                      | yes      |             | Followed while open                                               |
| `pageY`                      | `number`                      | yes      |             | Followed while open                                               |
| `children`                   | `React.ReactNode`             | yes      |             | Mounted only while open                                           |
| `backgroundColor`            | `string`                      | no       | `undefined` | Backdrop colour. Fades with the content.                          |
| `disableBackdropPress`       | `boolean`                     | no       | `false`     | Backdrop tap does not close                                       |
| `disableAndroidBackButton`   | `boolean`                     | no       | `false`     | Back does nothing while open                                      |
| `disablePortal`              | `boolean`                     | no       | `false`     | Native modal path                                                 |
| `disableNativeModal`         | `boolean`                     | no       | `false`     | Non-portal path only                                              |
| `mountDelayInMilliSeconds`   | `number`                      | no       | `0`         |                                                                   |
| `unMountDelayInMilliSeconds` | `number`                      | no       | `250`       | Unmount delay and fade-out length                                 |
| `onComponentShow`            | `() => void \| Promise<void>` | no       |             | Fires at mount                                                    |
| `onComponentClose`           | `() => void \| Promise<void>` | no       |             | Fires at unmount                                                  |

`mountDefault` from `ComponentMounterProps` is not part of `SpotModalProps`.

### `SpotModalPortalProvider` props

| Prop                  | Type                   | Default | Notes                                                                                             |
| --------------------- | ---------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `children`            | `ReactNode`            |         |                                                                                                   |
| `unMountBufferTimeMS` | `number`               | `100`   | Wait before a portal item is removed                                                              |
| `updateBufferTimeMS`  | `number`               | none    | Throttle for `update`                                                                             |
| `CustomPortalContext` | `typeof PortalContext` | none    | `SpotModal` only reads the default context. A provider given a custom context is invisible to it. |

### Fixed values

| Value                         | Amount                                         |
| ----------------------------- | ---------------------------------------------- |
| Fade in                       | 300 ms                                         |
| Backdrop tap activation delay | 50 ms                                          |
| Edge padding                  | 5% of screen width and 5% of screen height     |
| Content max height            | 85% of screen height                           |
| Portal id                     | `spot-modal-<random>-<timestamp>` per instance |

## Recipes

Each recipe typechecks against 0.1.0 under `strict`.

### Context menu on long press

```tsx
function MessageBubble({ message, onCopy, onDelete }: MessageBubbleProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const open = (e: GestureResponderEvent) => {
    setPos({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
    setShow(true);
  };
  const run = (action: () => void) => () => {
    setShow(false);
    action();
  };

  return (
    <>
      <Pressable onLongPress={open}>
        <Text>{message.text}</Text>
      </Pressable>
      <SpotModal
        showModal={show}
        setShowModal={setShow}
        pageX={pos.x}
        pageY={pos.y}
        backgroundColor="rgba(0,0,0,0.3)"
      >
        <View style={styles.menu}>
          <Pressable style={styles.menuItem} onPress={run(onCopy)}>
            <Text>Copy</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={run(onDelete)}>
            <Text>Delete</Text>
          </Pressable>
        </View>
      </SpotModal>
    </>
  );
}
```

### One modal for a whole list

```tsx
function Inbox({ items }: { items: Item[] }) {
  const [show, setShow] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; item: Item | null }>(
    { x: 0, y: 0, item: null }
  );

  const openMenu = useCallback((item: Item, e: GestureResponderEvent) => {
    setMenu({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, item });
    setShow(true);
  }, []);

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <Row item={item} onLongPress={openMenu} />}
      />
      <SpotModal
        showModal={show}
        setShowModal={setShow}
        pageX={menu.x}
        pageY={menu.y}
      >
        <ItemMenuContent item={menu.item} close={() => setShow(false)} />
      </SpotModal>
    </>
  );
}
```

`ItemMenuContent` owns any state and data hooks, so they only run while the menu
is open.

### Dropdown anchored to an element

A fixed offset such as `pageY + 20` covers the button when it sits in the bottom
half of the screen. Anchor to the element's far edge instead.

```tsx
function Dropdown({ options, value, onChange }: DropdownProps) {
  const anchor = useRef<View>(null);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const open = () => {
    anchor.current?.measure((_x, _y, w, h, px, py) => {
      const screen = Dimensions.get('screen');
      const lowerHalf = py >= screen.height / 2;
      const rightHalf = px >= screen.width / 2;
      setPos({ x: rightHalf ? px + w : px, y: lowerHalf ? py : py + h });
      setShow(true);
    });
  };

  return (
    <>
      <Pressable ref={anchor} onPress={open} style={styles.trigger}>
        <Text>{value}</Text>
      </Pressable>
      <SpotModal
        showModal={show}
        setShowModal={setShow}
        pageX={pos.x}
        pageY={pos.y}
      >
        <ScrollView style={styles.list}>
          {options.map((o) => (
            <Pressable
              key={o}
              style={styles.menuItem}
              onPress={() => {
                onChange(o);
                setShow(false);
              }}
            >
              <Text>{o}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SpotModal>
    </>
  );
}
```

A trigger that straddles the vertical midline will be partly covered whichever
edge you choose.

### Tooltip

```tsx
<SpotModal showModal={show} setShowModal={setShow} pageX={pos.x} pageY={pos.y}>
  <View
    style={{
      maxWidth: 250,
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#222',
    }}
  >
    <Text style={{ color: 'white' }}>
      Score is based on accuracy, speed and consistency.
    </Text>
  </View>
</SpotModal>
```

The tooltip blocks touches while open and is dismissed by a tap anywhere.

### Reusable hook

```tsx
export function useSpotModal() {
  const [showModal, setShowModal] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const openAt = useCallback((x: number, y: number) => {
    setPos({ x, y });
    setShowModal(true);
  }, []);
  const openFromEvent = useCallback(
    (e: GestureResponderEvent) =>
      openAt(e.nativeEvent.pageX, e.nativeEvent.pageY),
    [openAt]
  );
  const close = useCallback(() => setShowModal(false), []);

  return {
    openAt,
    openFromEvent,
    close,
    modalProps: { showModal, setShowModal, pageX: pos.x, pageY: pos.y },
  };
}

// usage
const menu = useSpotModal();
<SpotModal {...menu.modalProps}>{content}</SpotModal>;
```

Calling `openAt` while the modal is already open moves it.

### Visibility and position in one state object

```tsx
const [menu, setMenu] = useState({ show: false, x: 0, y: 0 });

<SpotModal
  showModal={menu.show}
  setShowModal={(show) => setMenu((prev) => ({ ...prev, show }))}
  pageX={menu.x}
  pageY={menu.y}
>
  {content}
</SpotModal>;
```

### A modal that only closes from inside

```tsx
<SpotModal {...menu.modalProps} disableBackdropPress disableAndroidBackButton>
  <ConfirmContent onDone={menu.close} />
</SpotModal>
```

### Opening from a Gesture Handler gesture

```tsx
const longPress = Gesture.LongPress()
  .runOnJS(true)
  .onStart((e) => {
    setPos({ x: e.absoluteX, y: e.absoluteY });
    setShow(true);
  });
```

`.runOnJS(true)` is required. With Reanimated installed the callback is a
worklet, and calling React setters from it crashes.

### Reading current state in `onComponentClose`

```tsx
<SpotModal
  {...menu.modalProps}
  onComponentClose={() => analytics.track('menu_closed', { selectedId })}
/>
```

The callback is read when it fires, so `selectedId` is current.

## Troubleshooting

| Symptom                                                               | Cause                                                                                                                |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Modal fades in at the previous position, then jumps                   | `showModal` was set to `true` before the coordinates. Set both in the same handler or inside the `measure` callback. |
| Modal is offset from the finger                                       | `locationX/locationY` or RNGH `x/y` used in place of page or absolute coordinates.                                   |
| `useRoute` throws, or a context is `undefined`, inside the modal      | Portal path. Children render under the provider. Pass props or use `disablePortal`.                                  |
| `navigation.navigate` inside the modal targets the wrong navigator    | Same. `useNavigation` resolved to the root navigator.                                                                |
| App ignores taps briefly after the modal closes                       | Backdrop stays mounted for the unmount delay. Lower it.                                                              |
| Close animation is too fast or too slow                               | `unMountDelayInMilliSeconds` is the fade-out length.                                                                 |
| Tapping a menu item does nothing to the modal                         | Touches inside the content never reach the backdrop. Call `setShowModal(false)` in the item's handler.               |
| Content state resets every time the modal opens                       | Children unmount on close. Keep lasting state outside them.                                                          |
| Dropdown covers its own button                                        | Bottom-half placement extends up from the point. Use the anchored recipe.                                            |
| Content runs off the side of the screen                               | No width cap. Set `maxWidth`.                                                                                        |
| Nothing appears                                                       | Content measured zero width or height, or Reanimated is not set up.                                                  |
| Modal invisible when opened from inside an RN `Modal` or modal screen | Portal overlay is in the window below. Use `disablePortal`.                                                          |
| `disableNativeModal` seems to do nothing                              | It only applies on the non-portal path.                                                                              |
| Screen with a `SpotModal` re-renders the whole overlay constantly     | Host component renders often. Every host render updates the portal. Hoist the modal and keep one per screen.         |
| Crash when opening from an RNGH gesture                               | Missing `.runOnJS(true)`.                                                                                            |
| Android back closes the modal when it should not                      | Set `disableAndroidBackButton`.                                                                                      |
| Modal lands under the Android navigation bar near the bottom edge     | `Dimensions.get('screen')` includes system bars. Derived from source. See Known issues.                              |
| Callbacks see stale state, or a fast reopen closes the modal          | essentials is older than 1.15.0. Upgrade it.                                                                         |
| Type error: `mountDefault` does not exist                             | Removed in 0.1.0. Start with `showModal` set to `true` if you need it open on first render.                          |

## Known issues

1. **Every host render updates the portal.** `SpotModal` builds a new element on
   each render and `usePortalComponent` forwards it with `portal.update`, which
   is a `setState` on the root provider. It is cheap for one modal on a calm
   screen and wasteful for many instances or fast-rendering hosts. Memoising the
   element helps little because `children` usually changes identity each render.
   Keep one hoisted instance per screen.
2. **Screen size includes Android system bars.** `useDeviceOrientation` in
   essentials reads `Dimensions.get('screen')`, while touch coordinates are
   window-relative. On devices with a visible navigation bar, the bottom clamp
   and the top/bottom half decision can be off by the height of the bars.
   Derived from source and not confirmed on a device.
3. **Placement direction cannot be overridden.** A trigger that straddles the
   screen's midline is partly covered whichever edge you anchor to.
4. **No pass-through mode.** The backdrop always blocks touches while mounted.

## Upgrading from 0.0.x

Requires `@shaquillehinds/react-native-essentials` `>=1.15.0`.

| Change                                                                           | What to do                                                                                            |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `pageX` / `pageY` are followed while open                                        | Remove `key` bumps and close-wait-reopen sequences that existed to reposition.                        |
| Reopening during the unmount delay keeps the modal open                          | Remove timeouts that waited out the delay.                                                            |
| Callbacks and delays are no longer frozen at first mount                         | Remove ref indirection around `onComponentShow` / `onComponentClose`.                                 |
| Backdrop colour fades with the content                                           | Nothing. Visual change only.                                                                          |
| Fade-out lasts `unMountDelayInMilliSeconds`, and `0` is honoured                 | Values above 300 that were used to "lengthen the fade" now do so. Lower them if the close feels slow. |
| Right-half placement is flush with the point                                     | Remove manual `pageX` offsets that compensated for the old gap.                                       |
| Android back closes the modal                                                    | Remove your own `BackHandler` listeners. Use `disableAndroidBackButton` to opt out.                   |
| New `disableBackdropPress`                                                       | Replace workarounds that re-set `showModal` to `true`.                                                |
| `setShowModal` is typed `(show: boolean) => void`                                | Custom setters no longer need to handle the function form.                                            |
| `mountDefault` removed from the props type                                       | Initialise `showModal` to `true` instead.                                                             |
| Reanimated and Gesture Handler are declared peers, essentials is a required peer | Install them if your package manager now warns.                                                       |

## AI agent rules

The package ships a rules file written for AI coding agents (Claude Code, Cursor,
Codex, Copilot, etc.) at `rules/AGENT_RULES.md`. It tells an agent to keep
screen-scoped hooks out of the modal's children because the portal renders them
outside the calling tree, to pass root-view coordinates and set them in the same
handler that opens the modal, to hoist one modal per screen and never put one in
a list row, and to leave the backdrop, dismissal and Android back to the package.
It lists every prop and export
so an agent cannot invent APIs or fall back to patterns from a different popover
library. Point your agent at it with any of the following.

**Copy it into your project (recommended)**

```sh
npx rnsm-rules            # writes ./AGENTS.md
npx rnsm-rules cursor     # writes ./.cursor/rules/react-native-spot-modal.mdc (alwaysApply)
npx rnsm-rules claude     # writes ./.claude/rules/react-native-spot-modal.md
npx rnsm-rules codex      # writes ./.codex/rules/react-native-spot-modal.md
npx rnsm-rules copilot    # writes ./.github/instructions/react-native-spot-modal.instructions.md
npx rnsm-rules windsurf   # writes ./.windsurf/rules/react-native-spot-modal.md
npx rnsm-rules docs/ai/spot-modal.md   # custom path
```

Add `--force` to overwrite an existing file. `--print` writes the rules to stdout
instead of to disk. Re-run after upgrading the package to pick up rule changes.

**Reference it without copying (Claude Code)**

`CLAUDE.md` supports `@path` imports, so a single line keeps the rules in sync with
the installed version:

```md
# CLAUDE.md

@node_modules/@shaquillehinds/react-native-spot-modal/rules/AGENT_RULES.md
```

**Reference it from a generic `AGENTS.md`**

```md
Before writing any spot modal, read and follow
node_modules/@shaquillehinds/react-native-spot-modal/rules/AGENT_RULES.md.
```

---

## License

MIT © [Shaquille Hinds](https://github.com/shaquillehinds)
