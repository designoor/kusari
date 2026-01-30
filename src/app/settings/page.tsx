'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletClient } from 'wagmi';
import { Avatar, Button, Icon, Modal, PageHeader, Section, Skeleton, Toggle } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { usePreferences } from '@/hooks/usePreferences';
import { useEthosScore } from '@/hooks/useEthosScore';
import { useInstallations } from '@/hooks/useInstallations';
import { useToast } from '@/providers/ToastProvider';
import { createXmtpSigner } from '@/services/xmtp';
import { truncateAddress } from '@/lib';
import {
  isBrowserNotificationSupported,
  getNotificationPermissionState,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '@/lib/notifications';
import styles from './settings.module.css';

/** Truncate installation ID for display */
function truncateInstallationId(id: string, prefixLength = 8, suffixLength = 4): string {
  if (id.length <= prefixLength + suffixLength + 3) {
    return id;
  }
  return `${id.slice(0, prefixLength)}...${id.slice(-suffixLength)}`;
}

const APP_VERSION = '0.1.0';

export default function SettingsPage() {
  const router = useRouter();
  const { address, disconnectAsync, isConnected } = useWallet();
  const { data: walletClient } = useWalletClient();
  const { data: ethosProfile } = useEthosScore(address ?? null);
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

  // Active Sessions (XMTP Installations)
  const {
    installations,
    currentInstallationId,
    isLoading: installationsLoading,
    isRevoking,
    revokeInstallation,
    revokeAllOther,
    maxInstallations,
  } = useInstallations();

  // Confirmation dialog state
  const [revokeConfirmation, setRevokeConfirmation] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    installationId?: string;
    error?: string;
  }>({ isOpen: false, type: 'single' });

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

  // Open confirmation dialog for revoking a single session
  const handleRevokeClick = useCallback((installationId: string) => {
    setRevokeConfirmation({ isOpen: true, type: 'single', installationId });
  }, []);

  // Open confirmation dialog for revoking all other sessions
  const handleRevokeAllClick = useCallback(() => {
    setRevokeConfirmation({ isOpen: true, type: 'all' });
  }, []);

  // Close confirmation dialog and clear error
  const handleCloseConfirmation = useCallback(() => {
    setRevokeConfirmation({ isOpen: false, type: 'single', error: undefined });
  }, []);

  // Confirm and execute revoke action
  const handleConfirmRevoke = useCallback(async () => {
    // Clear any previous error
    setRevokeConfirmation(prev => ({ ...prev, error: undefined }));

    if (!walletClient || !address) {
      setRevokeConfirmation(prev => ({ ...prev, error: 'Wallet not connected' }));
      return;
    }

    // Create signer for the revocation (requires wallet signature)
    const signer = createXmtpSigner(walletClient, address);

    try {
      if (revokeConfirmation.type === 'single' && revokeConfirmation.installationId) {
        await revokeInstallation(revokeConfirmation.installationId, signer);
        toast.success('Session revoked');
      } else if (revokeConfirmation.type === 'all') {
        await revokeAllOther(signer);
        toast.success('All other sessions revoked');
      }
      // Only close on success
      handleCloseConfirmation();
    } catch (err) {
      console.error('Failed to revoke session(s):', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setRevokeConfirmation(prev => ({ ...prev, error: errorMessage }));
    }
  }, [walletClient, address, revokeConfirmation, revokeInstallation, revokeAllOther, toast, handleCloseConfirmation]);

  return (
    <div className={styles.container}>
      <PageHeader title="Settings" size="lg" />

      <div className={styles.sections}>
        {/* Profile Section */}
        <Section title="Profile">
          <div className={styles.profileCard}>
            <div className={styles.profileInfo}>
              <Avatar address={address ?? ''} src={ethosProfile?.avatarUrl} size="lg" />
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

        {/* Active Sessions Section */}
        <Section title="Active Sessions">
          <div className={styles.sessionsHeader}>
            <span className={styles.sessionsCount}>
              {installationsLoading ? (
                <Skeleton width={80} height={16} />
              ) : (
                `${installations.length} of ${maxInstallations} sessions used`
              )}
            </span>
          </div>

          {installationsLoading ? (
            <div className={styles.sessionsList}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.sessionItem}>
                  <Skeleton width={120} height={16} />
                  <Skeleton width={60} height={32} />
                </div>
              ))}
            </div>
          ) : installations.length === 0 ? (
            <p className={styles.sessionsEmpty}>No active sessions found.</p>
          ) : (
            <>
              <div className={styles.sessionsList}>
                {installations.map((installation) => {
                  const isCurrent = installation.id === currentInstallationId;
                  return (
                    <div key={installation.id} className={styles.sessionItem}>
                      <div className={styles.sessionInfo}>
                        <span className={styles.sessionId}>
                          {truncateInstallationId(installation.id)}
                        </span>
                        {isCurrent && (
                          <span className={styles.currentBadge}>This device</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeClick(installation.id)}
                        disabled={isCurrent || isRevoking}
                        aria-label={isCurrent ? 'Cannot revoke current session' : 'Revoke session'}
                      >
                        Revoke
                      </Button>
                    </div>
                  );
                })}
              </div>

              {installations.length > 1 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRevokeAllClick}
                  disabled={isRevoking}
                  loading={isRevoking}
                  className={styles.revokeAllButton}
                >
                  Revoke All Other Sessions
                </Button>
              )}
            </>
          )}
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

      {/* Revoke Confirmation Dialog */}
      <Modal
        isOpen={revokeConfirmation.isOpen}
        onClose={handleCloseConfirmation}
        title="Revoke Session"
        size="sm"
        footer={
          <div className={styles.confirmationFooter}>
            <Button variant="secondary" size="md" onClick={handleCloseConfirmation}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => void handleConfirmRevoke()}
              loading={isRevoking}
            >
              Revoke
            </Button>
          </div>
        }
      >
        <p className={styles.confirmationText}>
          {revokeConfirmation.type === 'all'
            ? 'This will sign out all other devices. You will remain signed in on this device.'
            : 'This will sign out the selected device. Continue?'}
        </p>
        {revokeConfirmation.error && (
          <p className={styles.confirmationError}>{revokeConfirmation.error}</p>
        )}
      </Modal>
    </div>
  );
}
