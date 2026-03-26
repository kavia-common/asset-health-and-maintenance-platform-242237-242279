"use client";

import Link from "next/link";
import React from "react";

import { ApiError } from "@/lib/api";
import { buildFileUrl, createInspection, listAssets } from "@/lib/client";
import type { AssetOutMVP, InspectionOutMVP } from "@/lib/types";

export default function InspectionsPage() {
  const [assets, setAssets] = React.useState<AssetOutMVP[]>([]);
  const [loadingAssets, setLoadingAssets] = React.useState(true);

  const [assetId, setAssetId] = React.useState<number | "">("");
  const [conditionRating, setConditionRating] = React.useState(3);
  const [observations, setObservations] = React.useState("");
  const [photo, setPhoto] = React.useState<File | null>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<InspectionOutMVP | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const a = await listAssets();
        if (!alive) return;
        setAssets(a);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load assets");
      } finally {
        if (!alive) return;
        setLoadingAssets(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (assetId === "") {
      setError("Please select an asset.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createInspection({
        asset_id: assetId,
        condition_rating: conditionRating,
        observations: observations.trim() || undefined,
        // Let backend default timestamp; can add ISO string if desired.
        photo,
      });
      setResult(created);
      setObservations("");
      setPhoto(null);
      // Keep rating and asset selection for quick repeated entry
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`${e.message} (HTTP ${e.status})`);
      } else {
        setError(e instanceof Error ? e.message : "Failed to create inspection");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Log Inspection</h1>
            <p className="mt-1 text-sm text-slate-600">Real backend: multipart POST /inspections (optional photo).</p>
          </div>
          <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/">
            ← Dashboard
          </Link>
        </header>

        <section className="mt-6 rounded-xl border border-slate-200 p-5">
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Asset</span>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={assetId}
                onChange={(ev) => setAssetId(ev.target.value ? Number(ev.target.value) : "")}
                disabled={loadingAssets}
              >
                <option value="">{loadingAssets ? "Loading assets..." : "Select an asset"}</option>
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
                Photos are stored server-side and served via <code className="rounded bg-slate-50 px-1">GET /files/&lt;photo_path&gt;</code>.
              </span>
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
              {submitting ? "Submitting..." : "Submit inspection"}
            </button>
          </form>
        </section>

        {result ? (
          <section className="mt-6 rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold">Inspection Created</h2>
            <div className="mt-2 text-sm text-slate-700">
              <div>ID: {result.id}</div>
              <div>Asset: {result.asset_id}</div>
              <div>Condition: {result.condition_rating}</div>
              <div>Timestamp: {new Date(result.timestamp).toLocaleString()}</div>
            </div>

            {result.photo_path ? (
              <div className="mt-4">
                <div className="text-sm font-medium">Photo preview</div>
                {/* Use <img> for simplicity; in a production Next.js app you might use next/image with remotePatterns. */}
                <img
                  className="mt-2 max-h-80 rounded-lg border border-slate-200 object-contain"
                  src={buildFileUrl(result.photo_path)}
                  alt="Inspection upload"
                />
                <div className="mt-2 text-xs text-slate-500">
                  Stored as: <code className="rounded bg-slate-50 px-1">{result.photo_path}</code>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-600">No photo uploaded.</div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
