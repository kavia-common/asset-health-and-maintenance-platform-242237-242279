"use client";

import Link from "next/link";
import React from "react";

import { ApiError } from "@/lib/api";
import { patchWorkOrderStatus } from "@/lib/client";
import type { WorkOrderOutMVP, WorkOrderStatus } from "@/lib/types";

const STATUSES: WorkOrderStatus[] = ["open", "in_progress", "done"];

export default function WorkOrdersPage() {
  const [workOrderId, setWorkOrderId] = React.useState("");
  const [status, setStatus] = React.useState<WorkOrderStatus>("in_progress");

  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<WorkOrderOutMVP | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const id = Number(workOrderId);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Please enter a valid work order ID.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await patchWorkOrderStatus(id, status);
      setResult(updated);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.message} (HTTP ${e.status})`);
      else setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Work Orders</h1>
            <p className="mt-1 text-sm text-slate-600">
              Real backend: update lifecycle via <code className="rounded bg-slate-50 px-1">PATCH /workorders/:id/status</code>.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Note: MVP backend currently exposes create-from-alert and patch-status, but not list. This page avoids mock data by operating directly on IDs.
            </p>
          </div>
          <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/">
            ← Dashboard
          </Link>
        </header>

        <section className="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Update Work Order Status</h2>

          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Work Order ID</span>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={workOrderId}
                onChange={(ev) => setWorkOrderId(ev.target.value)}
                placeholder="e.g. 12"
                inputMode="numeric"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">New Status</span>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={status}
                onChange={(ev) => setStatus(ev.target.value as WorkOrderStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Updating…" : "Update status"}
            </button>
          </form>
        </section>

        {result ? (
          <section className="mt-6 rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold">Updated</h2>
            <div className="mt-2 text-sm text-slate-700">
              <div>ID: {result.id}</div>
              <div>Asset: {result.asset_id}</div>
              <div>Status: {result.status}</div>
              <div>Assignee: {result.assignee ?? "—"}</div>
              <div>Updated: {new Date(result.updated_at).toLocaleString()}</div>
            </div>
            <div className="mt-3">
              <Link className="text-sm text-blue-600 hover:underline" href={`/assets/${result.asset_id}`}>
                View asset timeline →
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
