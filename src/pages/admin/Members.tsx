import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Link2,
  MessageSquare,
  Plus,
  Clock,
  Search,
  Upload,
  UserPlus,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { Avatar, Field, SmsModal, StatusPill } from "../../components/ui";
import { parseCsv } from "../../lib/csv";
import { navigate } from "../../lib/router";

export default function Members() {
  const { state, addMembers, queueMemberSms } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<{
    rows: { name: string; phone: string; membershipCode: string }[];
    errors: string[];
  } | null>(null);
  const [fileName, setFileName] = useState("");
  const [notice, setNotice] = useState("");
  const [manual, setManual] = useState({ name: "", phone: "", membershipCode: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "invited" | "queued" | "submitted" | "approved">("all");
  const [activeSms, setActiveSms] = useState<{
    name: string;
    phone: string;
    inviteCode: string;
    otp: string;
    link: string;
  } | null>(null);

  const members = useMemo(
    () => [...state.members].sort((a, b) => a.invitedAt - b.invitedAt),
    [state.members]
  );

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.membershipCode.toLowerCase().includes(q) ||
        m.inviteCode.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "invited") return m.status === "invited";
      if (statusFilter === "queued") return Boolean(m.smsQueuedAt);
      if (statusFilter === "submitted") return m.status === "submitted" || m.status === "pending";
      if (statusFilter === "approved") return m.status === "approved" || m.status === "printed";
      return true;
    });
  }, [members, search, statusFilter]);

  const onFile = async (file: File) => {
    const text = await file.text();
    const result = parseCsv(text);
    setParsed(result);
    setFileName(file.name);
    setNotice(result.errors[0] ?? "");
  };

  const handleQueueSms = (memberId: string) => {
    const sms = queueMemberSms(memberId);
    if (sms) {
      setActiveSms(sms);
    } else {
      setNotice("Could not prepare this invitation. The member record was not found.");
    }
  };

  const copyInvite = async (code: string) => {
    const link = `${window.location.origin}${window.location.pathname}#/kyc/${code.toLowerCase()}`;
    try {
      await navigator.clipboard.writeText(link);
      setNotice(`✓ Link copied for code ${code}!`);
      setTimeout(() => setNotice(""), 2500);
    } catch {
      // ignore
    }
  };

  const exportMembersCsv = () => {
    const headers = ["Full Name", "Mobile (+977)", "Membership Code", "Status", "Invite Code", "OTP", "Invited Date"];
    const rows = filteredMembers.map((m) => [
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.phone}"`,
      `"${m.membershipCode}"`,
      `"${m.status}"`,
      `"${m.inviteCode}"`,
      `"${m.otp}"`,
      `"${new Date(m.invitedAt).toLocaleDateString()}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `coop-members-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotice(`✓ Exported ${filteredMembers.length} member records to CSV!`);
    setTimeout(() => setNotice(""), 3000);
  };

  const submitManual = (e: FormEvent) => {
    e.preventDefault();
    const cleanPhone = manual.phone.trim().replace(/\D/g, "");
    if (!manual.name.trim() || !cleanPhone) return;

    if (cleanPhone.length !== 10) {
      setNotice("⚠ Please enter a valid 10-digit mobile number (e.g. 9812345678).");
      return;
    }

    addMembers([
      {
        name: manual.name.trim(),
        phone: cleanPhone,
        membershipCode: manual.membershipCode.trim(),
      },
    ]);
    setManual({ name: "", phone: "", membershipCode: "" });
    setNotice("✓ Member added! Invite details generated; no SMS was sent.");
    setTimeout(() => setNotice(""), 3000);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
          Member Directory & Local SMS Queue
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
        Prepare invitations with each member's phone number, personal link, and OTP. Open your SMS app to send; messages are not sent automatically.
        </p>
      </div>

      {notice && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center text-xs font-bold text-emerald-800 animate-fade-in">
          {notice}
        </div>
      )}

      {/* CSV Import Card */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Upload className="h-4 w-4 text-[#145C45]" /> Bulk Member Import (CSV)
        </h3>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void onFile(f);
          }}
          onClick={() => fileRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragOver
              ? "border-[#145C45]/40 bg-[#145C45]/5"
              : "border-slate-300 bg-slate-50/70 hover:bg-slate-100/70"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DDF3E7] text-[#145C45]">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Drag & drop member CSV file here or click to browse
          </p>
          <p className="text-xs text-slate-400">
            Expected columns: Full Name, Phone Number, Membership Code
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </div>

        <div className="flex gap-2">
          <a
            href={`${import.meta.env.BASE_URL}sample-members.csv`}
            download="sample-members.csv"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" /> Download sample CSV
          </a>
        </div>

        {/* CSV Preview */}
        {parsed && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800">
                Preview: {fileName} ({parsed.rows.length} valid members found)
              </p>
              <button
                onClick={() => {
                  addMembers(parsed.rows);
                  setParsed(null);
                  setFileName("");
                  setNotice(`✓ Added ${parsed.rows.length} members successfully!`);
                  setTimeout(() => setNotice(""), 3000);
                }}
                className="flex items-center gap-1 rounded-xl bg-[#145C45] hover:bg-[#0f4534] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Import All
              </button>
            </div>
            <div className="max-h-40 overflow-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-bold">#</th>
                    <th className="px-3 py-2 font-bold">Name</th>
                    <th className="px-3 py-2 font-bold">Phone</th>
                    <th className="px-3 py-2 font-bold">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 10).map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5 font-bold text-slate-800">{r.name}</td>
                      <td className="px-3 py-1.5 font-mono">{r.phone}</td>
                      <td className="px-3 py-1.5 font-semibold text-[#145C45]">
                        {r.membershipCode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Manual Member Add */}
      <form
        onSubmit={submitManual}
        className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-3"
      >
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <UserPlus className="h-4 w-4 text-[#145C45]" /> Add Single Member Manually
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Full Name" required>
            <input
              required
              value={manual.name}
              onChange={(e) => setManual({ ...manual, name: e.target.value })}
              placeholder="e.g. Ramesh Karki"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs sm:text-sm outline-none transition focus:border-[#145C45] focus:ring-2 focus:ring-[#DDF3E7]"
            />
          </Field>
          <Field label="Mobile Number" required>
            <input
              required
              value={manual.phone}
              onChange={(e) => setManual({ ...manual, phone: e.target.value })}
              placeholder="e.g. 9812345678"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs sm:text-sm outline-none transition focus:border-[#145C45] focus:ring-2 focus:ring-[#DDF3E7] font-mono"
            />
          </Field>
          <Field label="Membership Code">
            <input
              value={manual.membershipCode}
              onChange={(e) => setManual({ ...manual, membershipCode: e.target.value })}
              placeholder="Auto-generated if empty"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs sm:text-sm outline-none transition focus:border-[#145C45] focus:ring-2 focus:ring-[#DDF3E7]"
            />
          </Field>
        </div>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#145C45] hover:bg-[#0f4534] py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition sm:w-auto sm:px-6 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Save &amp; Generate SMS Invite
        </button>
      </form>

      {/* Members Directory List */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <UsersIcon className="h-4 w-4 text-[#145C45]" /> Registered Cooperative Members ({members.length})
            </h3>
            <p className="text-xs text-slate-400">Manage member roster, invite links, and SMS generation</p>
          </div>
          <button
            type="button"
            onClick={exportMembersCsv}
            disabled={members.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#145C45]/30 bg-[#DDF3E7]/60 hover:bg-[#DDF3E7] text-[#145C45] px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export Members CSV
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member by name, phone, or membership code..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-8 text-xs font-medium text-slate-800 outline-none transition focus:border-[#145C45] focus:bg-white focus:ring-2 focus:ring-[#DDF3E7]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { key: "all", label: `All (${members.length})` },
                { key: "invited", label: "Invited" },
                { key: "queued", label: "SMS Queued" },
                { key: "submitted", label: "Pending Review" },
                { key: "approved", label: "Approved" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  statusFilter === f.key
                    ? "bg-[#145C45] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-[#DDF3E7] hover:text-[#145C45]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredMembers.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200">
              {search || statusFilter !== "all"
                ? "No members match the current search or filter criteria."
                : "No members found. Upload a CSV or add manually above."}
            </div>
          )}

          {filteredMembers.map((m) => {
            const isDemo = m.isDemo || m.id === "mem_ram";
            return (
              <div
                key={m.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-3.5 border transition ${
                  isDemo
                    ? "border-[#145C45]/30 bg-[#145C45]/5 ring-1 ring-[#145C45]/30"
                    : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/60"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={m.name} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {m.name}
                      </p>
                      {isDemo && (
                        <span className="rounded-full bg-[#145C45] text-white text-[10px] font-extrabold px-2 py-0.5">
                          Demo Member
                        </span>
                      )}
                      <StatusPill status={m.status} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Code: <span className="font-bold text-slate-700">{m.membershipCode}</span> · Phone:{" "}
                      <span className="font-mono text-slate-700">+977 {m.phone}</span> · Invite link:{" "}
                      <span className="font-mono font-bold text-[#145C45] break-all">
                        {window.location.origin}{window.location.pathname}#/kyc/{m.inviteCode.toLowerCase()}
                      </span>{" "}
                      · OTP: <span className="font-mono font-bold text-amber-700">{m.otp}</span>
                    </p>
                    {m.smsQueuedAt && (
                      <p className="mt-1 text-[11px] font-bold text-amber-700">
                        Invitation queued locally · not delivered
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons for this member */}
                <div className="flex flex-wrap items-center justify-end gap-1.5 self-stretch sm:self-auto">
                  {/* Send / Preview SMS Button */}
                  <button
                    onClick={() => handleQueueSms(m.id)}
                    className="flex items-center gap-1 rounded-xl bg-[#145C45] hover:bg-[#0f4534] active:scale-95 text-white px-3 py-2 text-xs font-bold shadow-sm transition cursor-pointer"
                    title="Queue SMS text locally and copy it for manual sending"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Queue SMS</span>
                  </button>

                  {/* Copy Link */}
                  <button
                    onClick={() => void copyInvite(m.inviteCode)}
                    className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-2.5 py-2 text-xs font-medium text-slate-700 transition cursor-pointer"
                    title="Copy KYC link to clipboard"
                    aria-label="Copy link"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Open Direct */}
                  <button
                    onClick={() => navigate(`/manager-kyc/${m.inviteCode.toLowerCase()}`)}
                    className="flex items-center gap-1 rounded-xl border border-[#145C45]/30 bg-[#145C45]/5 hover:bg-[#DDF3E7] px-2.5 py-2 text-xs font-bold text-[#145C45] transition cursor-pointer"
                    title="Open form page"
                    aria-label="Open Form"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SMS Simulation Modal */}
      <SmsModal
        open={Boolean(activeSms)}
        onClose={() => setActiveSms(null)}
        data={activeSms}
      />
    </div>
  );
}
