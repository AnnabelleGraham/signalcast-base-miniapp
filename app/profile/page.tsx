"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { base } from "wagmi/chains";
import { signalCastAbi, SIGNALCAST_ADDRESS, SignalRaw } from "@/lib/signalcast";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
  const publicClient = usePublicClient({ chainId: base.id });
  const { address, isConnected, chainId } = useAccount();
  const [totalSignals, setTotalSignals] = useState(0);
  const [createdByMe, setCreatedByMe] = useState(0);
  const [joinedByMe, setJoinedByMe] = useState(0);
  const [loading, setLoading] = useState(false);

  const onBase = chainId === base.id;

  const loadStats = useCallback(async () => {
    if (!publicClient || !address || !onBase) return;
    setLoading(true);
    try {
      const total = Number(
        await publicClient.readContract({
          address: SIGNALCAST_ADDRESS,
          abi: signalCastAbi,
          functionName: "signalId",
        }),
      );
      setTotalSignals(total);

      if (total === 0) {
        setCreatedByMe(0);
        setJoinedByMe(0);
        return;
      }

      const ids = Array.from({ length: total }, (_, index) => index);
      const results = await Promise.all(
        ids.map(async (id) => {
          const raw = (await publicClient.readContract({
            address: SIGNALCAST_ADDRESS,
            abi: signalCastAbi,
            functionName: "signals",
            args: [BigInt(id)],
          })) as SignalRaw;

          const joined = (await publicClient.readContract({
            address: SIGNALCAST_ADDRESS,
            abi: signalCastAbi,
            functionName: "participated",
            args: [BigInt(id), address],
          })) as boolean;

          return {
            creator: raw[0],
            joined,
          };
        }),
      );

      const createdCount = results.filter(
        (item) => item.creator.toLowerCase() === address.toLowerCase(),
      ).length;
      const joinedCount = results.filter((item) => item.joined).length;

      setCreatedByMe(createdCount);
      setJoinedByMe(joinedCount);
    } finally {
      setLoading(false);
    }
  }, [address, onBase, publicClient]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const title = useMemo(() => {
    if (!isConnected) return "Wallet not connected";
    if (!onBase) return "Switch to Base";
    return "Onchain Profile";
  }, [isConnected, onBase]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h1 className="font-title text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {isConnected && address
            ? `Address: ${shortAddress(address)}`
            : "Connect your wallet to view personal stats."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Total</p>
          <p className="mt-1 font-title text-xl font-bold text-slate-900">{totalSignals}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Created</p>
          <p className="mt-1 font-title text-xl font-bold text-slate-900">{createdByMe}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200">
          <p className="text-xs text-slate-500">Joined</p>
          <p className="mt-1 font-title text-xl font-bold text-slate-900">{joinedByMe}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Syncing onchain stats...</p>
      ) : (
        <p className="text-sm text-slate-600">
          Stats are read directly from Base contract state.
        </p>
      )}
    </section>
  );
}
