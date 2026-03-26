import Link from "next/link";
import { notFound } from "next/navigation";

import { getAsset, getTimeline } from "@/lib/client";

function eventBadge(eventType: string): string {
  if (eventType.includes("inspection")) return "bg-slate-50 text-slate-700 ring-slate-200";
  if (eventType.includes("alert")) return "bg-red-50 text-red-700 ring-red-200";
  if (eventType.includes("work_order")) return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

export default async function AssetDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assetId = Number(id);
  if (!Number.isFinite(assetId)) notFound();

  // If asset doesn't exist, backend returns 404; Next will surface an error.
  // For cleaner UX you can add error.tsx later; keep minimal as requested.
  const [asset, timeline] = await Promise.all([
    getAsset(assetId),
    getTimeline(assetId, 200),
  ]);

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{asset.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {asset.asset_tag} • {asset.asset_type ?? "—"} • {asset.location ?? "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/assets">
              ← Assets
            </Link>
            <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/inspections">
              Log inspection →
            </Link>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Health Score</div>
            <div className="mt-2 text-3xl font-semibold">{Math.round(asset.health_score)}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Manufacturer</div>
            <div className="mt-2 text-sm">{asset.manufacturer ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-medium text-slate-500">Installed / Last Service</div>
            <div className="mt-2 text-sm text-slate-700">
              <div>Installed: {asset.installation_date ?? "—"}</div>
              <div>Last service: {asset.last_service_date ?? "—"}</div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <div className="mt-4 space-y-3">
            {timeline.map((e) => (
              <div key={e.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ring-1 ${eventBadge(String(e.event_type))}`}>
                      {String(e.event_type)}
                    </span>
                    <span className="text-sm font-medium">{e.description}</span>
                  </div>
                  <div className="text-xs text-slate-500">{new Date(e.timestamp).toLocaleString()}</div>
                </div>

                {/* If this was an inspection and a photo exists, show a preview link.
                   The timeline event doesn't include photo_path, so we just provide a hint to look at latest inspection via Inspections module.
                   For MVP wiring, photo display is handled after uploading in Inspections page (see /inspections).
                */}
              </div>
            ))}
            {timeline.length === 0 ? (
              <div className="text-sm text-slate-600">No timeline events yet.</div>
            ) : null}
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Inspection photos are served by the backend via <code className="rounded bg-slate-50 px-1">GET /files/&lt;photo_path&gt;</code>.
            Example URL builder: <code className="rounded bg-slate-50 px-1">buildFileUrl(photo_path)</code>.
          </div>
        </section>
      </div>
    </main>
  );
}
