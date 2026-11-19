import { useState } from "react";
import { Copy, Search, Send, X } from "lucide-react";
import { useI18n } from "../lib/i18n";
import type { Member } from "../lib/types";
import { useStore, type SmsInviteData } from "../lib/store";

interface BulkSmsPickerProps {
  members: Member[];
  onClose: () => void;
}

export function BulkSmsPicker({ members, onClose }: BulkSmsPickerProps) {
  const { state, queueMemberSms, markMemberSmsSent } = useStore();
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState(() =>
    members.filter((member) => !member.smsSentAt).map((member) => member.id)
  );
  const [search, setSearch] = useState("");
  const [smsMessages, setSmsMessages] = useState<SmsInviteData[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const unsentIds = members
    .filter((member) => !member.smsSentAt)
    .map((member) => member.id);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredMembers = members.filter(
    (member) =>
      !normalizedSearch ||
      member.name.toLowerCase().includes(normalizedSearch) ||
      member.phone.includes(normalizedSearch) ||
      member.membershipCode.toLowerCase().includes(normalizedSearch)
  );

  const getMessageText = (message: SmsInviteData) =>
    t("smsInviteBody", {
      name: message.name,
      code: message.inviteCode,
      link: message.link,
    });

  const handleCreateMessages = () => {
    const messages = selectedIds
      .map((id) => queueMemberSms(id))
      .filter((message): message is SmsInviteData => message !== null);
    setSmsMessages(messages);
    if (messages.length !== selectedIds.length) {
      setError(`Could not create SMS for all selected members (${messages.length} of ${selectedIds.length}).`);
    }
  };

  const handleMarkAsSent = (memberId: string) => {
    if (!markMemberSmsSent(memberId)) {
      setError("Could not update SMS status because the member record was not found.");
      return;
    }
    setError("");
  };

  const handleCopyMessage = async (message: SmsInviteData) => {
    try {
      await navigator.clipboard.writeText(getMessageText(message));
      setCopiedId(message.memberId);
      setError("");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Could not copy the SMS text. Use Send SMS instead.");
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bulk SMS recipients"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between bg-[#145C45] px-4 py-3.5 text-white sm:px-5">
          <div>
            <h2 className="text-base font-extrabold">Bulk SMS</h2>
            <p className="text-[11px] text-[#DDF3E7]">
              Select members without sent SMS, or choose sent members to resend
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
            aria-label="Close bulk SMS"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {smsMessages === null ? (
          <>
            <div className="shrink-0 space-y-3 border-b border-slate-200 bg-slate-50 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, phone, or membership code"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#145C45] focus:ring-2 focus:ring-[#DDF3E7]"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  {selectedIds.length} selected
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(unsentIds)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    Select all SMS Not Sent
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
              {filteredMembers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  {members.length === 0
                    ? "No invitation-ready members. Offline entries are completed KYC submissions and are not included."
                    : "No members match this search."}
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const source =
                    member.source === "csv"
                      ? "CSV"
                      : member.source === "manual"
                        ? "Manual"
                        : "Existing";
                  const isSelected = selectedIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                        isSelected
                          ? "border-[#145C45]/50 bg-[#DDF3E7]/50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(member.id)}
                        className="h-5 w-5 shrink-0 accent-[#145C45]"
                        aria-label={`Select ${member.name}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">{member.name}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {source}
                          </span>
                          <span className={`text-[10px] font-semibold ${member.smsSentAt ? "text-sky-700" : "text-slate-500"}`}>
                            {member.smsSentAt ? "SMS Sent" : "SMS Not Sent"}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-600">
                          {member.membershipCode} · +977 {member.phone}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <p className="mb-2 text-[11px] text-slate-500">
                Offline entries are excluded. Simulate sending in demo mode, or open the SMS app to send a real message.
              </p>
              <button
                type="button"
                onClick={handleCreateMessages}
                disabled={selectedIds.length === 0}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#145C45] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0f4534] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Prepare SMS ({selectedIds.length})
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                SMS prepared for {smsMessages.length} {smsMessages.length === 1 ? "member" : "members"}. Use “Simulate demo send” to update the demo status, or open the SMS app to send a real message.
              </p>
              {error && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                  {error}
                </p>
              )}
              {smsMessages.map((message) => {
                const text = getMessageText(message);
                const smsAppLink = `sms:${message.phone}?body=${encodeURIComponent(text)}`;
                const isSent = Boolean(
                  state.members.find((member) => member.id === message.memberId)?.smsSentAt
                );
                return (
                  <div
                    key={message.memberId}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{message.name}</p>
                      <p className="text-xs font-mono text-slate-600">+977 {message.phone}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <a
                        href={smsAppLink}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#145C45] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#0f4534]"
                      >
                        <Send className="h-3.5 w-3.5" /> Send SMS
                      </a>
                      <button
                        type="button"
                        onClick={() => void handleCopyMessage(message)}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedId === message.memberId ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkAsSent(message.memberId)}
                        disabled={isSent}
                        className="min-h-10 rounded-lg border border-[#145C45]/30 bg-[#DDF3E7]/60 px-3 py-2 text-xs font-bold text-[#145C45] transition hover:bg-[#DDF3E7] disabled:cursor-default disabled:opacity-70"
                      >
                        {isSent ? "Demo SMS sent" : "Simulate demo send"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex shrink-0 gap-2 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  setSmsMessages(null);
                  setError("");
                }}
                className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Edit Selection
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 flex-1 rounded-xl bg-[#145C45] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0f4534]"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
