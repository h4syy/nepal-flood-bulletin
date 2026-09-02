export type Lang = "en" | "ne";

export const LANGS: Lang[] = ["en", "ne"];

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "ne";
}

// UI chrome only. Feed content stays in its original (mixed) language.
const en = {
  langName: "English",
  otherLangName: "नेपाली",
  siteTagline: "Rescue & Relief Bulletin",
  updatedAt: "Data updated",
  source: "Source",
  sourceUnreachable:
    "Live source unavailable. Showing the last saved data.",
  emergency: "Emergency hotlines",
  call: "Call",

  srTitle: "Search & Rescue",
  srIntro:
    "From the community bulletin and official NDRRMA rescued lists. Each card shows its source. Verify before acting.",
  tabMissing: "Need attention",
  tabFound: "Rescued",
  statusMissing: "Missing",
  statusRescued: "Rescued",
  emergencyRelief: "Emergency relief",
  needAttentionChip: "Need attention",
  rescuedChip: "Rescued",
  searchByName: "Search by name",
  crossCheckTitle: "May already be rescued?",
  crossCheckNote:
    "Someone listed as missing here may already be safe. Always cross-check the official rescued lists:",
  searchPlaceholder: "Search by name (Nepali or romanized, e.g. binod), place, phone…",
  countryLabel: "Country",
  filterAll: "All",
  countryNepal: "Nepal",
  countryForeign: "Foreign",
  rescueStatusLabel: "Status",
  resultsCount: "records",
  showing: "Showing",
  of: "of",
  prev: "Prev",
  next: "Next",
  noResults: "No matching records.",
  reportMissing: "Report a missing person",
  reportFound: "Report someone found",
  fieldPlace: "Location",
  fieldPhone: "Contact",
  fieldAge: "Age",
  fieldWhen: "Last seen",
  fieldNote: "Note",
  flagged: "Needs review",

  liveUpdatesTitle: "Live updates",
  liveUpdatesIntro: "Recent changes from the bulletin source.",
  liveUpdatesEmpty: "No recent updates.",
  reportedLabel: "Reported",

  updatesTitle: "Official updates & posts",
  updatesIntro:
    "Links to posts from official handles and agencies. Check the source before acting.",
  updatesEmpty: "No updates posted yet.",
  verified: "Verified",
  unverified: "Unverified",
  viewPost: "View post",
  pinned: "Pinned",

  helpTitle: "How to get help",
  helpIntro:
    "Report a missing or found person through the official community forms, or use the emergency numbers.",
  resourcesTitle: "Helpful resources",

  donationTitle: "Support & Donation",
  informationalBadge: "Informational only",
  donationPending:
    "Official donation details are pending verification and are intentionally hidden. Do not publish this page until your team fills in verified details.",
  donationBank: "Bank",
  donationAccountName: "Account name",
  donationAccountNumber: "Account number",
  officialPage: "Official page",
  donatePortal: "Donate at the official portal",
  donateInfoNote:
    "Payment is processed on the official government portal (pmdrf.nchl.com.np). This site does not handle payments and is not affiliated with any government body.",

  kpiTitle: "Situation at a glance",
  kpiStillMissing: "Still missing",
  kpiRescued: "Rescued / found",
  kpiReunited: "Reunited",
  kpiAccounted: "Accounted for",
  kpiNew24h: "New (24h)",
  kpiRiversWarn: "Rivers above warning",
  kpiDistricts: "Affected districts",
  kpiOfMissing: "Among those still missing",
  kpiMinors: "minors",
  kpiElderly: "elderly",
  kpiForeign: "foreign*",
  kpiForeignNote: "*foreign nationals, approximate (from location / phone)",
  minAgo: "min ago",
  tagMinor: "Minor",
  tagElderly: "Elderly",
  tagForeign: "Foreign",

  riverTitle: "River Watch",
  riverIntro:
    "Live river levels from the Dept. of Hydrology & Meteorology (DHM). Verify with authorities before acting.",
  riverDangerAlert: "One or more rivers are at or above DANGER level.",
  riverWarningAlert: "One or more rivers are above WARNING level.",
  riverWarn: "Warning",
  riverDanger: "Danger",
  riverLevel: "Level",
  riverObserved: "Observed",
  riverSourceDhm: "DHM source",
  riverRising: "Rising",
  riverFalling: "Falling",
  riverSteady: "Steady",
  riverNormal: "Normal",
  riverReliability: "Gauge data may be unreliable",
  riverEmpty: "River data is unavailable right now.",

  mapTitle: "Flood Map",
  mapIntro:
    "Approximate flood corridor along the Trishuli–Narayani, with live DHM gauge locations coloured by status.",
  mapConfirmed: "River corridor",
  mapAtRisk: "Downstream / at-risk",
  mapGauge: "DHM gauge (by status)",
  mapEntry: "Upstream / entry",
  mapDisclaimer:
    "Pins and paths are approximate (market / bridge points, not the exact channel). Verify with DHM and local authorities.",
  mapRain: "Rain radar",
  mapRainNote: "Live rain radar by RainViewer. Toggle it top-right.",
  riverSafetyTitle: "Request to people living near the river.",
  riverSafetyBody: "Move from the riverside to higher ground and stay on high alert.",

  footerDisclaimer:
    "This site gathers missing, rescued and recovered-person records from official sources — NDRRMA SETU, NDRRMA, Nepal Police, HEOC, OPMCM and more — alongside the community bulletin, so families can search them in one place. Records may be updated at their source after they appear here, and some matches are fuzzy or transliterated — so please re-confirm details, especially a person's identity, with the official source or authorities before acting. We help you search; we are not the rescuing authority.",
  dataMirroredFrom: "Data mirrored from",
  backToTop: "Back to top",

  creditBy: "Data & original bulletin by",
  creditThanks: "full credit to the original author",
  creditView: "View original",
  builtBy: "Built by",
  dataSourcesLabel: "Data sources",
  suggestionsLabel: "Found an issue or have a suggestion? Let the maintainers know:",
  topInviteLabel:
    "Know an official data source we should add, or have feedback? Reach out:",

  // Search-first hero
  navSearch: "Search & Found",
  navOverview: "Overview",
  navUpdates: "Official Updates",
  navEmergency: "Emergency",
  navDonate: "Donate",
  heroScope: "Rasuwa · Nuwakot · Dhading — Bhotekoshi / Trishuli Flood",
  heroTitle: "Find someone. Report someone. Check a status.",
  heroSubtitle:
    "Search Nepal's flood missing & found directory. Every card shows its source — always verify before acting.",
  searchCta: "Search",
  heroSearchHelp:
    'Works with both scripts — try "Binod" or "बिनोद". You can also filter by country and status below.',
  heroLiveSynced:
    "Live-synced from official NDRRMA lists & the community bulletin",
  heroLastSynced: "Last synced",
  heroHowItWorks: "How this works",
  heroReportMissing: "Report Missing",
  heroMarkFound: "Mark Someone Found",
  heroEmergencyBtn: "Emergency numbers",
  statMissing: "missing",
  statFound: "found",
  statTracked: "records tracked",

  // Categories & search cautions
  tabDeceased: "Unidentified",
  statusDeceased: "Unidentified body",
  deceasedNote:
    "Recovered but not-yet-identified victims (Nepal Police). Listed so families can reconcile — contact the holding facility or police to confirm.",
  fuzzyNote:
    "Some results are close or similar-sounding matches — names vary by spelling and script, so a match may be a different person. Please verify identity before concluding.",

  // Hospitals
  hospitalsTitle: "Hospitals & treatment",
  hospitalsIntro:
    "Where flood patients were taken for treatment, with admitted / discharged / referred counts. Named hospital patients are searchable above.",
  hospitalName: "Facility",
  hospitalTotal: "Admitted",
  hospitalDischarged: "Discharged",
  hospitalReferred: "Referred",
  hospitalTotalRow: "Total",
  hospitalsNote:
    "Facility totals via the community bulletin (HEOC / DEOC-derived) — re-confirm with the hospital or health authorities.",

  // Kailash Mansarovar Yatra pilgrims notice
  kailashTag: "Special notice",
  kailashTitle: "Kailash Mansarovar Yatra pilgrims — out of contact",
  kailashBody:
    "When the flood hit the Rasuwagadhi–Kerung (Gyirong) border crossing on 26 August 2026, foreign pilgrims on the Kailash Mansarovar Yatra were caught in the affected zone. Among those still out of contact are the Isha Foundation's “S3” group (reported ~77–80 members) and a 32-member group from Kolkata. Communication lines, roads and power were destroyed, so contact has not been restored. We do not yet hold person-level records for this group — families should reach the official channels below.",
  kailashContactsLabel: "Official contacts for families",
  kailashEmbassy: "Indian Embassy, Kathmandu — emergency",
  kailashMofaLabel: "Nepal MoFA — Emergency Control Room",
  kailashNewsLabel: "In the news",
  kailashChip: "Kailash Yatra pilgrims",
  possiblyRescuedNote: "May already be rescued — check the Rescued list",
  searchableHere: "searchable by name here",
  resultsLoading: "Loading the people list…",
  genericAdvisory:
    "Listed in the national missing/found registry — not explicitly recorded as flood-related.",
};

const ne: typeof en = {
  langName: "नेपाली",
  otherLangName: "English",
  siteTagline: "उद्धार तथा राहत बुलेटिन",
  updatedAt: "तथ्याङ्क अद्यावधिक",
  source: "स्रोत",
  sourceUnreachable:
    "प्रत्यक्ष स्रोत उपलब्ध छैन। पछिल्लो सुरक्षित तथ्याङ्क देखाइँदैछ।",
  emergency: "आपत्‌कालीन नम्बरहरू",
  call: "फोन",

  srTitle: "खोज तथा उद्धार",
  srIntro:
    "सामुदायिक बुलेटिन र आधिकारिक NDRRMA उद्धार सूचीबाट। प्रत्येक कार्डमा स्रोत देखाइएको छ। कार्य गर्नुअघि पुष्टि गर्नुहोस्।",
  tabMissing: "ध्यान आवश्यक",
  tabFound: "उद्धार गरिएको",
  statusMissing: "हराएको",
  statusRescued: "उद्धार गरिएको",
  emergencyRelief: "आपत्‌कालीन राहत",
  needAttentionChip: "ध्यान आवश्यक",
  rescuedChip: "उद्धार गरिएको",
  searchByName: "नामबाट खोज्नुहोस्",
  crossCheckTitle: "उद्धार भइसकेको हुन सक्छ?",
  crossCheckNote:
    "यहाँ हराएको भनी सूचीबद्ध व्यक्ति सुरक्षित भइसकेको हुन सक्छ। सधैँ आधिकारिक उद्धार सूचीहरू जाँच्नुहोस्:",
  searchPlaceholder: "नाम (नेपाली वा रोमन, जस्तै binod), स्थान वा फोनबाट खोज्नुहोस्…",
  countryLabel: "देश",
  filterAll: "सबै",
  countryNepal: "नेपाल",
  countryForeign: "विदेशी",
  rescueStatusLabel: "अवस्था",
  resultsCount: "विवरण",
  showing: "देखाइँदै",
  of: "मध्ये",
  prev: "अघिल्लो",
  next: "अर्को",
  noResults: "कुनै विवरण भेटिएन।",
  reportMissing: "हराएको व्यक्ति रिपोर्ट गर्नुहोस्",
  reportFound: "भेटिएको व्यक्ति रिपोर्ट गर्नुहोस्",
  fieldPlace: "स्थान",
  fieldPhone: "सम्पर्क",
  fieldAge: "उमेर",
  fieldWhen: "अन्तिम पटक देखिएको",
  fieldNote: "टिप्पणी",
  flagged: "पुनरावलोकन आवश्यक",

  liveUpdatesTitle: "प्रत्यक्ष अपडेट",
  liveUpdatesIntro: "बुलेटिन स्रोतबाट भर्खरका परिवर्तन।",
  liveUpdatesEmpty: "हाल कुनै अपडेट छैन।",
  reportedLabel: "रिपोर्ट",

  updatesTitle: "आधिकारिक अपडेट तथा पोस्ट",
  updatesIntro:
    "आधिकारिक ह्यान्डल र निकायहरूका पोस्टका लिङ्कहरू। कार्य गर्नुअघि स्रोत जाँच्नुहोस्।",
  updatesEmpty: "अहिलेसम्म कुनै अपडेट छैन।",
  verified: "प्रमाणित",
  unverified: "अप्रमाणित",
  viewPost: "पोस्ट हेर्नुहोस्",
  pinned: "पिन गरिएको",

  helpTitle: "कसरी सहयोग पाउने",
  helpIntro:
    "आधिकारिक सामुदायिक फारमबाट हराएको वा भेटिएको व्यक्ति रिपोर्ट गर्नुहोस्, वा आपत्‌कालीन नम्बर प्रयोग गर्नुहोस्।",
  resourcesTitle: "उपयोगी स्रोतहरू",

  donationTitle: "सहयोग तथा दान",
  informationalBadge: "जानकारीमूलक मात्र",
  donationPending:
    "आधिकारिक दान विवरण प्रमाणीकरण बाँकी भएकाले लुकाइएको छ। प्रमाणित विवरण नभरेसम्म यो पृष्ठ प्रकाशित नगर्नुहोस्।",
  donationBank: "बैंक",
  donationAccountName: "खाता नाम",
  donationAccountNumber: "खाता नम्बर",
  officialPage: "आधिकारिक पृष्ठ",
  donatePortal: "आधिकारिक पोर्टलमा सहयोग गर्नुहोस्",
  donateInfoNote:
    "भुक्तानी आधिकारिक सरकारी पोर्टल (pmdrf.nchl.com.np) मा हुन्छ। यो साइटले भुक्तानी लिँदैन र कुनै सरकारी निकायसँग सम्बद्ध छैन।",

  kpiTitle: "अवस्था एक नजरमा",
  kpiStillMissing: "अझै हराएका",
  kpiRescued: "उद्धार / भेटिएका",
  kpiReunited: "पुनर्मिलन",
  kpiAccounted: "हिसाब भएका",
  kpiNew24h: "नयाँ (२४ घण्टा)",
  kpiRiversWarn: "सतर्कता माथिका नदी",
  kpiDistricts: "प्रभावित जिल्ला",
  kpiOfMissing: "अझै हराएका मध्ये",
  kpiMinors: "नाबालक",
  kpiElderly: "वृद्ध",
  kpiForeign: "विदेशी*",
  kpiForeignNote: "*विदेशी नागरिक, स्थान/फोनका आधारमा अनुमानित",
  minAgo: "मिनेट अघि",
  tagMinor: "नाबालक",
  tagElderly: "वृद्ध",
  tagForeign: "विदेशी",

  riverTitle: "नदी निगरानी",
  riverIntro:
    "जल तथा मौसम विज्ञान विभाग (DHM) बाट नदीको प्रत्यक्ष सतह। कार्य गर्नुअघि अधिकारीहरूसँग पुष्टि गर्नुहोस्।",
  riverDangerAlert: "एक वा बढी नदी खतरा तह वा सोभन्दा माथि छन्।",
  riverWarningAlert: "एक वा बढी नदी सतर्कता तहभन्दा माथि छन्।",
  riverWarn: "सतर्कता",
  riverDanger: "खतरा",
  riverLevel: "सतह",
  riverObserved: "अवलोकन",
  riverSourceDhm: "DHM स्रोत",
  riverRising: "बढ्दै",
  riverFalling: "घट्दै",
  riverSteady: "स्थिर",
  riverNormal: "सामान्य",
  riverReliability: "गेज डाटा अविश्वसनीय हुन सक्छ",
  riverEmpty: "नदी डाटा हाल उपलब्ध छैन।",

  mapTitle: "बाढी नक्सा",
  mapIntro:
    "त्रिशूली–नारायणी किनार भएर बाढीको अनुमानित मार्ग, स्थिति अनुसार रङ दिइएका DHM गेजका प्रत्यक्ष स्थानसहित।",
  mapConfirmed: "नदी मार्ग",
  mapAtRisk: "तल्लो / जोखिममा",
  mapGauge: "DHM गेज (स्थिति अनुसार)",
  mapEntry: "माथिल्लो / प्रवेश",
  mapDisclaimer:
    "पिन र मार्ग अनुमानित हुन् (बजार/पुल बिन्दु, ठ्याक्कै नदी बहाव होइन)। DHM र स्थानीय अधिकारीसँग पुष्टि गर्नुहोस्।",
  mapRain: "वर्षा राडार",
  mapRainNote: "RainViewer द्वारा प्रत्यक्ष वर्षा राडार। दायाँ-माथिबाट टगल गर्नुहोस्।",
  riverSafetyTitle: "नदी किनारमा बस्ने जनतालाई अनुरोध।",
  riverSafetyBody: "नदी किनारबाट अग्लो सुरक्षित स्थानमा जानुहोस् र उच्च सतर्क रहनुहोस्।",

  footerDisclaimer:
    "यो साइटले हराएका, उद्धार गरिएका र भेटिएका व्यक्तिका विवरण आधिकारिक स्रोतहरू — NDRRMA SETU, NDRRMA, नेपाल प्रहरी, HEOC, OPMCM लगायत — तथा सामुदायिक बुलेटिनबाट एकै ठाउँमा खोज्न मिल्ने गरी जुटाउँछ। यहाँ देखिएपछि पनि स्रोतमा विवरण अद्यावधिक हुन सक्छ, र केही मिलान मिल्दोजुल्दो वा लिप्यन्तरणमा आधारित हुन सक्छ — त्यसैले कार्य गर्नुअघि विवरण, विशेषगरी व्यक्तिको पहिचान, आधिकारिक स्रोत वा अधिकारीसँग पुनः पुष्टि गर्नुहोस्। हामी खोज्न सहयोग गर्छौं; हामी उद्धार गर्ने निकाय होइनौं।",
  dataMirroredFrom: "तथ्याङ्क स्रोत",
  backToTop: "माथि जानुहोस्",

  creditBy: "तथ्याङ्क तथा मूल बुलेटिन:",
  creditThanks: "मूल स्रष्टालाई पूर्ण श्रेय",
  creditView: "मूल हेर्नुहोस्",
  builtBy: "निर्माण:",
  dataSourcesLabel: "तथ्याङ्क स्रोतहरू",
  suggestionsLabel: "कुनै समस्या वा सुझाव भए मर्मतकर्तालाई जानकारी दिनुहोस्:",
  topInviteLabel: "थप्नुपर्ने आधिकारिक स्रोत वा सुझाव छ? सम्पर्क गर्नुहोस्:",

  // Search-first hero
  navSearch: "खोज / भेटिएका",
  navOverview: "सारांश",
  navUpdates: "आधिकारिक अपडेट",
  navEmergency: "आपत्‌कालीन",
  navDonate: "सहयोग",
  heroScope: "रसुवा · नुवाकोट · धादिङ — भोटेकोशी / त्रिशूली बाढी",
  heroTitle: "आफ्नो मान्छे खोज्नुहोस्। रिपोर्ट गर्नुहोस्। अवस्था हेर्नुहोस्।",
  heroSubtitle:
    "नेपाल बाढीका हराएका र भेटिएका व्यक्तिको खोजी। प्रत्येक कार्डमा स्रोत उल्लेख छ — कार्य गर्नुअघि सधैँ पुष्टि गर्नुहोस्।",
  searchCta: "खोज्नुहोस्",
  heroSearchHelp:
    'दुवै लिपिमा काम गर्छ — "Binod" वा "बिनोद" प्रयास गर्नुहोस्। तल देश र अवस्थाअनुसार पनि छान्न सकिन्छ।',
  heroLiveSynced:
    "आधिकारिक NDRRMA सूची र सामुदायिक बुलेटिनबाट प्रत्यक्ष अद्यावधिक",
  heroLastSynced: "पछिल्लो अद्यावधिक",
  heroHowItWorks: "यो कसरी काम गर्छ",
  heroReportMissing: "हराएको रिपोर्ट",
  heroMarkFound: "भेटिएको जनाउनुहोस्",
  heroEmergencyBtn: "आपत्‌कालीन नम्बर",
  statMissing: "हराएका",
  statFound: "भेटिएका",
  statTracked: "कुल विवरण",

  // Categories & search cautions
  tabDeceased: "अपरिचित शव",
  statusDeceased: "अपरिचित शव",
  deceasedNote:
    "उद्धार गरिएका तर पहिचान नखुलेका शव (नेपाल प्रहरी)। परिवारले मिलान गर्न सकुन् भन्ने हेतुले राखिएको — पुष्टिका लागि सम्बन्धित अस्पताल/प्रहरीलाई सम्पर्क गर्नुहोस्।",
  fuzzyNote:
    "केही नतिजा मिल्दोजुल्दो वा उस्तै उच्चारणका हुन सक्छन् — नाम हिज्जे र लिपिअनुसार फरक पर्ने हुँदा फरक व्यक्ति पनि हुन सक्छ। निष्कर्षअघि पहिचान पुष्टि गर्नुहोस्।",

  // Hospitals
  hospitalsTitle: "अस्पताल तथा उपचार",
  hospitalsIntro:
    "बाढी प्रभावितहरूलाई उपचारका लागि पुर्‍याइएका अस्पताल — भर्ना / डिस्चार्ज / रिफर सङ्ख्यासहित। नाम भएका बिरामी माथि खोज्न सकिन्छ।",
  hospitalName: "अस्पताल",
  hospitalTotal: "भर्ना",
  hospitalDischarged: "डिस्चार्ज",
  hospitalReferred: "रिफर",
  hospitalTotalRow: "जम्मा",
  hospitalsNote:
    "अस्पताल विवरण सामुदायिक बुलेटिन (HEOC / DEOC आधारित) बाट — अस्पताल वा स्वास्थ्य निकायसँग पुनः पुष्टि गर्नुहोस्।",

  // Kailash Mansarovar Yatra pilgrims notice
  kailashTag: "विशेष सूचना",
  kailashTitle: "कैलाश मानसरोवर यात्रा तीर्थयात्रीहरू — सम्पर्कविहीन",
  kailashBody:
    "२६ अगस्ट २०२६ मा रसुवागढी–केरुङ (ग्यिरोङ) नाकामा बाढी आउँदा कैलाश मानसरोवर यात्रामा रहेका विदेशी तीर्थयात्रीहरू प्रभावित क्षेत्रमा परे। हालसम्म सम्पर्कविहीन रहेकाहरूमा ईशा फाउन्डेसनको “S3” समूह (करिब ७७–८० जना) र कोलकाताको ३२ सदस्यीय समूह छन्। सञ्चार, सडक र विद्युत् नष्ट भएकाले सम्पर्क पुनः स्थापित हुन सकेको छैन। यस समूहको व्यक्तिगत विवरण हामीसँग छैन — परिवारजनले तलका आधिकारिक माध्यमहरूमा सम्पर्क गर्नुहोस्।",
  kailashContactsLabel: "परिवारका लागि आधिकारिक सम्पर्क",
  kailashEmbassy: "भारतीय दूतावास, काठमाडौं — आपत्‌कालीन",
  kailashMofaLabel: "नेपाल परराष्ट्र मन्त्रालय — आपत्‌कालीन कक्ष",
  kailashNewsLabel: "समाचारमा",
  kailashChip: "कैलाश यात्रा तीर्थयात्री",
  possiblyRescuedNote: "उद्धार भइसकेको हुन सक्छ — उद्धार सूची जाँच्नुहोस्",
  searchableHere: "यहाँ नामबाट खोज्न मिल्ने",
  resultsLoading: "व्यक्ति सूची लोड हुँदै…",
  genericAdvisory:
    "राष्ट्रिय हराएको/भेटिएको दर्ता प्रणालीमा समावेश — बाढीसँग सम्बन्धित हो/होइन स्पष्ट छैन।",
};

export const messages = { en, ne } as const;
export type Messages = typeof en;

export function getMessages(lang: Lang): Messages {
  return messages[lang];
}
