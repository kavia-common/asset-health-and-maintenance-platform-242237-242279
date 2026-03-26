import Link from "next/link";

import { createAsset, listAssets } from "@/lib/client";
import type { AssetCreateMVP } from "@/lib/types";

async function createAssetAction(formData: FormData) {
  "use server";

  const payload: AssetCreateMVP = {
    asset_tag: String(formData.get("asset_tag") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    asset_type: String(formData.get("asset_type") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    manufacturer: String(formData.get("manufacturer") ?? "").trim() || null,
    installation_date: String(formData.get("installation_date") ?? "").trim() || null,
    last_service_date: String(formData.get("last_service_date") ?? "").trim() || null,
  };

  // Basic server-side validation for demo UX
  if (!payload.asset_tag || !payload.name) {
    // In a full app we'd return structured action state; keep simple here.
    throw new Error("asset_tag and name are required");
  }

  await createAsset(payload);
}

export default async function AssetsPage() {
  const assets = await listAssets();

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Assets</h1>
            <p className="mt-1 text-sm text-slate-600">Backed by FastAPI: GET/POST /assets, GET /assets/:id.</p>
          </div>
          <Link className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" href="/">
            ← Dashboard
          </Link>
        </header>

        <section className="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Create Asset</h2>
          <form action={createAssetAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Asset Tag *</span>
              <input name="asset_tag" className="rounded-lg border border-slate-200 px-3 py-2" placeholder="TX-POLE-0001" required />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Name *</span>
              <input name="name" className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Pole 0001" required />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Type</span>
              <input name="asset_type" className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Pole / Transformer / Substation" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Location</span>
              <input name="location" className="rounded-lg border border-slate-200 px-3 py-2" placeholder="North Yard" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Manufacturer</span>
              <input name="manufacturer" className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Acme Utilities" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Installation Date</span>
              <input name="installation_date" type="date" className="rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Last Service Date</span>
              <input name="last_service_date" type="date" className="rounded-lg border border-slate-200 px-3 py-2" />
            </label>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Asset Register</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Tag</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Location</th>
                  <th className="py-2 pr-3">Health</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3">{a.id}</td>
                    <td className="py-2 pr-3 font-medium">{a.asset_tag}</td>
                    <td className="py-2 pr-3">{a.name}</td>
                    <td className="py-2 pr-3 text-slate-600">{a.asset_type ?? "—"}</td>
                    <td className="py-2 pr-3 text-slate-600">{a.location ?? "—"}</td>
                    <td className="py-2 pr-3">{Math.round(a.health_score)}</td>
                    <td className="py-2 pr-3">
                      <Link className="text-blue-600 hover:underline" href={`/assets/${a.id}`}>
                        Details & timeline
                      </Link>
                    </td>
                  </tr>
                ))}
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-slate-600">
                      No assets yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
