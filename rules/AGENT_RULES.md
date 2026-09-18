# Agent Rules — `@shaquillehinds/react-native-spot-modal`

Rules for AI coding agents writing or modifying code that uses this package.
Read this before writing any spot modal, context menu, anchored dropdown or
tooltip built on it.

The mistake that breaks the most code: in the default portal mode the modal's
children render under the root `PortalProvider`, outside the calling component's
tree. Context from anything mounted below the provider is missing inside the
modal (Rule 1). The second is feeding it the wrong kind of coordinates (Rule 2).

Applies to `@shaquillehinds/react-native-spot-modal` `>=0.1.0` with
`@shaquillehinds/react-native-essentials` `>=1.15.0`. On older versions the
coordinates are read once at mount, the mount callbacks are frozen at first
render, and reopening inside the unmount delay force-closes the modal. Upgrade
before writing code against these rules.

---

## 0. Non-negotiables

1. Children must not call hooks that depend on a provider mounted below `SpotModalPortalProvider` (`useRoute`, screen-scoped `useNavigation`, per-screen contexts, `FormProvider`). Read them in the wrapper and pass props down.
2. Pass root-view coordinates: `event.nativeEvent.pageX/pageY`, `measure()`'s `pageX/pageY`, or RNGH `absoluteX/absoluteY`. Never `locationX/locationY` or `x/y`.
3. Set the coordinates in the same handler that sets `showModal` to `true`. Setting them later works but the modal visibly jumps.
4. One `SpotModal` per screen or per menu type, hoisted above the list. Never one per list row.
5. Do not wrap `SpotModal` in `<Modal>`, add your own backdrop, add a dismiss wrapper, or add a `BackHandler` listener for it. Backdrop, dismissal and Android back are built in.
6. The content has no default background, width limit, radius or shadow. Style the child `View` yourself and give it a `maxWidth`.
7. Actions inside the content close the modal themselves with `setShowModal(false)`.
8. Keep `unMountDelayInMilliSeconds` at or below 300. The backdrop blocks touches until unmount.
9. Inside a React Native `<Modal>` or a native modal / form-sheet screen, set `disablePortal`.
10. Never guess prop names. If a prop is not in the table in Rule 9, it does not exist. There is no `style`, `position`, `placement`, `anchor`, `offset`, `onClose`, `onDismiss`, `visible`, `animationDuration`, `closeOnBackdropPress` or `mountDefault`.

---

## 1. Portal mode moves children out of your component tree

With a `PortalProvider` mounted (the default path), `SpotModal` returns an empty
fragment where you placed it and pushes its children into the provider's overlay
`View`. React context follows render position. Children see providers above the
`PortalProvider` and nothing between the provider and the call site.

| Available to children in portal mode                       | Not available                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| Redux / Zustand / Query clients mounted above the provider | `useRoute()`                                                           |
| Theme providers mounted above the provider                 | Screen-scoped `useNavigation()`                                        |
| Anything imported as a module singleton                    | Any context provided by the screen or a parent component               |
| Props and closures passed from the wrapper                 | Form contexts (`react-hook-form` `FormProvider`) mounted in the screen |

✅ Correct: read in the wrapper, pass down

```tsx
function RowMenu(props: RowMenuProps) {
  const navigation = useNavigation<Nav>();
  return (
    <SpotModal {...props.modal}>
      <RowMenuContent
        onEdit={() => {
          props.modal.setShowModal(false);
          navigation.navigate('Edit', { id: props.id });
        }}
      />
    </SpotModal>
  );
}
```

❌ Wrong: throws or returns the wrong navigator in portal mode

```tsx
function RowMenuContent() {
  const route = useRoute();
  const navigation = useNavigation();
  // ...
}
```

If the children need the local tree's context and you cannot pass props, set
`disablePortal`. That path renders inside React Native's `Modal`, which keeps
the React tree intact.

`SpotModalPortalProvider` is the `PortalProvider` from
`@shaquillehinds/react-native-essentials`, re-exported. The bottom sheet, menu
modal and other `@shaquillehinds` packages re-export the same component and
share the same context. If the app already mounts one of them at the root, do
not add another. Place it under `GestureHandlerRootView`.

---

## 2. Coordinates

`pageX` / `pageY` are root-view coordinates.

| Source          | Use                                                      | Never                    |
| --------------- | -------------------------------------------------------- | ------------------------ |
| Touch event     | `e.nativeEvent.pageX`, `e.nativeEvent.pageY`             | `locationX`, `locationY` |
| Element         | `ref.current.measure((x, y, w, h, pageX, pageY) => ...)` | `onLayout` `x`, `y`      |
| Gesture Handler | `e.absoluteX`, `e.absoluteY`                             | `e.x`, `e.y`             |

✅ Correct

```tsx
const [show, setShow] = useState(false);
const [pos, setPos] = useState({ x: 0, y: 0 });

const open = (e: GestureResponderEvent) => {
  setPos({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
  setShow(true);
};
```

✅ Correct with an async measurement: open inside the callback

```tsx
const open = () => {
  ref.current?.measure((_x, _y, _w, h, px, py) => {
    setPos({ x: px, y: py + h });
    setShow(true);
  });
};
```

❌ Wrong: fades in at the old position, then jumps

```tsx
const open = () => {
  setShow(true);
  ref.current?.measure((_x, _y, _w, h, px, py) => setPos({ x: px, y: py + h }));
};
```

The modal follows `pageX` / `pageY` while open. A change repositions it without
animation. To move an open modal, set new coordinates. No close, `key` change or
remount is needed.

Read `e.nativeEvent` synchronously inside the handler. Do not read it after an
`await` or inside a `setTimeout`.

### Placement maths

The package decides direction from which half of the screen the point is in.
You cannot override it. Padding is 5% of screen width (horizontal) and 5% of
screen height (vertical).

| Point is in            | Result                                                     |
| ---------------------- | ---------------------------------------------------------- |
| Top half               | Content's top edge sits at `pageY`, content extends down   |
| Bottom half            | Content's bottom edge sits at `pageY`, content extends up  |
| Left half              | Content's left edge sits at `pageX`, content extends right |
| Right half             | Content's right edge sits at `pageX`, content extends left |
| Would overflow an edge | Clamped to the padding distance from that edge             |

Consequences:

- A fixed offset such as `y: pageY + 20` to "appear below the button" only works
  in the top half. In the bottom half the content extends up from that point and
  covers the button. Anchor to the element's top edge when it is in the bottom
  half, and to its right edge when it is in the right half.

  ```tsx
  anchor.current?.measure((_x, _y, w, h, px, py) => {
    const screen = Dimensions.get('screen');
    setPos({
      x: px >= screen.width / 2 ? px + w : px,
      y: py >= screen.height / 2 ? py : py + h,
    });
    setShow(true);
  });
  ```

- Height is capped at 85% of screen height. Width is not capped. Content wider
  than the screen minus padding overflows. Set `maxWidth` on your content.
- Screen size comes from `Dimensions.get('screen')`. On Android that includes
  system bars.
- The modal repositions on rotation.

---

## 3. One hoisted modal, never one per row

Every render of a component that contains `<SpotModal>` pushes a new element to
the root `PortalProvider` through `portal.update`, open or closed. That is a
`setState` on the provider on each render of the host. Fifty rows with a modal
each means fifty portal entries and fifty updates per list render.

❌ Wrong

```tsx
const renderItem = ({ item }) => (
  <Row item={item}>
    <SpotModal ...>{/* menu */}</SpotModal>
  </Row>
);
```

✅ Correct: rows report the press, the screen owns one modal

```tsx
function Screen() {
  const [menu, setMenu] = useState<{ x: number; y: number; item: Item | null }>(
    { x: 0, y: 0, item: null }
  );
  const [show, setShow] = useState(false);

  const openMenu = useCallback((item: Item, e: GestureResponderEvent) => {
    setMenu({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, item });
    setShow(true);
  }, []);

  return (
    <>
      <FlatList
        data={items}
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

Keep the host component's render rate low. Do not place `<SpotModal>` in a
component that re-renders on scroll, on every keystroke, or on an animation
tick.

---

## 4. Render isolation: state lives in the content component

Children are only mounted while the modal is open. Hooks inside the child
component cost nothing until then. Hooks in the wrapper run on every parent
render and, per Rule 3, every wrapper render also updates the portal.

- Wrapper: takes props, reads any screen-scoped context the content needs
  (Rule 1), renders `<SpotModal><XContent /></SpotModal>`.
- `XContent`: owns `useState`, queries, store subscriptions, derived lists.

The content unmounts `unMountDelayInMilliSeconds` after every close. Local state
inside it resets each time the modal opens. Keep anything that must survive in
the wrapper's parent or a store.

---

## 5. Backdrop, touches and timing

- The backdrop is full-screen and blocks every touch underneath while the inner
  modal is mounted, including the unmount delay after closing. A tooltip that
  lets touches through is not possible with this package.
- A backdrop tap calls `setShowModal(false)` after a 50 ms activation delay. Turn
  that off with `disableBackdropPress`. Do not build a workaround.
- `backgroundColor` colours the backdrop. It defaults to `undefined`, which is
  transparent and still blocks touches. The colour fades with the content.
- Fade-in is 300 ms. Fade-out lasts exactly `unMountDelayInMilliSeconds`
  (default 250). That prop is the close animation length. `0` removes the view
  at once with no fade.
- Touches that end inside the content do not reach the backdrop. Buttons inside
  the content must call `setShowModal(false)` themselves.
- Use React Native `Pressable` / `TouchableOpacity` or essentials `Press` inside
  the content. Long content goes in a `ScrollView` so the 85% height cap clips
  correctly.
- Setting `showModal` back to `true` during the unmount delay keeps the same
  instance mounted and fades it back in. Content state is kept in that case.

| Callback           | Fires                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `onComponentShow`  | When the inner modal mounts, after `mountDelayInMilliSeconds`. The fade-in has not started yet. |
| `onComponentClose` | When the inner modal unmounts, `unMountDelayInMilliSeconds` after `showModal` became `false`.   |

Both callbacks and both delays are read when they are needed. Inline arrow
functions that read current state are fine. No ref indirection is required.

---

## 6. Rendering modes

| Path          | Taken when                                           | What renders                                                                                                        |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Portal        | A provider is mounted and `disablePortal` is unset   | Absolute-fill `View` in the provider overlay. `disableNativeModal` has no effect here.                              |
| Native modal  | `disablePortal` is `true`, or no provider is mounted | React Native `Modal` (`transparent`, `statusBarTranslucent`) at the call site. A missing provider gives no warning. |
| In-place view | Native modal path plus `disableNativeModal`          | Absolute-fill `View` with max `zIndex` inside the parent                                                            |

- `disableNativeModal` only has an effect on the non-portal path. With it, the
  overlay is bounded by the nearest parent and sibling stacking order. Avoid it
  unless the parent fills the screen.
- Toggling `disablePortal` at runtime is safe but remounts the content and
  resets its state. Treat it as a constant.
- Inside a React Native `<Modal>` or a native modal / form-sheet screen, the
  portal overlay sits in the window underneath and the spot modal is hidden.
  Use `disablePortal` there.

---

## 7. Android back button

Hardware back closes the modal on every path. Do not add a `BackHandler`
listener for it. `disableAndroidBackButton` makes back do nothing while the
modal is open. Back never reaches the navigator while the modal is open.

---

## 8. Gesture Handler triggers

RNGH gesture callbacks run as worklets on the UI thread when Reanimated is
installed. Calling React setters from them crashes. Use `.runOnJS(true)` on the
gesture or wrap the setters with `runOnJS`.

✅ Correct

```tsx
const longPress = Gesture.LongPress()
  .runOnJS(true)
  .onStart((e) => {
    setPos({ x: e.absoluteX, y: e.absoluteY });
    setShow(true);
  });
```

❌ Wrong

```tsx
const longPress = Gesture.LongPress().onStart((e) => {
  setPos({ x: e.absoluteX, y: e.absoluteY });
  setShow(true);
});
```

---

## 9. API reference

### Exports

| Export                        | Kind                         | Notes                                                           |
| ----------------------------- | ---------------------------- | --------------------------------------------------------------- |
| `SpotModal`                   | component, named and default |                                                                 |
| `SpotModalProps`              | type                         | Full props                                                      |
| `_SpotModalProps`             | type                         | Props without the mounter options                               |
| `SpotModalPortalProvider`     | component                    | `PortalProvider` from essentials                                |
| `useSpotModalPortal`          | hook                         | `usePortal` from essentials. Returns `null` without a provider. |
| `useSpotModalPortalComponent` | hook                         | `usePortalComponent` from essentials                            |
| `PortalItem`                  | type                         |                                                                 |

### `SpotModal` props

| Prop                         | Type                          | Required | Default     | Behaviour                                                         |
| ---------------------------- | ----------------------------- | -------- | ----------- | ----------------------------------------------------------------- |
| `showModal`                  | `boolean`                     | yes      |             | Visibility                                                        |
| `setShowModal`               | `(show: boolean) => void`     | yes      |             | Only ever called with `false`. A `useState` setter fits.          |
| `pageX`                      | `number`                      | yes      |             | Root-view X. Followed while open.                                 |
| `pageY`                      | `number`                      | yes      |             | Root-view Y. Followed while open.                                 |
| `children`                   | `React.ReactNode`             | yes      |             | Mounted only while open                                           |
| `backgroundColor`            | `string`                      | no       | `undefined` | Backdrop colour. Fades with the content.                          |
| `disableBackdropPress`       | `boolean`                     | no       | `false`     | Backdrop tap does not close                                       |
| `disableAndroidBackButton`   | `boolean`                     | no       | `false`     | Back does nothing while open                                      |
| `disablePortal`              | `boolean`                     | no       | `false`     | Use the native `Modal` path                                       |
| `disableNativeModal`         | `boolean`                     | no       | `false`     | Non-portal path only                                              |
| `mountDelayInMilliSeconds`   | `number`                      | no       | `0`         | Delay before mount                                                |
| `unMountDelayInMilliSeconds` | `number`                      | no       | `250`       | Delay before unmount and length of the fade-out. `0` is honoured. |
| `onComponentShow`            | `() => void \| Promise<void>` | no       |             | Fires at mount                                                    |
| `onComponentClose`           | `() => void \| Promise<void>` | no       |             | Fires at unmount                                                  |

### `SpotModalPortalProvider` props

| Prop                  | Type                   | Default                                                                                        |
| --------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| `children`            | `ReactNode`            |                                                                                                |
| `unMountBufferTimeMS` | `number`               | `100`                                                                                          |
| `updateBufferTimeMS`  | `number`               | none                                                                                           |
| `CustomPortalContext` | `typeof PortalContext` | none. `SpotModal` always uses the default context, so a custom one hides the provider from it. |

### Fixed values with no prop

| Value                                            | Amount                                  |
| ------------------------------------------------ | --------------------------------------- |
| Fade in                                          | 300 ms (`withTiming` default)           |
| Backdrop tap activation delay                    | 50 ms                                   |
| Edge padding                                     | 5% of screen width, 5% of screen height |
| Content max height                               | 85% of screen height                    |
| Portal removal buffer after `SpotModal` unmounts | 100 ms                                  |

---

## Review checklist

- [ ] No `useRoute`, screen-scoped `useNavigation` or screen-level context inside the children, unless `disablePortal` is set.
- [ ] Coordinates come from `pageX/pageY`, `measure()` page values, or RNGH `absoluteX/absoluteY`.
- [ ] Coordinates and `showModal(true)` are set in the same handler or the same measure callback.
- [ ] Anchored menus pick the element edge by screen half.
- [ ] There is one `<SpotModal>` per screen or menu type and none inside `renderItem`.
- [ ] State and data hooks live in a `*Content` child.
- [ ] Content has its own `backgroundColor` and a `maxWidth`.
- [ ] Every action inside the content calls `setShowModal(false)` itself.
- [ ] No extra `<Modal>`, backdrop, dismiss wrapper or `BackHandler` listener around `SpotModal`.
- [ ] `unMountDelayInMilliSeconds` is absent or at most 300.
- [ ] A `SpotModal` used inside an RN `<Modal>` or native modal screen sets `disablePortal`.
- [ ] RNGH-triggered opens use `.runOnJS(true)` or `runOnJS`.
- [ ] Only one `PortalProvider` from any `@shaquillehinds` package wraps the app, under `GestureHandlerRootView`.
- [ ] Every prop used appears in the Rule 9 table. `mountDefault` is not used.
- [ ] No `key` bumping, close-wait-reopen sequences or callback refs left over from pre-0.1.0 workarounds.
