"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import { ApiError } from "@/lib/api";
import { buildFileUrl, createInspection, listAssets, listInspections } from "@/lib/client";
import type { AssetOutMVP, InspectionOutMVP } from "@/lib/types";

function formatTs(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export default function InspectionsPage() {
  const [assets, setAssets] = React.useState<AssetOutMVP[]>([]);
  const [loadingAssets, setLoadingAssets] = React.useState(true);

  const [inspections, setInspections] = React.useState<InspectionOutMVP[]>([]);
  const [loadingInspections, setLoadingInspections] = React.useState(true);

  const [assetId, setAssetId] = React.useState<number | "">("");
  const [conditionRating, setConditionRating] = React.useState(3);
  const [observations, setObservations] = React.useState("");
  const [photo, setPhoto] = React.useState<File | null>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [created, setCreated] = React.useState<InspectionOutMVP | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function refreshAssets() {
    setLoadingAssets(true);
    try {
      const a = await listAssets();
      setAssets(a);
    } finally {
      setLoadingAssets(false);
    }
  }

  async function refreshInspections(assetFilter?: number) {
    setLoadingInspections(true);
    try {
      const items = await listInspections({ asset_id: assetFilter, limit: 100 });
      // Show newest first for operator UX
      items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
      setInspections(items);
    } finally {
      setLoadingInspections(false);
    }
  }

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await Promise.all([refreshAssets(), refreshInspections()]);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load inspections data");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);

    if (assetId === "") {
      setError("Please select an asset.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createInspection({
        asset_id: assetId,
        condition_rating: conditionRating,
        observations: observations.trim() || undefined,
        // Backend defaults timestamp; send photo via multipart if present.
        photo,
      });
      setCreated(result);
      setObservations("");
      setPhoto(null);

      // Refresh list to show the newly-created inspection
      await refreshInspections(assetId);
    } catch (e) {
      if (e instanceof ApiError) setError(`${e.message} (HTTP ${e.status})`);
      else setError(e instanceof Error ? e.message : "Failed to create inspection");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredAssetId = assetId === "" ? undefined : assetId;

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Inspections</h1>
            <p className="mt-1 text-sm text-slate-600">
              Live backend: <code className="rounded bg-slate-50 px-1">GET /inspections</code>,{" "}
              <code className="rounded bg-slate-50 px-1">POST /inspections</code> (multipart with optional photo),
              photos served by <code className="rounded bg-slate-50 px-1">GET /files/&lt;photo_path&gt;</code>.
            </p>
          </div>
          <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/">
            ← Dashboard
          </Link>
        </header>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold">Log Inspection</h2>

            <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">Asset</span>
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  value={assetId}
                  onChange={(ev) => {
                    const v = ev.target.value ? Number(ev.target.value) : "";
                    setAssetId(v);
                    // Re-filter list immediately when selecting an asset (no mock data).
                    void refreshInspections(v === "" ? undefined : v);
                  }}
                  disabled={loadingAssets}
                >
                  <option value="">
                    {loadingAssets ? "Loading assets..." : "All assets (no filter)"}
                  </option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_tag} — {a.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">Condition Rating (1–5)</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  value={conditionRating}
                  onChange={(ev) => setConditionRating(Number(ev.target.value))}
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">Observations</span>
                <textarea
                  className="min-h-24 rounded-lg border border-slate-200 px-3 py-2"
                  value={observations}
                  onChange={(ev) => setObservations(ev.target.value)}
                  placeholder="Cracks near base, corrosion on bolts…"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">Photo (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  onChange={(ev) => setPhoto(ev.target.files?.item(0) ?? null)}
                />
                <span className="text-xs text-slate-500">
                  Uploaded via <code className="rounded bg-slate-50 px-1">FormData</code> to{" "}
                  <code className="rounded bg-slate-50 px-1">POST /inspections</code>.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit inspection"}
              </button>
            </form>

            {created ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                Created inspection <span className="font-medium">#{created.id}</span> for asset{" "}
                <span className="font-medium">#{created.asset_id}</span>.
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Recent Inspections</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {filteredAssetId ? (
                    <>Filtered by asset #{filteredAssetId}.</>
                  ) : (
                    <>Showing all assets.</>
                  )}
                </p>
              </div>
              <button
                onClick={() => void refreshInspections(filteredAssetId)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            {loadingInspections ? <div className="mt-3 text-sm text-slate-600">Loading…</div> : null}

            {!loadingInspections && inspections.length === 0 ? (
              <div className="mt-3 text-sm text-slate-600">No inspections found.</div>
            ) : null}

            <div className="mt-4 space-y-4">
              {inspections.slice(0, 20).map((i) => (
                <div key={i.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium">
                      Inspection #{i.id} • Asset #{i.asset_id}
                    </div>
                    <div className="text-xs text-slate-500">{formatTs(i.timestamp)}</div>
                  </div>

                  <div className="mt-1 text-sm text-slate-700">
                    Condition: <span className="font-medium">{i.condition_rating}</span>
                  </div>

                  {i.observations ? (
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="text-slate-500">Observations:</span> {i.observations}
                    </div>
                  ) : null}

                  {i.photo_path ? (
                    <div className="mt-3">
                      <div className="text-xs text-slate-500">
                        Photo path: <code className="rounded bg-slate-50 px-1">{i.photo_path}</code>
                      </div>
                      <Image
                        className="mt-2 max-h-64 w-full rounded-lg border border-slate-200 object-contain"
                        src={buildFileUrl(i.photo_path)}
                        alt={`Inspection ${i.id} photo`}
                        width={960}
                        height={640}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-slate-500">No photo.</div>
                  )}
                </div>
              ))}
            </div>

            {inspections.length > 20 ? (
              <div className="mt-4 text-xs text-slate-500">Showing 20 of {inspections.length}.</div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
