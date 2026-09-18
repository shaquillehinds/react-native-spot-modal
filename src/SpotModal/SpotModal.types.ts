import type { ComponentMounterProps } from '@shaquillehinds/react-native-essentials';

export type _SpotModalProps = {
  /** Root-view X (touch `pageX`, `measure()` pageX, RNGH `absoluteX`). Followed while open. */
  pageX: number;
  /** Root-view Y (touch `pageY`, `measure()` pageY, RNGH `absoluteY`). Followed while open. */
  pageY: number;
  children: React.ReactNode;
  showModal: boolean;
  /** Only ever called with `false`. A `useState` setter is assignable. */
  setShowModal: (show: boolean) => void;
  /** Backdrop colour. Fades in and out with the content. */
  backgroundColor?: string;
  /** Render in a React Native `Modal` at the call site instead of the portal. */
  disablePortal?: boolean;
  /**
   * Non-portal path only: render an absolute-fill `View` instead of a React
   * Native `Modal`. Has no effect on the portal path, which never uses a
   * native `Modal`.
   */
  disableNativeModal?: boolean;
  /** Stop a backdrop tap from closing the modal. @default false */
  disableBackdropPress?: boolean;
  /**
   * Android: hardware back closes the modal by default. Set this to swallow
   * the back press without closing. @default false
   */
  disableAndroidBackButton?: boolean;
};

export type SpotModalProps = _SpotModalProps &
  Omit<
    ComponentMounterProps,
    | 'showComponent'
    | 'setShowComponent'
    | 'component'
    | 'mountDefault'
    | 'keepMountedOnReopen'
  >;
