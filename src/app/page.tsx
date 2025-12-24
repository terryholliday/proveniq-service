
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">PROVENIQ <span className="text-emerald-500">SERVICE</span></h1>
            <p className="text-slate-400 text-sm tracking-widest uppercase">The Guild // Verified Maintenance Authority</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 font-mono">SYSTEM STATUS</div>
            <div className="text-emerald-400 font-bold flex items-center justify-end gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              OPERATIONAL
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Action Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-emerald-500/50 transition-colors group">
              <h2 className="text-xl font-semibold text-white mb-4 group-hover:text-emerald-400 transition-colors">Log Service Event</h2>
              <p className="text-slate-400 text-sm mb-6">Cryptographically sign and record a maintenance event to the immutable ledger.</p>
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20">
                INITIATE LOG
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h2 className="text-lg font-semibold text-white mb-4">Provider Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 text-sm">Verification Level</span>
                  <span className="text-white font-mono">ASE_MASTER</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 text-sm">Trust Score</span>
                  <span className="text-emerald-400 font-mono">98.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Events Logged</span>
                  <span className="text-white font-mono">1,248</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Recent Ledger Entries</h2>
              <span className="text-xs font-mono text-slate-500">LIVE FEED</span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500 font-mono text-xs border border-slate-700 group-hover:border-emerald-500/30">
                    LOG
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-200 font-medium">Routine Maintenance: Oil & Filter</span>
                      <span className="text-slate-500 text-xs font-mono">TX: 0x8a...4b2</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400">
                      <span>ASSET: <span className="text-slate-300">Porsche 911 GT3</span></span>
                      <span>•</span>
                      <span>PROV: <span className="text-emerald-400">@tech_center_berlin</span></span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">2m ago</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
