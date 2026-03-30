"use client";

import { useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletBar() {
  const [busy, setBusy] = useState(false);
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  const primaryConnector = useMemo(
    () => connectors.find((item) => item.type === "injected") ?? connectors[0],
    [connectors],
  );

  const connectWallet = async () => {
    if (!primaryConnector || busy) return;
    try {
      setBusy(true);
      await connectAsync({ connector: primaryConnector, chainId: base.id });
    } finally {
      setBusy(false);
    }
  };

  const switchToBase = async () => {
    if (busy) return;
    try {
      setBusy(true);
      await switchChainAsync({ chainId: base.id });
    } finally {
      setBusy(false);
    }
  };

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={connectWallet}
        className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
      >
        {busy ? "Connecting..." : "Connect"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
        {address ? shortAddress(address) : "Connected"}
      </span>
      {chainId !== base.id ? (
        <button
          type="button"
          onClick={switchToBase}
          className="min-h-11 rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white"
        >
          {busy ? "Switching..." : "Switch Base"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => disconnect()}
          className="min-h-11 rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-700"
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
