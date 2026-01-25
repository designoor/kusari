'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Icon, PageHeader, SectionTitle, Toggle } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/providers/ToastProvider';
import { truncateAddress } from '@/lib';
import styles from './settings.module.css';

const APP_VERSION = '0.1.0';

export default function SettingsPage() {
  const router = useRouter();
  const { address, disconnectAsync, isConnected } = useWallet();
  const toast = useToast();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const {
    hideMessagePreviews,
    setHideMessagePreviews,
    disableReadReceipts,
    setDisableReadReceipts,
  } = usePreferences();

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied');
    } catch (err) {
      console.error('Failed to copy address:', err);
      toast.error('Failed to copy address');
    }
  }, [address, toast]);

  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await disconnectAsync();
      router.push('/');
    } catch (err) {
      console.error('Failed to disconnect:', err);
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnectAsync, router]);

  return (
    <div className={styles.container}>
      <PageHeader title="Settings" size="lg" />

      <div className={styles.sections}>
        {/* Profile Section */}
        <section className={styles.section}>
          <SectionTitle>Profile</SectionTitle>
          <div className={styles.sectionContent}>
            <div className={styles.profileCard}>
              <div className={styles.profileInfo}>
                <Avatar address={address ?? ''} size="lg" />
                <div className={styles.profileDetails}>
                  <span className={styles.profileLabel}>Connected Wallet</span>
                  <span className={styles.profileAddress}>
                    {address ? truncateAddress(address, 6, 4) : 'Not connected'}
                  </span>
                </div>
              </div>
              {isConnected && (
                <div className={styles.profileActions}>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleCopyAddress}
                    aria-label="Copy wallet address"
                  >
                    <Icon name="copy" size="sm" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleDisconnect}
                    loading={isDisconnecting}
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className={styles.section}>
          <SectionTitle>Privacy</SectionTitle>
          <div className={styles.sectionContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Hide message previews</span>
                <span className={styles.settingDescription}>
                  Show &quot;Message hidden&quot; instead of message content in the chat list
                </span>
              </div>
              <Toggle
                checked={hideMessagePreviews}
                onChange={setHideMessagePreviews}
                aria-label="Hide message previews"
              />
            </div>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Disable read receipts</span>
                <span className={styles.settingDescription}>
                  Don&apos;t let others know when you&apos;ve read their messages
                </span>
              </div>
              <Toggle
                checked={disableReadReceipts}
                onChange={setDisableReadReceipts}
                aria-label="Disable read receipts"
              />
            </div>
          </div>
        </section>

        {/* Messaging Section */}
        <section className={styles.section}>
          <SectionTitle>Messaging</SectionTitle>
          <div className={styles.sectionContent}>
            <div className={styles.comingSoon}>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
              <p className={styles.comingSoonText}>
                Payment requirements for new contacts and other messaging settings will be available in a future update.
              </p>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className={styles.section}>
          <SectionTitle>Tech Stack</SectionTitle>
          <div className={styles.sectionContent}>
            <div className={styles.aboutCard}>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Kusari version</span>
                <span className={styles.aboutValue}>{APP_VERSION}</span>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Messaging protocol</span>
                <a
                  href="https://xmtp.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.aboutLink}
                >
                  XMTP
                </a>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Reputation system</span>
                <a
                  href="https://ethos.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.aboutLink}
                >
                  Ethos
                </a>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Wallet connect</span>
                <a
                  href="https://reown.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.aboutLink}
                >
                  Reown AppKit
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
