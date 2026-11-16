import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CheckSquare,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Link2,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  Square,
  Upload,
  UserPlus,
  Users as UsersIcon,
  X,
  XCircle,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { Avatar, Field, SmsModal, StatusPill } from "../../components/ui";
import { BulkSmsModal } from "../../components/BulkSmsModal";
import type { BulkSmsResult } from "../../lib/types";
import { parseCsv } from "../../lib/csv";
import { navigate } from "../../lib/router";
import { SAMPLE_MEMBERS_CSV } from "../../config/demoData";

type MemberFilterKey =
  | "all"
  | "active"
  | "inactive"
  | "unsent"
  | "sent"
  | "approved";

export default function Members() {
  const {
    state,
    addMembers,
    queueMemberSms,
    queueBulkSms,
    toggleMemberActive,
  } = useStore();
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
  const [statusFilter, setStatusFilter] = useState<MemberFilterKey>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkResult, setBulkResult] = useState<BulkSmsResult | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
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

  // Stats calculation
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.isActive !== false).length;
  const inactiveCount = members.filter((m) => m.isActive === false).length;
  const unsentCount = members.filter(
    (m) => m.isActive !== false && !m.smsQueuedAt && m.status === "invited"
  ).length;
  const sentCount = members.filter(
    (m) => Boolean(m.smsQueuedAt) || m.status !== "invited"
  ).length;

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
      if (statusFilter === "active") return m.isActive !== false;
      if (statusFilter === "inactive") return m.isActive === false;
      if (statusFilter === "unsent")
        return m.isActive !== false && !m.smsQueuedAt && m.status === "invited";
      if (statusFilter === "sent")
        return Boolean(m.smsQueuedAt) || m.status !== "invited";
      if (statusFilter === "approved")
        return m.status === "approved" || m.status === "printed";
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
    const member = state.members.find((m) => m.id === memberId);
    if (!member) {
      setNotice("Could not prepare this invitation. The member record was not found.");
      return;
    }
    if (member.isActive === false) {
      setNotice(`⚠ ${member.name} is marked as Inactive. Activate member to send SMS.`);
      return;
    }
    const sms = queueMemberSms(memberId);
    if (sms) {
      setActiveSms(sms);
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

  // Selection handlers
  const toggleSelectMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredMembers.map((m) => m.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSelectAllUnsent = () => {
    const unsentIds = members
      .filter((m) => m.isActive !== false && !m.smsQueuedAt && m.status === "invited")
      .map((m) => m.id);
    setSelectedIds(unsentIds);
    setNotice(`✓ Selected ${unsentIds.length} active members with unsent SMS.`);
    setTimeout(() => setNotice(""), 2500);
  };

  // Bulk SMS Actions
  const handleBulkSendAllUnsent = () => {
    const res = queueBulkSms();
    setBulkResult(res);
    setShowBulkModal(true);
    setNotice(
      `✓ Bulk SMS Action: ${res.queued.length} queued, ${res.skippedAlreadySent.length} skipped (already sent), ${res.skippedInactive.length} skipped (inactive).`
    );
  };

  const handleBulkSendSelected = () => {
    if (selectedIds.length === 0) return;
    const res = queueBulkSms(selectedIds);
    setBulkResult(res);
    setShowBulkModal(true);
    setSelectedIds([]);
    setNotice(
      `✓ Bulk SMS Action: ${res.queued.length} queued, ${res.skippedAlreadySent.length} skipped (already sent), ${res.skippedInactive.length} skipped (inactive).`
    );
  };

  const exportMembersCsv = () => {
    const headers = [
      "Full Name",
      "Mobile (+977)",
      "Membership Code",
      "Member Status",
      "SMS Status",
      "KYC Status",
      "Invite Code",
      "OTP",
      "Invited Date",
    ];
    const rows = filteredMembers.map((m) => [
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.phone}"`,
      `"${m.membershipCode}"`,
      `"${m.isActive === false ? "Inactive" : "Active"}"`,
      `"${m.smsQueuedAt ? "SMS Sent" : "SMS Not Sent"}"`,
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
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_MEMBERS_CSV)}`}
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
        {/* Header & CSV Export */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <UsersIcon className="h-5 w-5 text-[#145C45]" /> Registered Cooperative Members ({totalCount})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage member active status, bulk SMS invitations, and automated duplicate exclusion
            </p>
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

        {/* ── Key Member & SMS Distribution Metrics ──────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Members</span>
            <p className="text-lg font-black text-slate-800">{totalCount}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Active (सक्रिय)</span>
            <p className="text-lg font-black text-emerald-900">{activeCount}</p>
          </div>
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Inactive (निष्क्रिय)</span>
            <p className="text-lg font-black text-amber-900">{inactiveCount}</p>
          </div>
          <div className="rounded-2xl bg-teal-50 border border-teal-200 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#145C45]">SMS Not Sent</span>
            <p className="text-lg font-black text-[#145C45]">{unsentCount}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl bg-sky-50 border border-sky-200 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">SMS Sent / Done</span>
            <p className="text-lg font-black text-sky-900">{sentCount}</p>
          </div>
        </div>

        {/* ── Bulk Action Panel (Supervisor Requirement) ────────────────── */}
        <div className="rounded-2xl border-2 border-[#145C45]/25 bg-gradient-to-r from-[#DDF3E7]/40 via-white to-[#DDF3E7]/20 p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#145C45] text-white">
                  <Send className="h-3.5 w-3.5" />
                </span>
                <h4 className="text-sm font-extrabold text-[#145C45]">
                  थोक एसएमएस प्रेषण कार्य (Bulk SMS Dispatch Action)
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Smart rule applied:</strong> SMS is queued only for{" "}
                <span className="font-bold text-[#145C45]">Active members who have NOT received SMS yet</span>.
                Members who already received SMS or are marked Inactive are automatically skipped.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
              {/* Select All Unsent Quick Helper */}
              {unsentCount > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllUnsent}
                  className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Select Unsent ({unsentCount})
                </button>
              )}

              {/* Bulk Send to Selected */}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkSendSelected}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-4 py-2 text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send SMS to Selected ({selectedIds.length})</span>
                </button>
              )}

              {/* Master Bulk Send to All Unsent */}
              <button
                type="button"
                onClick={handleBulkSendAllUnsent}
                disabled={unsentCount === 0}
                className="flex items-center gap-2 rounded-xl bg-[#145C45] hover:bg-[#0f4534] active:scale-95 text-white px-4 py-2.5 text-xs sm:text-sm font-extrabold shadow-md shadow-[#145C45]/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4 text-[#DDF3E7]" />
                <span>
                  {unsentCount > 0
                    ? `Queue Bulk SMS for All Unsent (${unsentCount})`
                    : "All Active Members Already Contacted"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Toolbar ────────────────────────────────────── */}
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

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { key: "all", label: `All (${totalCount})` },
                { key: "active", label: `Active (${activeCount})` },
                { key: "inactive", label: `Inactive (${inactiveCount})` },
                { key: "unsent", label: `SMS Unsent (${unsentCount})` },
                { key: "sent", label: `SMS Sent (${sentCount})` },
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

        {/* ── Selection Batch Bar (when members are selected) ─────────────── */}
        <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-[#145C45] cursor-pointer"
            >
              {filteredMembers.length > 0 &&
              filteredMembers.every((m) => selectedIds.includes(m.id)) ? (
                <CheckSquare className="h-4 w-4 text-[#145C45]" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
              <span>Select All Visible ({filteredMembers.length})</span>
            </button>
            {selectedIds.length > 0 && (
              <span className="text-[11px] font-semibold text-[#145C45] bg-[#DDF3E7] px-2 py-0.5 rounded-full">
                {selectedIds.length} selected
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* ── Members List ────────────────────────────────────────────────── */}
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
            const isSelected = selectedIds.includes(m.id);
            const isActive = m.isActive !== false;
            const hasReceivedSms = Boolean(m.smsQueuedAt) || m.status !== "invited";

            return (
              <div
                key={m.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-3.5 border transition ${
                  isSelected
                    ? "border-[#145C45] bg-[#DDF3E7]/40 ring-2 ring-[#145C45]/20"
                    : !isActive
                    ? "border-amber-200/80 bg-amber-50/20 opacity-80"
                    : isDemo
                    ? "border-[#145C45]/30 bg-[#145C45]/5 ring-1 ring-[#145C45]/30"
                    : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/60"
                }`}
              >
                <div className="flex min-w-0 items-start sm:items-center gap-3">
                  {/* Select Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelectMember(m.id)}
                    className="mt-1 sm:mt-0 p-1 text-slate-400 hover:text-[#145C45] transition cursor-pointer shrink-0"
                    aria-label={`Select ${m.name}`}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-[#145C45]" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>

                  <Avatar name={m.name} size="sm" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {m.name}
                      </p>

                      {/* Active vs Inactive Pill */}
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5">
                          <PauseCircle className="h-3 w-3 text-amber-700" /> Inactive (निष्क्रिय)
                        </span>
                      )}

                      {/* SMS Status Badge */}
                      {hasReceivedSms ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5">
                          <Clock className="h-3 w-3 text-sky-600" /> SMS Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold px-2 py-0.5">
                          ⏳ SMS Not Sent
                        </span>
                      )}

                      {isDemo && (
                        <span className="rounded-full bg-[#145C45] text-white text-[10px] font-extrabold px-2 py-0.5">
                          Demo
                        </span>
                      )}

                      <StatusPill status={m.status} />
                    </div>

                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Code: <span className="font-bold text-slate-700">{m.membershipCode}</span> · Phone:{" "}
                      <span className="font-mono text-slate-700">+977 {m.phone}</span> · Invite:{" "}
                      <span className="font-mono font-bold text-[#145C45] break-all">
                        {window.location.origin}{window.location.pathname}#/kyc/{m.inviteCode.toLowerCase()}
                      </span>{" "}
                      · OTP: <span className="font-mono font-bold text-amber-700">{m.otp}</span>
                    </p>

                    {m.smsQueuedAt && (
                      <p className="mt-0.5 text-[10px] font-semibold text-sky-800">
                        ✓ SMS invitation was previously prepared for this member
                      </p>
                    )}
                    {!isActive && (
                      <p className="mt-0.5 text-[10px] font-bold text-amber-700">
                        ⚠ Excluded from bulk SMS because member account is marked Inactive
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons for this member */}
                <div className="flex flex-wrap items-center justify-end gap-1.5 self-stretch sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Active / Inactive Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleMemberActive(m.id);
                      setNotice(
                        `✓ ${m.name} is now marked as ${!isActive ? "Active (सक्रिय)" : "Inactive (निष्क्रिय)"}.`
                      );
                      setTimeout(() => setNotice(""), 2500);
                    }}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold border transition cursor-pointer ${
                      isActive
                        ? "border-slate-200 bg-white hover:bg-amber-50 hover:text-amber-800 text-slate-600"
                        : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                    title={isActive ? "Mark member as Inactive" : "Mark member as Active"}
                  >
                    {isActive ? (
                      <>
                        <PauseCircle className="h-3.5 w-3.5 text-slate-400" />
                        <span>Set Inactive</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>

                  {/* Send / Queue SMS Button */}
                  <button
                    onClick={() => handleQueueSms(m.id)}
                    disabled={!isActive}
                    className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shadow-xs transition cursor-pointer ${
                      !isActive
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : hasReceivedSms
                        ? "border border-[#145C45]/30 bg-[#DDF3E7] hover:bg-[#cbebd9] text-[#145C45]"
                        : "bg-[#145C45] hover:bg-[#0f4534] active:scale-95 text-white"
                    }`}
                    title={
                      !isActive
                        ? "Member is inactive"
                        : hasReceivedSms
                        ? "Resend or inspect SMS invitation"
                        : "Queue SMS invitation"
                    }
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>{hasReceivedSms ? "Resend SMS" : "Queue SMS"}</span>
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
                    title="Open KYC form directly"
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

      {/* Single SMS Modal */}
      <SmsModal
        open={Boolean(activeSms)}
        onClose={() => setActiveSms(null)}
        data={activeSms}
      />

      {/* Bulk SMS Dispatch Result Modal */}
      <BulkSmsModal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        result={bulkResult}
      />
    </div>
  );
}
