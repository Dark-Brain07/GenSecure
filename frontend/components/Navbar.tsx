"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Wallet, Copy, LogOut, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useInjectedWallet, copyWalletAddress } from "@/lib/wallet";
import { shorten } from "@/lib/format";

export function Navbar() {
  const pathname = usePathname();
  const wallet = useInjectedWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!wallet.address) return;
    await copyWalletAddress(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="site-navbar">
      <div className="navbar-container">
        <Link href="/" className="brand-wrapper">
          <div className="brand-symbol">
            <Image
              src="/logo.png"
              alt="GenSecure Logo"
              width={38}
              height={38}
              className="brand-logo-img"
              priority
            />
          </div>
          <span className="brand-name">GenSecure</span>
          <span className="brand-badge">PROTOCOL</span>
        </Link>

        <nav className="nav-links">
          <Link href="/covenants" className={`nav-item ${pathname === "/covenants" ? "active" : ""}`}>
            Covenants
          </Link>
          <Link href="/create" className={`nav-item ${pathname === "/create" ? "active" : ""}`}>
            <Sparkles size={14} />
            Create
          </Link>
          <Link href="/protocol" className={`nav-item ${pathname === "/protocol" ? "active" : ""}`}>
            Protocol
          </Link>
          <Link href="/activity" className={`nav-item ${pathname === "/activity" ? "active" : ""}`}>
            Ledger
          </Link>
          <Link href="/contracts" className={`nav-item ${pathname === "/contracts" ? "active" : ""}`}>
            Contracts
          </Link>
        </nav>

        <div className="navbar-right">
          <div className="studionet-pill" title="Target Network: GenLayer Studionet">
            <span className="pulse-dot" />
            <span>StudioNet 61999</span>
          </div>

          {!wallet.connected ? (
            <button className="btn-wallet" onClick={() => void wallet.connect()}>
              <Wallet size={15} />
              Connect Wallet
            </button>
          ) : (
            <div className="btn-wallet-connected">
              <span onClick={handleCopy} style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                {shorten(wallet.address || "")}
              </span>
              <button
                onClick={() => wallet.disconnect()}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                title="Disconnect"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
