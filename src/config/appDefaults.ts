import type { OrgSettings } from "../lib/types";

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  nameNepali: "नेपाल बचत तथा ऋण सहकारी संस्था लिमिटेड",
  nameEnglish: "Nepal Savings & Credit Cooperative Society Ltd.",
  shortName: "सहकारी (Coop)",
  regNo: "दर्ता नं: २०७४/००१ (नमूना)",
  panNo: "३०००००००१ (Sample)",
  addressNepali: "काठमाडौँ महानगरपालिका-१०, बागमती प्रदेश, नेपाल",
  addressEnglish: "Ward 10, Kathmandu Metropolitan City, Bagmati Province, Nepal",
  phone: "+977-01-4400000",
  email: "info@coop-sample.org.np",
  cooperativeType: "बचत तथा ऋण सहकारी संस्था (Savings & Credit Cooperative)",
  logoPreset: "emblem",
  isSample: true,
};

export const DEMO_MANAGER_CREDENTIALS = {
  email: "manager@demo.com",
  password: "Manager@123",
} as const;
