import Link from "next/link";

export default function Home() {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-slate-900 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Base Mini App</p>
        <h1 className="mt-2 font-title text-3xl font-extrabold leading-tight">
          Publish signals. Predict trends. Settle onchain.
        </h1>
        <p className="mt-3 text-sm text-slate-200">
          SignalCast sends real transactions to Base and attributes every action with ERC-8021
          `dataSuffix`.
        </p>
      </div>

      <div className="grid gap-3">
        <Link
          href="/signals"
          className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white"
        >
          Open Signal Market
        </Link>
        <Link
          href="/profile"
          className="flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-200"
        >
          View Wallet Profile
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-title text-lg font-bold text-slate-900">Core Actions</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>1. Create signal with `createSignal(bytes32,uint32,uint96)`</li>
          <li>2. Join direction with `participate(uint256,bool)`</li>
          <li>3. Resolve with `resolve(uint256,bool)`</li>
          <li>4. Claim winner reward with `claim(uint256)`</li>
        </ul>
      </div>
    </section>
  );
}
