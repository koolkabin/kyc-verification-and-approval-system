import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MessageSquare,
  Send,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type { BulkSmsResult } from "../lib/types";
import { useStore } from "../lib/store";

interface BulkSmsModalProps {
  open: boolean;
  onClose: () => void;
  result: BulkSmsResult | null;
}

export function BulkSmsModal({ open, onClose, result }: BulkSmsModalProps) {
  const { state } = useStore();
  const org = state.orgSettings;
  const [activeTab, setActiveTab] = useState<"queued" | "alreadySent" | "inactive">("queued");
  const [copiedAll, setCopiedAll] = useState(false);

  if (!open || !result) return null;

  const orgTag = org.shortName || org.nameEnglish || "Coop KYC";

  const handleCopyAll = async () => {
    const text = result.queued
      .map((m) => {
        const link = `${window.location.origin}${window.location.pathname}#/kyc/${m.inviteCode.toLowerCase()}`;
        return `[${orgTag} KYC] नमस्ते ${m.name}, कृपया यो लिङ्क खोलेर आफ्नो सहकारी KYC विवरण भर्नुहोस्: ${link} — OTP: ${m.otp}`;
      })
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className="bg-[#145C45] px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <MessageSquare className="h-5 w-5 text-[#DDF3E7]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                थोक एसएमएस प्रेषण (Bulk SMS Dispatch Queue)
              </h3>
              <p className="text-xs text-[#DDF3E7]">
                Smart dispatch filter: Only unsent active members are queued
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
          {/* Queued Card */}
          <button
            type="button"
            onClick={() => setActiveTab("queued")}
            className={`rounded-2xl p-3 border text-left transition cursor-pointer ${
              activeTab === "queued"
                ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/40"
                : "bg-white border-slate-200 hover:border-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">SMS Queued (पठाउन तयार)</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-1 text-2xl font-black text-emerald-900">{result.queued.length}</p>
            <p className="text-[10px] text-emerald-700">Eligible active members</p>
          </button>

          {/* Skipped - Already Sent */}
          <button
            type="button"
            onClick={() => setActiveTab("alreadySent")}
            className={`rounded-2xl p-3 border text-left transition cursor-pointer ${
              activeTab === "alreadySent"
                ? "bg-sky-50 border-sky-300 ring-2 ring-sky-400/40"
                : "bg-white border-slate-200 hover:border-sky-200"
            }`}
          >
            <div className="flex items-center justify-between text-sky-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Skipped: Sent (पहिले नै पठाइएको)</span>
              <Clock className="h-4 w-4 text-sky-600" />
            </div>
            <p className="mt-1 text-2xl font-black text-sky-900">{result.skippedAlreadySent.length}</p>
            <p className="text-[10px] text-sky-700">Prevented duplicate SMS</p>
          </button>

          {/* Skipped - Inactive */}
          <button
            type="button"
            onClick={() => setActiveTab("inactive")}
            className={`rounded-2xl p-3 border text-left transition cursor-pointer ${
              activeTab === "inactive"
                ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/40"
                : "bg-white border-slate-200 hover:border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Skipped: Inactive (निष्क्रिय)</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-1 text-2xl font-black text-amber-900">{result.skippedInactive.length}</p>
            <p className="text-[10px] text-amber-700">Excluded inactive accounts</p>
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="px-5 pt-3 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("queued")}
              className={`pb-2 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeTab === "queued"
                  ? "border-[#145C45] text-[#145C45]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Eligible &amp; Queued ({result.queued.length})
            </button>
            <button
              onClick={() => setActiveTab("alreadySent")}
              className={`pb-2 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeTab === "alreadySent"
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Already Contacted ({result.skippedAlreadySent.length})
            </button>
            <button
              onClick={() => setActiveTab("inactive")}
              className={`pb-2 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeTab === "inactive"
                  ? "border-amber-600 text-amber-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Inactive Members ({result.skippedInactive.length})
            </button>
          </div>

          {activeTab === "queued" && result.queued.length > 0 && (
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 pb-2 text-xs font-bold text-[#145C45] hover:text-[#0f4534] transition cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copiedAll ? "✓ Copied All Messages!" : "Copy All SMS"}</span>
            </button>
          )}
        </div>

        {/* Tab Content List (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 min-h-[160px]">
          {/* TAB 1: QUEUED */}
          {activeTab === "queued" && (
            <>
              {result.queued.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No new members require SMS.</p>
                  <p className="text-[11px] mt-0.5">
                    All targeted active members have already received their invitation or completed KYC.
                  </p>
                </div>
              ) : (
                result.queued.map((m) => {
                  const link = `${window.location.origin}${window.location.pathname}#/kyc/${m.inviteCode.toLowerCase()}`;
                  return (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{m.name}</span>
                          <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5">
                            Queued
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Phone: <span className="font-mono font-bold text-slate-800">+977 {m.phone}</span> · OTP:{" "}
                          <span className="font-mono font-bold text-amber-700">{m.otp}</span>
                        </p>
                        <p className="text-[10px] text-[#145C45] font-mono break-all mt-0.5">
                          Link: {link}
                        </p>
                      </div>
                      <a
                        href={`sms:${m.phone}?body=${encodeURIComponent(
                          `[${orgTag} KYC] नमस्ते ${m.name}, कृपया यो लिङ्क खोलेर आफ्नो सहकारी KYC भर्नुहोस्: ${link} — OTP: ${m.otp}`
                        )}`}
                        className="self-start sm:self-auto inline-flex items-center gap-1 rounded-xl bg-[#145C45] hover:bg-[#0f4534] text-white text-xs font-bold px-3 py-1.5 shadow-xs transition shrink-0"
                      >
                        <Send className="h-3 w-3" /> Send via SMS App
                      </a>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 2: ALREADY SENT */}
          {activeTab === "alreadySent" && (
            <>
              {result.skippedAlreadySent.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200">
                  No members were skipped under this category.
                </div>
              ) : (
                result.skippedAlreadySent.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{m.name}</p>
                      <p className="text-[11px] text-sky-800 mt-0.5">
                        ✓ {m.reason}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 shrink-0">
                      Already Sent (Excluded)
                    </span>
                  </div>
                ))
              )}
            </>
          )}

          {/* TAB 3: INACTIVE */}
          {activeTab === "inactive" && (
            <>
              {result.skippedInactive.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200">
                  No members are marked Inactive.
                </div>
              ) : (
                result.skippedInactive.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{m.name}</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        ⚠ {m.reason}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 shrink-0">
                      Inactive (Excluded)
                    </span>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
          <p className="text-[11px] text-slate-500">
            Smart Bulk Filter Rule: Only active members with unsent SMS are contacted.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#145C45] hover:bg-[#0f4534] px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

