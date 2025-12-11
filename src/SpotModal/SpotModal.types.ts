import type { ComponentMounterProps } from '@shaquillehinds/react-native-essentials';

export type _SpotModalProps = {
  pageX: number;
  pageY: number;
  children: React.ReactNode;
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  backgroundColor?: string;
  disablePortal?: boolean;
  disableNativeModal?: boolean;
};
export type SpotModalProps = _SpotModalProps &
  Omit<
    ComponentMounterProps,
    'showComponent' | 'setShowComponent' | 'component'
  >;
