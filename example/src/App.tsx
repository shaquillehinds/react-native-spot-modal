import { useState } from 'react';
import {
  Button,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import {
  SpotModal,
  SpotModalPortalProvider,
} from '@shaquillehinds/react-native-spot-modal';

export default function App() {
  return (
    <SpotModalPortalProvider>
      <Demo />
    </SpotModalPortalProvider>
  );
}

function Demo() {
  const [showModal, setShowModal] = useState(false);
  const [coords, setCoords] = useState({ pageX: 0, pageY: 0 });
  const [disablePortal, setDisablePortal] = useState(false);
  const [disableBackdropPress, setDisableBackdropPress] = useState(false);
  const [disableAndroidBackButton, setDisableAndroidBackButton] =
    useState(false);
  const [unMountDelay, setUnMountDelay] = useState(250);
  const [counter, setCounter] = useState(0);

  const open = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    setCoords({ pageX, pageY });
    setShowModal(true);
  };

  return (
    <Pressable style={styles.screen} onPress={open}>
      <Text style={styles.hint}>Tap anywhere to open at that point</Text>
      <View style={styles.controls}>
        <Button
          title={`disablePortal: ${disablePortal}`}
          onPress={() => setDisablePortal((v) => !v)}
        />
        <Button
          title={`disableBackdropPress: ${disableBackdropPress}`}
          onPress={() => setDisableBackdropPress((v) => !v)}
        />
        <Button
          title={`disableAndroidBackButton: ${disableAndroidBackButton}`}
          onPress={() => setDisableAndroidBackButton((v) => !v)}
        />
        <Button
          title={`unMountDelay: ${unMountDelay}`}
          onPress={() =>
            setUnMountDelay((v) => (v === 250 ? 1000 : v === 1000 ? 0 : 250))
          }
        />
        <Button
          title="Open, then set coords after 100 ms"
          onPress={() => {
            setShowModal(true);
            setTimeout(() => setCoords({ pageX: 300, pageY: 500 }), 100);
          }}
        />
      </View>
      <SpotModal
        pageX={coords.pageX}
        pageY={coords.pageY}
        showModal={showModal}
        setShowModal={setShowModal}
        backgroundColor="rgba(0,0,0,0.4)"
        disablePortal={disablePortal}
        disableBackdropPress={disableBackdropPress}
        disableAndroidBackButton={disableAndroidBackButton}
        unMountDelayInMilliSeconds={unMountDelay}
        onComponentClose={() => console.log('closed, counter =', counter)}
      >
        <View style={styles.content}>
          <Text>Counter: {counter}</Text>
          <Button title="Increment" onPress={() => setCounter((c) => c + 1)} />
          <Button
            title="Move to (100, 200)"
            onPress={() => setCoords({ pageX: 100, pageY: 200 })}
          />
          <Button
            title="Close and reopen after 100 ms"
            onPress={() => {
              setShowModal(false);
              setTimeout(() => setShowModal(true), 100);
            }}
          />
        </View>
      </SpotModal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { marginBottom: 16 },
  controls: { gap: 4 },
  content: {
    width: 220,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    gap: 4,
  },
});
