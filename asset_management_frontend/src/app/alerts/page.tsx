"use client";

import Link from "next/link";
import React from "react";

import { ApiError } from "@/lib/api";
import { createWorkOrderFromAlert, listAlerts } from "@/lib/client";
import type { AlertOutMVP, WorkOrderOutMVP } from "@/lib/types";

export default function AlertsPage() {
  const [alerts, setAlerts] = React.useState<AlertOutMVP[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [creatingForAlertId, setCreatingForAlertId] = React.useState<number | null>(null);
  const [createdWorkOrder, setCreatedWorkOrder] = React.useState<WorkOrderOutMVP | null>(null);

  async function refresh() {
    setError(null);
    setCreatedWorkOrder(null);
    setLoading(true);
    try {
      const items = await listAlerts(100);
      setAlerts(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  async function onCreateWorkOrder(alertId: number) {
    setError(null);
    setCreatedWorkOrder(null);
    setCreatingForAlertId(alertId);
    try {
      const wo = await createWorkOrderFromAlert({
        alert_id: alertId,
        description: "Investigate at-risk asset and schedule maintenance.",
        assignee: "Maintenance Crew A",
      });
      setCreatedWorkOrder(wo);
      // Refresh alerts list after WO creation (optional)
      await refresh();
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.message} (HTTP ${e.status})`);
      else setError(e instanceof Error ? e.message : "Failed to create work order");
    } finally {
      setCreatingForAlertId(null);
    }
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Alerts</h1>
            <p className="mt-1 text-sm text-slate-600">Real backend: GET /alerts (active alerts for assets in red).</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void refresh()}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Refresh
            </button>
            <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/">
              ← Dashboard
            </Link>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : null}

        {createdWorkOrder ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Work order created: <span className="font-medium">#{createdWorkOrder.id}</span> (asset{" "}
            {createdWorkOrder.asset_id})
          </div>
        ) : null}

        <section className="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Active Alerts</h2>

          {loading ? <div className="mt-3 text-sm text-slate-600">Loading…</div> : null}

          {!loading && alerts.length === 0 ? (
            <div className="mt-3 text-sm text-slate-600">No active alerts.</div>
          ) : null}

          <div className="mt-4 space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{a.type}</div>
                    <div className="text-xs text-slate-500">
                      Asset #{a.asset_id} • priority: {a.priority} • {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link className="text-sm text-blue-600 hover:underline" href={`/assets/${a.asset_id}`}>
                      View asset
                    </Link>
                    <button
                      onClick={() => void onCreateWorkOrder(a.id)}
                      disabled={creatingForAlertId === a.id}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {creatingForAlertId === a.id ? "Creating…" : "Create work order"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-6 text-xs text-slate-500">
          Work orders are created via <code className="rounded bg-slate-50 px-1">POST /workorders</code>. Status updates use{" "}
          <code className="rounded bg-slate-50 px-1">PATCH /workorders/:id/status</code>.
        </p>
      </div>
    </main>
  );
}
