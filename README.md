# @shaquillehinds/react-native-spot-modal

A simple, intelligent location-based modal for React Native that positions itself relative to a tap/press location on the screen. Perfect for context menus, dropdowns, tooltips, and any UI element that needs to appear near where the user interacted.

[![npm version](https://img.shields.io/npm/v/@shaquillehinds/react-native-spot-modal.svg)](https://www.npmjs.com/package/@shaquillehinds/react-native-spot-modal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<img src="https://raw.githubusercontent.com/shaquillehinds/react-native-spot-modal/master/assets/spotmodal.gif" alt="example" height="500"/>

## Features

- **🎯 Smart Positioning** - Automatically positions modal near tap location while staying within screen bounds
- **📱 Orientation Aware** - Handles device rotation and recalculates position accordingly
- **🎨 Fully Customizable** - Control appearance, animations, and behavior
- **⚡ Smooth Animations** - Built with react-native-reanimated for 60fps animations
- **🔌 Portal Support** - Render modals at the root level to avoid z-index issues
- **🪶 Lightweight** - Minimal dependencies, maximum performance
- **📦 TypeScript Support** - Fully typed for excellent IntelliSense

## Installation

```bash
npm install @shaquillehinds/react-native-spot-modal
# or
yarn add @shaquillehinds/react-native-spot-modal
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react-native-reanimated react-native-gesture-handler
# or
yarn add react-native-reanimated react-native-gesture-handler
```

**Note:** Make sure to complete the [react-native-reanimated installation](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/) steps for your platform.

### Additional Dependency

This package depends on:

- `@shaquillehinds/react-native-essentials` - Provides core utilities for modals, portals, and component mounting

## Portal Provider Setup

**IMPORTANT:** To use `SpotModal` with the portal system (enabled by default), you must wrap your app with `SpotModalPortalProvider` at the root level. This ensures modals render at the top layer of your app, avoiding z-index conflicts.

### Basic Setup

Wrap your root component with `SpotModalPortalProvider` in your entry file (typically `App.tsx`, `App.js`, or `_layout.tsx` for Expo Router):

```tsx
import React from 'react';
import { SpotModalPortalProvider } from '@shaquillehinds/react-native-spot-modal';
// or
// import { PortalProvider as SpotModalPortalProvider } from '@shaquillehinds/react-native-essentials';

export default function App() {
  return (
    <SpotModalPortalProvider>
      {/* Your app content goes here */}
      <YourAppContent />
    </SpotModalPortalProvider>
  );
}
```

### Setup with React Navigation

If you're using React Navigation, place the `SpotModalPortalProvider` inside your `NavigationContainer`:

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SpotModalPortalProvider } from '@shaquillehinds/react-native-spot-modal';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <SpotModalPortalProvider>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          {/* Other screens */}
        </Stack.Navigator>
      </SpotModalPortalProvider>
    </NavigationContainer>
  );
}
```

### Setup with Gesture Handler

**Important:** When using `react-native-gesture-handler`, place `SpotModalPortalProvider` **under** `GestureHandlerRootView` to avoid app freezing issues:

```tsx
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SpotModalPortalProvider } from '@shaquillehinds/react-native-spot-modal';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SpotModalPortalProvider>
        <YourAppContent />
      </SpotModalPortalProvider>
    </GestureHandlerRootView>
  );
}
```

### Complete Setup Example (with Multiple Providers)

Here's a full example showing proper provider nesting order:

```tsx
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { SpotModalPortalProvider } from '@shaquillehinds/react-native-spot-modal';

const queryClient = new QueryClient();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <SpotModalPortalProvider>
            {/* Your app screens and navigation */}
            <YourAppContent />
          </SpotModalPortalProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

### Disabling Portal (Optional)

If you don't want to use the portal system, you can disable it per modal using the `disablePortal` prop. This will render the modal in-place within your component tree:

```tsx
<SpotModal
  showModal={showModal}
  setShowModal={setShowModal}
  pageX={position.x}
  pageY={position.y}
  disablePortal={true} // Renders without portal
>
  <View>
    <Text>In-place modal</Text>
  </View>
</SpotModal>
```

**Note:** When using `disablePortal={true}`, you don't need `SpotModalPortalProvider`, but you may encounter z-index issues depending on your component hierarchy.

## Quick Start

**Prerequisites:** Make sure you've set up the `SpotModalPortalProvider` as described in the [Portal Provider Setup](#portal-provider-setup) section above.

Here's a simple example to get you started:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SpotModal } from '@shaquillehinds/react-native-spot-modal';

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handlePress = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    setPosition({ x: pageX, y: pageY });
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} style={styles.button}>
        <Text>Tap anywhere on this button</Text>
      </TouchableOpacity>

      <SpotModal
        showModal={showModal}
        setShowModal={setShowModal}
        pageX={position.x}
        pageY={position.y}
        backgroundColor="rgba(0, 0, 0, 0.5)"
      >
        <View style={styles.modalContent}>
          <Text>Modal Content</Text>
          <Text>Positioned at tap location!</Text>
        </View>
      </SpotModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
```

## Exports

This package exports the following components and utilities:

### Main Component

- **`SpotModal`** - The primary modal component (default export)
- **`SpotModalProps`** - TypeScript type for modal props

### Portal System Utilities

The package also re-exports portal utilities from `@shaquillehinds/react-native-essentials` for convenience:

- **`SpotModalPortalProvider`** - Wrap your app with this component to enable portal rendering
- **`useSpotModalPortalComponent`** - Hook to programmatically add components to portal
- **`useSpotModalPortal`** - Hook to access portal context
- **`PortalItem`** - TypeScript type for portal items

```typescript
// You can import portal utilities directly from this package
import {
  SpotModal,
  SpotModalPortalProvider,
  useSpotModalPortalComponent,
  useSpotModalPortal,
} from '@shaquillehinds/react-native-spot-modal';

// Or use the original names from react-native-essentials
import {
  PortalProvider,
  usePortalComponent,
  usePortal,
} from '@shaquillehinds/react-native-essentials';
```

## API Reference

### SpotModal Props

| Prop                         | Type                                            | Required | Default     | Description                                               |
| ---------------------------- | ----------------------------------------------- | -------- | ----------- | --------------------------------------------------------- |
| `showModal`                  | `boolean`                                       | ✅       | -           | Controls modal visibility                                 |
| `setShowModal`               | `React.Dispatch<React.SetStateAction<boolean>>` | ✅       | -           | Function to update modal visibility                       |
| `pageX`                      | `number`                                        | ✅       | -           | X coordinate where modal should appear (from touch event) |
| `pageY`                      | `number`                                        | ✅       | -           | Y coordinate where modal should appear (from touch event) |
| `children`                   | `React.ReactNode`                               | ✅       | -           | Content to display inside the modal                       |
| `backgroundColor`            | `string`                                        | ❌       | `undefined` | Background color for modal backdrop                       |
| `disablePortal`              | `boolean`                                       | ❌       | `false`     | Disable portal rendering (renders in-place instead)       |
| `disableNativeModal`         | `boolean`                                       | ❌       | `false`     | Disable React Native's Modal component                    |
| `unMountDelayInMilliSeconds` | `number`                                        | ❌       | `250`       | Delay before unmounting after closing                     |
| `mountDelayInMilliSeconds`   | `number`                                        | ❌       | `0`         | Delay before mounting when opening                        |
| `mountDefault`               | `boolean`                                       | ❌       | `false`     | Whether to mount component by default                     |
| `onComponentClose`           | `() => void`                                    | ❌       | -           | Callback fired when modal finishes closing                |
| `onComponentShow`            | `() => void`                                    | ❌       | -           | Callback fired when modal finishes opening                |

## Usage Examples

### Context Menu

Create a context menu that appears where the user long-presses:

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SpotModal } from '@shaquillehinds/react-native-spot-modal';

function ContextMenu() {
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleLongPress = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    setPosition({ x: pageX, y: pageY });
    setShowMenu(true);
  };

  const handleMenuAction = (action: string) => {
    console.log(`Action: ${action}`);
    setShowMenu(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onLongPress={handleLongPress} style={styles.content}>
        <Text>Long press me for options</Text>
      </TouchableOpacity>

      <SpotModal
        showModal={showMenu}
        setShowModal={setShowMenu}
        pageX={position.x}
        pageY={position.y}
        backgroundColor="rgba(0, 0, 0, 0.4)"
      >
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuAction('copy')}
          >
            <Text style={styles.menuText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuAction('paste')}
          >
            <Text style={styles.menuText}>Paste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuAction('delete')}
          >
            <Text style={[styles.menuText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </SpotModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
  },
  deleteText: {
    color: '#ff3b30',
  },
});
```

### Dropdown Selector

Use as a dropdown that appears below a button:

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SpotModal } from '@shaquillehinds/react-native-spot-modal';

function DropdownSelector() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState('Option 1');

  const options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

  const handleButtonPress = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    // Offset Y to appear below button
    setPosition({ x: pageX, y: pageY + 20 });
    setShowDropdown(true);
  };

  const handleSelect = (option: string) => {
    setSelected(option);
    setShowDropdown(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleButtonPress}
        style={styles.dropdownButton}
      >
        <Text style={styles.buttonText}>{selected}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <SpotModal
        showModal={showDropdown}
        setShowModal={setShowDropdown}
        pageX={position.x}
        pageY={position.y}
        backgroundColor="transparent"
      >
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.dropdownItem,
                selected === option && styles.selectedItem,
              ]}
              onPress={() => handleSelect(option)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  selected === option && styles.selectedText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SpotModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 150,
    justifyContent: 'space-between',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  arrow: {
    color: 'white',
    marginLeft: 8,
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
```

### Tooltip

Create a tooltip that appears near an information icon:

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SpotModal } from '@shaquillehinds/react-native-spot-modal';

function TooltipExample() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleInfoPress = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    setPosition({ x: pageX, y: pageY });
    setShowTooltip(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Your Score</Text>
        <TouchableOpacity onPress={handleInfoPress} style={styles.infoIcon}>
          <Text style={styles.infoText}>ⓘ</Text>
        </TouchableOpacity>
      </View>

      <SpotModal
        showModal={showTooltip}
        setShowModal={setShowTooltip}
        pageX={position.x}
        pageY={position.y}
        backgroundColor="transparent"
        unMountDelayInMilliSeconds={200}
      >
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            Your score is calculated based on accuracy, speed, and consistency
            across all completed exercises.
          </Text>
        </View>
      </SpotModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    marginRight: 8,
  },
  infoIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 20,
    color: '#007AFF',
  },
  tooltip: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    maxWidth: 250,
  },
  tooltipText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
});
```

### With Custom Animation Timing

Control the mount and unmount timing for custom animations:

```tsx
<SpotModal
  showModal={showModal}
  setShowModal={setShowModal}
  pageX={position.x}
  pageY={position.y}
  unMountDelayInMilliSeconds={500} // Longer fade out
  mountDelayInMilliSeconds={100} // Slight delay on open
  onComponentShow={() => console.log('Modal opened')}
  onComponentClose={() => console.log('Modal closed')}
>
  <View style={styles.content}>
    <Text>Custom timing!</Text>
  </View>
</SpotModal>
```

### Without Portal (In-Place Rendering)

If you need the modal to render in the component tree rather than at root level:

```tsx
<SpotModal
  showModal={showModal}
  setShowModal={setShowModal}
  pageX={position.x}
  pageY={position.y}
  disablePortal={true} // Renders in-place instead of portal
>
  <View style={styles.content}>
    <Text>In-place modal</Text>
  </View>
</SpotModal>
```

## How It Works

### Intelligent Positioning

The `SpotModal` uses smart positioning logic to ensure your modal stays within screen bounds:

1. **Initial Position**: Modal attempts to render at the tap coordinates
2. **Boundary Detection**: Checks distance to screen edges
3. **Auto-Adjustment**:
   - If tapping in the **top half**, modal appears below the point
   - If tapping in the **bottom half**, modal appears above the point
   - If tapping on the **left side**, modal appears to the right
   - If tapping on the **right side**, modal appears to the left
4. **Overflow Protection**: Automatically adjusts if content would overflow screen

### Orientation Handling

The component automatically handles device rotation by:

- Detecting orientation changes
- Recalculating positions based on new dimensions
- Maintaining modal visibility during rotation

### Portal System

By default, modals render through a portal system (provided by `@shaquillehinds/react-native-essentials`), which:

- Renders modals at the root level of your app
- Avoids z-index conflicts with other components
- Ensures modals always appear on top
- Can be disabled with `disablePortal={true}` if needed

## Advanced Usage

### Multiple Modals

You can have multiple spot modals, each with their own state:

```tsx
function MultiModalExample() {
  const [modal1, setModal1] = useState({ show: false, x: 0, y: 0 });
  const [modal2, setModal2] = useState({ show: false, x: 0, y: 0 });

  const handlePress1 = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    setModal1({ show: true, x: pageX, y: pageY });
  };

  const handlePress2 = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    setModal2({ show: true, x: pageX, y: pageY });
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress1}>
        <Text>Open Modal 1</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handlePress2}>
        <Text>Open Modal 2</Text>
      </TouchableOpacity>

      <SpotModal
        showModal={modal1.show}
        setShowModal={(show) => setModal1((prev) => ({ ...prev, show }))}
        pageX={modal1.x}
        pageY={modal1.y}
      >
        <View>
          <Text>Modal 1</Text>
        </View>
      </SpotModal>

      <SpotModal
        showModal={modal2.show}
        setShowModal={(show) => setModal2((prev) => ({ ...prev, show }))}
        pageX={modal2.x}
        pageY={modal2.y}
      >
        <View>
          <Text>Modal 2</Text>
        </View>
      </SpotModal>
    </>
  );
}
```

### Custom Hook Pattern

Create a reusable hook for spot modal state management:

```tsx
import { useState, useCallback } from 'react';

function useSpotModal() {
  const [showModal, setShowModal] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const openModal = useCallback((event) => {
    const { pageX, pageY } = event.nativeEvent;
    setPosition({ x: pageX, y: pageY });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return {
    showModal,
    setShowModal,
    position,
    openModal,
    closeModal,
  };
}

// Usage
function MyComponent() {
  const menu = useSpotModal();

  return (
    <>
      <TouchableOpacity onPress={menu.openModal}>
        <Text>Open Menu</Text>
      </TouchableOpacity>

      <SpotModal
        showModal={menu.showModal}
        setShowModal={menu.setShowModal}
        pageX={menu.position.x}
        pageY={menu.position.y}
      >
        <View>
          <Text>Menu Content</Text>
        </View>
      </SpotModal>
    </>
  );
}
```

### Integration with Gesture Handler

For more complex gesture interactions:

```tsx
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

function GestureExample() {
  const [showModal, setShowModal] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const longPress = Gesture.LongPress().onStart((event) => {
    setPosition({ x: event.absoluteX, y: event.absoluteY });
    setShowModal(true);
  });

  return (
    <>
      <GestureDetector gesture={longPress}>
        <View style={styles.container}>
          <Text>Long press anywhere</Text>
        </View>
      </GestureDetector>

      <SpotModal
        showModal={showModal}
        setShowModal={setShowModal}
        pageX={position.x}
        pageY={position.y}
      >
        <View>
          <Text>Gesture-triggered modal</Text>
        </View>
      </SpotModal>
    </>
  );
}
```

## TypeScript

The package is fully typed. Here are the main type definitions:

```typescript
type _SpotModalProps = {
  pageX: number;
  pageY: number;
  children: React.ReactNode;
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  backgroundColor?: string;
  disablePortal?: boolean;
  disableNativeModal?: boolean;
};

type SpotModalProps = _SpotModalProps & {
  unMountDelayInMilliSeconds?: number;
  mountDelayInMilliSeconds?: number;
  mountDefault?: boolean;
  onComponentClose?: () => void;
  onComponentShow?: () => void;
};
```

## Performance Tips

1. **Memoize Modal Content**: Use `React.memo()` for modal content that doesn't change frequently
2. **Optimize Renders**: Keep modal state separate from parent component state when possible
3. **Lazy Loading**: Consider lazy loading modal content if it's complex
4. **Animation Timing**: Use appropriate `unMountDelayInMilliSeconds` values (250-500ms is typically sufficient)

```tsx
// Example of optimized modal content
const ModalContent = React.memo(({ items }) => (
  <View>
    {items.map((item) => (
      <Text key={item.id}>{item.name}</Text>
    ))}
  </View>
));

// Usage
<SpotModal {...modalProps}>
  <ModalContent items={data} />
</SpotModal>;
```

## Troubleshooting

### Modal Not Appearing

1. **Check Reanimated Setup**: Ensure `react-native-reanimated` is properly installed with babel plugin
2. **Verify Coordinates**: Make sure `pageX` and `pageY` are valid numbers from the touch event
3. **Portal System**: Try setting `disablePortal={true}` to test if it's a portal-related issue

### Position Issues

1. **Touch Event**: Use `event.nativeEvent.pageX/pageY` not `locationX/locationY`
2. **Screen Coordinates**: Ensure you're using absolute screen coordinates, not relative ones
3. **Orientation**: The component handles rotation, but make sure initial coordinates are correct

### Animation Issues

1. **Babel Plugin**: Add reanimated babel plugin to `babel.config.js`:

```javascript
module.exports = {
  plugins: ['react-native-reanimated/plugin'],
};
```

2. **Clear Cache**: Try `npx react-native start --reset-cache`

## Related Packages

This package is part of the `@shaquillehinds` React Native ecosystem:

- [`@shaquillehinds/react-native-essentials`](https://www.npmjs.com/package/@shaquillehinds/react-native-essentials) - Core utilities and components

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

MIT © [Shaquille Hinds](https://github.com/shaquillehinds)

## Support

- 🐛 [Report Bug](https://github.com/shaquillehinds/react-native-spot-modal/issues)
- 💡 [Request Feature](https://github.com/shaquillehinds/react-native-spot-modal/issues)
- 📧 Email: shaqdulove@gmail.com

---

Made with ❤️ by [Shaquille Hinds](https://github.com/shaquillehinds)
