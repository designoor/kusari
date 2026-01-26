'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { useWallet } from '@/hooks/useWallet';
import { useEthosScore } from '@/hooks/useEthosScore';
import styles from './NavProfileAvatar.module.css';

export const NavProfileAvatar: React.FC = () => {
  const pathname = usePathname();
  const { address } = useWallet();
  const { data: ethosProfile } = useEthosScore(address ?? null);

  const isActive = pathname.startsWith('/settings');

  return (
    <div className={`${styles.wrapper} ${isActive ? styles.active : styles.inactive}`}>
      <Avatar src={ethosProfile?.avatarUrl} address={address} size="sm" />
    </div>
  );
};
