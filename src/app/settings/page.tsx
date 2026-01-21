'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Button, PageHeader } from '@/components/ui';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/providers/ToastProvider';
import { truncateAddress } from '@/lib';
import styles from './settings.module.css';

const APP_VERSION = '0.1.0';

export default function SettingsPage() {
  const router = useRouter();
  const { address, disconnectAsync, isConnected } = useWallet();
  const toast = useToast();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
      toast.error('Failed to copy address to clipboard');
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

  const handleOpenDocs = useCallback(() => {
    window.open('https://docs.xmtp.org', '_blank', 'noopener,noreferrer');
  }, []);

  const handleOpenSupport = useCallback(() => {
    window.open('https://github.com/xmtp/xmtp-web/discussions', '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className={styles.container}>
      <PageHeader title="Settings" size="lg" />

      <div className={styles.sections}>
        {/* Profile Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          <div className={styles.sectionContent}>
            <div className={styles.profileCard}>
              <div className={styles.profileInfo}>
                <Avatar address={address ?? ''} size="lg" />
                <div className={styles.profileDetails}>
                  <span className={styles.profileLabel}>Connected Wallet</span>
                  <span className={styles.profileAddress}>
                    {address ? truncateAddress(address, 6, 4) : 'Not connected'}
                  </span>
                  {address && (
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={handleCopyAddress}
                      aria-label="Copy wallet address to clipboard"
                    >
                      {copied ? 'Copied!' : 'Copy full address'}
                    </button>
                  )}
                </div>
              </div>
              {isConnected && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleDisconnect}
                  loading={isDisconnecting}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Messaging Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Messaging</h2>
          <div className={styles.sectionContent}>
            <div className={styles.comingSoon}>
              <span className={styles.comingSoonBadge}>Coming Soon</span>
              <p className={styles.comingSoonText}>
                Payment requirements for new contacts and other messaging settings will be available in a future update.
              </p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <div className={styles.sectionContent}>
            <div className={styles.aboutCard}>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Version</span>
                <span className={styles.aboutValue}>{APP_VERSION}</span>
              </div>
              <div className={styles.aboutRow}>
                <span className={styles.aboutLabel}>Built with</span>
                <span className={styles.aboutValue}>XMTP Protocol</span>
              </div>
            </div>
            <div className={styles.aboutLinks}>
              <Button variant="ghost" size="sm" onClick={handleOpenDocs}>
                Documentation
              </Button>
              <Button variant="ghost" size="sm" onClick={handleOpenSupport}>
                Support
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
