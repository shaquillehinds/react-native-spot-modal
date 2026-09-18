import { useDeviceOrientation } from '@shaquillehinds/react-native-essentials';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { BackHandler, type LayoutChangeEvent } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { _SpotModalProps } from './SpotModal.types';

type ControllerProps = _SpotModalProps & { fadeOutDuration: number };

export function SpotModalController(props: ControllerProps) {
  const {
    screenWidth,
    screenHeight,
    relativeX,
    relativeY,
    relativeYWorklet,
    orientation,
  } = useDeviceOrientation();
  const opacity = useSharedValue(0);
  const top2 = useSharedValue(0);
  const left2 = useSharedValue(0);
  const screenModalPaddingX = relativeX(5);
  const screenModalPaddingY = relativeY(5);

  // Orientation the current props.pageX / props.pageY were supplied in. The
  // rotation rescale below is only valid relative to that orientation.
  const coordsOrientation = useRef(orientation);
  const prevCoords = useRef({ x: props.pageX, y: props.pageY });
  if (
    prevCoords.current.x !== props.pageX ||
    prevCoords.current.y !== props.pageY
  ) {
    prevCoords.current = { x: props.pageX, y: props.pageY };
    coordsOrientation.current = orientation;
  }
  const lastLayout = useRef<{ width: number; height: number } | null>(null);
  const showModalRef = useRef(props.showModal);
  showModalRef.current = props.showModal;

  const { pageY, pageX } = useMemo(() => {
    if (orientation === coordsOrientation.current)
      return { pageX: props.pageX, pageY: props.pageY };
    return {
      pageX: (props.pageX / screenHeight) * screenWidth,
      pageY: (props.pageY / screenWidth) * screenHeight,
    };
  }, [orientation, props.pageX, props.pageY, screenWidth, screenHeight]);

  const setModalPosition = useCallback(
    ({ width, height }: { width: number; height: number }) => {
      if (!width || !height) return;
      width += screenModalPaddingX;
      height += screenModalPaddingY;
      const distanceToTop = pageY;
      const distanceToBottom = screenHeight - distanceToTop;
      const distanceToLeft = pageX;
      const distanceToRight = screenWidth - distanceToLeft;
      let top = pageY;
      if (pageY >= screenHeight / 2) {
        top = pageY + screenModalPaddingY - height;
        if (height >= distanceToTop) top = top + (height - distanceToTop);
      } else {
        if (height >= distanceToBottom)
          top = pageY - (height - distanceToBottom);
      }
      let left = pageX;
      if (pageX >= screenWidth / 2) {
        // Flush with the point, mirroring the vertical maths.
        left = pageX + screenModalPaddingX - width;
        if (width >= distanceToLeft) left = left + (width - distanceToLeft);
      } else {
        if (width >= distanceToRight) left = pageX - (width - distanceToRight);
      }

      top2.value = top;
      left2.value = left;
      if (showModalRef.current) opacity.value = withTiming(1);
    },
    [
      pageX,
      pageY,
      screenWidth,
      screenHeight,
      screenModalPaddingX,
      screenModalPaddingY,
    ]
  );

  const onContentLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      lastLayout.current = { width, height };
      setModalPosition({ width, height });
    },
    [setModalPosition]
  );

  // Reposition when the point or the screen changes without a layout change
  // (new pageX / pageY while open, rotation with same-size content).
  useEffect(() => {
    if (lastLayout.current) setModalPosition(lastLayout.current);
  }, [setModalPosition]);

  const closeModal = useCallback(() => {
    props.setShowModal(false);
  }, [props.setShowModal]);

  const onModalBackdropPress = () => {
    if (!props.disableBackdropPress) closeModal();
  };

  // Fade out for exactly the unmount delay. Fade back in if showModal returns
  // to true while still mounted (ComponentMounter keepMountedOnReopen).
  useEffect(() => {
    if (!props.showModal) {
      opacity.value = withTiming(0, { duration: props.fadeOutDuration });
    } else if (lastLayout.current) {
      opacity.value = withTiming(1);
    }
  }, [props.showModal]);

  // Android back for the View-based paths. The native Modal path gets
  // onRequestClose from ModalWrapper instead.
  useEffect(() => {
    if (!props.disableNativeModal || !props.showModal) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!props.disableAndroidBackButton) closeModal();
      return true;
    });
    return () => sub.remove();
  }, [
    props.disableNativeModal,
    props.showModal,
    props.disableAndroidBackButton,
    closeModal,
  ]);

  const modalAnimatedStyles = useAnimatedStyle(
    () => ({
      position: 'absolute',
      top: top2.value,
      left: left2.value,
      opacity: opacity.value,
      maxHeight: relativeYWorklet(85),
    }),
    [orientation]
  );

  const backdropAnimatedStyles = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return {
    onContentLayout,
    onModalBackdropPress,
    closeModal,
    modalAnimatedStyles,
    backdropAnimatedStyles,
  };
}
