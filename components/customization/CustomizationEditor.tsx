"use client";
import { useState } from "react";
import type { CustomizationProduct } from "@/lib/customization";
import { customizationRules } from "@/lib/customization/rules";
import {
  clamp,
  type CustomizationDocument,
  type Crop,
} from "@/lib/customization/model";
import { templates } from "@/lib/customization/templates";
import { cropPreset } from "@/lib/customization/geometry";
import { CanvasPreview } from "./CanvasPreview";
import type { BackgroundRemovalAdapter } from "@/lib/customization/background-removal";
import type { UiLanguage } from "@/lib/i18n";
import type { ImageQualityReport } from "@/lib/customization/image-provider";

const copy = {
  en: {
    cropPhotograph: "Crop your photograph",
    livePreview: "Live indicative preview",
    doneCropping: "Done cropping",
    cropPhoto: "Crop photo",
    downloadPreview: "Download preview",
    previewHelp:
      "Drag your photo to reposition it. Arrow keys and the controls below also work. The selected size is shown; template proportions are indicative, not a measurement guide. Final shape, colours and text layout require mockup approval.",
    controls: "Customization controls",
    productOptions: "1. Product & options",
    sizeVariant: "Size / variant",
    unavailable: " — unavailable",
    quantity: "Quantity",
    priceEnquiry: "Price confirmed on enquiry",
    productEstimate: "product estimate · customisation and delivery confirmed separately",
    previewTemplate: "Preview template",
    photoLogo: "2. Photo / logo",
    uploadPhoto: "Upload photo or logo",
    fileHelp: "JPG, PNG or WebP · up to 8 MB / 25 megapixels.",
    selected: "Selected:",
    noPhoto: "No photograph selected.",
    qualityGood: "Photo quality looks suitable for editing.",
    qualityWarning: "Photo quality warning:",
    qualityProduction: "Final print quality will be confirmed after size/DPI review.",
    issueLabels: { "low-resolution": "low resolution", blur: "possible blur", underexposed: "too dark", overexposed: "too bright", "low-contrast": "low contrast" },
    removeBackground: "Remove background",
    onDevice: "on this device",
    selfHosted: "self-hosted",
    resetPosition: "Reset position",
    fullPhoto: "Full photo",
    squareCrop: "Square crop",
    portraitCrop: "Portrait crop",
    cropHelp: "Drag the crop corners, or adjust the four edges.",
    crop: "Crop",
    edges: { left: "left", top: "top", right: "right", bottom: "bottom" },
    photoFit: "Photo fit",
    fillArea: "Fill the photo area",
    showWhole: "Show the whole crop",
    zoom: "Zoom",
    horizontal: "Horizontal position",
    vertical: "Vertical position",
    personalText: "3. Personal text",
    textLine: "Text line",
    line: "Line",
    font: "font",
    alignment: "alignment",
    fontSize: "font size",
    modern: "Modern",
    classic: "Classic",
    monospace: "Monospace",
    left: "Left",
    centre: "Centre",
    right: "Right",
    longText: "Long text wraps and scales down to fit. Please check the downloaded preview.",
    reset: "Reset customization (remove photo & text)",
  },
  gu: {
    cropPhotograph: "તમારો ફોટો ક્રોપ કરો",
    livePreview: "લાઇવ અંદાજિત પ્રિવ્યૂ",
    doneCropping: "ક્રોપ પૂર્ણ",
    cropPhoto: "ફોટો ક્રોપ કરો",
    downloadPreview: "પ્રિવ્યૂ ડાઉનલોડ કરો",
    previewHelp:
      "ફોટોનું સ્થાન બદલવા તેને drag કરો. Arrow keys અને નીચેના controls પણ વાપરી શકો છો. બતાવેલી સાઇઝ પસંદ કરેલી સાઇઝ છે; template proportion માત્ર અંદાજ માટે છે. અંતિમ shape, colour અને text layout માટે mockup approval જરૂરી છે.",
    controls: "કસ્ટમાઇઝેશન કંટ્રોલ્સ",
    productOptions: "1. પ્રોડક્ટ અને વિકલ્પો",
    sizeVariant: "સાઇઝ / વિકલ્પ",
    unavailable: " — ઉપલબ્ધ નથી",
    quantity: "જથ્થો",
    priceEnquiry: "ભાવ પૂછપરછ પછી કન્ફર્મ થશે",
    productEstimate: "પ્રોડક્ટ અંદાજ · કસ્ટમાઇઝેશન અને ડિલિવરી અલગથી કન્ફર્મ થશે",
    previewTemplate: "પ્રિવ્યૂ ટેમ્પલેટ",
    photoLogo: "2. ફોટો / લોગો",
    uploadPhoto: "ફોટો અથવા લોગો અપલોડ કરો",
    fileHelp: "JPG, PNG અથવા WebP · વધુમાં વધુ 8 MB / 25 megapixels.",
    selected: "પસંદ કરેલ:",
    noPhoto: "કોઈ ફોટો પસંદ નથી.",
    qualityGood: "ફોટોની quality editing માટે યોગ્ય લાગે છે.",
    qualityWarning: "ફોટો quality warning:",
    qualityProduction: "Final print quality size/DPI review પછી confirm થશે.",
    issueLabels: { "low-resolution": "ઓછું resolution", blur: "શક્ય blur", underexposed: "ઘણો dark", overexposed: "ઘણો bright", "low-contrast": "ઓછો contrast" },
    removeBackground: "બેકગ્રાઉન્ડ દૂર કરો",
    onDevice: "આ ડિવાઇસ પર",
    selfHosted: "સેલ્ફ-હોસ્ટેડ",
    resetPosition: "સ્થાન રીસેટ કરો",
    fullPhoto: "આખો ફોટો",
    squareCrop: "સ્ક્વેર ક્રોપ",
    portraitCrop: "પોર્ટ્રેટ ક્રોપ",
    cropHelp: "ક્રોપના corners drag કરો અથવા ચારેય edges adjust કરો.",
    crop: "ક્રોપ",
    edges: { left: "ડાબી", top: "ઉપર", right: "જમણી", bottom: "નીચે" },
    photoFit: "ફોટો ફિટ",
    fillArea: "ફોટો વિસ્તાર ભરો",
    showWhole: "આખો ક્રોપ બતાવો",
    zoom: "ઝૂમ",
    horizontal: "આડું સ્થાન",
    vertical: "ઊભું સ્થાન",
    personalText: "3. વ્યક્તિગત લખાણ",
    textLine: "લખાણ લાઇન",
    line: "લાઇન",
    font: "ફોન્ટ",
    alignment: "એલાઇનમેન્ટ",
    fontSize: "ફોન્ટ સાઇઝ",
    modern: "મોડર્ન",
    classic: "ક્લાસિક",
    monospace: "મોનોસ્પેસ",
    left: "ડાબે",
    centre: "મધ્યમાં",
    right: "જમણે",
    longText: "લાંબું લખાણ ફિટ થવા wrap અને નાનું થાય છે. ડાઉનલોડ કરેલ preview ચેક કરો.",
    reset: "કસ્ટમાઇઝેશન રીસેટ કરો (ફોટો અને લખાણ દૂર કરો)",
  },
  hi: {
    cropPhotograph: "अपनी फोटो क्रॉप करें",
    livePreview: "लाइव अनुमानित प्रीव्यू",
    doneCropping: "क्रॉप पूरा",
    cropPhoto: "फोटो क्रॉप करें",
    downloadPreview: "प्रीव्यू डाउनलोड करें",
    previewHelp:
      "फोटो की जगह बदलने के लिए उसे drag करें. Arrow keys और नीचे के controls भी काम करते हैं. दिखाई गई साइज़ चुनी हुई साइज़ है; template proportion केवल संकेत के लिए है. अंतिम shape, colour और text layout के लिए mockup approval आवश्यक है.",
    controls: "कस्टमाइज़ेशन कंट्रोल",
    productOptions: "1. प्रोडक्ट और विकल्प",
    sizeVariant: "साइज़ / विकल्प",
    unavailable: " — उपलब्ध नहीं",
    quantity: "मात्रा",
    priceEnquiry: "कीमत पूछताछ पर कन्फर्म होगी",
    productEstimate: "प्रोडक्ट अनुमान · कस्टमाइज़ेशन और डिलीवरी अलग से कन्फर्म होंगे",
    previewTemplate: "प्रीव्यू टेम्पलेट",
    photoLogo: "2. फोटो / लोगो",
    uploadPhoto: "फोटो या लोगो अपलोड करें",
    fileHelp: "JPG, PNG या WebP · अधिकतम 8 MB / 25 megapixels.",
    selected: "चुना गया:",
    noPhoto: "कोई फोटो नहीं चुनी गई.",
    qualityGood: "फोटो की quality editing के लिए ठीक लगती है.",
    qualityWarning: "फोटो quality warning:",
    qualityProduction: "Final print quality size/DPI review के बाद confirm होगी.",
    issueLabels: { "low-resolution": "कम resolution", blur: "संभावित blur", underexposed: "बहुत dark", overexposed: "बहुत bright", "low-contrast": "कम contrast" },
    removeBackground: "बैकग्राउंड हटाएँ",
    onDevice: "इस डिवाइस पर",
    selfHosted: "सेल्फ-होस्टेड",
    resetPosition: "स्थिति रीसेट करें",
    fullPhoto: "पूरी फोटो",
    squareCrop: "स्क्वेयर क्रॉप",
    portraitCrop: "पोर्ट्रेट क्रॉप",
    cropHelp: "क्रॉप corners को drag करें या चारों edges adjust करें.",
    crop: "क्रॉप",
    edges: { left: "बायाँ", top: "ऊपर", right: "दायाँ", bottom: "नीचे" },
    photoFit: "फोटो फिट",
    fillArea: "फोटो क्षेत्र भरें",
    showWhole: "पूरा क्रॉप दिखाएँ",
    zoom: "ज़ूम",
    horizontal: "क्षैतिज स्थिति",
    vertical: "ऊर्ध्व स्थिति",
    personalText: "3. व्यक्तिगत टेक्स्ट",
    textLine: "टेक्स्ट लाइन",
    line: "लाइन",
    font: "फॉन्ट",
    alignment: "अलाइनमेंट",
    fontSize: "फॉन्ट साइज़",
    modern: "मॉडर्न",
    classic: "क्लासिक",
    monospace: "मोनोस्पेस",
    left: "बाएँ",
    centre: "बीच",
    right: "दाएँ",
    longText: "लंबा टेक्स्ट फिट होने के लिए wrap और छोटा होता है. डाउनलोड किया हुआ preview जांचें.",
    reset: "कस्टमाइज़ेशन रीसेट करें (फोटो और टेक्स्ट हटाएँ)",
  },
  mr: {
    cropPhotograph: "तुमचा फोटो क्रॉप करा",
    livePreview: "लाइव्ह अंदाजे प्रीव्ह्यू",
    doneCropping: "क्रॉप पूर्ण",
    cropPhoto: "फोटो क्रॉप करा",
    downloadPreview: "प्रीव्ह्यू डाउनलोड करा",
    previewHelp:
      "फोटोचे स्थान बदलण्यासाठी तो drag करा. Arrow keys आणि खालील controlsही वापरू शकता. दाखवलेली साइझ निवडलेली साइझ आहे; template proportion फक्त अंदाजासाठी आहे. अंतिम shape, colour आणि text layoutसाठी mockup approval आवश्यक आहे.",
    controls: "कस्टमायझेशन कंट्रोल्स",
    productOptions: "1. प्रॉडक्ट आणि पर्याय",
    sizeVariant: "साइझ / पर्याय",
    unavailable: " — उपलब्ध नाही",
    quantity: "प्रमाण",
    priceEnquiry: "किंमत चौकशीनंतर निश्चित होईल",
    productEstimate: "प्रॉडक्ट अंदाज · कस्टमायझेशन आणि डिलिव्हरी वेगळी निश्चित होतील",
    previewTemplate: "प्रीव्ह्यू टेम्पलेट",
    photoLogo: "2. फोटो / लोगो",
    uploadPhoto: "फोटो किंवा लोगो अपलोड करा",
    fileHelp: "JPG, PNG किंवा WebP · कमाल 8 MB / 25 megapixels.",
    selected: "निवडलेले:",
    noPhoto: "कोणताही फोटो निवडलेला नाही.",
    qualityGood: "फोटो quality editing साठी योग्य दिसते.",
    qualityWarning: "फोटो quality warning:",
    qualityProduction: "Final print quality size/DPI review नंतर confirm होईल.",
    issueLabels: { "low-resolution": "कमी resolution", blur: "संभाव्य blur", underexposed: "खूप dark", overexposed: "खूप bright", "low-contrast": "कमी contrast" },
    removeBackground: "बॅकग्राउंड काढा",
    onDevice: "या डिवाइसवर",
    selfHosted: "सेल्फ-होस्टेड",
    resetPosition: "स्थान रीसेट करा",
    fullPhoto: "पूर्ण फोटो",
    squareCrop: "स्क्वेअर क्रॉप",
    portraitCrop: "पोर्ट्रेट क्रॉप",
    cropHelp: "क्रॉप corners drag करा किंवा चारही edges adjust करा.",
    crop: "क्रॉप",
    edges: { left: "डावी", top: "वर", right: "उजवी", bottom: "खाली" },
    photoFit: "फोटो फिट",
    fillArea: "फोटो क्षेत्र भरा",
    showWhole: "पूर्ण क्रॉप दाखवा",
    zoom: "झूम",
    horizontal: "आडवे स्थान",
    vertical: "उभे स्थान",
    personalText: "3. वैयक्तिक मजकूर",
    textLine: "मजकूर ओळ",
    line: "ओळ",
    font: "फॉन्ट",
    alignment: "अलाइनमेंट",
    fontSize: "फॉन्ट साइझ",
    modern: "मॉडर्न",
    classic: "क्लासिक",
    monospace: "मोनोस्पेस",
    left: "डावे",
    centre: "मध्य",
    right: "उजवे",
    longText: "लांब मजकूर fit होण्यासाठी wrap आणि लहान होतो. डाउनलोड केलेला preview तपासा.",
    reset: "कस्टमायझेशन रीसेट करा (फोटो आणि मजकूर काढा)",
  },
} as const;

export function CustomizationEditor({
  document: doc,
  bitmap,
  qualityReport,
  product,
  onChange,
  onUpload,
  onReset,
  onOverflow,
  processing,
  adapter,
  onRemoveBackground,
  onDownload,
  lang = "en",
}: {
  document: CustomizationDocument;
  bitmap: ImageBitmap | null;
  qualityReport: ImageQualityReport | null;
  product: CustomizationProduct;
  onChange: (d: CustomizationDocument) => void;
  onUpload: (file: File) => void;
  onReset: () => void;
  onOverflow: (v: boolean) => void;
  processing: boolean;
  adapter?: BackgroundRemovalAdapter;
  onRemoveBackground: () => void;
  onDownload: () => void;
  lang?: UiLanguage;
}) {
  const t = copy[lang];
  const rules = customizationRules(product);
  const textRules = rules.fields.filter((field) => field.kind === "text");
  const [cropMode, setCropMode] = useState(false),
    [fileKey, setFileKey] = useState(0);
  const image = (patch: Partial<CustomizationDocument["image"]>) =>
    onChange({ ...doc, image: { ...doc.image, ...patch } });
  const crop = (next: Crop) => image({ crop: next, zoom: 1, panX: 0, panY: 0 });
  const currentVariant = product.variants.find((v) => v.id === doc.variantId);
  const price =
    currentVariant?.effectivePriceMinor ?? product.effectivePriceMinor;

  return (
    <div className="advanced-editor">
      <section className="editor-preview">
        <p className="eyebrow">
          {cropMode ? t.cropPhotograph : t.livePreview}
        </p>
        <CanvasPreview
          document={doc}
          bitmap={bitmap}
          product={product}
          cropMode={cropMode}
          onChange={processing ? undefined : onChange}
          onOverflow={onOverflow}
          lang={lang}
        />
        <div className="editor-toolbar">
          <button
            type="button"
            className="button button-secondary"
            disabled={!bitmap || processing}
            onClick={() => setCropMode(!cropMode)}
          >
            {cropMode ? t.doneCropping : t.cropPhoto}
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={onDownload}
            disabled={processing}
          >
            {t.downloadPreview}
          </button>
        </div>
        <p className="muted">{t.previewHelp}</p>
      </section>

      <fieldset className="editor-controls" disabled={processing}>
        <legend className="sr-only">{t.controls}</legend>
        <section>
          <h2>{t.productOptions}</h2>
          <div className="option-fields">
            {product.variants.length > 0 && (
              <label>
                {t.sizeVariant}
                <select
                  value={doc.variantId}
                  onChange={(e) =>
                    onChange({ ...doc, variantId: e.target.value })
                  }
                  required
                >
                  {product.variants.map((v) => (
                    <option key={v.id} value={v.id} disabled={!v.available}>
                      {v.name}
                      {!v.available ? t.unavailable : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              {t.quantity}
              <input
                type="number"
                min={1}
                max={10000}
                step={1}
                value={doc.quantity}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  onChange({
                    ...doc,
                    quantity: Number.isInteger(n) ? clamp(n, 1, 10000) : 1,
                  });
                }}
              />
            </label>
          </div>
          <p className="muted">
            {product.pricingMode === "quote_required" || !price
              ? t.priceEnquiry
              : new Intl.NumberFormat(
                  lang === "gu"
                    ? "gu-IN"
                    : lang === "hi"
                      ? "hi-IN"
                      : lang === "mr"
                        ? "mr-IN"
                        : "en-IN",
                  { style: "currency", currency: "INR" },
                ).format((price * doc.quantity) / 100) +
                " " +
                t.productEstimate}
          </p>
          {rules.templates.length > 1 && (
            <label>
              {t.previewTemplate}
              <select
                value={doc.templateId}
                onChange={(e) =>
                  onChange({
                    ...doc,
                    templateId: e.target
                      .value as CustomizationDocument["templateId"],
                  })
                }
              >
                {rules.templates.map((templateId) => (
                  <option key={templateId} value={templateId}>
                    {templates[templateId].name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>

        <section>
          <h2>{t.photoLogo}</h2>
          <label>
            {t.uploadPhoto}
            <input
              key={fileKey}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setCropMode(false);
                  onUpload(f);
                }
                e.target.value = "";
              }}
            />
          </label>
          <p className="muted">
            {t.fileHelp}{" "}
            {doc.artwork ? t.selected + " " + doc.artwork.name : t.noPhoto}
          </p>
          {qualityReport && (
            <div className={qualityReport.issues.length ? "form-error" : "muted"} role="status">
              <strong>
                {qualityReport.issues.length ? t.qualityWarning : t.qualityGood}
              </strong>{" "}
              {qualityReport.issues.length
                ? qualityReport.issues
                    .map((issue) => t.issueLabels[issue])
                    .join(", ")
                : ""}
              <div>
                {qualityReport.width} × {qualityReport.height} ·{" "}
                {qualityReport.megapixels.toFixed(1)} MP
              </div>
              <small>{t.qualityProduction}</small>
            </div>
          )}
          {adapter && (
            <button
              type="button"
              className="text-link"
              disabled={!bitmap}
              onClick={onRemoveBackground}
            >
              {t.removeBackground} (
              {adapter.execution === "browser" ? t.onDevice : t.selfHosted})
            </button>
          )}
          {bitmap && (
            <>
              <div className="editor-toolbar">
                <button
                  type="button"
                  onClick={() => {
                    setCropMode(false);
                    image({ zoom: 1, panX: 0, panY: 0 });
                  }}
                >
                  {t.resetPosition}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropMode(true);
                    crop({ x: 0, y: 0, width: 1, height: 1 });
                  }}
                >
                  {t.fullPhoto}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropMode(true);
                    crop(cropPreset(bitmap.width, bitmap.height, 1));
                  }}
                >
                  {t.squareCrop}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropMode(true);
                    crop(cropPreset(bitmap.width, bitmap.height, 4 / 5));
                  }}
                >
                  {t.portraitCrop}
                </button>
              </div>

              {cropMode ? (
                <div className="crop-controls">
                  <p className="muted">{t.cropHelp}</p>
                  {(["left", "top", "right", "bottom"] as const).map((edge) => {
                    const c = doc.image.crop;
                    const value =
                      edge === "left"
                        ? c.x
                        : edge === "top"
                          ? c.y
                          : edge === "right"
                            ? c.x + c.width
                            : c.y + c.height;
                    return (
                      <label key={edge}>
                        {t.crop} {t.edges[edge]}: {Math.round(value * 100)}%
                        <input
                          type="range"
                          min={
                            edge === "right"
                              ? (c.x + 0.05) * 100
                              : edge === "bottom"
                                ? (c.y + 0.05) * 100
                                : 0
                          }
                          max={
                            edge === "left"
                              ? (c.x + c.width - 0.05) * 100
                              : edge === "top"
                                ? (c.y + c.height - 0.05) * 100
                                : 100
                          }
                          step={0.1}
                          value={value * 100}
                          onChange={(e) => {
                            const n = Number(e.target.value) / 100;
                            crop(
                              edge === "left"
                                ? { ...c, x: n, width: c.x + c.width - n }
                                : edge === "top"
                                  ? { ...c, y: n, height: c.y + c.height - n }
                                  : edge === "right"
                                    ? { ...c, width: n - c.x }
                                    : { ...c, height: n - c.y },
                            );
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              ) : (
                <>
                  <label>
                    {t.photoFit}
                    <select
                      value={doc.image.fit}
                      onChange={(e) =>
                        image({
                          fit: e.target.value as "contain" | "cover",
                          panX: 0,
                          panY: 0,
                        })
                      }
                    >
                      <option value="cover">{t.fillArea}</option>
                      <option value="contain">{t.showWhole}</option>
                    </select>
                  </label>
                  <label>
                    {t.zoom}: {doc.image.zoom.toFixed(2)}×
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={0.01}
                      value={doc.image.zoom}
                      onChange={(e) => image({ zoom: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    {t.horizontal}
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.01}
                      value={doc.image.panX}
                      onChange={(e) => image({ panX: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    {t.vertical}
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.01}
                      value={doc.image.panY}
                      onChange={(e) => image({ panY: Number(e.target.value) })}
                    />
                  </label>
                </>
              )}
            </>
          )}
        </section>

        <section>
          <h2>{t.personalText}</h2>
          {doc.text.map((layer, i) => (
            <div className="text-layer-controls" key={i}>
              <label>
                {lang === "en"
                  ? textRules[i]?.label ?? t.textLine + " " + (i + 1)
                  : t.textLine + " " + (i + 1)}
                <textarea
                  rows={2}
                  maxLength={textRules[i]?.maxLength ?? (i === 0 ? 120 : 180)}
                  value={layer.text}
                  onChange={(e) =>
                    onChange({
                      ...doc,
                      text: doc.text.map((textLayer, n) =>
                        n === i
                          ? { ...textLayer, text: e.target.value }
                          : textLayer,
                      ) as CustomizationDocument["text"],
                    })
                  }
                />
              </label>
              <div className="option-fields">
                <label>
                  {t.line} {i + 1} {t.font}
                  <select
                    value={layer.font}
                    onChange={(e) =>
                      onChange({
                        ...doc,
                        text: doc.text.map((textLayer, n) =>
                          n === i
                            ? {
                                ...textLayer,
                                font: e.target.value as typeof textLayer.font,
                              }
                            : textLayer,
                        ) as CustomizationDocument["text"],
                      })
                    }
                  >
                    <option value="sans">{t.modern}</option>
                    <option value="serif">{t.classic}</option>
                    <option value="mono">{t.monospace}</option>
                  </select>
                </label>
                <label>
                  {t.line} {i + 1} {t.alignment}
                  <select
                    value={layer.align}
                    onChange={(e) =>
                      onChange({
                        ...doc,
                        text: doc.text.map((textLayer, n) =>
                          n === i
                            ? {
                                ...textLayer,
                                align: e.target.value as typeof textLayer.align,
                              }
                            : textLayer,
                        ) as CustomizationDocument["text"],
                      })
                    }
                  >
                    <option value="left">{t.left}</option>
                    <option value="center">{t.centre}</option>
                    <option value="right">{t.right}</option>
                  </select>
                </label>
              </div>
              <label>
                {t.line} {i + 1} {t.fontSize}: {layer.fontSize}
                <input
                  type="range"
                  min={14}
                  max={60}
                  step={1}
                  value={layer.fontSize}
                  onChange={(e) =>
                    onChange({
                      ...doc,
                      text: doc.text.map((textLayer, n) =>
                        n === i
                          ? { ...textLayer, fontSize: Number(e.target.value) }
                          : textLayer,
                      ) as CustomizationDocument["text"],
                    })
                  }
                />
              </label>
            </div>
          ))}
          <p className="muted">{t.longText}</p>
        </section>

        <button
          className="text-link"
          type="button"
          onClick={() => {
            setCropMode(false);
            setFileKey((key) => key + 1);
            onReset();
          }}
        >
          {t.reset}
        </button>
      </fieldset>
    </div>
  );
}
