"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  resolveSelection,
  type CustomizationProduct,
} from "@/lib/customization";
import { business, whatsappUrl } from "@/data/business";
import {
  blobHash,
  postEnquiryJson,
  uploadPrivate,
  type UploadSession,
} from "@/lib/direct-upload";
import { CustomizationEditor } from "@/components/customization/CustomizationEditor";
import { CanvasPreview } from "@/components/customization/CanvasPreview";
import { useCustomization } from "@/components/customization/useCustomization";
import {
  createSnapshot,
  downloadBlob,
  type CustomizationSnapshot,
} from "@/lib/customization/snapshot";
import type { BackgroundRemovalAdapter } from "@/lib/customization/background-removal";
import { sameOriginBackgroundRemovalAdapter } from "@/lib/customization/background-removal-client";
import { addCartItem } from "@/lib/cart";
import type { UiLanguage } from "@/lib/i18n";

const formCopy = {
  en: {
    previewError: "Unable to generate your preview.",
    validationError: "Please check your name, phone number and consent.",
    selectArtwork: "Please select your artwork again.",
    prepareUpload: "Preparing private upload…",
    uploadArtwork: "Uploading original artwork privately…",
    uploadPreview: "Uploading preview privately…",
    verifySave: "Verifying artwork and saving enquiry…",
    enquiryError: "Unable to prepare your enquiry.",
    toConfirm: "To confirm",
    shareFallback: "Indicative preview. Final digital mockup approval required.",
    shareError: "Sharing is unavailable. Use Download preview and attach it in WhatsApp.",
    preparingEditor: "Preparing your customization editor…",
    designStep: "1. Design",
    reviewStep: "2. Review & enquire",
    draftPrivacy: "Customer contact details are not stored in this draft.",
    whatsappContinue: "Continue enquiry on WhatsApp ↗",
    preparingPhoto: "Preparing your photograph…",
    overflow: "Some text does not fit. Shorten it or reduce its font size before continuing.",
    saveDraftError: "Download a preview before leaving: this browser could not save the draft.",
    backProduct: "← Back to product",
    reviewButton: "Review & enquire →",
    indicativePreview: "indicative preview",
    downloadPreview: "Download preview",
    downloadSettings: "Download design settings",
    sharePreview: "Share preview…",
    enquirySaved: "Enquiry saved",
    whatsappReady: "WhatsApp enquiry ready",
    thankYou: "Thank you. Let’s discuss your idea.",
    sendWithPreview: "Send your enquiry with the preview.",
    reference: "Reference",
    savedText: "Your design settings, preview and any uploaded artwork are saved privately. Continue on WhatsApp to discuss the quotation.",
    draftText: "This is a draft, not a submitted order. Open WhatsApp, send the message, then attach your downloaded preview and original artwork.",
    whatsapp: "Continue on WhatsApp ↗",
    addCart: "Add saved design to cart →",
    noProduction: "No payment or production begins until your quotation and digital mockup are approved.",
    editDesign: "Edit this design",
    enquiryTitle: "Your enquiry",
    sizeConfirm: "Size to confirm",
    quantity: "Quantity",
    snapshotHelp: "The snapshot includes your crop, position and text choices. Final dimensions and print colours require approval.",
    contactLegend: "Your contact details",
    name: "Your name",
    phone: "WhatsApp / phone",
    city: "City / delivery location",
    email: "Email (optional)",
    notes: "Special instructions",
    consent: "I have permission to use this artwork and agree to be contacted about this enquiry.",
    privacy: "Artwork & privacy",
    preparing: "Preparing…",
    submit: "Submit enquiry",
    prepareWhatsapp: "Prepare WhatsApp enquiry",
    enquiryOnly: "Enquiry only.",
    privateUpload: "Artwork and preview are uploaded privately on submission.",
    manualAttach: "Attach the preview and artwork in WhatsApp; files are not sent automatically.",
    backDesign: "← Back to design",
    notProvided: "Not provided",
    none: "None",
    pleaseConfirm: "Please confirm",
  },
  gu: {
    previewError: "તમારું પ્રિવ્યૂ બનાવી શકાયું નથી.",
    validationError: "તમારું નામ, ફોન નંબર અને consent ચેક કરો.",
    selectArtwork: "કૃપા કરીને artwork ફરી પસંદ કરો.",
    prepareUpload: "Private upload તૈયાર થઈ રહ્યું છે…",
    uploadArtwork: "મૂળ artwork ખાનગી રીતે upload થઈ રહ્યું છે…",
    uploadPreview: "Preview ખાનગી રીતે upload થઈ રહ્યું છે…",
    verifySave: "Artwork verify કરીને enquiry save થઈ રહી છે…",
    enquiryError: "તમારી enquiry તૈયાર થઈ શકી નથી.",
    toConfirm: "કન્ફર્મ કરવું",
    shareFallback: "અંદાજિત preview. અંતિમ digital mockup approval જરૂરી છે.",
    shareError: "Share ઉપલબ્ધ નથી. Preview download કરીને WhatsAppમાં attach કરો.",
    preparingEditor: "Customizer તૈયાર થઈ રહ્યું છે…",
    designStep: "1. ડિઝાઇન",
    reviewStep: "2. રિવ્યૂ અને પૂછપરછ",
    draftPrivacy: "આ draftમાં customer contact details store થતી નથી.",
    whatsappContinue: "WhatsApp પર enquiry ચાલુ રાખો ↗",
    preparingPhoto: "તમારો ફોટો તૈયાર થઈ રહ્યો છે…",
    overflow: "કેટલાક લખાણ માટે જગ્યા ઓછી છે. આગળ વધતા પહેલાં લખાણ ટૂંકું કરો અથવા font size ઘટાડો.",
    saveDraftError: "બહાર જતા પહેલાં preview download કરો: આ browser draft save કરી શક્યો નથી.",
    backProduct: "← પ્રોડક્ટ પર પાછા",
    reviewButton: "રિવ્યૂ અને પૂછપરછ →",
    indicativePreview: "અંદાજિત પ્રિવ્યૂ",
    downloadPreview: "પ્રિવ્યૂ ડાઉનલોડ કરો",
    downloadSettings: "ડિઝાઇન સેટિંગ્સ ડાઉનલોડ કરો",
    sharePreview: "પ્રિવ્યૂ શેર કરો…",
    enquirySaved: "Enquiry save થઈ",
    whatsappReady: "WhatsApp enquiry તૈયાર",
    thankYou: "આભાર. હવે તમારા વિચાર અંગે ચર્ચા કરીએ.",
    sendWithPreview: "Preview સાથે તમારી enquiry મોકલો.",
    reference: "રેફરન્સ",
    savedText: "તમારી design settings, preview અને uploaded artwork ખાનગી રીતે save થયાં છે. Quotation માટે WhatsApp પર આગળ વધો.",
    draftText: "આ માત્ર draft છે, submitted order નથી. WhatsApp ખોલો, message મોકલો અને પછી downloaded preview તથા original artwork attach કરો.",
    whatsapp: "WhatsApp પર આગળ વધો ↗",
    addCart: "Saved design cartમાં ઉમેરો →",
    noProduction: "Quotation અને digital mockup approve થાય ત્યાં સુધી payment અથવા production શરૂ નહીં થાય.",
    editDesign: "આ design edit કરો",
    enquiryTitle: "તમારી enquiry",
    sizeConfirm: "સાઇઝ કન્ફર્મ કરવી",
    quantity: "જથ્થો",
    snapshotHelp: "Snapshotમાં તમારું crop, position અને text choices સામેલ છે. અંતિમ dimension અને print colour માટે approval જરૂરી છે.",
    contactLegend: "તમારી સંપર્ક વિગતો",
    name: "તમારું નામ",
    phone: "WhatsApp / ફોન",
    city: "શહેર / delivery location",
    email: "ઈમેલ (વૈકલ્પિક)",
    notes: "ખાસ સૂચનાઓ",
    consent: "મને આ artwork વાપરવાની મંજૂરી છે અને આ enquiry અંગે સંપર્ક કરવા હું સંમત છું.",
    privacy: "Artwork અને privacy",
    preparing: "તૈયાર થઈ રહ્યું છે…",
    submit: "Enquiry સબમિટ કરો",
    prepareWhatsapp: "WhatsApp enquiry તૈયાર કરો",
    enquiryOnly: "ફક્ત enquiry.",
    privateUpload: "Submit કરતી વખતે artwork અને preview ખાનગી રીતે upload થાય છે.",
    manualAttach: "Preview અને artwork WhatsAppમાં attach કરો; files આપમેળે મોકલાતી નથી.",
    backDesign: "← ડિઝાઇન પર પાછા",
    notProvided: "આપેલ નથી",
    none: "કંઈ નહીં",
    pleaseConfirm: "કન્ફર્મ કરો",
  },
  hi: {
    previewError: "आपका प्रीव्यू तैयार नहीं हो सका.",
    validationError: "अपना नाम, फोन नंबर और consent जांचें.",
    selectArtwork: "कृपया artwork फिर से चुनें.",
    prepareUpload: "Private upload तैयार हो रहा है…",
    uploadArtwork: "मूल artwork निजी रूप से upload हो रहा है…",
    uploadPreview: "Preview निजी रूप से upload हो रहा है…",
    verifySave: "Artwork verify करके enquiry save की जा रही है…",
    enquiryError: "आपकी enquiry तैयार नहीं हो सकी.",
    toConfirm: "कन्फर्म करना है",
    shareFallback: "अनुमानित preview. अंतिम digital mockup approval आवश्यक है.",
    shareError: "Share उपलब्ध नहीं है. Preview download करके WhatsApp में attach करें.",
    preparingEditor: "Customizer तैयार हो रहा है…",
    designStep: "1. डिज़ाइन",
    reviewStep: "2. रिव्यू और पूछताछ",
    draftPrivacy: "इस draft में customer contact details store नहीं होतीं.",
    whatsappContinue: "WhatsApp पर enquiry जारी रखें ↗",
    preparingPhoto: "आपकी फोटो तैयार हो रही है…",
    overflow: "कुछ टेक्स्ट फिट नहीं हो रहा. आगे बढ़ने से पहले टेक्स्ट छोटा करें या font size घटाएँ.",
    saveDraftError: "बाहर जाने से पहले preview download करें: यह browser draft save नहीं कर सका.",
    backProduct: "← प्रोडक्ट पर वापस",
    reviewButton: "रिव्यू और पूछताछ →",
    indicativePreview: "अनुमानित प्रीव्यू",
    downloadPreview: "प्रीव्यू डाउनलोड करें",
    downloadSettings: "डिज़ाइन सेटिंग्स डाउनलोड करें",
    sharePreview: "प्रीव्यू शेयर करें…",
    enquirySaved: "Enquiry save हुई",
    whatsappReady: "WhatsApp enquiry तैयार",
    thankYou: "धन्यवाद. अब आपके आइडिया पर चर्चा करें.",
    sendWithPreview: "Preview के साथ अपनी enquiry भेजें.",
    reference: "रेफरेंस",
    savedText: "आपकी design settings, preview और uploaded artwork निजी रूप से save हैं. Quotation पर चर्चा के लिए WhatsApp पर आगे बढ़ें.",
    draftText: "यह केवल draft है, submitted order नहीं. WhatsApp खोलें, message भेजें और फिर downloaded preview तथा original artwork attach करें.",
    whatsapp: "WhatsApp पर आगे बढ़ें ↗",
    addCart: "Saved design cart में जोड़ें →",
    noProduction: "Quotation और digital mockup approve होने तक payment या production शुरू नहीं होगा.",
    editDesign: "यह design edit करें",
    enquiryTitle: "आपकी enquiry",
    sizeConfirm: "साइज़ कन्फर्म करनी है",
    quantity: "मात्रा",
    snapshotHelp: "Snapshot में आपका crop, position और text choices शामिल हैं. अंतिम dimensions और print colours के लिए approval आवश्यक है.",
    contactLegend: "आपकी संपर्क जानकारी",
    name: "आपका नाम",
    phone: "WhatsApp / फोन",
    city: "शहर / delivery location",
    email: "ईमेल (वैकल्पिक)",
    notes: "विशेष निर्देश",
    consent: "मुझे इस artwork का उपयोग करने की अनुमति है और इस enquiry के बारे में संपर्क किए जाने से सहमत हूँ.",
    privacy: "Artwork और privacy",
    preparing: "तैयार हो रहा है…",
    submit: "Enquiry सबमिट करें",
    prepareWhatsapp: "WhatsApp enquiry तैयार करें",
    enquiryOnly: "केवल enquiry.",
    privateUpload: "Submit करते समय artwork और preview निजी रूप से upload होते हैं.",
    manualAttach: "Preview और artwork WhatsApp में attach करें; files अपने-आप नहीं भेजी जातीं.",
    backDesign: "← डिज़ाइन पर वापस",
    notProvided: "नहीं दिया",
    none: "कोई नहीं",
    pleaseConfirm: "कन्फर्म करें",
  },
  mr: {
    previewError: "तुमचा प्रीव्ह्यू तयार करता आला नाही.",
    validationError: "तुमचे नाव, फोन नंबर आणि consent तपासा.",
    selectArtwork: "कृपया artwork पुन्हा निवडा.",
    prepareUpload: "Private upload तयार होत आहे…",
    uploadArtwork: "मूळ artwork खाजगी स्वरूपात upload होत आहे…",
    uploadPreview: "Preview खाजगी स्वरूपात upload होत आहे…",
    verifySave: "Artwork verify करून enquiry save होत आहे…",
    enquiryError: "तुमची enquiry तयार करता आली नाही.",
    toConfirm: "निश्चित करायचे",
    shareFallback: "अंदाजे preview. अंतिम digital mockup approval आवश्यक आहे.",
    shareError: "Share उपलब्ध नाही. Preview download करून WhatsAppमध्ये attach करा.",
    preparingEditor: "Customizer तयार होत आहे…",
    designStep: "1. डिझाइन",
    reviewStep: "2. रिव्ह्यू आणि चौकशी",
    draftPrivacy: "या draftमध्ये customer contact details store होत नाहीत.",
    whatsappContinue: "WhatsApp वर enquiry सुरू ठेवा ↗",
    preparingPhoto: "तुमचा फोटो तयार होत आहे…",
    overflow: "काही मजकूर fit होत नाही. पुढे जाण्यापूर्वी मजकूर कमी करा किंवा font size कमी करा.",
    saveDraftError: "बाहेर जाण्यापूर्वी preview download करा: हा browser draft save करू शकला नाही.",
    backProduct: "← प्रॉडक्टवर परत",
    reviewButton: "रिव्ह्यू आणि चौकशी →",
    indicativePreview: "अंदाजे प्रीव्ह्यू",
    downloadPreview: "प्रीव्ह्यू डाउनलोड करा",
    downloadSettings: "डिझाइन सेटिंग्स डाउनलोड करा",
    sharePreview: "प्रीव्ह्यू शेअर करा…",
    enquirySaved: "Enquiry save झाली",
    whatsappReady: "WhatsApp enquiry तयार",
    thankYou: "धन्यवाद. आता तुमच्या कल्पनेवर चर्चा करूया.",
    sendWithPreview: "Preview सोबत तुमची enquiry पाठवा.",
    reference: "रेफरन्स",
    savedText: "तुमची design settings, preview आणि uploaded artwork खाजगी स्वरूपात save झाली आहेत. Quotationबद्दल चर्चा करण्यासाठी WhatsApp वर पुढे जा.",
    draftText: "हा फक्त draft आहे, submitted order नाही. WhatsApp उघडा, message पाठवा आणि नंतर downloaded preview व original artwork attach करा.",
    whatsapp: "WhatsApp वर पुढे जा ↗",
    addCart: "Saved design cartमध्ये जोडा →",
    noProduction: "Quotation आणि digital mockup approve होईपर्यंत payment किंवा production सुरू होणार नाही.",
    editDesign: "हे design edit करा",
    enquiryTitle: "तुमची enquiry",
    sizeConfirm: "साइझ निश्चित करायची",
    quantity: "प्रमाण",
    snapshotHelp: "Snapshotमध्ये तुमचा crop, position आणि text choices आहेत. अंतिम dimensions आणि print coloursसाठी approval आवश्यक आहे.",
    contactLegend: "तुमची संपर्क माहिती",
    name: "तुमचे नाव",
    phone: "WhatsApp / फोन",
    city: "शहर / delivery location",
    email: "ईमेल (पर्यायी)",
    notes: "विशेष सूचना",
    consent: "मला हे artwork वापरण्याची परवानगी आहे आणि या enquiryबद्दल संपर्क करण्यास मी सहमत आहे.",
    privacy: "Artwork आणि privacy",
    preparing: "तयार होत आहे…",
    submit: "Enquiry सबमिट करा",
    prepareWhatsapp: "WhatsApp enquiry तयार करा",
    enquiryOnly: "फक्त enquiry.",
    privateUpload: "Submit करताना artwork आणि preview खाजगी स्वरूपात upload होतात.",
    manualAttach: "Preview आणि artwork WhatsAppमध्ये attach करा; files आपोआप पाठवल्या जात नाहीत.",
    backDesign: "← डिझाइनवर परत",
    notProvided: "दिलेला नाही",
    none: "काही नाही",
    pleaseConfirm: "निश्चित करा",
  },
} as const;

const emptyCustomer = {
  customerName: "",
  phone: "",
  email: "",
  city: "",
  notes: "",
  consent: false,
};
export function CustomizationForm({
  product: p,
  onlineSubmission,
  initialSelection,
  selectionOverrides = {},
  backgroundRemovalEnabled = false,
  backgroundRemovalAdapter: injectedBackgroundRemovalAdapter,
  lang = "en",
}: {
  product: CustomizationProduct;
  onlineSubmission: boolean;
  initialSelection?: { variantId: string; quantity: number };
  selectionOverrides?: { variantId?: string; quantity?: number };
  backgroundRemovalEnabled?: boolean;
  backgroundRemovalAdapter?: BackgroundRemovalAdapter;
  lang?: UiLanguage;
}) {
  const t = formCopy[lang];
  const backgroundRemovalAdapter =
    injectedBackgroundRemovalAdapter ??
    (backgroundRemovalEnabled ? sameOriginBackgroundRemovalAdapter : undefined);
  const prefix = lang === "en" ? "" : "/" + lang;
  const productPath = prefix + "/products/" + p.slug;
  const editor = useCustomization(
    p,
    initialSelection ?? resolveSelection(p),
    selectionOverrides,
    lang,
  );
  const router = useRouter();
  const [step, setStep] = useState<"design" | "enquiry" | "success">("design");
  const [snapshot, setSnapshot] = useState<CustomizationSnapshot | null>(null),
    [customer, setCustomer] = useState(emptyCustomer);
  const [busy, setBusy] = useState(false),
    [overflow, setOverflow] = useState(false);
  const [success, setSuccess] = useState<{
    reference: string;
    message: string;
    saved: boolean;
  } | null>(null);
  const requestKey = useRef({ fingerprint: "", id: "" });
  const uploadSession = useRef<{
    requestId: string;
    session: UploadSession;
  } | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  async function prepare(review = false) {
    editor.setError("");
    setBusy(true);
    try {
      const next = await createSnapshot(editor.document, editor.bitmap, p);
      setSnapshot(next);
      await editor.flush();
      if (review) setStep("enquiry");
      else downloadBlob(next.png, "YL-design-" + next.designId + ".png");
    } catch (e) {
      editor.setError(
        e instanceof Error ? e.message : t.previewError,
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!snapshot) return;
    setBusy(true);
    editor.setError("");
    try {
      if (
        !customer.consent ||
        customer.customerName.trim().length < 2 ||
        customer.phone.replace(/\D/g, "").length < 10
      )
        throw new Error(t.validationError);
      const doc = snapshot.document,
        variant = p.variants.find((v) => v.id === doc.variantId);
      const sourceArtwork =
        doc.backgroundRemoval.adapter &&
        editor.originalArtwork &&
        editor.originalArtwork !== editor.artwork
          ? {
              bytes: editor.originalArtwork.size,
              sha256: await blobHash(editor.originalArtwork),
              mimeType: editor.originalArtwork.type,
              name:
                editor.originalArtwork instanceof File
                  ? editor.originalArtwork.name.slice(0, 180)
                  : "original-artwork",
            }
          : null;
      const fingerprint = JSON.stringify([
        snapshot.designId,
        sourceArtwork?.sha256 || null,
        customer,
      ]);
      if (requestKey.current.fingerprint !== fingerprint)
        requestKey.current = { fingerprint, id: crypto.randomUUID() };
      const requestId = requestKey.current.id;
      const payload = {
        ...customer,
        requestId,
        productId: p.id,
        variantId: doc.variantId,
        quantity: doc.quantity,
        customization: doc,
        designId: snapshot.designId,
        sourceArtwork,
        website: String(new FormData(e.currentTarget).get("website") || ""),
      };
      let reference = "YL-DRAFT-" + requestId.slice(0, 8).toUpperCase(),
        saved = false;
      if (onlineSubmission) {
        setUploadStatus(t.prepareUpload);
        let session =
          uploadSession.current?.requestId === requestId &&
          uploadSession.current.session.expiresAt > Date.now() + 10000
            ? uploadSession.current.session
            : null;
        if (!session) {
          const signed = await postEnquiryJson("/api/enquiries/uploads", {
            ...payload,
            preview: {
              bytes: snapshot.png.size,
              sha256: await blobHash(snapshot.png),
            },
          });
          if (signed.reference) {
            reference = signed.reference;
            saved = true;
          } else {
            session = signed as UploadSession;
            uploadSession.current = { requestId, session };
          }
        }
        if (!saved && session) {
          if (session.artwork && !session.artworkDone) {
            if (!editor.artwork)
              throw new Error(t.selectArtwork);
            setUploadStatus(t.uploadArtwork);
            await uploadPrivate(session.artwork, editor.artwork);
            session.artworkDone = true;
          }
          if (session.sourceArtwork && !session.sourceArtworkDone) {
            if (!editor.originalArtwork)
              throw new Error(t.selectArtwork);
            setUploadStatus(t.uploadArtwork);
            await uploadPrivate(session.sourceArtwork, editor.originalArtwork);
            session.sourceArtworkDone = true;
          }
          if (!session.previewDone) {
            setUploadStatus(t.uploadPreview);
            await uploadPrivate(session.preview, snapshot.png);
            session.previewDone = true;
          }
          setUploadStatus(t.verifySave);
          const result = await postEnquiryJson("/api/enquiries", {
            ...payload,
            uploadReceipt: session.receipt,
          });
          reference = result.reference;
        }
        saved = true;
      }
      const message = [
        "Hello Yash Laser, " +
          (saved
            ? "my enquiry reference is "
            : "my enquiry draft reference is ") +
          reference +
          ".",
        "Design: " + snapshot.designId,
        "Product: " + p.name,
        "Size / option: " + (variant?.name || t.pleaseConfirm),
        "Quantity: " + doc.quantity,
        "Text: " +
          doc.text
            .map((t) => t.text)
            .filter(Boolean)
            .join(" / "),
        "Name: " + customer.customerName,
        "Phone: " + customer.phone,
        "Email: " + (customer.email || t.notProvided),
        "Location: " + customer.city,
        "Notes: " + (customer.notes || t.none),
        business.url + productPath,
        saved
          ? "My artwork, design settings and indicative preview are saved with this enquiry."
          : "I will attach the downloaded design preview and original artwork in this conversation.",
        "Please confirm the quotation and final digital mockup before production.",
      ].join("\n");
      setSuccess({ reference, message, saved });
      setUploadStatus("");
      setStep("success");
    } catch (e) {
      editor.setError(
        e instanceof Error ? e.message : t.enquiryError,
      );
    } finally {
      setBusy(false);
    }
  }
  function addSavedDesignToCart() {
    if (!snapshot || !success?.saved) return;
    const variant = p.variants.find((v) => v.id === snapshot.document.variantId);
    const unitPriceMinor =
      p.pricingMode === "quote_required"
        ? null
        : (variant?.effectivePriceMinor ?? p.effectivePriceMinor) || null;
    addCartItem({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      variantId: variant?.id || "",
      variantName: variant?.name || t.toConfirm,
      quantity: snapshot.document.quantity,
      unitPriceMinor,
      pricingMode: p.pricingMode,
      designId: snapshot.designId,
      notes: "Saved enquiry " + success.reference,
    });
    router.push(prefix + "/cart");
  }

  async function share() {
    if (!snapshot) return;
    const file = new File(
      [snapshot.png],
      "YL-design-" + snapshot.designId + ".png",
      { type: "image/png" },
    );
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share)
        await navigator.share({
          files: [file],
          title: "Yash Laser design " + snapshot.designId,
          text:
            success?.message || t.shareFallback,
        });
      else downloadBlob(snapshot.png, file.name);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        editor.setError(t.shareError);
    }
  }
  if (!editor.ready)
    return (
      <p className="editor-status" role="status">
        {t.preparingEditor}
      </p>
    );
  const locked = busy || editor.processing;
  return (
    <div className="customization-workspace" aria-busy={locked}>
      <nav className="editor-steps" aria-label="Customization steps">
        <button
          type="button"
          aria-current={step === "design" ? "step" : undefined}
          disabled={locked}
          onClick={() => setStep("design")}
        >
          {t.designStep}
        </button>
        <span>→</span>
        <button
          type="button"
          aria-current={step !== "design" ? "step" : undefined}
          disabled={locked}
          onClick={() => void prepare(true)}
        >
          {t.reviewStep}
        </button>
      </nav>
      <p className="muted" role="status">
        {editor.storageMessage} {t.draftPrivacy}
      </p>
      {editor.error && (
        <p className="form-error" role="alert">
          {editor.error}{" "}
          {step === "enquiry" && (
            <a
              href={whatsappUrl(
                `Hello Yash Laser, please help with my enquiry for ${p.name}. Design: ${snapshot?.designId || "not generated"}. Size: ${p.variants.find((v) => v.id === editor.document.variantId)?.name || "To confirm"}. Quantity: ${editor.document.quantity}. I will attach my preview and artwork. ${business.url}${productPath}`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              {t.whatsappContinue}
            </a>
          )}
        </p>
      )}
      {editor.processing && <p role="status">{t.preparingPhoto}</p>}
      {busy && uploadStatus && <p role="status">{uploadStatus}</p>}
      {overflow && step === "design" && (
        <p className="form-error" role="alert">
          {t.overflow}
        </p>
      )}
      {step === "design" ? (
        <>
          <CustomizationEditor
            document={editor.document}
            bitmap={editor.bitmap}
            qualityReport={editor.qualityReport}
            product={p}
            onChange={editor.setDocument}
            onUpload={(f) => void editor.upload(f, f.name)}
            onReset={() => {
              editor.reset();
              setSnapshot(null);
              setSuccess(null);
              requestKey.current = { fingerprint: "", id: "" };
            }}
            onOverflow={setOverflow}
            processing={locked}
            adapter={backgroundRemovalAdapter}
            onRemoveBackground={() => {
              if (backgroundRemovalAdapter)
                void editor.applyBackgroundRemoval(backgroundRemovalAdapter);
            }}
            hasOriginalArtwork={Boolean(editor.originalArtwork)}
            onRestoreOriginal={() => void editor.restoreOriginalArtwork()}
            onDownload={() => void prepare()}
            lang={lang}
          />
          <div className="editor-bottom-actions">
            <a
              className="text-link"
              href={productPath}
              onClick={async (e) => {
                e.preventDefault();
                if (await editor.flush()) router.push(productPath);
                else
                  editor.setError(
                    t.saveDraftError,
                  );
              }}
            >
              {t.backProduct}
            </a>
            <button
              type="button"
              className="button"
              disabled={locked || overflow}
              onClick={() => void prepare(true)}
            >
              {t.reviewButton}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="review-grid">
            <section className="review-preview">
              {snapshot && (
                <>
                  <CanvasPreview
                    document={snapshot.document}
                    bitmap={editor.bitmap}
                    product={p}
                    lang={lang}
                  />
                  <p className="muted">
                    Design {snapshot.designId} · {t.indicativePreview}
                  </p>
                  <div className="editor-toolbar">
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(
                          snapshot.png,
                          "YL-design-" + snapshot.designId + ".png",
                        )
                      }
                    >
                      {t.downloadPreview}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(
                          snapshot.json,
                          "YL-design-" + snapshot.designId + ".json",
                        )
                      }
                    >
                      {t.downloadSettings}
                    </button>
                    <button type="button" onClick={() => void share()}>
                      {t.sharePreview}
                    </button>
                  </div>
                </>
              )}
            </section>
            {step === "success" && success ? (
              <section className="enquiry-success" role="status">
                <p className="eyebrow">
                  {success.saved ? t.enquirySaved : t.whatsappReady}
                </p>
                <h2>
                  {success.saved
                    ? t.thankYou
                    : t.sendWithPreview}
                </h2>
                <p>
                  {t.reference}: <strong>{success.reference}</strong>
                </p>
                <p>
                  {success.saved
                    ? t.savedText
                    : t.draftText}
                </p>
                <div className="editor-toolbar">
                  <a
                    className="button"
                    href={whatsappUrl(success.message)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.whatsapp}
                  </a>
                  {success.saved && (
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={addSavedDesignToCart}
                    >
                      {t.addCart}
                    </button>
                  )}
                </div>
                <p>
                  {t.noProduction}
                </p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setStep("design")}
                >
                  {t.editDesign}
                </button>
              </section>
            ) : (
              <form className="enquiry-form" onSubmit={submit}>
                <h2>{t.enquiryTitle}</h2>
                <p>
                  {p.name}
                  <br />
                  {p.variants.find((v) => v.id === editor.document.variantId)
                    ?.name || t.sizeConfirm}{" "}
                  · {t.quantity} {editor.document.quantity}
                </p>
                <p className="muted">
                  {t.snapshotHelp}
                </p>
                <fieldset disabled={locked}>
                  <legend>{t.contactLegend}</legend>
                  <label>
                    {t.name}
                    <input
                      name="customerName"
                      autoComplete="name"
                      minLength={2}
                      maxLength={80}
                      required
                      value={customer.customerName}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          customerName: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t.phone}
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      pattern={"[+]?[0-9\\s\\(\\)\\-]{10,20}"}
                      maxLength={20}
                      required
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({ ...customer, phone: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t.city}
                    <input
                      name="city"
                      autoComplete="address-level2"
                      maxLength={100}
                      required
                      value={customer.city}
                      onChange={(e) =>
                        setCustomer({ ...customer, city: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t.email}
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={160}
                      value={customer.email}
                      onChange={(e) =>
                        setCustomer({ ...customer, email: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t.notes}
                    <textarea
                      name="notes"
                      rows={3}
                      maxLength={1000}
                      value={customer.notes}
                      onChange={(e) =>
                        setCustomer({ ...customer, notes: e.target.value })
                      }
                    />
                  </label>
                  <div className="honeypot" aria-hidden="true">
                    <label>
                      Leave blank
                      <input name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                  <label className="consent">
                    <input
                      type="checkbox"
                      name="consent"
                      required
                      checked={customer.consent}
                      onChange={(e) =>
                        setCustomer({ ...customer, consent: e.target.checked })
                      }
                    />
                    <span>
                      {t.consent}{" "}
                      <Link href={prefix + "/privacy"}>{t.privacy}</Link>
                    </span>
                  </label>
                </fieldset>
                <button type="submit" className="button" disabled={locked}>
                  {busy
                    ? t.preparing
                    : onlineSubmission
                      ? t.submit
                      : t.prepareWhatsapp}{" "}
                  ↗
                </button>
                <p className="muted">
                  {t.enquiryOnly}{" "}
                  {onlineSubmission ? t.privateUpload : t.manualAttach}
                </p>
                <button
                  type="button"
                  className="text-link"
                  disabled={locked}
                  onClick={() => setStep("design")}
                >
                  {t.backDesign}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
