"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { WalletProvider } from "@/lib/wallet";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      {children}
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#090e17",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            color: "#f8fafc",
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </WalletProvider>
  );
}
