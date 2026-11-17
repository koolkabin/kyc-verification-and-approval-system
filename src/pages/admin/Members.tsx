import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  Building2,
  Copy,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Eye,
  FileSpreadsheet,
  Filter,
  Link2,
  Plus,
  RotateCcw,
  Search,
  Send,
  Upload,
  UserPlus,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { useStore, type SmsInviteData } from "../../lib/store";
import { Avatar, Field, Modal, SmsModal } from "../../components/ui";
import { BulkSmsPicker } from "../../components/BulkSmsPicker";
import { parseCsv } from "../../lib/csv";
import { SAMPLE_MEMBERS_CSV } from "../../config/demoData";
import { useI18n } from "../../lib/i18n";
import { fiscalYearLabel, fiscalYearStartYear } from "../../lib/fiscalYear";
import type { KycSubmission } from "../../lib/types";
import { formatDateTime } from "../../lib/utils";

type MemberFilterKey =
  | "all"
  | "unsent"
  | "sent"
  | "approved"
  | "pendingReview"
  | "rejected";

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 break-words font-semibold text-slate-800">
        {value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  );
}

function KycSubmissionDetails({ submission }: { submission: KycSubmission }) {
  const documents = [
    {
      label: "Passport Photo",
      url: submission.photoDataUrl,
      name: submission.photoName,
    },
    {
      label: "Citizenship Front",
      url: submission.citizenshipFrontDataUrl || submission.idDocDataUrl,
      name: submission.citizenshipFrontName || submission.idDocName,
    },
    {
      label: "Citizenship Back",
      url: submission.citizenshipBackDataUrl,
      name: submission.citizenshipBackName,
    },
    {
      label: "Selfie With ID",
      url: submission.selfieDataUrl,
      name: submission.selfieName,
    },
    {
      label: "National ID Card",
      url: submission.nationalIdDataUrl,
      name: submission.nationalIdName,
    },
    {
      label: "PAN Document",
      url: submission.panDocDataUrl,
      name: submission.panDocName,
    },
    {
      label: "Official KYC Form",
      url: submission.kycFormDataUrl,
      name: submission.kycFormName,
    },
    {
      label: "Online Agreement",
      url: submission.agreementDataUrl,
      name: submission.agreementName,
    },
    {
      label: "Birth Certificate",
      url: submission.birthCertDataUrl,
      name: submission.birthCertName,
    },
    {
      label: "Company Registration",
      url: submission.companyRegDataUrl,
      name: submission.companyRegName,
    },
    {
      label: "Member Signature",
      url: submission.signatureDataUrl,
      name: submission.signatureName,
    },
    {
      label: "Member Thumbprint",
      url: submission.thumbprintDataUrl,
      name: submission.thumbprintName,
    },
  ];

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#145C45]">
          General &amp; Membership Details
        </h4>
        <dl className="grid gap-2 sm:grid-cols-2">
          <DetailField label="Submitted Full Name" value={submission.memberName} />
          <DetailField label="Submitted Membership Code" value={submission.membershipCode} />
          <DetailField label="Submitted Phone" value={submission.phone} />
          <DetailField label="Client Type" value={submission.clientType} />
          <DetailField label="Member Branch" value={submission.memberBranch} />
          <DetailField label="Email" value={submission.email} />
          <DetailField label="PAN Number" value={submission.panNumber} />
          <DetailField label="ID Document Type" value={submission.idDocType} />
          <DetailField label="Submission Mode" value={submission.submissionType} />
          <DetailField label="Referred By" value={submission.referredBy} />
        </dl>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#145C45]">
          Permanent Address
        </h4>
        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Country" value={submission.country} />
          <DetailField label="State / Province" value={submission.state} />
          <DetailField label="District" value={submission.district} />
          <DetailField label="Municipality" value={submission.municipality} />
          <DetailField label="Ward Number" value={submission.wardNo} />
          <DetailField label="Street / Tole" value={submission.streetTole} />
          <DetailField label="Full Address" value={submission.address} />
        </dl>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#145C45]">
          Temporary Address
        </h4>
        {submission.hasTempAddress && !submission.sameAsPermanent ? (
          <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Country" value={submission.tempCountry} />
            <DetailField label="State / Province" value={submission.tempState} />
            <DetailField label="District" value={submission.tempDistrict} />
            <DetailField label="Municipality" value={submission.tempMunicipality} />
            <DetailField label="Ward Number" value={submission.tempWardNo} />
            <DetailField label="Street / Tole" value={submission.tempStreetTole} />
          </dl>
        ) : (
          <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
            {submission.sameAsPermanent
              ? "Same as permanent address"
              : "No temporary address provided"}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#145C45]">
          Uploaded Documents
        </h4>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => {
            const isPdf =
              document.url?.startsWith("data:application/pdf") ||
              document.name?.toLowerCase().endsWith(".pdf");
            return (
              <div
                key={document.label}
                className="space-y-2 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800">{document.label}</p>
                  <span className="shrink-0 text-[10px] font-semibold text-slate-500">
                    {document.url ? "Uploaded" : "Not provided"}
                  </span>
                </div>
                {document.url ? (
                  isPdf ? (
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-32 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-[#145C45] underline"
                    >
                      Open PDF
                    </a>
                  ) : (
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${document.label}`}
                    >
                      <img
                        src={document.url}
                        alt={document.label}
                        loading="lazy"
                        className="h-32 w-full rounded-lg bg-slate-100 object-contain"
                      />
                    </a>
                  )
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-400">
                    Not uploaded
                  </div>
                )}
                {document.name && (
                  <p className="truncate text-[10px] text-slate-500" title={document.name}>
                    {document.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#145C45]">
          Review &amp; Verification
        </h4>
        <dl className="grid gap-2 sm:grid-cols-2">
          <DetailField label="KYC Status" value={submission.status} />
          <DetailField label="Submitted On" value={formatDateTime(submission.submittedAt)} />
          <DetailField
            label="Reviewed On"
            value={submission.reviewedAt ? formatDateTime(submission.reviewedAt) : undefined}
          />
          <DetailField label="Reviewed By" value={submission.reviewedBy} />
          <DetailField label="Rejection Remark" value={submission.remark} />
          <DetailField
            label="Printed On"
            value={submission.printedAt ? formatDateTime(submission.printedAt) : undefined}
          />
          <DetailField
            label="Signature Verification"
            value={submission.signatureVerified ? "Verified" : "Not verified"}
          />
          <DetailField label="Signature Verified By" value={submission.signatureVerifiedBy} />
          <DetailField
            label="Signature Verified On"
            value={
              submission.signatureVerifiedAt
                ? formatDateTime(submission.signatureVerifiedAt)
                : undefined
            }
          />
          <DetailField
            label="Thumbprint Verification"
            value={submission.thumbprintVerified ? "Verified" : "Not verified"}
          />
          <DetailField label="Thumbprint Verified By" value={submission.thumbprintVerifiedBy} />
          <DetailField
            label="Thumbprint Verified On"
            value={
              submission.thumbprintVerifiedAt
                ? formatDateTime(submission.thumbprintVerifiedAt)
                : undefined
            }
          />
        </dl>
      </section>
    </div>
  );
}

export default function Members() {
  const {
    state,
    addMembers,
    queueMemberSms,
  } = useStore();
  const { t } = useI18n();
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
  const currentFiscalYear = fiscalYearStartYear(Date.now());
  const [fiscalYear, setFiscalYear] = useState<number | "all">(currentFiscalYear);
  const [bulkSmsOpen, setBulkSmsOpen] = useState(false);
  const [detailsMemberId, setDetailsMemberId] = useState<string | null>(null);
  const [activeSms, setActiveSms] = useState<SmsInviteData | null>(null);

  const members = useMemo(
    () => [...state.members].sort((a, b) => a.invitedAt - b.invitedAt),
    [state.members]
  );
  const fiscalYears = useMemo(() => {
    const years = new Set<number>([
      currentFiscalYear,
      currentFiscalYear - 1,
      currentFiscalYear - 2,
    ]);
    members.forEach((member) => years.add(fiscalYearStartYear(member.invitedAt)));
    return [...years]
      .sort((a, b) => b - a)
      .map((year) => ({
        year,
        registrations: members.filter(
          (member) => fiscalYearStartYear(member.invitedAt) === year
        ).length,
      }));
  }, [currentFiscalYear, members]);
  const fiscalMembers = useMemo(
    () =>
      fiscalYear === "all"
        ? members
        : members.filter(
            (member) => fiscalYearStartYear(member.invitedAt) === fiscalYear
          ),
    [members, fiscalYear]
  );
  const selectedYearRegistrations = fiscalMembers.length;
  const previousYearRegistrations =
    fiscalYear === "all"
      ? undefined
      : fiscalYears.find((year) => year.year === fiscalYear - 1)?.registrations ?? 0;
  const smsEligibleMembers = members.filter(
    (member) => member.status === "invited" || member.status === "rejected"
  );
  const detailsMember = detailsMemberId
    ? state.members.find((member) => member.id === detailsMemberId)
    : undefined;
  const detailsSubmission = detailsMember
    ? state.submissions.find((submission) => submission.memberId === detailsMember.id)
    : undefined;

  // Stats calculation
  const totalCount = fiscalMembers.length;
  const unsentCount = fiscalMembers.filter((m) => !m.smsSentAt).length;
  const sentCount = fiscalMembers.filter((m) => Boolean(m.smsSentAt)).length;
  const pendingReviewCount = fiscalMembers.filter(
    (m) => m.status === "submitted" || m.status === "pending"
  ).length;

  const filteredMembers = useMemo(() => {
    return fiscalMembers.filter((m) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.membershipCode.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "unsent")
        return !m.smsSentAt;
      if (statusFilter === "sent")
        return Boolean(m.smsSentAt);
      if (statusFilter === "approved")
        return m.status === "approved" || m.status === "printed";
      if (statusFilter === "pendingReview")
        return m.status === "submitted" || m.status === "pending";
      if (statusFilter === "rejected") return m.status === "rejected";
      return true;
    });
  }, [fiscalMembers, search, statusFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFiscalYear("all");
  };

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
      setNotice("Could not open SMS because the member record was not found.");
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

  const exportMembersCsv = () => {
    const headers = [
      "Full Name",
      "Mobile (+977)",
      "Membership Code",
      "SMS Status",
      "KYC Status",
      "Invited Date",
    ];
    const rows = filteredMembers.map((m) => [
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.phone}"`,
      `"${m.membershipCode}"`,
      `"${m.smsSentAt ? "SMS Sent" : "SMS Not Sent"}"`,
      `"${m.status}"`,
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
    ], "manual");
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
        Send invitations individually or choose multiple members with Bulk SMS.
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
                  addMembers(parsed.rows, "csv");
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
              Manage members and prepare SMS invitations
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBulkSmsOpen(true)}
              disabled={smsEligibleMembers.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#145C45] hover:bg-[#0f4534] text-white px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" /> Bulk SMS
            </button>
            <button
              type="button"
              onClick={exportMembersCsv}
              disabled={filteredMembers.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#145C45]/30 bg-[#DDF3E7]/60 hover:bg-[#DDF3E7] text-[#145C45] px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Export Members CSV
            </button>
          </div>
        </div>

        {/* ── Key Member & SMS Distribution Metrics ──────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Members</span>
            <p className="text-lg font-black text-slate-800">{totalCount}</p>
          </div>
          <div className="rounded-2xl bg-teal-50 border border-teal-200 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#145C45]">SMS Not Sent</span>
            <p className="text-lg font-black text-[#145C45]">{unsentCount}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl bg-sky-50 border border-sky-200 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">SMS Sent</span>
            <p className="text-lg font-black text-sky-900">{sentCount}</p>
          </div>
        </div>

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
                {t("allFiscalYears")} · {t("memberCount", { count: members.length })}
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
            disabled={statusFilter === "all" && !search && fiscalYear === "all"}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-[#145C45]/30 hover:bg-[#F3F8F5] hover:text-[#145C45] disabled:cursor-not-allowed disabled:opacity-45 sm:self-end"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("clearFilters")}
          </button>
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
                { key: "unsent", label: `SMS Not Sent (${unsentCount})` },
                { key: "sent", label: `SMS Sent (${sentCount})` },
                { key: "approved", label: "Approved" },
                { key: "pendingReview", label: `Pending Review (${pendingReviewCount})` },
                { key: "rejected", label: "Rejected" },
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

        {/* ── Members List ────────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          {filteredMembers.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200">
              {search || statusFilter !== "all" || fiscalYear !== "all"
                ? "No members match the current search or filter criteria."
                : "No members found. Upload a CSV or add manually above."}
            </div>
          )}

          {filteredMembers.map((m) => {
            const hasSmsSent = Boolean(m.smsSentAt);

            return (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-3.5 border border-slate-200 bg-slate-50/60 transition hover:bg-slate-100/60"
              >
                <div className="flex min-w-0 items-start sm:items-center gap-3">
                  <Avatar name={m.name} size="sm" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {m.name}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Code: <span className="font-bold text-slate-700">{m.membershipCode}</span> · Phone:{" "}
                      <span className="font-mono text-slate-700">+977 {m.phone}</span>
                    </p>

                    <div className="mt-1 text-[11px] font-extrabold">
                      <span className={hasSmsSent ? "text-sky-800" : "text-slate-600"}>
                        {hasSmsSent ? "SMS Sent" : "SMS Not Sent"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for this member */}
                <div className="flex flex-wrap items-center justify-end gap-1.5 self-stretch sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Send SMS Button */}
                  <button
                    onClick={() => handleQueueSms(m.id)}
                    className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shadow-xs transition cursor-pointer ${
                      hasSmsSent
                        ? "border border-[#145C45]/30 bg-[#DDF3E7] hover:bg-[#cbebd9] text-[#145C45]"
                        : "bg-[#145C45] hover:bg-[#0f4534] active:scale-95 text-white"
                    }`}
                    title="Send SMS"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send SMS</span>
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

                  {/* View Member and KYC Details */}
                  <button
                    type="button"
                    onClick={() => setDetailsMemberId(m.id)}
                    className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-2.5 py-2 text-xs font-medium text-slate-700 transition cursor-pointer"
                    title="View member details"
                    aria-label={`View details for ${m.name}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Details</span>
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
      {bulkSmsOpen && (
        <BulkSmsPicker
          members={smsEligibleMembers}
          onClose={() => setBulkSmsOpen(false)}
        />
      )}
      <Modal
        open={Boolean(detailsMember)}
        onClose={() => setDetailsMemberId(null)}
        title="Member & KYC Details"
        wide
        footer={
          <button
            type="button"
            onClick={() => setDetailsMemberId(null)}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            Close
          </button>
        }
      >
        {detailsMember && (
          <div className="space-y-5">
            <section className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-[#145C45]">
                Member Details
              </h4>
              <dl className="grid gap-2 sm:grid-cols-2">
                <DetailField label="Full Name" value={detailsMember.name} />
                <DetailField label="Membership Code" value={detailsMember.membershipCode} />
                <DetailField label="Phone" value={`+977 ${detailsMember.phone}`} />
                <DetailField
                  label="SMS Status"
                  value={detailsMember.smsSentAt ? "SMS Sent" : "SMS Not Sent"}
                />
              </dl>
            </section>
            {detailsSubmission ? (
              <KycSubmissionDetails submission={detailsSubmission} />
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
                This member has not submitted a KYC form yet.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
