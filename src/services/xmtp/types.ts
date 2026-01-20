import type { Client, EOASigner } from '@xmtp/browser-sdk';

export type XmtpEnv = 'local' | 'dev' | 'production';

export interface XmtpClientConfig {
  env: XmtpEnv;
  apiUrl?: string;
}

export interface XmtpState {
  client: Client | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
}

export interface XmtpContextValue extends XmtpState {
  initialize: (signer: EOASigner) => Promise<void>;
  disconnect: () => void;
}
