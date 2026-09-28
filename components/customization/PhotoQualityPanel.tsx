"use client";

import type {
  PhotoQualityIssueCode,
  PhotoQualityReport,
} from "@/lib/customization/photo-quality";
import type { UiLanguage } from "@/lib/i18n";

const issueCopy: Record<
  UiLanguage,
  Record<PhotoQualityIssueCode, string>
> = {
  en: {
    "resolution-low":
      "Source resolution is low. A larger original may print better.",
    "blur-risk":
      "The photo may be soft or blurred. Review it carefully before approval.",
    "too-dark": "The photo is quite dark and may lose detail in print.",
    "too-bright": "The photo is very bright and may have lost highlight detail.",
    "contrast-low": "The photo has low contrast and may look flat in print.",
  },
  gu: {
    "resolution-low":
      "Original photoની resolution ઓછી છે. વધુ મોટો original print માટે સારું રહી શકે.",
    "blur-risk":
      "Photo soft અથવા blur હોઈ શકે છે. Approval પહેલાં ધ્યાનથી ચેક કરો.",
    "too-dark": "Photo ઘણો dark છે અને printમાં detail ઓછી થઈ શકે.",
    "too-bright": "Photo ઘણો bright છે અને highlight detail ખોવાઈ હોઈ શકે.",
    "contrast-low": "Photoમાં contrast ઓછો છે અને print flat લાગી શકે.",
  },
  hi: {
    "resolution-low":
      "Original photo की resolution कम है. बड़ा original print के लिए बेहतर हो सकता है.",
    "blur-risk":
      "Photo soft या blur हो सकती है. Approval से पहले ध्यान से जांचें.",
    "too-dark": "Photo काफी dark है और print में detail कम हो सकती है.",
    "too-bright":
      "Photo बहुत bright है और highlight detail खो सकती है.",
    "contrast-low": "Photo में contrast कम है और print flat लग सकती है.",
  },
  mr: {
    "resolution-low":
      "Original photoची resolution कमी आहे. मोठा original printसाठी चांगला ठरू शकतो.",
    "blur-risk":
      "Photo soft किंवा blur असू शकतो. Approvalपूर्वी नीट तपासा.",
    "too-dark": "Photo खूप dark आहे आणि printमध्ये detail कमी होऊ शकते.",
    "too-bright":
      "Photo खूप bright आहे आणि highlight detail कमी झाली असू शकते.",
    "contrast-low": "Photoमध्ये contrast कमी आहे आणि print flat दिसू शकतो.",
  },
};

const copy = {
  en: {
    title: "Photo quality check",
    good: "No obvious source-quality warning found.",
    warning: "Review these source-quality warnings.",
    details: "This is an on-device screening, not final print approval.",
    faceOne: "Face check: 1 face detected.",
    faceMany: "Face check: {count} faces detected.",
    faceNone: "Face check: no face detected.",
    faceUnavailable: "Face check is unavailable in this browser.",
  },
  gu: {
    title: "Photo quality check",
    good: "Source photoમાં કોઈ સ્પષ્ટ quality warning મળ્યું નથી.",
    warning: "આ source-quality warnings ચેક કરો.",
    details: "આ on-device screening છે; final print approval નથી.",
    faceOne: "Face check: 1 face મળ્યો.",
    faceMany: "Face check: {count} faces મળ્યા.",
    faceNone: "Face check: કોઈ face મળ્યો નથી.",
    faceUnavailable: "આ browserમાં face check ઉપલબ્ધ નથી.",
  },
  hi: {
    title: "Photo quality check",
    good: "Source photo में कोई स्पष्ट quality warning नहीं मिली.",
    warning: "इन source-quality warnings को जांचें.",
    details: "यह on-device screening है; final print approval नहीं.",
    faceOne: "Face check: 1 face मिला.",
    faceMany: "Face check: {count} faces मिले.",
    faceNone: "Face check: कोई face नहीं मिला.",
    faceUnavailable: "इस browser में face check उपलब्ध नहीं है.",
  },
  mr: {
    title: "Photo quality check",
    good: "Source photoमध्ये स्पष्ट quality warning सापडली नाही.",
    warning: "ही source-quality warnings तपासा.",
    details: "हे on-device screening आहे; final print approval नाही.",
    faceOne: "Face check: 1 face सापडला.",
    faceMany: "Face check: {count} faces सापडले.",
    faceNone: "Face check: face सापडला नाही.",
    faceUnavailable: "या browserमध्ये face check उपलब्ध नाही.",
  },
} as const;

export function PhotoQualityPanel({
  report,
  lang = "en",
}: {
  report: PhotoQualityReport | null;
  lang?: UiLanguage;
}) {
  if (!report) return null;
  const t = copy[lang];

  return (
    <section className="photo-quality-panel" aria-label={t.title}>
      <strong>{t.title}</strong>
      <p>
        {report.width}×{report.height}px · {report.megapixels.toFixed(2)} MP
      </p>
      <p className="muted">
        {report.status === "good" ? t.good : t.warning} {t.details}
      </p>
      <p className="muted">
        {report.faceCount === null
          ? t.faceUnavailable
          : report.faceCount === 0
            ? t.faceNone
            : report.faceCount === 1
              ? t.faceOne
              : t.faceMany.replace("{count}", String(report.faceCount))}
      </p>
      {report.issues.length > 0 && (
        <ul>
          {report.issues.map((issue) => (
            <li key={issue.code}>{issueCopy[lang][issue.code]}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
