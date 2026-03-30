"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatEther, Hex } from "viem";
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Transaction failed.";
}

export default function SignalDetailPage() {
  const params = useParams<{ id: string }>();
  const signalId = Number(params.id);

  const publicClient = usePublicClient({ chainId: base.id });
  const { address, chainId } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [signal, setSignal] = useState<SignalItem | null>(null);
  const [joined, setJoined] = useState(false);
  const [myChoice, setMyChoice] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);

  const ended = useMemo(
    () => (signal ? Math.floor(Date.now() / 1000) >= signal.endTime : false),
    [signal],
  );

  const isCreator = useMemo(() => {
    if (!signal || !address) return false;
    return signal.creator.toLowerCase() === address.toLowerCase();
  }, [signal, address]);

  const loadSignal = useCallback(async () => {
    if (!publicClient || !Number.isFinite(signalId)) return;
    setLoading(true);
    try {
      const raw = (await publicClient.readContract({
        address: SIGNALCAST_ADDRESS,
        abi: signalCastAbi,
        functionName: "signals",
        args: [BigInt(signalId)],
      })) as SignalRaw;

      const mapped = mapSignal(signalId, raw);
      setSignal(mapped);

      if (address) {
        const hasJoined = (await publicClient.readContract({
          address: SIGNALCAST_ADDRESS,
          abi: signalCastAbi,
          functionName: "participated",
          args: [BigInt(signalId), address],
        })) as boolean;
        setJoined(hasJoined);

        if (hasJoined) {
          const selected = (await publicClient.readContract({
            address: SIGNALCAST_ADDRESS,
            abi: signalCastAbi,
            functionName: "choice",
            args: [BigInt(signalId), address],
          })) as boolean;
          setMyChoice(selected);
        } else {
          setMyChoice(null);
        }
      } else {
        setJoined(false);
        setMyChoice(null);
      }
    } finally {
      setLoading(false);
    }
  }, [address, publicClient, signalId]);

  useEffect(() => {
    void loadSignal();
  }, [loadSignal]);

  const ensureWalletReady = () => {
    if (!address) {
      setNotice("Connect wallet first.");
      return false;
    }
    if (chainId !== base.id) {
      setNotice("Switch wallet to Base.");
      return false;
    }
    if (!publicClient) {
      setNotice("Base public client unavailable.");
      return false;
    }
    return true;
  };

  const onTransactionSent = async (hash: Hex) => {
    if (!publicClient || !address) return;
    setTxHash(hash);
    setNotice("Transaction sent. Waiting for confirmation...");
    await publicClient.waitForTransactionReceipt({ hash });
    await trackTransaction("app-001", "SignalCast", address, hash);
    await loadSignal();
    setNotice("Onchain action confirmed.");
  };

  const sendParticipate = async (isUp: boolean) => {
    setNotice(null);
    if (!ensureWalletReady() || !publicClient || !address) return;
    if (!signal) return;

    try {
      const hash = await writeContractAsync({
        address: SIGNALCAST_ADDRESS,
        abi: signalCastAbi,
        functionName: "participate",
        args: [BigInt(signalId), isUp],
        value: signal.stakeAmount,
        dataSuffix: DATA_SUFFIX,
      });
      await onTransactionSent(hash);
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  };

  const sendResolve = async (outcome: boolean) => {
    setNotice(null);
    if (!ensureWalletReady() || !publicClient || !address) return;

    try {
      const hash = await writeContractAsync({
        address: SIGNALCAST_ADDRESS,
        abi: signalCastAbi,
        functionName: "resolve",
        args: [BigInt(signalId), outcome],
        dataSuffix: DATA_SUFFIX,
      });
      await onTransactionSent(hash);
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  };

  const sendClaim = async () => {
    setNotice(null);
    if (!ensureWalletReady() || !publicClient || !address) return;

    try {
      const hash = await writeContractAsync({
        address: SIGNALCAST_ADDRESS,
        abi: signalCastAbi,
        functionName: "claim",
        args: [BigInt(signalId)],
        dataSuffix: DATA_SUFFIX,
      });
      await onTransactionSent(hash);
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  };

  if (!Number.isFinite(signalId)) {
    return (
      <section className="space-y-3">
        <p className="text-sm text-slate-700">Invalid signal id.</p>
        <Link href="/signals" className="text-sm font-semibold text-slate-900">
          Back to signals
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-title text-xl font-bold text-slate-900">Signal #{signalId}</h1>
          <Link href="/signals" className="text-sm font-semibold text-slate-700">
            Back
          </Link>
        </div>

        {loading ? <p className="mt-3 text-sm text-slate-600">Loading onchain data...</p> : null}

        {signal ? (
          <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="break-all">Creator: {signal.creator}</p>
            <p>Stake: {formatEther(signal.stakeAmount)} ETH</p>
            <p>Ends At: {new Date(signal.endTime * 1000).toLocaleString()}</p>
            <p>
              Votes: Up {signal.upCount} / Down {signal.downCount}
            </p>
            <p>Status: {signal.resolved ? "Resolved" : ended ? "Ended (await resolve)" : "Open"}</p>
            {signal.resolved ? <p>Outcome: {signal.outcome ? "UP" : "DOWN"}</p> : null}
            {joined ? <p>Your Direction: {myChoice ? "UP" : "DOWN"}</p> : null}
          </div>
        ) : null}

        {signal && !signal.resolved && !ended && !joined ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => sendParticipate(true)}
              className="min-h-11 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Participate UP
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => sendParticipate(false)}
              className="min-h-11 rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Participate DOWN
            </button>
          </div>
        ) : null}

        {signal && isCreator && !signal.resolved && ended ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => sendResolve(true)}
              className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Resolve UP
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => sendResolve(false)}
              className="min-h-11 rounded-xl bg-slate-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              Resolve DOWN
            </button>
          </div>
        ) : null}

        {signal && signal.resolved && joined ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => sendClaim()}
            className="mt-4 min-h-11 w-full rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            Claim Reward
          </button>
        ) : null}

        {notice ? <p className="mt-3 text-sm text-slate-700">{notice}</p> : null}
        {txHash ? (
          <a
            className="mt-2 block break-all text-xs text-blue-700"
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            tx hash: {txHash}
          </a>
        ) : null}
      </div>
    </section>
  );
}
