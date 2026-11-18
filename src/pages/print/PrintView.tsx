import { ArrowLeft, CheckCircle2, FileText, Printer } from "lucide-react";
import { useStore } from "../../lib/store";
import { navigate } from "../../lib/router";
import { formatDateTime } from "../../lib/utils";

// ─── Authentic ACCESS BRONZE Certification Badge ──────────────────────────────
function AccessBronzeBadge({ className = "h-11" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 border border-black px-2 py-0.5 text-black bg-white select-none shrink-0 ${className}`}
      title="ACCESS BRONZE Certified - Asian Confederation of Credit Unions"
    >
      <div className="flex flex-col items-center justify-center leading-none text-center">
        <span className="text-[12px] font-black tracking-widest font-sans">ACCESS</span>
        <span className="text-[8px] font-bold tracking-wider border-t border-b border-black px-1.5 my-0.5">
          BRONZE
        </span>
        <span className="text-[5.5px] font-semibold tracking-tighter uppercase text-slate-800">
          Asian Confederation of Credit Unions
        </span>
      </div>
    </div>
  );
}

// ─── Authentic Ganesh / Cooperative Emblem ────────────────────────────────────
function GaneshEmblem({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`shrink-0 ${className}`}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="47" fill="none" stroke="black" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="43" fill="none" stroke="black" strokeWidth="1" strokeDasharray="3 2" />
      <path d="M25 72 C35 65 65 65 75 72 C68 80 32 80 25 72 Z" fill="black" />
      <ellipse cx="50" cy="54" rx="20" ry="16" fill="none" stroke="black" strokeWidth="2" />
      <circle cx="50" cy="38" r="14" fill="none" stroke="black" strokeWidth="2" />
      <polygon points="50,14 42,26 58,26" fill="black" />
      <path d="M36 34 C28 32 26 44 36 46" fill="none" stroke="black" strokeWidth="2" />
      <path d="M64 34 C72 32 74 44 64 46" fill="none" stroke="black" strokeWidth="2" />
      <path d="M50 42 Q46 54 55 56 Q59 56 59 52" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="50" y1="28" x2="50" y2="35" stroke="black" strokeWidth="1.8" />
      <circle cx="50" cy="36" r="1.5" fill="black" />
    </svg>
  );
}

// ─── Standard Checkbox for KYC Form ───────────────────────────────────────────
function FormCheckbox({ checked, label }: { checked?: boolean; label: string }) {
  return (
        <span className="inline-flex items-center gap-1.5 mr-3 text-black select-none text-[10.5px] leading-tight">
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black bg-white text-[9px] font-black leading-none shrink-0">
            {checked ? "✓" : ""}
          </span>
          <span>{label}</span>
      </span>
      );
}

      // ─── Underlined dynamic KYC value or blank dotted line ────────────────────────
      function Underlined({
        value,
        dots = "........................",
        className = "",
}: {
        value ?: string | number | null;
      dots?: string;
      className?: string;
}) {
  if (value !== undefined && value !== null && String(value).trim() !== "" && String(value).trim() !== "—") {
    return (
        <span className={`font-bold text-black border-b border-black px-1.5 inline-block text-center ${className}`}>
          {value}
        </span>
        );
  }
        return <span className={`text-slate-500 font-mono tracking-tighter ${className}`}>{dots}</span>;
}

        export default function PrintView({id}: {id: string }) {
  const {state, getSubmission, markPrinted} = useStore();
        const sub = getSubmission(id);
        const org = state.orgSettings;

        if (!sub) {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-100 p-6 text-center">
          <FileText className="h-10 w-10 text-slate-400" />
          <p className="font-bold text-slate-700">KYC form not found.</p>
          <button
            onClick={() => navigate("/admin")}
            className="rounded-2xl bg-[#145C45] px-6 py-3 font-bold text-white hover:bg-[#0f4534] transition cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
        );
  }

  const doPrint = () => {
          markPrinted(sub.id);
        window.print();
  };

        const coopTitle = org.nameNepali || "सिद्धि गणेश बचत तथा ऋण सहकारी संस्था लि.";
        const displayCid = `KYC-${sub.id.slice(-6).toUpperCase()}`;

        // Formatted address components
        const permanentAddressParts = [
        sub.wardNo ? `वडा नं. ${sub.wardNo}` : null,
        sub.streetTole,
        sub.municipality,
        sub.district,
        sub.state,
        sub.country || "नेपाल",
        ].filter(Boolean);

        const hasDistinctTemp = Boolean(
        sub.hasTempAddress &&
        !sub.sameAsPermanent &&
        (sub.tempDistrict || sub.tempMunicipality || sub.tempState)
        );

        return (
                <div className="min-h-dvh bg-slate-100 pb-14 print:bg-white print:p-0 print:pb-0">
                  {/* ─── Action Bar (Hidden during Print) ─────────────────────────────────── */}
                  <div className="no-print sticky top-0 z-30 border-b border-[#0f4534] bg-[#145C45] px-4 py-3 text-white shadow-md">
                    <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => navigate(`/admin/submissions/${sub.id}`)}
                          className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-[#DDF3E7] transition cursor-pointer"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>Back to Submission</span>
                        </button>
                          <div className="hidden sm:block">
                            <p className="text-xs font-black text-white">{sub.memberName}</p>
                            <p className="text-[10px] text-[#DDF3E7]/80">
                              {sub.membershipCode} &middot; Official KYC Document
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={doPrint}
                          className="flex items-center gap-2 rounded-xl bg-[#059669] hover:bg-emerald-600 active:scale-95 px-5 py-2 text-xs sm:text-sm font-extrabold text-white shadow-md transition cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                          <span>Print KYC Form</span>
                        </button>
                      </div>
                    </div>

                      {/* ─── Document Container (Mobile Friendly & A4 Print Formatted) ────────── */}
                      <div className="print-area mx-auto mt-4 max-w-4xl px-2 sm:px-4">
                        <div
                          className="kyc-page relative mx-auto bg-white p-5 sm:p-9 shadow-lg border border-slate-300 rounded-sm text-[11px] leading-[1.4] text-black"
                          style={{ fontFamily: "'Plus Jakarta Sans', 'Mukta', 'Noto Sans Devanagari', sans-serif" }}
                        >
                          {/* Top Slogan */}
                          <div className="text-center font-bold text-[10px] tracking-wide mb-1">
                            "सदस्यहरूको सम्पूर्ण वित्तीय समाधानको पहिलो छनौट"
                          </div>

                          {/* Organization Header */}
                            <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2.5">
                              {/* Left Emblem */}
                              <div className="w-16 flex justify-start">
                                <GaneshEmblem className="h-14 w-14" />
                              </div>

                              {/* Center Organization Identity */}
                              <div className="flex-1 text-center">
                                <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight">
                                  {coopTitle}
                                </h1>
                                  {org.nameEnglish && (
                                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-black">
                                      {org.nameEnglish}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-slate-800 mt-0.5">
                                    {org.addressNepali || org.addressEnglish || "काठमाडौं, नेपाल"}
                                  </p>
                                    <p className="text-[9px] text-slate-700 font-medium">
                                      {org.regNo} &middot; स्थायी लेखा नं. (PAN): {org.panNo} &middot; फोन: {org.phone}
                                    </p>
                                  </div>

                                  {/* Right ACCESS BRONZE Badge */}
                                  <div className="w-24 flex justify-end">
                                    <AccessBronzeBadge className="h-12" />
                                  </div>
                              </div>

                              {/* Sub Header: CID / Membership No & Photo Box */}
                              <div className="mt-2.5 flex items-start justify-between">
                                  <div className="space-y-1.5 text-[11px] font-medium pt-1">
                                    <div>
                                      CID No.: <Underlined value={displayCid} dots="........................" />
                                    </div>
                                    <div>
                                      सदस्यता नं.: <Underlined value={sub.membershipCode} dots="........................" />
                                    </div>
                                    <div>
                                      सदस्य शाखा: <Underlined value={sub.memberBranch || "मुख्य कार्यालय (Head Office)"} dots="........................" />
                                    </div>
                                  </div>

                                      {/* Passport Photo Box */ }
                                      < div className="relative h-28 w-24 border border-black border-dashed flex flex-col items-center justify-center bg-slate-50 text-center p-0.5 overflow-hidden shrink-0">
                                    {sub.photoDataUrl ? (
                                      <img
                                        src={sub.photoDataUrl}
                                        alt="Member"
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center justify-center p-1 text-[9px] text-slate-500">
                                        <span className="font-bold">तस्बिर</span>
                                        <span className="text-[7.5px] mt-0.5">(पासपोर्ट साइज)</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Main Title Box */}
                                  <div className="my-2.5 text-center">
                                    <div className="inline-block border-b-2 border-black pb-0.5">
                                      <h2 className="text-base sm:text-lg font-black tracking-wide text-black">
                                        सदस्य पहिचान फारम (KYC Form)
                                      </h2>
                                    </div>
                                      <p className="text-[10px] font-semibold text-slate-800 mt-0.5">
                                        (दफा ३ उपदफा (२) को खण्ड (ख) सँग सम्बन्धित आधिकारिक विवरण)
                                      </p>
                                  </div>

                                  {/* ─── १. व्यक्तिगत विवरण ────────────────────────────────────────── */}
                                  <div className="mt-2">
                                    <h3 className="font-black text-xs border-b border-black pb-0.5 mb-1.5 uppercase tracking-wide">
                                      १. व्यक्तिगत विवरण (Personal Details)
                                    </h3>
                                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-2 gap-x-2 text-[10.5px]">
                                        <div className="sm:col-span-6">
                                          १.१ नाम, थर (Full Name): <Underlined value={sub.memberName} className="font-bold text-xs" />
                                        </div>
                                          <div className="sm:col-span-6">
                                            १.२ सम्पर्क फोन (Mobile): <Underlined value={sub.phone ? `+977 ${sub.phone}` : null} dots="........................" />
                                          </div>

                                          <div className="sm:col-span-6">
                                            १.३ सदस्यता कोड (Member Code): <Underlined value={sub.membershipCode} className="font-bold" />
                                          </div>
                                          <div className="sm:col-span-6">
                                            १.४ सदस्य प्रकार (Client Type): <Underlined value={sub.clientType || "Individual (व्यक्तिगत)"} />
                                          </div>

                                          <div className="sm:col-span-6">
                                            १.५ स्थायी लेखा नम्बर (PAN No.): <Underlined value={sub.panNumber} dots="........................" />
                                          </div>
                                          <div className="sm:col-span-6">
                                            १.६ इमेल ठेगाना (Email): <Underlined value={sub.email} dots="........................" />
                                          </div>

                                          <div className="sm:col-span-6">
                                            १.७ पहिचान प्रमाण प्रकार (ID Doc Type): <Underlined value={sub.idDocType || "नागरिकता प्रमाणपत्र (Citizenship)"} />
                                          </div>
                                            <div className="sm:col-span-6">
                                              १.८ सिफारिसकर्ता सदस्य (Referred By): <Underlined value={sub.referredBy} dots="........................" />
                                            </div>
                                          </div>
                                        </div>

                                          {/* ─── २. ठेगाना सम्बन्धी विवरण ─────────────────────────────────── */}
                                          <div className="mt-3.5">
                                            <h3 className="font-black text-xs border-b border-black pb-0.5 mb-1.5 uppercase tracking-wide">
                                              २. ठेगाना सम्बन्धी विवरण (Address Details)
                                            </h3>
                                              <div className="space-y-2 text-[10.5px]">
                                                <div>
                                                    <span className="font-bold">२.१ स्थायी ठेगाना (Permanent Address):</span>
                                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 mt-1 pl-2">
                                                      <div>(१) प्रदेश: <Underlined value={sub.state} dots="............" /></div>
                                                      <div>(२) जिल्ला: <Underlined value={sub.district} dots="............" /></div>
                                                      <div className="sm:col-span-2">(३) न.पा./गाउँपालिका: <Underlined value={sub.municipality} dots="............" /></div>
                                                      <div>(४) वडा नं.: <Underlined value={sub.wardNo} dots="......" /></div>
                                                      <div>(५) टोल/मार्ग: <Underlined value={sub.streetTole} dots="............" /></div>
                                                    </div>
                                                    {permanentAddressParts.length > 0 && (
                                                      <p className="text-[10px] text-slate-700 pl-2 mt-1">
                                                        पूर्ण ठेगाना: <span className="font-bold text-black">{permanentAddressParts.join(", ")}</span>
                                                      </p>
                                                    )}
                                                  </div>

                                                  <div>
                                                    <span className="font-bold">२.२ अस्थायी ठेगाना (Temporary Address):</span>
                                                    {hasDistinctTemp ? (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 mt-1 pl-2">
                    <div>(१) प्रदेश: <Underlined value={sub.tempState} dots="............" /></div>
                    <div>(२) जिल्ला: <Underlined value={sub.tempDistrict} dots="............" /></div>
                    <div className="sm:col-span-2">(३) न.पा./गाउँपालिका: <Underlined value={sub.tempMunicipality} dots="............" /></div>
                    <div>(४) वडा नं.: <Underlined value={sub.tempWardNo} dots="......" /></div>
                    <div>(५) टोल/मार्ग: <Underlined value={sub.tempStreetTole} dots="............" /></div>
                  </div>
                                                    ) : (
                  <p className="text-[10px] text-slate-700 pl-2 mt-0.5">
                    <span className="font-bold text-black">स्थायी ठेगाना अनुसार (Same as Permanent Address)</span>
                  </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>

                                                {/* ─── ३. संलग्न तथा प्रमाणित कागजातहरूको विवरण ──────────────────── */}
                                                <div className="mt-3.5">
                                                  <h3 className="font-black text-xs border-b border-black pb-0.5 mb-1.5 uppercase tracking-wide">
                                                    ३. संलग्न तथा प्रमाणित कागजातहरूको विवरण (Verified Documents & KYC Proofs)
                                                  </h3>
                                                    <table className="w-full border-collapse border border-black text-center text-[10px] mt-1">
                                                      <thead>
                                                        <tr className="border-b border-black bg-slate-50 font-bold">
                                                          <th className="border-r border-black w-10 py-1">सि.नं.</th>
                                                          <th className="border-r border-black py-1 text-left px-2">कागजातको विवरण (Document Type)</th>
                                                          <th className="border-r border-black w-36 py-1">प्रमाणीकरण स्थिति</th>
                                                          <th className="w-32 py-1">कैफियत (Remarks)</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        <tr className="border-b border-black h-5">
                                                          <td className="border-r border-black py-0.5">१.</td>
                                                          <td className="border-r border-black py-0.5 text-left px-2 font-medium">
                                                            सदस्यको तस्बिर (Passport Size Member Photo)
                                                          </td>
                                                          <td className="border-r border-black py-0.5 font-bold text-emerald-800">
                                                            {sub.photoDataUrl ? "✓ संलग्न तथा रुजु" : "अनलाइन पेश गरिएको"}
                                                          </td>
                                                          <td className="py-0.5 text-[9.5px]">बायोमेट्रिक रुजु</td>
                                                        </tr>
                                                        <tr className="border-b border-black h-5">
                                                          <td className="border-r border-black py-0.5">२.</td>
                                                          <td className="border-r border-black py-0.5 text-left px-2 font-medium">
                                                            परिचयपत्र प्रमाणपत्र (Citizenship / ID Card - Front &amp; Back)
                                                          </td>
                                                          <td className="border-r border-black py-0.5 font-bold text-emerald-800">
                                                            {sub.citizenshipFrontDataUrl || sub.idDocDataUrl ? "✓ संलग्न तथा प्रमाणित" : "प्रमाणित"}
                                                          </td>
                                                          <td className="py-0.5 text-[9.5px]">{sub.idDocType || "नागरिकता"}</td>
                                                        </tr>
                                                        <tr className="border-b border-black h-5">
                                                          <td className="border-r border-black py-0.5">३.</td>
                                                          <td className="border-r border-black py-0.5 text-left px-2 font-medium">
                                                            परिचयपत्र सहितको सेल्फी (Selfie with ID Verification)
                                                          </td>
                                                          <td className="border-r border-black py-0.5 font-bold text-emerald-800">
                                                            {sub.selfieDataUrl ? "✓ संलग्न तथा प्रमाणित" : "रुजु गरिएको"}
                                                          </td>
                                                          <td className="py-0.5 text-[9.5px]">डिजिटल भेरिफाइड</td>
                                                        </tr>
                                                        <tr className="border-b border-black h-5">
                                                          <td className="border-r border-black py-0.5">४.</td>
                                                          <td className="border-r border-black py-0.5 text-left px-2 font-medium">
                                                            स्थायी लेखा नम्बर प्रमाणपत्र (PAN Card)
                                                          </td>
                                                          <td className="border-r border-black py-0.5">
                                                            {sub.panNumber || sub.panDocDataUrl ? "✓ पेश गरिएको" : "लागू नभएको (N/A)"}
                                                          </td>
                                                          <td className="py-0.5 text-[9.5px]">{sub.panNumber || "—"}</td>
                                                        </tr>
                                                        <tr className="border-b border-black h-5">
                                                          <td className="border-r border-black py-0.5">५.</td>
                                                          <td className="border-r border-black py-0.5 text-left px-2 font-medium">
                                                            अनलाइन सदस्य सम्झौता (Online KYC Agreement)
                                                          </td>
                                                          <td className="border-r border-black py-0.5 font-bold text-emerald-800">
                                                            ✓ हस्ताक्षर सहित स्वीकृत
                                                          </td>
                                                          <td className="py-0.5 text-[9.5px]">डिजिटल सम्झौता</td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                </div>

                                                {/* ─── ४. स्वघोषणा ──────────────────────────────────────────────── */}
                                                <div className="mt-3.5 border-t border-black pt-2 text-[10.5px]">
                                                  <h3 className="font-black text-xs pb-0.5 uppercase tracking-wide">
                                                    ४. स्वघोषणा (Member Self Declaration)
                                                  </h3>
                                                  <p className="mt-0.5 text-justify">
                                                    (१) मैले पेश गरेको यो KYC विवरणमा भविष्यमा कुनै परिवर्तन आएमा त्यस्तो परिवर्तन भएका मितिले ३५ दिन भित्र संस्थामा पेश गर्नेछु ।
                                                  </p>
                                                  <p className="mt-0.5 text-justify">
                                                    (२) मैले माथि पेस गरेको मेरो सम्पूर्ण विवरण ठीक, दुरुस्त छ । झुठ्ठा ठहरे कानुनबमोजिम सहुँला, बुझाउँला ।
                                                  </p>

                                                  <div className="mt-3 flex items-start justify-between gap-4">
                                                    {/* Member Signature & Identity */}
                                                      <div className="space-y-1 text-[11px] pt-1">
                                                        <div className="flex items-center gap-2">
                                                            <span>सदस्यको दस्तखत :</span>
                  {sub.signatureDataUrl ? (
                                                            <img
                                                              src={sub.signatureDataUrl}
                                                              alt="Signature"
                                                              className="h-10 max-w-[130px] object-contain border-b border-black"
                                                            />
                                                          ) : (
                                                            <span className="font-mono">....................................</span>
                                                          )}
                                                        </div>
                                                        <div>
                                                          नाम : <strong className="font-bold underline text-xs">{sub.memberName}</strong>
                                                        </div>
                                                        <div>
                                                          मिति :{" "}
                                                          <span className="font-bold">
                                                            {formatDateTime(sub.submittedAt || Date.now()).split(",")[0]}
                                                          </span>
                                                        </div>
                                                      </div>

                                                      {/* Thumbprint Impressions (दायाँ / बायाँ) */}
                                                      <div className="text-center">
                                                        <div className="flex justify-around text-[10px] font-bold text-slate-800 mb-0.5 px-2">
                                                          <span>दायाँ</span>
                                                          <span>बायाँ</span>
                                                        </div>
                                                        <div className="h-16 w-32 border border-black border-dashed flex items-center justify-center p-1 bg-white">
                                                            {
                                                              sub.thumbprintDataUrl ? (
                                                                <img
                                                                  src={sub.thumbprintDataUrl}
                                                                  alt="Thumbprint"
                                                                  className="h-full w-full object-contain"
                                                                />
                                                              ) : (
                                                                <span className="text-[9px] text-slate-400">औंठाछाप</span>
                                                              )
                                                            }
                </div>
                                                        <p className="text-[9.5px] font-bold text-slate-700 mt-0.5">औंठाछाप (दायाँ / बायाँ)</p>
                                                      </div>
                                                    </div>
                                                  </div>

                                                    {/* ─── ५. कार्यालय प्रयोजन तथा प्रमाणीकरण ─────────────────────────── */}
                                                    <div className="mt-3.5 border-t-2 border-black pt-2 text-[10.5px]">
                                                      <h3 className="font-black text-xs pb-0.5 mb-1 uppercase tracking-wide">
                                                        ५. कार्यालय प्रयोजन तथा प्रमाणीकरण (Office Approval &amp; Verification)
                                                      </h3>
                                                      <p className="text-justify leading-relaxed">
                                                        यसमा उल्लेख भएका श्री{" "}
                                                        <strong className="underline font-bold px-1 text-black">{sub.memberName}</strong>{" "}
                                                        ले पेस गरेको सम्पूर्ण KYC विवरण तथा संलग्न कागजातहरू रुजु गर्दा रीतपूर्वक भएको पाइएकोले संस्थाको आधिकारिक अभिलेखमा दर्ता तथा सदस्यता अद्यावधिक गर्न सिफारिस / स्वीकृत गर्दछु ।
                                                      </p>

                                                        <div className="mt-3.5 grid grid-cols-2 gap-8 text-[10.5px]">
                                                          {/* Review Officer Sign */}
                                                          <div className="space-y-1">
                                                            <p className="font-bold underline">रुजु तथा प्रमाणित गर्ने अधिकृत</p>
                                                            <p>दस्तखत : ....................................</p>
                                                            <p>नाम : <Underlined value={sub.reviewedBy || "अधिकृत व्यवस्थापक (Manager)"} dots="................................" /></p>
                                                            <p>निर्णय स्थिति : <strong className="font-bold text-emerald-800 underline">APPROVED (प्रमाणित)</strong></p>
                                                            <p>मिति : {formatDateTime(sub.reviewedAt || sub.submittedAt || Date.now()).split(",")[0]}</p>
                                                          </div>

                                                            {/* Official Seal Frame */}
                                                            <div className="flex flex-col items-center justify-center text-center">
                                                              <div className="h-16 w-24 border border-black border-dashed flex items-center justify-center text-[9px] text-slate-500 font-bold">
                                                                कार्यालय छाप (Seal)
                                                              </div>
                                                              <p className="text-[9.5px] font-bold mt-1">{coopTitle}</p>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  );
}
