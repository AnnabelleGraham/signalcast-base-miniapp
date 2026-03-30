"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { formatEther, Hex, keccak256, parseEther, toBytes } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { base } from "wagmi/chains";
import {
  signalCastAbi,
  SIGNALCAST_ADDRESS,
  mapSignal,
  SignalItem,
  SignalRaw,
} from "@/lib/signalcast";
import { DATA_SUFFIX } from "@/lib/wagmi";
import { trackTransaction } from "@/utils/track";

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString();
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Transaction failed.";
}

export default function SignalsPage() {
  const publicClient = usePublicClient({ chainId: base.id });
  const { address, chainId } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [metaText, setMetaText] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [stakeEth, setStakeEth] = useState("0.0001");
  const [notice, setNotice] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);

  const totalSignals = useMemo(() => signals.length, [signals.length]);

  const loadSignals = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    try {
      const total = Number(
        await publicClient.readContract({
          address: SIGNALCAST_ADDRESS,
          abi: signalCastAbi,
          functionName: "signalId",
        }),
      );

      if (total === 0) {
        setSignals([]);
        return;
      }

      const ids = Array.from({ length: Math.min(total, 30) }, (_, index) => total - 1 - index);
      const data = await Promise.all(
        ids.map(async (id) => {
          const raw = (await publicClient.readContract({
            address: SIGNALCAST_ADDRESS,
            abi: signalCastAbi,
            functionName: "signals",
            args: [BigInt(id)],
          })) as SignalRaw;
          return mapSignal(id, raw);
        }),
      );
      setSignals(data);
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    void loadSignals();
  }, [loadSignals]);

  const createSignal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!address) {
      setNotice("Connect wallet first.");
      return;
    }
    if (chainId !== base.id) {
      setNotice("Switch wallet to Base.");
      return;
    }
    if (!publicClient) {
      setNotice("Base public client unavailable.");
      return;
    }

    try {
      const cleanedText = metaText.trim();
      if (!cleanedText) {
        setNotice("Signal text is required.");
        return;
      }

      const durationValue = Number(durationMinutes);
      if (!Number.isFinite(durationValue) || durationValue <= 0) {
        setNotice("Duration must be greater than zero.");
        return;
      }

      const durationSeconds = Math.floor(durationValue * 60);
      const stakeWei = parseEther(stakeEth);
      const hash = await writeContractAsync({
        address: SIGNALCAST_ADDRESS,
        abi: signalCastAbi,
        functionName: "createSignal",
        args: [keccak256(toBytes(cleanedText)), durationSeconds, stakeWei],
        dataSuffix: DATA_SUFFIX,
      });

      setTxHash(hash);
      setNotice("Transaction sent. Waiting for confirmation...");

      await publicClient.waitForTransactionReceipt({ hash });
      await trackTransaction("app-001", "SignalCast", address, hash);
      await loadSignals();
      setMetaText("");
      setNotice("Signal created onchain.");
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h1 className="font-title text-xl font-bold text-slate-900">Create Signal</h1>
        <form className="mt-3 space-y-3" onSubmit={createSignal}>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-slate-700">Signal Text</span>
            <textarea
              value={metaText}
              onChange={(event) => setMetaText(event.target.value)}
              placeholder="BTC will break weekly high"
              className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none"
              maxLength={200}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-slate-700">Duration (mins)</span>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold text-slate-700">Stake (ETH)</span>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={stakeEth}
                onChange={(event) => setStakeEth(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="min-h-11 w-full rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Sending..." : "Send createSignal"}
          </button>
        </form>

        {notice ? <p className="mt-3 text-sm text-slate-700">{notice}</p> : null}
        {txHash ? (
          <p className="mt-2 break-all text-xs text-slate-500">
            tx hash: {txHash}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-title text-xl font-bold text-slate-900">
          Latest Signals ({totalSignals})
        </h2>

        {loading ? <p className="mt-3 text-sm text-slate-600">Loading signals...</p> : null}
        {!loading && signals.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No onchain signals yet.</p>
        ) : null}

        <ul className="mt-3 space-y-3">
          {signals.map((signal) => (
            <li key={signal.id}>
              <Link
                href={`/signals/${signal.id}`}
                className="block rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-title text-base font-bold text-slate-900">Signal #{signal.id}</p>
                  <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
                    {signal.resolved ? "Resolved" : "Open"}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <p>Stake: {formatEther(signal.stakeAmount)} ETH</p>
                  <p>Ends: {formatTime(signal.endTime)}</p>
                  <p>
                    Votes: Up {signal.upCount} / Down {signal.downCount}
                  </p>
                  <p className="break-all">Creator: {signal.creator}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
