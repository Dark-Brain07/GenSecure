"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode, createElement } from "react";

import { CHAIN_ID, CHAIN_HEX, RPC_URL, EXPLORER_URL } from "./constants";
export { CHAIN_ID, CHAIN_HEX, RPC_URL, EXPLORER_URL };


export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function injectedProvider(): Eip1193Provider | null {
  return typeof window === "undefined" ? null : window.ethereum || null;
}

export function normalizeAccounts(result: unknown): string[] {
  return Array.isArray(result) ? result.filter((x): x is string => typeof x === "string") : [];
}

export function sameWallet(left?: string | null, right?: string | null): boolean {
  return !!left && !!right && left.toLowerCase() === right.toLowerCase();
}

export async function copyWalletAddress(address: string): Promise<void> {
  if (!address) throw new Error("No address provided");
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(address);
  }
}

export async function ensureStudionet(): Promise<void> {
  const provider = injectedProvider();
  if (!provider) throw new Error("No injected Web3 wallet found");
  const current = await provider.request({ method: "eth_chainId" });
  if (typeof current === "string" && parseInt(current, 16) === CHAIN_ID) return;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? Number((error as { code?: unknown }).code) : 0;
    if (code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: CHAIN_HEX,
        chainName: "GenLayer Studionet",
        nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
        rpcUrls: [RPC_URL],
        blockExplorerUrls: [EXPLORER_URL],
      }],
    });
  }
  const confirmed = await provider.request({ method: "eth_chainId" });
  if (typeof confirmed !== "string" || parseInt(confirmed, 16) !== CHAIN_ID) {
    throw new Error("Wallet is not switched to GenLayer Studionet (Chain 61999)");
  }
}

export type WalletState = {
  address: string | null;
  chainId: number | null;
  ready: boolean;
  connected: boolean;
  correctNetwork: boolean;
  hasProvider: boolean;
  connect: () => Promise<string>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  switchNetwork: () => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const provider = injectedProvider();
    if (!provider) {
      setAddress(null);
      setChainId(null);
      setReady(true);
      return;
    }
    const currentGen = ++generation.current;
    try {
      const [rawAccounts, rawChain] = await Promise.all([
        provider.request({ method: "eth_accounts" }),
        provider.request({ method: "eth_chainId" }),
      ]);
      if (currentGen !== generation.current) return;
      const accounts = normalizeAccounts(rawAccounts);
      setAddress(accounts[0] || null);
      setChainId(typeof rawChain === "string" ? parseInt(rawChain, 16) : null);
    } catch {
      if (currentGen === generation.current) {
        setAddress(null);
        setChainId(null);
      }
    } finally {
      if (currentGen === generation.current) setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const provider = injectedProvider();
    if (!provider?.on) return;
    const onAccounts = (accounts: unknown) => {
      const list = normalizeAccounts(accounts);
      setAddress(list[0] || null);
    };
    const onChain = (hex: unknown) => {
      setChainId(typeof hex === "string" ? parseInt(hex, 16) : null);
    };
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [refresh]);

  const connect = useCallback(async (): Promise<string> => {
    const provider = injectedProvider();
    if (!provider) throw new Error("No Web3 wallet installed in browser");
    await ensureStudionet();
    const raw = await provider.request({ method: "eth_requestAccounts" });
    const accounts = normalizeAccounts(raw);
    const chosen = accounts[0];
    if (!chosen) throw new Error("No account authorized by wallet");
    setAddress(chosen);
    setChainId(CHAIN_ID);
    return chosen;
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    await ensureStudionet();
    await refresh();
  }, [refresh]);

  const value: WalletState = {
    address,
    chainId,
    ready,
    connected: !!address,
    correctNetwork: chainId === CHAIN_ID,
    hasProvider: typeof window !== "undefined" && !!window.ethereum,
    connect,
    disconnect,
    refresh,
    switchNetwork,
  };

  return createElement(WalletContext.Provider, { value }, children);
}

export function useInjectedWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    return {
      address: null,
      chainId: null,
      ready: true,
      connected: false,
      correctNetwork: false,
      hasProvider: false,
      connect: async () => "",
      disconnect: () => {},
      refresh: async () => {},
      switchNetwork: async () => {},
    };
  }
  return ctx;
}
