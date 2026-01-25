'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Icon, PageHeader, Section, Toggle } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/providers/ToastProvider';
import { truncateAddress } from '@/lib';
import {
  isBrowserNotificationSupported,
  getNotificationPermissionState,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '@/lib/notifications';
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
    notificationsEnabled,
    setNotificationsEnabled,
    notifyForRequests,
    setNotifyForRequests,
  } = usePreferences();

  // Notification permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const notificationsSupported = isBrowserNotificationSupported();

  // Load initial notification permission state
  useEffect(() => {
    if (notificationsSupported) {
      setNotificationPermission(getNotificationPermissionState());
    } else {
      setNotificationPermission('unsupported');
    }
  }, [notificationsSupported]);

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

  const handleToggleNotifications = useCallback(async (enabled: boolean) => {
    if (enabled) {
      // If enabling and permission not yet granted, request it
      if (notificationPermission === 'default') {
        setIsRequestingPermission(true);
        try {
          const result = await requestNotificationPermission();
          setNotificationPermission(result);
          if (result === 'granted') {
            setNotificationsEnabled(true);
            toast.success('Notifications enabled');
          } else if (result === 'denied') {
            toast.error('Notifications blocked by browser');
          }
        } finally {
          setIsRequestingPermission(false);
        }
      } else if (notificationPermission === 'granted') {
        setNotificationsEnabled(true);
      }
    } else {
      setNotificationsEnabled(false);
    }
  }, [notificationPermission, setNotificationsEnabled, toast]);

  return (
    <div className={styles.container}>
      <PageHeader title="Settings" size="lg" />

      <div className={styles.sections}>
        {/* Profile Section */}
        <Section title="Profile">
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
        </Section>

        {/* Privacy Section */}
        <Section title="Privacy">
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
        </Section>

        {/* Notifications Section */}
        {notificationsSupported && (
          <Section title="Notifications">
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Enable notifications</span>
                <span className={styles.settingDescription}>
                  Receive browser notifications for new messages
                </span>
              </div>
              <Toggle
                checked={notificationsEnabled && notificationPermission === 'granted'}
                onChange={(checked) => void handleToggleNotifications(checked)}
                disabled={notificationPermission === 'denied' || isRequestingPermission}
                aria-label="Enable notifications"
              />
            </div>
            {notificationsEnabled && notificationPermission === 'granted' && (
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <span className={styles.settingLabel}>Include message requests</span>
                  <span className={styles.settingDescription}>
                    Also notify for messages from new contacts
                  </span>
                </div>
                <Toggle
                  checked={notifyForRequests}
                  onChange={setNotifyForRequests}
                  aria-label="Include message requests in notifications"
                />
              </div>
            )}
            {notificationPermission === 'denied' && (
              <p className={styles.settingWarning}>
                Notifications are blocked by your browser. Enable them in your browser settings to receive message alerts.
              </p>
            )}
          </Section>
        )}

        {/* Messaging Section */}
        <Section title="Messaging">
          <div className={styles.comingSoon}>
            <span className={styles.comingSoonBadge}>Coming Soon</span>
            <p className={styles.comingSoonText}>
              Payment requirements for new contacts and other messaging settings will be available in a future update.
            </p>
          </div>
        </Section>

        {/* Tech Stack Section */}
        <Section title="Tech Stack">
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
        </Section>
      </div>
    </div>
  );
}
