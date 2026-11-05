import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Maximize2,
  Printer,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { navigate } from "../../lib/router";
import { formatDateTime } from "../../lib/utils";
import { Avatar, Modal, StatusPill, StatusStepper } from "../../components/ui";

const QUICK_REJECTION_REASONS = [
  "Address on proof does not match permanent residence",
  "ID document image is blurry or unreadable",
  "Photograph does not meet passport specifications",
  "Incorrect document type uploaded",
  "Name mismatch between ID proof and cooperative record",
];

export default function SubmissionDetail({ id }: { id: string }) {
  const {
    state,
    getSubmission,
    approveSubmission,
    rejectSubmission,
    markPrinted,
    setEvidenceVerification,
  } = useStore();
  const sub = getSubmission(id);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (!sub) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-200">
        <FileText className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 font-bold text-slate-700">Submission not found</p>
        <button
          onClick={() => navigate("/admin")}
          className="mt-4 rounded-xl bg-[#145C45] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0f4534] transition cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleApprove = () => {
    approveSubmission(sub.id);
    showToast(`✓ Approved KYC for ${sub.memberName}`);
  };

  const handlePrint = () => {
    markPrinted(sub.id);
    navigate(`/print/${sub.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-12">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#145C45] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Submissions
        </button>
        <span className="rounded-full bg-[#DDF3E7] px-3 py-1 text-xs font-bold text-[#145C45] border border-[#145C45]/30">
          KYC-{sub.membershipCode}
        </span>
      </div>

      {toast && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-center text-xs font-bold text-emerald-800 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Member Card */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={sub.memberName} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-slate-900 truncate">
              {sub.memberName}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Member Code: <span className="font-bold text-slate-700">{sub.membershipCode}</span> ·
              Phone: <span className="font-bold text-slate-700 font-mono">+977 {sub.phone}</span>
            </p>
          </div>
          <StatusPill status={sub.status} />
        </div>

        <div className="pt-2 border-t border-slate-100">
          <StatusStepper status={sub.status} />
        </div>
      </div>

      {/* ── 1. Submitted General & Membership Details ─────────────────────── */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#145C45] flex items-center gap-1.5">
          <FileText className="h-4 w-4" /> General &amp; Membership Details
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <dt className="text-slate-400 font-medium text-[11px] uppercase tracking-wide">Client Type</dt>
            <dd className="font-bold text-slate-900 mt-0.5">{sub.clientType || "Individual"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <dt className="text-slate-400 font-medium text-[11px] uppercase tracking-wide">Member Branch</dt>
            <dd className="font-bold text-slate-900 mt-0.5">{sub.memberBranch || "Head Office"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <dt className="text-slate-400 font-medium text-[11px] uppercase tracking-wide">Mobile Number</dt>
            <dd className="font-mono font-bold text-slate-900 mt-0.5">+977 {sub.phone}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <dt className="text-slate-400 font-medium text-[11px] uppercase tracking-wide">Email Address</dt>
            <dd className="font-bold text-slate-900 mt-0.5 break-all">{sub.email || "—"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <dt className="text-slate-400 font-medium text-[11px] uppercase tracking-wide">PAN Number</dt>
            <dd className="font-mono font-bold text-slate-900 mt-0.5">{sub.panNumber || "—"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <dt className="text-slate-400 font-medium text-[11px] uppercase tracking-wide">Submission Mode</dt>
            <dd className="font-bold text-[#145C45] uppercase mt-0.5">{sub.submissionType || "online"}</dd>
          </div>
          {sub.referredBy && (
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 sm:col-span-2">
              <dt className="text-slate-400 font-medium text-[11px] uppercase tracking-wide">Referred By</dt>
              <dd className="font-bold text-slate-900 mt-0.5">{sub.referredBy}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* ── 2. Residential & Address Verification ─────────────────────────── */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#145C45] flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> Address &amp; Location Details
        </h3>
        
        {/* Permanent Address */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Permanent Address (स्थायी ठेगाना)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">Country</span>
              <span className="font-bold text-slate-800">{sub.country || "Nepal"}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">State / Province</span>
              <span className="font-bold text-slate-800">{sub.state || "—"}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">District</span>
              <span className="font-bold text-slate-800">{sub.district || "—"}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">Municipality</span>
              <span className="font-bold text-slate-800">{sub.municipality || "—"}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">Ward No</span>
              <span className="font-bold text-slate-800">{sub.wardNo || "—"}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">Street / Tole</span>
              <span className="font-bold text-slate-800">{sub.streetTole || "—"}</span>
            </div>
          </div>
          {sub.address && (
            <p className="text-xs text-slate-500 font-medium pt-1">
              Full formatted address: <span className="font-semibold text-slate-800">{sub.address}</span>
            </p>
          )}
        </div>

        {/* Temporary Address if exists */}
        {sub.hasTempAddress && !sub.sameAsPermanent && (
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Temporary Address (अस्थायी ठेगाना)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-xl bg-amber-50/50 p-2.5 border border-amber-100">
                <span className="text-[10px] text-slate-400 block uppercase">Country</span>
                <span className="font-bold text-slate-800">{sub.tempCountry || "Nepal"}</span>
              </div>
              <div className="rounded-xl bg-amber-50/50 p-2.5 border border-amber-100">
                <span className="text-[10px] text-slate-400 block uppercase">Province</span>
                <span className="font-bold text-slate-800">{sub.tempState || "—"}</span>
              </div>
              <div className="rounded-xl bg-amber-50/50 p-2.5 border border-amber-100">
                <span className="text-[10px] text-slate-400 block uppercase">District</span>
                <span className="font-bold text-slate-800">{sub.tempDistrict || "—"}</span>
              </div>
              <div className="rounded-xl bg-amber-50/50 p-2.5 border border-amber-100">
                <span className="text-[10px] text-slate-400 block uppercase">Municipality</span>
                <span className="font-bold text-slate-800">{sub.tempMunicipality || "—"}</span>
              </div>
              <div className="rounded-xl bg-amber-50/50 p-2.5 border border-amber-100">
                <span className="text-[10px] text-slate-400 block uppercase">Ward No</span>
                <span className="font-bold text-slate-800">{sub.tempWardNo || "—"}</span>
              </div>
              <div className="rounded-xl bg-amber-50/50 p-2.5 border border-amber-100">
                <span className="text-[10px] text-slate-400 block uppercase">Street / Tole</span>
                <span className="font-bold text-slate-800">{sub.tempStreetTole || "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Audit Details */}
        <div className="border-t border-slate-100 pt-3 space-y-1 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>Submitted On:</span>
            <span className="font-bold text-slate-800">{formatDateTime(sub.submittedAt)}</span>
          </div>
          {sub.reviewedAt && (
            <div className="flex justify-between">
              <span>Review Decision:</span>
              <span className="font-bold text-slate-800">{formatDateTime(sub.reviewedAt)} · {sub.reviewedBy}</span>
            </div>
          )}
          {sub.printedAt && (
            <div className="flex justify-between">
              <span>Printed At:</span>
              <span className="font-bold text-slate-800">{formatDateTime(sub.printedAt)}</span>
            </div>
          )}
          {sub.remark && (
            <div className="rounded-xl bg-rose-50 p-3 border border-rose-200 mt-2">
              <span className="text-[11px] font-bold uppercase text-rose-800 block">Manager Rejection Remark:</span>
              <span className="font-semibold text-rose-900 mt-0.5 block">{sub.remark}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Complete Uploaded Documents Review Section ────────────────── */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#145C45] flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> Uploaded Member Proofs &amp; Documents
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            Tap any document to view/enlarge
          </span>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              { label: "Passport Photo", docType: "Photo", url: sub.photoDataUrl, name: sub.photoName, required: true },
              { label: "Citizenship (Front)", docType: sub.idDocType ?? "Citizenship", url: sub.citizenshipFrontDataUrl || sub.idDocDataUrl, name: sub.citizenshipFrontName || sub.idDocName, required: true },
              { label: "Citizenship (Back)", docType: "Citizenship", url: sub.citizenshipBackDataUrl, name: sub.citizenshipBackName, required: false },
              { label: "Selfie With ID", docType: "Selfie Verification", url: sub.selfieDataUrl, name: sub.selfieName, required: true },
              { label: "National ID Card", docType: "National ID", url: sub.nationalIdDataUrl, name: sub.nationalIdName, required: false },
              { label: "PAN Card / Doc", docType: "PAN", url: sub.panDocDataUrl, name: sub.panDocName, required: false },
              { label: "Official KYC Form", docType: "KYM Form", url: sub.kycFormDataUrl, name: sub.kycFormName, required: false },
              { label: "Online Agreement", docType: "Signed Agreement", url: sub.agreementDataUrl, name: sub.agreementName, required: false },
              { label: "Birth Certificate", docType: "Minor Proof", url: sub.birthCertDataUrl, name: sub.birthCertName, required: false },
              { label: "Company Registration", docType: "Corporate", url: sub.companyRegDataUrl, name: sub.companyRegName, required: false },
            ] as const
          ).map((item) => {
            const isPdf = item.url?.startsWith("pdf:") || item.name?.toLowerCase().endsWith(".pdf");
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 p-3 bg-slate-50 flex flex-col justify-between space-y-2 hover:border-[#145C45]/40 transition"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold text-slate-800 truncate" title={item.label}>
                    {item.label}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    item.url
                      ? "bg-[#DDF3E7] text-[#145C45]"
                      : item.required
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-slate-200 text-slate-600"
                  }`}>
                    {item.url ? "Uploaded" : item.required ? "Required" : "Optional"}
                  </span>
                </div>

                {item.url ? (
                  <div
                    onClick={() => {
                      if (item.url) {
                        setEnlargedImage({
                          url: item.url,
                          title: `${item.label} — ${sub.memberName}`,
                        });
                      }
                    }}
                    className="group relative cursor-pointer overflow-hidden rounded-xl bg-slate-900 border border-slate-200 h-36 flex items-center justify-center"
                  >
                    {isPdf ? (
                      <div className="text-center p-3 text-white">
                        <FileText className="h-8 w-8 mx-auto text-[#DDF3E7] mb-1" />
                        <span className="text-[11px] font-mono font-bold block truncate max-w-[140px]">
                          {item.name || "Document.pdf"}
                        </span>
                        <span className="text-[10px] text-[#DDF3E7]/80 uppercase font-semibold">PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.label}
                        className="h-full w-full object-contain group-hover:scale-105 transition"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Maximize2 className="h-4 w-4" /> View Full
                    </div>
                  </div>
                ) : (
                  <div className="flex h-36 items-center justify-center rounded-xl bg-slate-100 border border-dashed border-slate-200 text-[11px] text-slate-400 text-center p-2">
                    Not provided
                  </div>
                )}

                {item.name && (
                  <p className="truncate text-[10px] text-slate-500 font-mono" title={item.name}>
                    {item.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Signature and thumbprint verification */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Signature &amp; Thumbprint Verification
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                evidence: "signature",
                label: "Member Signature",
                image: sub.signatureDataUrl,
                fileName: sub.signatureName,
                verified: sub.signatureVerified,
                verifiedAt: sub.signatureVerifiedAt,
                verifiedBy: sub.signatureVerifiedBy,
              },
              {
                evidence: "thumbprint",
                label: "Member Thumbprint",
                image: sub.thumbprintDataUrl,
                fileName: sub.thumbprintName,
                verified: sub.thumbprintVerified,
                verifiedAt: sub.thumbprintVerifiedAt,
                verifiedBy: sub.thumbprintVerifiedBy,
              },
            ] as const
          ).map((item) => (
            <div
              key={item.evidence}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">{item.label}</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    item.verified
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {item.verified ? "Verified by reviewer" : "Not verified"}
                </span>
              </div>
              {item.image ? (
                <button
                  type="button"
                  onClick={() =>
                    setEnlargedImage({
                      url: item.image!,
                      title: `${item.label} - ${sub.memberName}`,
                    })
                  }
                  className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className="h-40 w-full object-contain"
                  />
                </button>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                  No {item.label.toLowerCase()} uploaded
                </div>
              )}
              {item.fileName && (
                <p className="truncate text-[11px] text-slate-500">{item.fileName}</p>
              )}
              {item.verified && item.verifiedAt && (
                <p className="text-[11px] text-emerald-800">
                  Verified {formatDateTime(item.verifiedAt)}
                  {item.verifiedBy ? ` · ${item.verifiedBy}` : ""}
                </p>
              )}
              <button
                type="button"
                disabled={!item.image}
                onClick={() =>
                  setEvidenceVerification(
                    sub.id,
                    item.evidence,
                    !item.verified
                  )
                }
                className="w-full rounded-xl border border-[#145C45] px-3 py-2 text-xs font-bold text-[#145C45] transition hover:bg-[#DDF3E7] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                {item.verified ? "Undo verification" : "Mark as verified"}
              </button>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          Verification is a manual reviewer confirmation of the uploaded image, not biometric or identity authentication.
        </p>
      </div>

      {/* User-Friendly Mobile-Focused Action Card */}
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Manager Action
        </h3>

        {(sub.status === "pending" || sub.status === "submitted") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleApprove}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] py-3.5 px-4 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Approve KYC</span>
            </button>

            <button
              onClick={() => setRejectOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-[0.98] py-3.5 px-4 text-sm font-extrabold transition focus:outline-none focus:ring-4 focus:ring-rose-200"
            >
              <XCircle className="h-5 w-5 text-rose-600" />
              <span>Reject KYC</span>
            </button>
          </div>
        )}

        {sub.status === "approved" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              This KYC is Approved. You can now generate and print the official form.
            </div>
            <button
              onClick={handlePrint}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#145C45] hover:bg-[#0f4534] active:scale-[0.98] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#145C45]/20 transition focus:outline-none focus:ring-4 focus:ring-[#DDF3E7] cursor-pointer"
            >
              <Printer className="h-5 w-5" />
              <span>Print Official KYC Document</span>
            </button>
          </div>
        )}

        {sub.status === "printed" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-2xl bg-[#DDF3E7] p-3 text-xs font-bold text-[#145C45] border border-[#145C45]/30">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#145C45]" />
              This KYC has been printed and archived in society records.
            </div>
            <button
              onClick={handlePrint}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 py-3 text-xs font-bold text-slate-800 transition"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              <span>Reprint KYC Form</span>
            </button>
          </div>
        )}

        {sub.status === "rejected" && (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-800 border border-rose-200">
            <XCircle className="h-4 w-4 shrink-0" />
            Member was notified of rejection. They can resubmit with corrected information.
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={(remark) => {
          rejectSubmission(sub.id, remark);
          showToast(`Marked as Rejected: ${remark}`);
        }}
      />

      {/* Image Lightbox Modal */}
      {enlargedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative max-w-2xl w-full bg-slate-950 rounded-3xl p-4 text-white border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold truncate">{enlargedImage.title}</h4>
              <button
                onClick={() => setEnlargedImage(null)}
                className="rounded-full bg-slate-800 p-1.5 text-slate-300 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={enlargedImage.url}
                alt="Enlarged"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RejectModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (remark: string) => void;
}) {
  const [remark, setRemark] = useState("");

  const handleSelectPreset = (reason: string) => {
    setRemark(reason);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject KYC Submission"
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(remark.trim() || "Information or document did not match records.");
              setRemark("");
              onClose();
            }}
            className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-rose-600/20 transition"
          >
            Confirm Rejection
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Select or enter the reason for rejection. The member will be notified so they can correct it:
        </p>

        {/* Quick Reasons Chips */}
        <div>
          <label className="text-[11px] font-bold uppercase text-slate-400 mb-1.5 block">
            Quick Reasons:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REJECTION_REASONS.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => handleSelectPreset(r)}
                className={`rounded-xl px-2.5 py-1.5 text-left text-[11px] font-semibold transition active:scale-95 ${
                  remark === r
                    ? "bg-rose-100 text-rose-900 border border-rose-300"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom remark textarea */}
        <div>
          <label className="text-[11px] font-bold uppercase text-slate-400 mb-1 block">
            Specific Remark:
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            placeholder="e.g. Address mismatch or blurry Citizenship copy"
            className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-900 outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
          />
        </div>
      </div>
    </Modal>
  );
}
