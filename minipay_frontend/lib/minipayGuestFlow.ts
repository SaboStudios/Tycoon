import { connect, disconnect, getAccount } from '@wagmi/core';
import { injected } from 'wagmi/connectors';
import { getAddress } from 'viem';
import { getWagmiConfig } from '@/config';
const ZERO = "0x0000000000000000000000000000000000000000";

function isValidUserWalletAddress(a: string | null | undefined): a is string {
  if (!a || typeof a !== "string") return false;
  const s = a.trim();
  if (s.toLowerCase() === ZERO) return false;
  return /^0x[a-fA-F0-9]{40}$/i.test(s);
}

/**
 * Same resolution order as backend `getOnchainAddressForUser`: linked → smart → account primary.
 */
export function getGuestUserPlayAddress(guestUser: {
  linked_wallet_address?: string | null;
  smart_wallet_address?: string | null;
  address?: string;
} | null | undefined): string | null {
  if (!guestUser) return null;
  if (isValidUserWalletAddress(guestUser.linked_wallet_address)) {
    return guestUser.linked_wallet_address.trim();
  }
  if (isValidUserWalletAddress(guestUser.smart_wallet_address)) {
    return guestUser.smart_wallet_address.trim();
  }
  if (isValidUserWalletAddress(guestUser.address)) {
    return guestUser.address.trim();
  }
  return null;
}

export type MiniPayEthereumProvider = {
  request: (args: { method: string; params?: readonly unknown[] }) => Promise<unknown>;
  isMiniPay?: boolean;
  providers?: MiniPayEthereumProvider[];
};

function resolveWindowEthereum(): MiniPayEthereumProvider | null {
  if (typeof window === 'undefined') return null;

  const eth = (window as Window & { ethereum?: MiniPayEthereumProvider }).ethereum;
  if (!eth?.request) return null;

  if (eth.isMiniPay) return eth;

  const nested = eth.providers?.find(
    (p: MiniPayEthereumProvider) => p?.isMiniPay && typeof p.request === 'function',
  );
  return nested ?? null;
}

/**
 * Celopedia / MiniPay project setup: same window.ethereum for authorize, transport, and send.
 * Only returns the MiniPay provider — never Phantom/MetaMask (Chrome hang on create-game).
 * @see https://docs.minipay.xyz/getting-started/project-setup.html
 */
export function getEthereumProvider(): MiniPayEthereumProvider {
  if (typeof window === 'undefined') {
    throw new Error('window.ethereum is required. Run this app inside MiniPay.');
  }
  const eth = (window as Window & { ethereum?: MiniPayEthereumProvider }).ethereum;
  if (eth?.isMiniPay && typeof eth.request === 'function') return eth;
  const nested = eth?.providers?.find(
    (p: MiniPayEthereumProvider) => p?.isMiniPay && typeof p.request === 'function',
  );
  if (nested) return nested;
  throw new Error('MiniPay wallet not found. Open this app from MiniPay, then try again.');
}

/** @deprecated Use getEthereumProvider() */
export function getMiniPayEthereumProvider(): MiniPayEthereumProvider | null {
  return resolveWindowEthereum();
}

/** @deprecated Use getEthereumProvider() */
export async function getInjectedEthereumProvider(): Promise<MiniPayEthereumProvider> {
  return getEthereumProvider();
}

/** True when MiniPay's provider is actually injected (not hostname alone). */
export function hasMiniPayProvider(): boolean {
  if (typeof window === 'undefined') return false;
  const eth = (window as Window & { ethereum?: { isMiniPay?: boolean; providers?: { isMiniPay?: boolean }[] } })
    .ethereum;
  if (!eth) return false;
  if (eth.isMiniPay) return true;
  return (
    Array.isArray(eth.providers) &&
    eth.providers.some((p: { isMiniPay?: boolean }) => p?.isMiniPay)
  );
}

export function isMiniPayEmbeddedWallet(): boolean {
  // Provider only — do not use hostname. Chrome on a MiniPay host without
  // window.ethereum.isMiniPay used to look "connected" and hang on Connect.
  return hasMiniPayProvider();
}

export function isMiniPay(): boolean {
  return isMiniPayEmbeddedWallet();
}

export function shouldBypassViemForTx(): boolean {
  return isMiniPayEmbeddedWallet();
}

function isInjectedConnector(connector: { id?: string; type?: string } | undefined): boolean {
  if (!connector) return false;
  return connector.id === 'injected' || connector.type === 'injected';
}

/**
 * Keep wagmi on injected() so UI address matches window.ethereum — drop WalletConnect sessions.
 */
export async function ensureInjectedMiniPayConnection(): Promise<void> {
  const config = getWagmiConfig();
  const account = getAccount(config);

  if (!isInjectedConnector(account.connector)) {
    try {
      await disconnect(config);
    } catch {
      // ignore
    }
    await connect(config, { connector: injected() });
  }
}

/**
 * Authorize on window.ethereum (Celopedia: auto-connect on load, requestAccounts before send).
 */
export async function resolveMiniPaySender(): Promise<string> {
  await ensureInjectedMiniPayConnection();
  const eth = getEthereumProvider();

  let accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];

  if (!accounts?.[0]) {
    accounts = (await eth.request({ method: 'eth_accounts' })) as string[];
  }

  const raw = accounts?.[0];
  if (!raw || !isValidUserWalletAddress(raw)) {
    throw new Error(
      'MiniPay wallet not connected. Close and reopen this app from MiniPay, then try again.',
    );
  }

  return getAddress(raw as `0x${string}`);
}

export async function authorizeMiniPayWallet(): Promise<readonly string[]> {
  const from = await resolveMiniPaySender();
  return [from];
}

export async function getMiniPayAccountsForTx(): Promise<readonly string[]> {
  return authorizeMiniPayWallet();
}

/**
 * MiniPay webview: authorize injected MiniPay.
 * Desktop Chrome/Brave: require an already-connected wagmi account — do not poke
 * Phantom/other extensions via eth_requestAccounts (hangs create-game on LAUNCHING).
 */
export async function ensureMiniPayWalletReady(): Promise<readonly string[]> {
  if (!hasMiniPayProvider()) {
    const account = getAccount(getWagmiConfig());
    if (account.address && isValidUserWalletAddress(account.address)) {
      return [getAddress(account.address as `0x${string}`)];
    }
    throw new Error('Connect your wallet first, then try again.');
  }
  return authorizeMiniPayWallet();
}

export function shouldUseBackendGuestGameFlow(
  guestUser: {
    linked_wallet_address?: string | null;
    smart_wallet_address?: string | null;
    address?: string;
  } | null | undefined,
  wagmiAddress: string | undefined,
  _wagmiChainId: number
): boolean {
  if (wagmiAddress) return false;
  if (isMiniPayEmbeddedWallet()) return false;
  return !!guestUser;
}
