"use client";

import type { UiLanguage } from "@/lib/i18n";
import type {
  PhotoQualityIssue,
  PhotoQualityLevel,
  PhotoQualityReport,
} from "@/lib/customization/photo-quality";

const copy = {
  en: {
    title: "Photo quality check",
    good: "Looks suitable for the next step",
    warning: "Please review this photo",
    poor: "A better source photo is recommended",
    preliminary: "Automatic screening only — final print quality is confirmed during mockup approval.",
    resolution: "Resolution",
    blur: "Sharpness",
    exposure: "Exposure",
    contrast: "Contrast",
    subject: "Face / person",
    notChecked: "Not checked yet",
    issues: {
      "resolution-low": "Image resolution is low.",
      "resolution-borderline": "Image resolution is borderline.",
      "dpi-low": "Estimated print DPI is low.",
      "dpi-borderline": "Estimated print DPI is borderline.",
      "blur-likely": "The photo may be noticeably blurred.",
      "blur-possible": "The photo may be slightly soft.",
      underexposed: "The photo appears too dark.",
      overexposed: "The photo appears too bright.",
      "exposure-borderline": "Exposure may need correction.",
      "contrast-low": "The photo has low contrast.",
      "contrast-borderline": "Contrast may need correction.",
    },
  },
  gu: {
    title: "ફોટો ક્વોલિટી ચેક",
    good: "આગળના સ્ટેપ માટે ફોટો યોગ્ય લાગે છે",
    warning: "આ ફોટો એક વાર ચેક કરો",
    poor: "વધુ સારી original photo લેવી યોગ્ય રહેશે",
    preliminary: "આ automatic screening છે — final print quality mockup approval સમયે confirm થશે.",
    resolution: "Resolution",
    blur: "Sharpness",
    exposure: "Exposure",
    contrast: "Contrast",
    subject: "Face / person",
    notChecked: "હજુ ચેક થયું નથી",
    issues: {
      "resolution-low": "Image resolution ઓછું છે.",
      "resolution-borderline": "Image resolution borderline છે.",
      "dpi-low": "અંદાજિત print DPI ઓછું છે.",
      "dpi-borderline": "અંદાજિત print DPI borderline છે.",
      "blur-likely": "ફોટો નોંધપાત્ર blur હોઈ શકે છે.",
      "blur-possible": "ફોટો થોડો soft હોઈ શકે છે.",
      underexposed: "ફોટો બહુ dark લાગે છે.",
      overexposed: "ફોટો બહુ bright લાગે છે.",
      "exposure-borderline": "Exposure correctionની જરૂર પડી શકે.",
      "contrast-low": "ફોટોમાં contrast ઓછો છે.",
      "contrast-borderline": "Contrast correctionની જરૂર પડી શકે.",
    },
  },
  hi: {
    title: "फोटो क्वालिटी चेक",
    good: "फोटो अगले स्टेप के लिए ठीक लगती है",
    warning: "कृपया इस फोटो को एक बार जांचें",
    poor: "बेहतर original photo उपयोग करना उचित रहेगा",
    preliminary: "यह automatic screening है — final print quality mockup approval पर confirm होगी.",
    resolution: "Resolution",
    blur: "Sharpness",
    exposure: "Exposure",
    contrast: "Contrast",
    subject: "Face / person",
    notChecked: "अभी जांच नहीं हुई",
    issues: {
      "resolution-low": "Image resolution कम है.",
      "resolution-borderline": "Image resolution borderline है.",
      "dpi-low": "अनुमानित print DPI कम है.",
      "dpi-borderline": "अनुमानित print DPI borderline है.",
      "blur-likely": "फोटो स्पष्ट रूप से blur हो सकती है.",
      "blur-possible": "फोटो थोड़ी soft हो सकती है.",
      underexposed: "फोटो बहुत dark लगती है.",
      overexposed: "फोटो बहुत bright लगती है.",
      "exposure-borderline": "Exposure correction की जरूरत हो सकती है.",
      "contrast-low": "फोटो में contrast कम है.",
      "contrast-borderline": "Contrast correction की जरूरत हो सकती है.",
    },
  },
  mr: {
    title: "फोटो क्वालिटी तपासणी",
    good: "फोटो पुढील स्टेपसाठी योग्य दिसतो",
    warning: "कृपया हा फोटो एकदा तपासा",
    poor: "अधिक चांगला original photo वापरणे योग्य राहील",
    preliminary: "ही automatic screening आहे — final print quality mockup approvalवेळी confirm होईल.",
    resolution: "Resolution",
    blur: "Sharpness",
    exposure: "Exposure",
    contrast: "Contrast",
    subject: "Face / person",
    notChecked: "अजून तपासलेले नाही",
    issues: {
      "resolution-low": "Image resolution कमी आहे.",
      "resolution-borderline": "Image resolution borderline आहे.",
      "dpi-low": "अंदाजित print DPI कमी आहे.",
      "dpi-borderline": "अंदाजित print DPI borderline आहे.",
      "blur-likely": "फोटो noticeably blur असू शकतो.",
      "blur-possible": "फोटो थोडा soft असू शकतो.",
      underexposed: "फोटो खूप dark दिसतो.",
      overexposed: "फोटो खूप bright दिसतो.",
      "exposure-borderline": "Exposure correctionची गरज असू शकते.",
      "contrast-low": "फोटोमध्ये contrast कमी आहे.",
      "contrast-borderline": "Contrast correctionची गरज असू शकते.",
    },
  },
} as const;

function overall(report: PhotoQualityReport): Exclude<PhotoQualityLevel, "not-checked"> {
  const levels = [
    report.resolution,
    report.blur,
    report.exposure,
    report.contrast,
  ];
  if (levels.includes("poor")) return "poor";
  if (levels.includes("warning")) return "warning";
  return "good";
}

export function PhotoQualitySummary({
  report,
  lang = "en",
}: {
  report: PhotoQualityReport;
  lang?: UiLanguage;
}) {
  const t = copy[lang];
  const status = overall(report);
  const label = status === "poor" ? t.poor : status === "warning" ? t.warning : t.good;
  const issueText = (issue: PhotoQualityIssue) => t.issues[issue];

  return (
    <div className="process-note" role="status">
      <strong>{t.title}: {label}</strong>
      <p className="muted">
        {report.width}×{report.height} px · {report.megapixels.toFixed(1)} MP
      </p>
      <p>
        {t.resolution}: {report.resolution} · {t.blur}: {report.blur} ·{" "}
        {t.exposure}: {report.exposure} · {t.contrast}: {report.contrast}
      </p>
      {report.issues.length > 0 && (
        <ul>
          {report.issues.map((issue) => (
            <li key={issue}>{issueText(issue)}</li>
          ))}
        </ul>
      )}
      <p className="muted">
        {t.subject}: {t.notChecked}. {t.preliminary}
      </p>
    </div>
  );
}
