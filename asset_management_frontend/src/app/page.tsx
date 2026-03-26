import Link from "next/link";

import { getDashboard, listAlerts, listAssets } from "@/lib/client";

function healthPill(score: number): { label: string; className: string } {
  if (score >= 70) return { label: "Green", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (score >= 40) return { label: "Amber", className: "bg-amber-50 text-amber-800 ring-amber-200" };
  return { label: "Red", className: "bg-red-50 text-red-700 ring-red-200" };
}

export default async function Home() {
  const [dashboard, assets, alerts] = await Promise.all([
    getDashboard(),
    listAssets(),
    listAlerts(20),
  ]);

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Asset Health & Maintenance</h1>
            <p className="mt-2 text-sm text-slate-600">
              Demo MVP wired to the FastAPI backend (assets, inspections, alerts, work orders, timeline, dashboard).
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/assets">
              Assets
            </Link>
            <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/inspections">
              Inspections
            </Link>
            <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/alerts">
              Alerts
            </Link>
            <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/workorders">
              Work Orders
            </Link>
          </nav>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Total Assets</div>
            <div className="mt-2 text-2xl font-semibold">{dashboard.total_assets}</div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Health (Green/Amber/Red)</div>
            <div className="mt-2 text-2xl font-semibold">
              {dashboard.health_status_counts.green}/{dashboard.health_status_counts.amber}/{dashboard.health_status_counts.red}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Overdue Maintenance</div>
            <div className="mt-2 text-2xl font-semibold">{dashboard.overdue_maintenance}</div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Open Work Orders</div>
            <div className="mt-2 text-2xl font-semibold">{dashboard.open_work_orders}</div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Assets</h2>
              <Link className="text-sm text-blue-600 hover:underline" href="/assets">
                View all
              </Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-3">Tag</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Location</th>
                    <th className="py-2 pr-3">Health</th>
                    <th className="py-2 pr-3" />
                  </tr>
                </thead>
                <tbody>
                  {assets.slice(0, 8).map((a) => {
                    const pill = healthPill(a.health_score);
                    return (
                      <tr key={a.id} className="border-b border-slate-100">
                        <td className="py-2 pr-3 font-medium">{a.asset_tag}</td>
                        <td className="py-2 pr-3">{a.name}</td>
                        <td className="py-2 pr-3 text-slate-600">{a.location ?? "—"}</td>
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ring-1 ${pill.className}`}>
                            {pill.label} • {Math.round(a.health_score)}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <Link className="text-blue-600 hover:underline" href={`/assets/${a.id}`}>
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {assets.length === 0 ? (
                    <tr>
                      <td className="py-4 text-slate-600" colSpan={5}>
                        No assets yet. Create one in the Assets module.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Recent Alerts</h2>
              <Link className="text-sm text-blue-600 hover:underline" href="/alerts">
                View all
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {alerts.slice(0, 8).map((al) => (
                <div key={al.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{al.type}</div>
                    <div className="text-xs text-slate-500">{new Date(al.created_at).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">Asset #{al.asset_id} • priority: {al.priority}</div>
                  <div className="mt-2">
                    <Link className="text-sm text-blue-600 hover:underline" href={`/assets/${al.asset_id}`}>
                      Open asset timeline
                    </Link>
                  </div>
                </div>
              ))}
              {alerts.length === 0 ? <div className="text-sm text-slate-600">No active alerts.</div> : null}
            </div>
          </div>
        </section>

        <footer className="mt-10 text-xs text-slate-500">
          Backend base URL is controlled by <code className="rounded bg-slate-50 px-1">NEXT_PUBLIC_API_BASE_URL</code>.
        </footer>
      </div>
    </main>
  );
}
