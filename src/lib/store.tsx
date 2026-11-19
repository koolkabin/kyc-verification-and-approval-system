import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { KycSubmission, Member, MemberInput, MemberSource, OrgSettings } from "./types";
import { createDemoSeedState, DEMO_MEMBERS } from "../config/demoData";
import { DEFAULT_ORG_SETTINGS } from "../config/appDefaults";

const STORAGE_KEY = "coop-kyc-state-v7";
const DAY = 24 * 60 * 60 * 1000;

export interface AppState {
  members: Member[];
  submissions: KycSubmission[];
  orgSettings: OrgSettings;
}

export function seedState(): AppState {
  return createDemoSeedState();
}

export interface SubmitKycInput {
  inviteCode: string;
  otp: string;

  // Step 1 – General Details
  name: string;
  phone: string;
  referredBy?: string;
  clientType?: string;
  submissionType?: "online" | "offline";
  memberBranch?: string;
  panNumber: string;
  email: string;

  // Step 2 – Address Details (Permanent)
  country?: string;
  state?: string;
  district?: string;
  municipality?: string;
  wardNo?: string;
  streetTole?: string;
  // Temporary Address
  hasTempAddress?: boolean;
  sameAsPermanent?: boolean;
  tempCountry?: string;
  tempState?: string;
  tempDistrict?: string;
  tempMunicipality?: string;
  tempWardNo?: string;
  tempStreetTole?: string;

  // Step 3 – Documents Upload
  citizenshipFrontDataUrl?: string;
  citizenshipFrontName?: string;
  citizenshipBackDataUrl?: string;
  citizenshipBackName?: string;
  selfieDataUrl?: string;
  selfieName?: string;
  birthCertDataUrl?: string;
  birthCertName?: string;
  panDocDataUrl?: string;
  panDocName?: string;
  kycFormDataUrl?: string;
  kycFormName?: string;
  photoDataUrl?: string;
  photoName?: string;
  agreementDataUrl?: string;
  agreementName?: string;
  nationalIdDataUrl?: string;
  nationalIdName?: string;
  companyRegDataUrl?: string;
  companyRegName?: string;
  signatureDataUrl?: string;
  signatureName?: string;
  thumbprintDataUrl?: string;
  thumbprintName?: string;
}

export interface OfflineEntryInput {
  memberName: string;
  phone: string;
  membershipCode: string;
  address: string;
  idDocType?: string;
  idDocDataUrl?: string;
  idDocName?: string;
}

export interface SmsInviteData {
  memberId: string;
  name: string;
  phone: string;
  inviteCode: string;
  otp: string;
  link: string;
  queuedAt: number;
}

interface StoreValue {
  state: AppState;
  getMember: (id: string) => Member | undefined;
  getSubmission: (id: string) => KycSubmission | undefined;
  findByInviteCode: (code: string) => Member | undefined;
  addMembers: (rows: MemberInput[], source: MemberSource) => Member[];
  resendInvite: (memberId: string) => void;
  queueMemberSms: (memberId: string) => SmsInviteData | null;
  markMemberSmsSent: (memberId: string) => boolean;
  submitKyc: (input: SubmitKycInput) => { ok: boolean; error?: string };
  startReview: (submissionId: string) => void;
  approveSubmission: (submissionId: string) => void;
  rejectSubmission: (submissionId: string, remark: string) => void;
  setEvidenceVerification: (
    submissionId: string,
    evidence: "signature" | "thumbprint",
    verified: boolean
  ) => void;
  markPrinted: (submissionId: string) => void;
  offlineAdd: (input: OfflineEntryInput) => KycSubmission;
  updateOrgSettings: (patch: Partial<OrgSettings>) => void;
  resetState: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function buildAddress(
  wardNo?: string,
  streetTole?: string,
  municipality?: string,
  district?: string,
  state?: string,
  country?: string
): string {
  return [wardNo && `Ward ${wardNo}`, streetTole, municipality, district, state, country]
    .filter(Boolean)
    .join(", ");
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (Array.isArray(parsed.members) && Array.isArray(parsed.submissions)) {
        const existingIds = new Set(parsed.members.map((member) => member.id));
        const now = Date.now();
        const demoMembers = DEMO_MEMBERS
          .filter((member) => !existingIds.has(member.id))
          .map((member) => ({
            ...member,
            otpExpiresAt: now + 365 * DAY,
            invitedAt: now,
          }));
        return {
          ...parsed,
          members: [...parsed.members, ...demoMembers],
          orgSettings: parsed.orgSettings
            ? { ...DEFAULT_ORG_SETTINGS, ...parsed.orgSettings }
            : DEFAULT_ORG_SETTINGS,
        };
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return seedState();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full (large images) — ignore
    }
  }, [state]);

  const value = useMemo<StoreValue>(() => {
    const getMember = (id: string) => state.members.find((m) => m.id === id);
    const getSubmission = (id: string) =>
      state.submissions.find((s) => s.id === id);

    const findByInviteCode = (code: string) => {
      const cleaned = (code ?? "").trim().toLowerCase();
      if (!cleaned) return undefined;
      return state.members.find(
        (m) => m.inviteCode.toLowerCase() === cleaned
      );
    };

    const addMembers = (rows: MemberInput[], source: MemberSource): Member[] => {
      const now = Date.now();
      const created: Member[] = rows
        .filter((r) => r.name.trim().length > 0 && r.phone.trim().length > 0)
        .map((r) => ({
          id: uid("mem"),
          name: r.name.trim(),
          phone: r.phone.trim(),
          membershipCode:
            r.membershipCode.trim().toUpperCase() ||
            `MEM${String(state.members.length + 1).padStart(3, "0")}`,
          inviteCode: generateInviteCode(),
          otp: generateOtp(),
          otpExpiresAt: now + 30 * 60 * 1000,
          invitedAt: now,
          status: "invited",
          source,
        }));
      if (created.length > 0) {
        setState((s) => ({ ...s, members: [...created, ...s.members] }));
      }
      return created;
    };

    const resendInvite = (memberId: string) => {
      setState((s) => ({
        ...s,
        members: s.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                otp: m.otp,
                otpExpiresAt: Date.now() + 30 * 60 * 1000,
              }
            : m
        ),
      }));
    };

    const queueMemberSms = (memberId: string): SmsInviteData | null => {
      const member = state.members.find((m) => m.id === memberId);
      if (!member) return null;
      const otp = member.otp || generateOtp();
      const inviteCode = member.inviteCode;
      const queuedAt = Date.now();

      setState((s) => ({
        ...s,
        members: s.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                otp,
                otpExpiresAt: queuedAt + 30 * 60 * 1000,
                smsQueuedAt: queuedAt,
                smsSentAt: undefined,
              }
            : m
        ),
      }));

      return {
        memberId: member.id,
        name: member.name,
        phone: member.phone,
        inviteCode,
        otp,
        queuedAt,
        link: `${window.location.origin}${window.location.pathname}#/kyc/${inviteCode.toLowerCase()}`,
      };
    };

    const markMemberSmsSent = (memberId: string): boolean => {
      if (!state.members.some((member) => member.id === memberId)) return false;
      setState((s) => ({
        ...s,
        members: s.members.map((member) =>
          member.id === memberId ? { ...member, smsSentAt: Date.now() } : member
        ),
      }));
      return true;
    };

    const submitKyc: StoreValue["submitKyc"] = (input) => {
      const member = findByInviteCode(input.inviteCode);
      if (!member) return { ok: false, error: "Invitation not found. Please check your invite link." };
      if (member.status !== "invited" && member.status !== "rejected") {
        return { ok: false, error: "This invitation has already been submitted. Please contact your cooperative admin." };
      }
      if (member.otp !== input.otp.trim()) {
        return { ok: false, error: "Invalid OTP session. Please restart the verification." };
      }
      const panNumber = input.panNumber.trim();
      const email = input.email.trim();
      if (!/^\d{9}$/.test(panNumber)) {
        return { ok: false, error: "PAN must be exactly 9 digits." };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Please enter a valid email address." };
      }
      if (
        state.submissions.some(
          (submission) =>
            submission.memberId !== member.id &&
            submission.panNumber?.trim() === panNumber
        )
      ) {
        return { ok: false, error: "This PAN number is already registered." };
      }

      // Build a human-readable address string for display in list views
      const addressStr = buildAddress(
        input.wardNo,
        input.streetTole,
        input.municipality,
        input.district,
        input.state,
        input.country
      );

      // Step 4: Data is saved → Status becomes Pending Review
      const submission: KycSubmission = {
        id: uid("sub"),
        memberId: member.id,
        memberName: input.name.trim(),
        phone: input.phone.trim(),
        membershipCode: member.membershipCode,
        referredBy: input.referredBy,
        clientType: input.clientType,
        submissionType: input.submissionType,
        memberBranch: input.memberBranch,
        panNumber,
        email,
        // Permanent address
        country: input.country,
        state: input.state,
        district: input.district,
        municipality: input.municipality,
        wardNo: input.wardNo,
        streetTole: input.streetTole,
        address: addressStr || undefined,
        // Temporary address
        hasTempAddress: input.hasTempAddress,
        sameAsPermanent: input.sameAsPermanent,
        tempCountry: input.tempCountry,
        tempState: input.tempState,
        tempDistrict: input.tempDistrict,
        tempMunicipality: input.tempMunicipality,
        tempWardNo: input.tempWardNo,
        tempStreetTole: input.tempStreetTole,
        // Documents
        citizenshipFrontDataUrl: input.citizenshipFrontDataUrl,
        citizenshipFrontName: input.citizenshipFrontName,
        citizenshipBackDataUrl: input.citizenshipBackDataUrl,
        citizenshipBackName: input.citizenshipBackName,
        selfieDataUrl: input.selfieDataUrl,
        selfieName: input.selfieName,
        birthCertDataUrl: input.birthCertDataUrl,
        birthCertName: input.birthCertName,
        panDocDataUrl: input.panDocDataUrl,
        panDocName: input.panDocName,
        kycFormDataUrl: input.kycFormDataUrl,
        kycFormName: input.kycFormName,
        photoDataUrl: input.photoDataUrl,
        photoName: input.photoName,
        agreementDataUrl: input.agreementDataUrl,
        agreementName: input.agreementName,
        nationalIdDataUrl: input.nationalIdDataUrl,
        nationalIdName: input.nationalIdName,
        companyRegDataUrl: input.companyRegDataUrl,
        companyRegName: input.companyRegName,
        signatureDataUrl: input.signatureDataUrl,
        signatureName: input.signatureName,
        thumbprintDataUrl: input.thumbprintDataUrl,
        thumbprintName: input.thumbprintName,
        status: "pending",
        submittedAt: Date.now(),
      };

      setState((s) => ({
        ...s,
        members: s.members.map((m) =>
          m.id === member.id ? { ...m, status: "pending" } : m
        ),
        submissions: [
          submission,
          ...s.submissions.filter((x) => x.memberId !== member.id),
        ],
      }));
      return { ok: true };
    };

    const startReview = (submissionId: string) => {
      const sub = state.submissions.find((s) => s.id === submissionId);
      if (!sub) return;
      setState((s) => ({
        ...s,
        submissions: s.submissions.map((x) =>
          x.id === submissionId ? { ...x, status: "pending" } : x
        ),
        members: s.members.map((m) =>
          m.id === sub.memberId ? { ...m, status: "pending" } : m
        ),
      }));
    };

    const approveSubmission = (submissionId: string) => {
      const sub = state.submissions.find((s) => s.id === submissionId);
      if (!sub) return;
      if (sub.signatureVerified === undefined || sub.thumbprintVerified === undefined) return;
      setState((s) => ({
        ...s,
        submissions: s.submissions.map((x) =>
          x.id === submissionId
            ? { ...x, status: "approved", reviewedAt: Date.now(), reviewedBy: "Manager · Suresh" }
            : x
        ),
        members: s.members.map((m) =>
          m.id === sub.memberId ? { ...m, status: "approved" } : m
        ),
      }));
    };

    const rejectSubmission = (submissionId: string, remark: string) => {
      const sub = state.submissions.find((s) => s.id === submissionId);
      if (!sub) return;
      setState((s) => ({
        ...s,
        submissions: s.submissions.map((x) =>
          x.id === submissionId
            ? { ...x, status: "rejected", reviewedAt: Date.now(), reviewedBy: "Manager · Suresh", remark }
            : x
        ),
        members: s.members.map((m) =>
          m.id === sub.memberId ? { ...m, status: "rejected" } : m
        ),
      }));
    };

    const setEvidenceVerification: StoreValue["setEvidenceVerification"] = (
      submissionId,
      evidence,
      verified
    ) => {
      const existing = state.submissions.find((submission) => submission.id === submissionId);
      if (!existing || existing.status === "approved" || existing.status === "printed") return;
      const verifiedAt = verified ? Date.now() : undefined;
      const verifiedBy = verified ? "Manager · Suresh" : undefined;
      setState((s) => ({
        ...s,
        submissions: s.submissions.map((submission) =>
          submission.id === submissionId
            ? evidence === "signature"
              ? {
                  ...submission,
                  signatureVerified: verified,
                  signatureVerifiedAt: verifiedAt,
                  signatureVerifiedBy: verifiedBy,
                }
              : {
                  ...submission,
                  thumbprintVerified: verified,
                  thumbprintVerifiedAt: verifiedAt,
                  thumbprintVerifiedBy: verifiedBy,
                }
            : submission
        ),
      }));
    };

    const markPrinted = (submissionId: string) => {
      const sub = state.submissions.find((s) => s.id === submissionId);
      if (!sub || sub.status !== "approved") return;
      setState((s) => ({
        ...s,
        submissions: s.submissions.map((x) =>
          x.id === submissionId ? { ...x, status: "printed", printedAt: Date.now() } : x
        ),
        members: s.members.map((m) =>
          m.id === sub.memberId ? { ...m, status: "printed" } : m
        ),
      }));
    };

    const offlineAdd = (input: OfflineEntryInput): KycSubmission => {
      const sub: KycSubmission = {
        id: uid("sub"),
        memberId: "offline_manual",
        memberName: input.memberName.trim(),
        phone: input.phone.trim(),
        membershipCode: input.membershipCode.trim().toUpperCase() || "OFFLINE",
        address: input.address.trim(),
        idDocType: input.idDocType,
        idDocDataUrl: input.idDocDataUrl,
        idDocName: input.idDocName,
        status: "pending",
        submittedAt: Date.now(),
      };
      setState((s) => ({ ...s, submissions: [sub, ...s.submissions] }));
      return sub;
    };

    const updateOrgSettings = (patch: Partial<OrgSettings>) => {
      setState((s) => ({
        ...s,
        orgSettings: {
          ...s.orgSettings,
          ...patch,
        },
      }));
    };

    const resetState = () => {
      const fresh = seedState();
      setState(fresh);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch {
        // ignore
      }
    };

    return {
      state,
      getMember,
      getSubmission,
      findByInviteCode,
      addMembers,
      resendInvite,
      queueMemberSms,
      markMemberSmsSent,
      submitKyc,
      startReview,
      approveSubmission,
      rejectSubmission,
      setEvidenceVerification,
      markPrinted,
      offlineAdd,
      updateOrgSettings,
      resetState,
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `KYC${out}`;
}
