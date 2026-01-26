"use client";

import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import styles from "./page.module.css";

export default function OfflinePage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <Logo className={styles.logo} />
        </div>
        <h1 className={styles.title}>You're offline</h1>
        <p className={styles.message}>
          Kusari needs an internet connection to send and receive messages.
          Please check your connection and try again.
        </p>
        <div className={styles.actions}>
          <Button
            onClick={() => window.location.reload()}
            variant="primary"
            leftIcon={<Icon name="refresh" size="sm" />}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
