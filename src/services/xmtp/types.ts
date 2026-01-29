import type { Client, EOASigner } from '@xmtp/browser-sdk';

export type XmtpEnv = 'local' | 'dev' | 'production';

export interface XmtpClientConfig {
  env: XmtpEnv;
  apiUrl?: string;
  historySyncUrl?: string;
}

export interface XmtpState {
  client: Client | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
  /** True after identity check has completed (found identity, no identity, or error) */
  hasAttemptedAutoInit: boolean;
}

export interface XmtpContextValue extends XmtpState {
  initialize: (signer: EOASigner) => Promise<void>;
  disconnect: () => void;
}
