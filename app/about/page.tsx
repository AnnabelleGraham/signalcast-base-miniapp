export default function AboutPage() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h1 className="font-title text-xl font-bold text-slate-900">About SignalCast</h1>
        <p className="mt-2 text-sm text-slate-700">
          SignalCast is a Base Mini App for onchain signal publishing, trend participation, creator
          resolution, and winner claims.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-title text-lg font-bold text-slate-900">Data Surfaces</h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          <li>1. Onchain: every action uses real Base transaction writes.</li>
          <li>2. Attribution: every write includes ERC-8021 `dataSuffix` builder code.</li>
          <li>3. Offchain: confirmed tx hashes are posted to dashboard tracking API.</li>
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-title text-lg font-bold text-slate-900">Contract</h2>
        <p className="mt-2 break-all text-sm text-slate-700">
          0xc486f1ec06ba4b14051a60f11018b8ba2a3fff79
        </p>
      </div>
    </section>
  );
}
