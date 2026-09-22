import type { ProductCustomizationRule } from "./rules";

export type ImageQualitySignals = {
  width: number;
  height: number;
  blurScore?: number;
  exposure?: "low" | "ok" | "high";
  contrastScore?: number;
  subjectCount?: number;
  faceCount?: number;
};

export type ImageQualityIssueCode =
  | "resolution-low"
  | "blur-risk"
  | "underexposed"
  | "overexposed"
  | "contrast-low"
  | "subject-missing"
  | "multiple-subjects";

export type ImageQualityIssue = {
  code: ImageQualityIssueCode;
  severity: "warning" | "error";
  message: string;
};

export type ImageQualityAssessment = {
  width: number;
  height: number;
  megapixels: number;
  issues: ImageQualityIssue[];
  acceptableForPreview: boolean;
};

function boundedScore(value: number | undefined) {
  return value === undefined || (Number.isFinite(value) && value >= 0 && value <= 1);
}

export function assessImageQuality(
  signals: ImageQualitySignals,
  rule: Pick<ProductCustomizationRule, "image">,
): ImageQualityAssessment {
  if (
    !Number.isInteger(signals.width) ||
    !Number.isInteger(signals.height) ||
    signals.width < 1 ||
    signals.height < 1 ||
    !boundedScore(signals.blurScore) ||
    !boundedScore(signals.contrastScore)
  )
    throw new Error("Invalid image quality signals.");

  const issues: ImageQualityIssue[] = [];
  if (
    signals.width < rule.image.minRecommendedWidth ||
    signals.height < rule.image.minRecommendedHeight
  )
    issues.push({
      code: "resolution-low",
      severity: "warning",
      message:
        "Image resolution is below the recommended level for this product. A higher-resolution original may print better.",
    });

  if (signals.blurScore !== undefined && signals.blurScore >= 0.65)
    issues.push({
      code: "blur-risk",
      severity: "warning",
      message:
        "The image may be blurred. Use a sharper original or review enhancement before approval.",
    });

  if (signals.exposure === "low")
    issues.push({
      code: "underexposed",
      severity: "warning",
      message: "The image appears too dark and may need exposure correction.",
    });
  else if (signals.exposure === "high")
    issues.push({
      code: "overexposed",
      severity: "warning",
      message: "The image appears too bright and may have lost highlight detail.",
    });

  if (signals.contrastScore !== undefined && signals.contrastScore <= 0.2)
    issues.push({
      code: "contrast-low",
      severity: "warning",
      message: "The image has low contrast and may need correction.",
    });

  if (signals.subjectCount === 0)
    issues.push({
      code: "subject-missing",
      severity: "warning",
      message: "No clear main subject was detected. Check the crop manually.",
    });
  else if (signals.subjectCount !== undefined && signals.subjectCount > 1)
    issues.push({
      code: "multiple-subjects",
      severity: "warning",
      message: "Multiple subjects were detected. Confirm which subject should be used.",
    });

  return {
    width: signals.width,
    height: signals.height,
    megapixels: Math.round((signals.width * signals.height) / 10_000) / 100,
    issues,
    acceptableForPreview: true,
  };
}

export function printPpiForSize(
  widthPixels: number,
  heightPixels: number,
  widthMm: number,
  heightMm: number,
) {
  if (
    ![widthPixels, heightPixels, widthMm, heightMm].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    throw new Error("Invalid print-size values.");
  const widthInches = widthMm / 25.4;
  const heightInches = heightMm / 25.4;
  return Math.floor(Math.min(widthPixels / widthInches, heightPixels / heightInches));
}
