import { useEffect, useState } from "react";
import PageLayout from "@/components/ui/PageLayout";
import { listLeads, createLead, updateLead, convertLead } from "@/services/api";
import type { CrmLead } from "@/services/api";

export default function LeadsPage() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLeads();
      setLeads(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLead(form);
      setForm({ full_name: "", email: "", phone: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  };

  const setStatus = async (id: string, status: string) => {
    await updateLead(id, { status });
    await load();
  };

  const handleConvert = async (id: string) => {
    await convertLead(id);
    await load();
  };

  return (
    <PageLayout title="CRM Leads">
      {loading && <div className="p-4 text-sm text-gray-400">Loading…</div>}
      {error && <div className="p-4 text-sm text-red-400">Error: {error}</div>}

      <form onSubmit={handleCreate} className="p-4 mb-4 bg-slate-800 rounded space-y-3">
        <div className="flex gap-3 flex-wrap">
          <input
            className="px-3 py-2 rounded bg-slate-700 text-white border border-slate-600"
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <input
            className="px-3 py-2 rounded bg-slate-700 text-white border border-slate-600"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="px-3 py-2 rounded bg-slate-700 text-white border border-slate-600"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            + Add Lead
          </button>
        </div>
      </form>

      {!loading && !leads.length && (
        <div className="p-4 text-sm text-gray-400">No leads yet.</div>
      )}

      {!!leads.length && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-800">
                  <td className="px-3 py-2 text-white">{lead.full_name}</td>
                  <td className="px-3 py-2 text-slate-300">{lead.status}</td>
                  <td className="px-3 py-2 text-slate-200">{lead.email ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-200">{lead.phone ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {lead.status !== "converted" && (
                        <button
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                          onClick={() => void setStatus(lead.id, "qualified")}
                        >
                          Qualify
                        </button>
                      )}
                      {lead.status !== "converted" && (
                        <button
                          className="px-2 py-1 text-xs bg-emerald-600 text-white rounded"
                          onClick={() => void handleConvert(lead.id)}
                        >
                          Convert
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}
