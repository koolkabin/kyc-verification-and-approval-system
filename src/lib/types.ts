export interface OrgSettings {
  nameNepali: string;
  nameEnglish: string;
  shortName: string;
  regNo: string;
  panNo: string;
  addressNepali: string;
  addressEnglish: string;
  phone: string;
  email: string;
  cooperativeType: string;
  logoPreset?: "emblem" | "hands" | "scales";
  customLogoUrl?: string;
  isSample: boolean;
}

export const STATUS_LABEL: Record<string, string> = {
  invited: "Invitation Sent",
  submitted: "Submitted",
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  printed: "Printed",
};

/** Ordered happy-path states of a KYC. */
export const KYC_FLOW = ["invited", "submitted", "pending", "approved", "printed"] as const;

export type KycStatus =
  | "invited"
  | "submitted"
  | "pending"
  | "approved"
  | "rejected"
  | "printed";

export type SubmissionStatus = Exclude<KycStatus, "invited">;
export type MemberSource = "csv" | "manual";

export interface Member {
  id: string;
  name: string;
  phone: string;
  membershipCode: string;
  inviteCode: string;
  otp: string;
  otpExpiresAt: number;
  invitedAt: number;
  status: KycStatus;
  smsQueuedAt?: number;
  smsSentAt?: number;
  isDemo?: boolean;
  source?: MemberSource;
}

export interface KycSubmission {
  id: string;
  memberId: string;

  // ── Step 1: General Details ──────────────────────────────────────────────
  memberName: string;
  phone: string;
  membershipCode: string;
  referredBy?: string;
  clientType?: string;
  submissionType?: "online" | "offline";
  memberBranch?: string;
  panNumber?: string;
  email?: string;

  // ── Step 2: Address Details ───────────────────────────────────────────────
  // Permanent Address
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
  // Legacy / computed address string for display cards
  address?: string;

  // ── Extended Official Nepal KYM Fields (Optional) ───────────────────────────
  dob?: string;
  citizenshipNo?: string;
  citizenshipIssuedDistrict?: string;
  citizenshipIssuedDate?: string;
  gender?: "male" | "female" | "other" | string;
  motherName?: string;
  fatherName?: string;
  grandfatherName?: string;
  maritalStatus?: "married" | "unmarried" | "single" | string;
  spouseName?: string;
  familyType?: "joint_same_kitchen" | "joint_diff_kitchen" | "nuclear" | string;
  mainOccupation?: "farming" | "business" | "service" | "foreign" | "other" | string;
  occupationDetail?: string;
  spouseOccupation?: "farming" | "business" | "service" | "foreign" | "other" | string;
  spouseOccupationDetail?: string;
  otherIncomeEarner?: { name?: string; relation?: string; occupation?: string };
  isPepOrPublicFigure?: boolean;
  pepDetails?: { name?: string; relation?: string; role?: string };
  houseNo?: string;
  tempHouseNo?: string;
  residenceType?: "permanent" | "temporary" | string;
  voterIdNo?: string;
  votingPlace?: string;
  timeSpentInServiceArea?: string;
  passportNo?: string;
  membershipObjective?: string;
  isMemberOfOtherCoop?: boolean;
  otherCoops?: Array<{ nameAndAddress: string; memberNo: string }>;
  familyOtherCoops?: Array<{ memberName?: string; nameAndAddress: string; memberNo: string }>;
  coopMembershipPurpose?: string;
  familyCoopMembershipPurpose?: string;
  familyMemberInThisCoop?: boolean;
  familyMembersInThisCoop?: Array<{ nameAndAddress: string; memberNo: string }>;
  annualFamilyIncomeRange?: "up_to_4_lakh" | "4_to_10_lakh" | "10_to_25_lakh" | "25_to_50_lakh" | "above_50_lakh" | string;
  incomeBreakdown?: {
    farming?: string;
    business?: string;
    domesticJob?: string;
    foreignJob?: string;
    other?: string;
  };
  initialTransactions?: {
    share?: string;
    savings?: string;
    other?: string;
  };
  annualTransactionsCount?: string;
  annualEstimatedDeposit?: string;
  estimatedLoanAmount?: string;
  remarksAdditional?: string;
  recommender1?: { name?: string; memberNo?: string };
  recommender2?: { name?: string; memberNo?: string };

  // ── Step 3: Documents Upload ──────────────────────────────────────────────
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
  signatureVerified?: boolean;
  signatureVerifiedAt?: number;
  signatureVerifiedBy?: string;
  thumbprintDataUrl?: string;
  thumbprintName?: string;
  thumbprintVerified?: boolean;
  thumbprintVerifiedAt?: number;
  thumbprintVerifiedBy?: string;
  // Legacy doc fields (for backward compat with seed data)
  idDocType?: string;
  idDocDataUrl?: string;
  idDocName?: string;

  // ── Metadata ──────────────────────────────────────────────────────────────
  status: SubmissionStatus;
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  remark?: string;
  printedAt?: number;
}

export interface MemberInput {
  name: string;
  phone: string;
  membershipCode: string;
}
