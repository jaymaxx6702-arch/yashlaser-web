"use client";

import type { UiLanguage } from "@/lib/i18n";
import type {
  PhotoQualityIssueCode,
  PhotoQualityReport,
} from "@/lib/customization/quality";

const copy = {
  en: {
    title: "Photo quality check",
    good: "Source quality looks good",
    warning: "Please review this photo",
    poor: "A better source photo is recommended",
    resolution: "Resolution",
    exposure: "Exposure",
    contrast: "Contrast",
    sharpness: "Sharpness",
    issues: {
      "low-resolution":
        "The source has limited pixel resolution. A larger original may print more cleanly.",
      "very-low-resolution":
        "The source resolution is very low. Please use the original/high-resolution photo if available.",
      underexposed:
        "The photo appears dark or has heavy shadow clipping.",
      overexposed:
        "The photo appears very bright or has clipped highlights.",
      "low-contrast":
        "The photo has low tonal contrast and may need correction.",
      "soft-image":
        "The photo may be soft or blurred. Check faces and important details at full size.",
    },
    print:
      "Print-ready DPI cannot be confirmed until the final physical print dimensions are verified.",
    subject:
      "Face/person AI analysis is not enabled yet; no face-quality claim is being made.",
    heuristic:
      "Exposure, contrast and sharpness are on-device screening heuristics, not final production approval.",
  },
  gu: {
    title: "ફોટો ક્વોલિટી ચેક",
    good: "Source photoની quality સારી લાગે છે",
    warning: "આ ફોટો એક વાર ચેક કરો",
    poor: "વધુ સારી source photo વાપરવી યોગ્ય રહેશે",
    resolution: "રિઝોલ્યુશન",
    exposure: "એક્સપોઝર",
    contrast: "કોન્ટ્રાસ્ટ",
    sharpness: "શાર્પનેસ",
    issues: {
      "low-resolution":
        "Source photoનું pixel resolution મર્યાદિત છે. Original અથવા મોટી image વધુ સારી print આપી શકે.",
      "very-low-resolution":
        "Source resolution બહુ ઓછું છે. ઉપલબ્ધ હોય તો original/high-resolution photo વાપરો.",
      underexposed:
        "ફોટો અંધારો લાગે છે અથવા shadowsમાં detail ગુમાતી હોય શકે.",
      overexposed:
        "ફોટો બહુ bright લાગે છે અથવા highlightsમાં detail ગુમાતી હોય શકે.",
      "low-contrast":
        "ફોટોમાં tonal contrast ઓછું છે; correctionની જરૂર પડી શકે.",
      "soft-image":
        "ફોટો soft/blurred હોઈ શકે. ચહેરા અને મહત્વની detail full sizeમાં ચેક કરો.",
    },
    print:
      "Final physical print dimensions verify થયા વગર print-ready DPI confirm કરી શકાતું નથી.",
    subject:
      "Face/person AI analysis હજુ enable નથી; એટલે face quality અંગે કોઈ claim કરવામાં આવતો નથી.",
    heuristic:
      "Exposure, contrast અને sharpness on-device screening છે; final production approval નથી.",
  },
  hi: {
    title: "फोटो क्वालिटी चेक",
    good: "Source photo की quality अच्छी लगती है",
    warning: "इस फोटो को एक बार जाँचें",
    poor: "बेहतर source photo इस्तेमाल करना उचित रहेगा",
    resolution: "रिज़ॉल्यूशन",
    exposure: "एक्सपोज़र",
    contrast: "कॉन्ट्रास्ट",
    sharpness: "शार्पनेस",
    issues: {
      "low-resolution":
        "Source photo का pixel resolution सीमित है. Original या बड़ी image बेहतर print दे सकती है.",
      "very-low-resolution":
        "Source resolution बहुत कम है. उपलब्ध हो तो original/high-resolution photo इस्तेमाल करें.",
      underexposed:
        "फोटो अंधेरी लगती है या shadows में detail खो सकती है.",
      overexposed:
        "फोटो बहुत bright लगती है या highlights में detail खो सकती है.",
      "low-contrast":
        "फोटो में tonal contrast कम है और correction की जरूरत हो सकती है.",
      "soft-image":
        "फोटो soft/blurred हो सकती है. चेहरे और महत्वपूर्ण detail full size में जाँचें.",
    },
    print:
      "Final physical print dimensions verify होने तक print-ready DPI confirm नहीं किया जा सकता.",
    subject:
      "Face/person AI analysis अभी enabled नहीं है; इसलिए face quality का कोई दावा नहीं किया जा रहा.",
    heuristic:
      "Exposure, contrast और sharpness on-device screening हैं; final production approval नहीं.",
  },
  mr: {
    title: "फोटो क्वालिटी चेक",
    good: "Source photoची quality चांगली दिसते",
    warning: "हा फोटो एकदा तपासा",
    poor: "अधिक चांगला source photo वापरणे योग्य ठरेल",
    resolution: "रिझोल्यूशन",
    exposure: "एक्सपोजर",
    contrast: "कॉन्ट्रास्ट",
    sharpness: "शार्पनेस",
    issues: {
      "low-resolution":
        "Source photoचे pixel resolution मर्यादित आहे. Original किंवा मोठी image अधिक स्वच्छ print देऊ शकते.",
      "very-low-resolution":
        "Source resolution खूप कमी आहे. उपलब्ध असल्यास original/high-resolution photo वापरा.",
      underexposed:
        "फोटो अंधारा दिसतो किंवा shadowsमध्ये detail हरवू शकते.",
      overexposed:
        "फोटो खूप bright दिसतो किंवा highlightsमध्ये detail हरवू शकते.",
      "low-contrast":
        "फोटोमध्ये tonal contrast कमी आहे; correctionची गरज लागू शकते.",
      "soft-image":
        "फोटो soft/blurred असू शकतो. चेहरे आणि महत्त्वाची detail full sizeमध्ये तपासा.",
    },
    print:
      "Final physical print dimensions verify होईपर्यंत print-ready DPI confirm करता येत नाही.",
    subject:
      "Face/person AI analysis अजून enabled नाही; त्यामुळे face qualityबद्दल दावा केला जात नाही.",
    heuristic:
      "Exposure, contrast आणि sharpness हे on-device screening आहेत; final production approval नाही.",
  },
} as const;

const metric = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);

export function PhotoQualityPanel({
  report,
  lang = "en",
}: {
  report: PhotoQualityReport;
  lang?: UiLanguage;
}) {
  const t = copy[lang];
  const heading =
    report.level === "good"
      ? t.good
      : report.level === "poor"
        ? t.poor
        : t.warning;

  return (
    <aside className={"photo-quality photo-quality-" + report.level}>
      <p className="eyebrow">{t.title}</p>
      <strong>{heading}</strong>
      <div className="photo-quality-metrics">
        <span>
          {t.resolution}: {report.width}×{report.height} ·{" "}
          {metric(report.megapixels)} MP
        </span>
        <span>
          {t.exposure}: {metric(report.meanLuminance)}/255
        </span>
        <span>
          {t.contrast}: {metric(report.luminanceStdDev)}
        </span>
        <span>
          {t.sharpness}: {metric(report.sharpnessScore)}
        </span>
      </div>
      {report.issues.length > 0 && (
        <ul>
          {report.issues.map((issue) => (
            <li key={issue.code}>
              {t.issues[issue.code as PhotoQualityIssueCode]}
            </li>
          ))}
        </ul>
      )}
      <p className="muted">{t.print}</p>
      <p className="muted">{t.subject}</p>
      <small>{t.heuristic}</small>
    </aside>
  );
}
