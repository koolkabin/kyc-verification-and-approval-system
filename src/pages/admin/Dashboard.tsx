import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
  FileText,
  Printer,
  RotateCcw,
  Search,
  Sparkles,
  Users as UsersIcon,
  X,
  XCircle,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { useI18n, type TranslationKey } from "../../lib/i18n";
import { navigate } from "../../lib/router";
import { fiscalYearLabel, fiscalYearStartYear } from "../../lib/fiscalYear";
import { Avatar } from "../../components/ui";
import { RejectModal } from "./SubmissionDetail";
import type { KycSubmission, KycStatus } from "../../lib/types";

const FILTERS: { key: string; labelKey: TranslationKey }[] = [
  { key: "all", labelKey: "allSubmissions" },
  { key: "pending", labelKey: "statusPending" },
  { key: "approved", labelKey: "statusApproved" },
  { key: "rejected", labelKey: "statusRejected" },
  { key: "printed", labelKey: "statusPrinted" },
];

export default function Dashboard() {
  const { state } = useStore();
  const { t } = useI18n();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const currentFiscalYear = fiscalYearStartYear(Date.now());
  const [fiscalYear, setFiscalYear] = useState<number | "all">(currentFiscalYear);

  const fiscalYears = useMemo(() => {
    const years = new Set<number>([
      currentFiscalYear,
      currentFiscalYear - 1,
      currentFiscalYear - 2,
    ]);
    state.members.forEach((member) => years.add(fiscalYearStartYear(member.invitedAt)));
    state.submissions.forEach((submission) =>
      years.add(fiscalYearStartYear(submission.submittedAt))
    );
    return [...years]
      .sort((a, b) => b - a)
      .map((year) => ({
        year,
        registrations: state.members.filter(
          (member) => fiscalYearStartYear(member.invitedAt) === year
        ).length,
      }));
  }, [currentFiscalYear, state.members, state.submissions]);

  const selectedYearRegistrations =
    fiscalYear === "all"
      ? state.members.length
      : fiscalYears.find((year) => year.year === fiscalYear)?.registrations ?? 0;
  const previousYearRegistrations =
    fiscalYear === "all"
      ? undefined
      : fiscalYears.find((year) => year.year === fiscalYear - 1)?.registrations ?? 0;

  const stats = useMemo(() => {
    const subs =
      fiscalYear === "all"
        ? state.submissions
        : state.submissions.filter(
            (submission) => fiscalYearStartYear(submission.submittedAt) === fiscalYear
          );
    const count = (s: KycStatus) => subs.filter((x) => x.status === s).length;
    return {
      pending: subs.filter((x) => x.status === "pending").length,
      submitted: subs.filter((x) => x.status === "submitted").length,
      approved: count("approved"),
      rejected: count("rejected"),
      printed: count("printed"),
      members: selectedYearRegistrations,
    };
  }, [fiscalYear, selectedYearRegistrations, state.submissions]);

  const filtered = useMemo(() => {
    const list = state.submissions
      .filter(
        (submission) =>
          fiscalYear === "all" ||
          fiscalYearStartYear(submission.submittedAt) === fiscalYear
      )
      .sort((a, b) => b.submittedAt - a.submittedAt);
    return list.filter((x) => {
      // Status filter
      if (filter === "pending" && x.status !== "pending") return false;
      if (filter === "approved" && x.status !== "approved") return false;
      if (filter === "rejected" && x.status !== "rejected") return false;
      if (filter === "printed" && x.status !== "printed") return false;

      // Search filter
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        x.memberName.toLowerCase().includes(q) ||
        x.phone.includes(q) ||
        x.membershipCode.toLowerCase().includes(q)
      );
    });
  }, [state.submissions, filter, search, fiscalYear]);

  const clearFilters = () => {
    setFilter("all");
    setSearch("");
    setFiscalYear("all");
  };

  const exportSubmissionsCsv = () => {
    const headers = [
      "Member Name",
      "Phone Number",
      "Membership Code",
      "KYC Status",
      "Client Type",
      "Branch",
      "PAN Number",
      "Email",
      "Permanent Address",
      "Submitted At",
      "Review Remark",
    ];
    const rows = filtered.map((s) => [
      `"${s.memberName.replace(/"/g, '""')}"`,
      `"+977 ${s.phone}"`,
      `"${s.membershipCode}"`,
      `"${s.status}"`,
      `"${s.clientType || "Individual"}"`,
      `"${s.memberBranch || "Central / Main"}"`,
      `"${s.panNumber || ""}"`,
      `"${s.email || ""}"`,
      `"${(s.address || "").replace(/"/g, '""')}"`,
      `"${new Date(s.submittedAt).toLocaleString()}"`,
      `"${(s.remark || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kyc-submissions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cards: { labelKey: TranslationKey; value: number; icon: typeof Clock; cls: string }[] = [
    {
      labelKey: "statusPending",
      value: stats.pending,
      icon: Clock,
      cls: "bg-amber-50 text-amber-600 border border-amber-200/80",
    },
    {
      labelKey: "statusApproved",
      value: stats.approved,
      icon: CheckCircle2,
      cls: "bg-emerald-50 text-emerald-600 border border-emerald-200/80",
    },
    {
      labelKey: "statusRejected",
      value: stats.rejected,
      icon: XCircle,
      cls: "bg-rose-50 text-rose-600 border border-rose-200/80",
    },
    {
      labelKey: "statusPrinted",
      value: stats.printed,
      icon: Printer,
      cls: "bg-[#DDF3E7] text-[#145C45] border border-[#145C45]/20",
    },
    {
      labelKey: "totalMembers",
      value: stats.members,
      icon: UsersIcon,
      cls: "bg-slate-50 text-slate-700 border border-slate-200/80",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {t("dashboardTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t("dashboardSubtitle")}
          </p>
        </div>
      </div>

      {/* Pending Review Alert Banner */}
      {stats.pending > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-[#145C45] via-[#1a7357] to-[#145C45] p-4 text-white shadow-lg border border-[#0f4534]/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/30">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">
                  {t("pendingQueueAlert", { count: stats.pending })}
                </p>
                <p className="text-xs text-[#DDF3E7]">
                  {t("newSubmissionsWaiting")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilter("pending")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#DDF3E7] hover:bg-white active:scale-95 px-4 py-2 text-xs font-bold text-[#145C45] transition self-start sm:self-auto shadow-sm cursor-pointer"
            >
              {t("filterPendingQueue")} →
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.labelKey}
              className={`rounded-2xl p-3.5 shadow-sm bg-white border transition hover:shadow-md ${c.cls}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 truncate">{t(c.labelKey)}</span>
                <Icon className="h-4 w-4 shrink-0" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs, Search & Submissions List */}
      <div className="space-y-3">
        <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-end sm:p-4">
          <label className="block min-w-0">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <CalendarDays className="h-4 w-4 text-[#145C45]" />
              {t("fiscalYear")}
            </span>
            <select
              value={fiscalYear}
              onChange={(event) =>
                setFiscalYear(event.target.value === "all" ? "all" : Number(event.target.value))
              }
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#145C45] focus:ring-2 focus:ring-[#DDF3E7]"
            >
              <option value="all">
                {t("allFiscalYears")} · {t("memberCount", { count: state.members.length })}
              </option>
              {fiscalYears.map(({ year, registrations }) => (
                <option key={year} value={year}>
                  {fiscalYearLabel(year)}
                  {year === currentFiscalYear ? ` (${t("currentFiscalYear")})` : ""} ·{" "}
                  {t("memberCount", { count: registrations })}
                </option>
              ))}
            </select>
          </label>

          <div className="min-w-0 rounded-xl bg-[#F3F8F5] px-3.5 py-2.5">
            <p className="text-[11px] font-bold text-slate-500">
              {fiscalYear === "all"
                ? t("registeredMembersAllYears")
                : t("registeredMembersInYear", { year: fiscalYearLabel(fiscalYear) })}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-lg font-black leading-tight text-[#145C45]">
                {t("memberCount", { count: selectedYearRegistrations })}
              </p>
              {fiscalYear !== "all" && previousYearRegistrations !== undefined && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                  {selectedYearRegistrations >= previousYearRegistrations ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  {`${selectedYearRegistrations - previousYearRegistrations >= 0 ? "+" : ""}${selectedYearRegistrations - previousYearRegistrations}`}
                  {" "}{t("vsPreviousFiscalYear", { year: fiscalYearLabel(fiscalYear - 1) })}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={filter === "all" && !search && fiscalYear === "all"}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-[#145C45]/30 hover:bg-[#F3F8F5] hover:text-[#145C45] disabled:cursor-not-allowed disabled:opacity-45 sm:self-end"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("clearFilters")}
          </button>
        </div>

        {/* Search & Export Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search submissions by member name, phone, code..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs font-medium text-slate-800 outline-none transition focus:border-[#145C45] focus:ring-2 focus:ring-[#DDF3E7] shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={exportSubmissionsCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#145C45]/30 bg-[#DDF3E7]/60 hover:bg-[#DDF3E7] text-[#145C45] px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export Submissions CSV
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pb-1 sm:grid-cols-3 lg:grid-cols-5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap justify-center transition active:scale-95 cursor-pointer ${
                filter === f.key
                  ? "bg-[#145C45] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-[#DDF3E7] hover:text-[#145C45] hover:border-[#145C45]/30"
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        {/* List of Submissions */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-600">{t("noSubmissions")}</p>
              <p className="mt-1 text-xs text-slate-400">
                {t("noSubmissionsHint")}
              </p>
            </div>
          )}

          {filtered.map((s) => (
            <SubmissionCard key={s.id} sub={s} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({ sub }: { sub: KycSubmission }) {
  const { approveSubmission, rejectSubmission } = useStore();
  const { t } = useI18n();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleApprove = () => {
    approveSubmission(sub.id);
    showToast(`✓ Approved KYC for ${sub.memberName}`);
  };

  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200/80 transition hover:shadow-md space-y-3">
      {/* Toast */}
      {toast && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-bold text-emerald-800 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Member Header Info */}
      <div className="flex items-start gap-3">
        <Avatar name={sub.memberName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-extrabold text-slate-900">
              {sub.memberName}
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Code: <span className="font-bold text-slate-700">{sub.membershipCode}</span> · Phone:{" "}
            <span className="font-bold text-slate-700 font-mono">+977 {sub.phone}</span>
          </p>
          {sub.remark && (
            <p className="mt-1 text-xs text-rose-700 bg-rose-50/80 rounded-lg p-1.5 border border-rose-200 inline-block font-semibold">
              Remark: {sub.remark}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100">
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
          {/* View Details */}
          <button
            onClick={() => navigate(`/admin/submissions/${sub.id}`)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#145C45]/30 bg-[#DDF3E7]/60 hover:bg-[#DDF3E7] text-[#145C45] font-bold py-2.5 px-3 text-xs sm:text-sm active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-[#145C45]/30 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            <span>{t("viewDetails")}</span>
          </button>

          {/* Approve and Reject */}
          {(sub.status === "pending" || sub.status === "submitted") && (
            <>
              <button
                onClick={handleApprove}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold py-2.5 px-3.5 text-xs sm:text-sm shadow-sm shadow-emerald-600/20 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{t("approve")}</span>
              </button>

              <button
                onClick={() => setRejectOpen(true)}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-3 text-xs sm:text-sm active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>{t("reject")}</span>
              </button>
            </>
          )}

          {/* Print Button */}
          {sub.status === "approved" && (
            <button
              onClick={() => navigate(`/print/${sub.id}`)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#145C45] hover:bg-[#0f4534] text-white font-bold py-2.5 px-4 text-xs sm:text-sm shadow-sm active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-[#145C45] cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>{t("printKycForm")}</span>
            </button>
          )}

          {/* Reprint */}
          {sub.status === "printed" && (
            <button
              onClick={() => navigate(`/print/${sub.id}`)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-3 text-xs sm:text-sm active:scale-[0.98] transition"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Reprint</span>
            </button>
          )}
        </div>
      </div>

      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={(remark) => {
          rejectSubmission(sub.id, remark);
          showToast(`Marked as Rejected: ${remark}`);
        }}
      />
    </div>
  );
}
