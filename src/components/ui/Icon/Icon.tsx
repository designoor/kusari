import React from 'react';
import {
  ChatIcon,
  ContactsIcon,
  SettingsIcon,
  SendIcon,
  SearchIcon,
  ChevronLeftIcon,
  CheckIcon,
  XIcon,
  LoaderIcon,
  MessageIcon,
  ShieldIcon,
  VerifiedIcon,
  WalletIcon,
  AlertTriangleIcon,
  InfoIcon,
  RefreshIcon,
  PlusIcon,
} from './icons';
import styles from './Icon.module.css';

export type IconName =
  | 'chat'
  | 'contacts'
  | 'settings'
  | 'send'
  | 'search'
  | 'chevron-left'
  | 'check'
  | 'x'
  | 'loader'
  | 'message'
  | 'shield'
  | 'verified'
  | 'wallet'
  | 'alertTriangle'
  | 'info'
  | 'refresh'
  | 'plus';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

const SIZE_MAP: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const ICON_MAP = {
  chat: ChatIcon,
  contacts: ContactsIcon,
  settings: SettingsIcon,
  send: SendIcon,
  search: SearchIcon,
  'chevron-left': ChevronLeftIcon,
  check: CheckIcon,
  x: XIcon,
  loader: LoaderIcon,
  message: MessageIcon,
  shield: ShieldIcon,
  verified: VerifiedIcon,
  wallet: WalletIcon,
  alertTriangle: AlertTriangleIcon,
  info: InfoIcon,
  refresh: RefreshIcon,
  plus: PlusIcon,
} as const;

export const Icon: React.FC<IconProps> = React.memo(({
  name,
  size = 'md',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => {
  const IconComponent = ICON_MAP[name];
  const iconSize = SIZE_MAP[size];

  // If no aria-label is provided and not explicitly hidden, the icon is decorative
  const shouldBeHidden = ariaHidden ?? !ariaLabel;

  return (
    <IconComponent
      size={iconSize}
      className={`${styles.icon} ${name === 'loader' ? styles.loader : ''} ${className ?? ''}`}
      aria-hidden={shouldBeHidden}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    />
  );
});

Icon.displayName = 'Icon';
