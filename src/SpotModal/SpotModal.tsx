import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  Press,
  usePortalComponent,
  ComponentMounter,
  ModalWrapper,
  ModalForegroundWrapper,
} from '@shaquillehinds/react-native-essentials';
import { SpotModalController } from './SpotModal.controller';
import type { SpotModalProps, _SpotModalProps } from './SpotModal.types';

const DEFAULT_UNMOUNT_DELAY = 250;

export function SpotModal({
  unMountDelayInMilliSeconds,
  onComponentClose,
  onComponentShow,
  mountDelayInMilliSeconds,
  ...props
}: SpotModalProps) {
  const unMountDelay = unMountDelayInMilliSeconds ?? DEFAULT_UNMOUNT_DELAY;

  const mounter = (modal: React.JSX.Element) => (
    <ComponentMounter
      keepMountedOnReopen
      showComponent={props.showModal}
      setShowComponent={props.setShowModal}
      unMountDelayInMilliSeconds={unMountDelay}
      onComponentClose={onComponentClose}
      onComponentShow={onComponentShow}
      mountDelayInMilliSeconds={mountDelayInMilliSeconds}
      component={modal}
    />
  );

  const portal = usePortalComponent({
    // The portal overlay is already above the app, so this path never uses a
    // native Modal regardless of the disableNativeModal prop.
    Component: mounter(
      <Modal {...props} disableNativeModal fadeOutDuration={unMountDelay} />
    ),
    name: 'spot-modal',
    disable: props.disablePortal,
  });

  if (portal && !props.disablePortal) return <></>;
  return mounter(<Modal {...props} fadeOutDuration={unMountDelay} />);
}

function Modal(props: _SpotModalProps & { fadeOutDuration: number }) {
  const controller = SpotModalController(props);
  return (
    <ModalWrapper
      useNativeModal={!props.disableNativeModal}
      disableAndroidBackButton={props.disableAndroidBackButton}
      onRequestClose={controller.closeModal}
    >
      <Press
        stopPropagation
        disableAnimation
        style={StyleSheet.absoluteFill}
        onPress={controller.onModalBackdropPress}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: props.backgroundColor },
            controller.backdropAnimatedStyles,
          ]}
        />
        <ModalForegroundWrapper>
          <Animated.View
            onLayout={controller.onContentLayout}
            style={controller.modalAnimatedStyles}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {props.children}
          </Animated.View>
        </ModalForegroundWrapper>
      </Press>
    </ModalWrapper>
  );
}
