import type { UiLanguage } from "@/lib/i18n";

export type InfoPageKey =
  | "about"
  | "faq"
  | "shipping"
  | "terms"
  | "replacement";

type Section = {
  title: string;
  body: string[];
};

type InfoPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
};

export const infoPageCopy: Record<
  UiLanguage,
  Record<InfoPageKey, InfoPageContent>
> = {
  en: {
    about: {
      eyebrow: "Yash Laser · Established 1997",
      title: "Personal products, made with a practical production mindset.",
      intro:
        "Yash Laser is based in Prantij, Gujarat and focuses on personalised acrylic products for gifts, achievements, identity, institutions and events.",
      sections: [
        {
          title: "What we make",
          body: [
            "Our current online range focuses on personalised acrylic products including photo standees, awards, medals, keychains, I-cards, name plates and custom acrylic work.",
            "Product options, artwork requirements and final production details are confirmed before manufacturing.",
          ],
        },
        {
          title: "How we work",
          body: [
            "We keep product selection, personalisation, proof review and order tracking structured so important names, dates, quantities and artwork are recorded clearly.",
            "For bulk, event and custom requirements, our team reviews feasibility, pricing and delivery before confirming the job.",
          ],
        },
        {
          title: "Our approach",
          body: [
            "We prefer clear specifications and realistic commitments over promises that have not been verified.",
            "Customer artwork and order information are handled as private working data unless the customer separately agrees to public use.",
          ],
        },
      ],
    },
    faq: {
      eyebrow: "Help before you order",
      title: "Frequently asked questions.",
      intro:
        "These answers explain the current website workflow. Product-specific details are confirmed on the product, quotation or proof.",
      sections: [
        {
          title: "How do I place a personalised order?",
          body: [
            "Choose a product, add the available personalisation details and submit checkout. For quote-only, bulk, event or custom acrylic work, use the relevant request form.",
          ],
        },
        {
          title: "Will I receive a proof before production?",
          body: [
            "Where a digital proof is required, production starts only after the applicable proof and order requirements are confirmed.",
          ],
        },
        {
          title: "Do you deliver across India?",
          body: [
            "The website is designed for All-India orders. Pincode serviceability, courier option, charge and expected delivery are confirmed before payment when required.",
          ],
        },
        {
          title: "Can I place a bulk order with different names?",
          body: [
            "Yes. Bulk workflows can collect quantities, notes and structured files such as Excel or CSV where applicable. The data is reviewed before production.",
          ],
        },
        {
          title: "Can I print Gujarati, Hindi, Marathi or English?",
          body: [
            "Website language and print language are separate. Supported print languages depend on the selected product/template and are confirmed before production.",
          ],
        },
        {
          title: "What happens to my uploaded artwork?",
          body: [
            "Customer files are treated as private order data. Please upload only information needed for the job and avoid unnecessary identity documents.",
          ],
        },
      ],
    },
    shipping: {
      eyebrow: "Delivery information",
      title: "Shipping policy.",
      intro:
        "Shipping availability, courier charges and timing depend on the destination, product and production readiness. We confirm material delivery details before payment when required.",
      sections: [
        {
          title: "Serviceability and charges",
          body: [
            "A valid delivery address and pincode are required. Courier serviceability and final shipping charge may require manual confirmation.",
            "A checkout request is not a guaranteed delivery commitment until the order and shipping arrangement are confirmed.",
          ],
        },
        {
          title: "Dispatch timing",
          body: [
            "Personalised products require production after the necessary order details and proof approvals are complete. Dispatch timing therefore varies by product, quantity and workload.",
            "Any date shown or discussed before final confirmation should be treated as an estimate unless explicitly confirmed for the order.",
          ],
        },
        {
          title: "Tracking",
          body: [
            "When a courier tracking number or tracking link is available, it is added to the order record.",
            "Courier movement after dispatch is handled by the carrier, while Yash Laser can assist with order-related follow-up.",
          ],
        },
        {
          title: "Address changes",
          body: [
            "Contact us as early as possible if an address needs correction. An address may not be changeable after packing, label creation or dispatch.",
          ],
        },
      ],
    },
    terms: {
      eyebrow: "Website & order terms",
      title: "Terms of use and personalised orders.",
      intro:
        "These terms describe the current website workflow. A confirmed quotation, invoice, proof or written order confirmation may contain additional order-specific terms.",
      sections: [
        {
          title: "Product information and pricing",
          body: [
            "We aim to keep product descriptions, options and prices accurate. Quote-required work, unusual sizes, bulk jobs, shipping and special production needs are confirmed before payment.",
            "A submitted request does not by itself guarantee acceptance, price, production capacity or delivery date.",
          ],
        },
        {
          title: "Customer-provided content",
          body: [
            "You are responsible for providing accurate names, dates, spellings, logos and other content, and for having the right to use submitted artwork.",
            "We may decline files or requests that cannot be produced safely, lawfully or to an acceptable production standard.",
          ],
        },
        {
          title: "Proof approval",
          body: [
            "When a proof is provided, review all visible text, names, layout and artwork carefully. Approval applies to the exact proof version approved.",
            "A revised proof supersedes an older actionable proof where the system marks it as a newer version.",
          ],
        },
        {
          title: "Production and changes",
          body: [
            "Production begins only after the required commercial, artwork and approval conditions are met.",
            "Changes requested after confirmation may affect price, timing or feasibility and may not be possible after production has started.",
          ],
        },
        {
          title: "Website availability",
          body: [
            "Website features may be updated, temporarily unavailable or limited while services are being maintained. Confirmed customer orders remain governed by their recorded order details.",
          ],
        },
      ],
    },
    replacement: {
      eyebrow: "Order issue support",
      title: "Replacement & damage policy.",
      intro:
        "Personalised products are made for a specific customer, so reported problems are reviewed against the confirmed order, approved proof, production result and delivery condition.",
      sections: [
        {
          title: "If an item arrives damaged",
          body: [
            "Contact Yash Laser with the order number and clear photos of the product and packaging so the issue can be reviewed.",
            "Keep the product and packaging available until the review is complete, where practical.",
          ],
        },
        {
          title: "Production or specification issue",
          body: [
            "If the supplied product materially differs from the confirmed order or approved production specification, we will review the appropriate corrective option.",
            "The remedy may be a correction, reprint, replacement or another agreed resolution depending on the verified issue.",
          ],
        },
        {
          title: "Approved customer content",
          body: [
            "Names, spellings, dates, layout or artwork that match an approved proof are generally treated differently from a production error. Please review proofs carefully before approval.",
          ],
        },
        {
          title: "How resolution is decided",
          body: [
            "Eligibility and the appropriate resolution depend on the evidence, order stage, approved proof, product condition and any order-specific terms.",
            "For assistance, use the Support page and include the order reference and a clear description of the issue.",
          ],
        },
      ],
    },
  },
  gu: {
    about: {
      eyebrow: "Yash Laser · સ્થાપના 1997",
      title: "વ્યક્તિગત પ્રોડક્ટ્સ, વ્યવહારુ પ્રોડક્શન અભિગમ સાથે.",
      intro:
        "Yash Laser પ્રાંતિજ, ગુજરાતમાં સ્થિત છે અને ગિફ્ટ, સિદ્ધિ, ઓળખ, સંસ્થા અને ઇવેન્ટ માટે વ્યક્તિગત એક્રેલિક પ્રોડક્ટ્સ પર ધ્યાન આપે છે.",
      sections: [
        {
          title: "અમે શું બનાવીએ છીએ",
          body: [
            "હાલનું online range ફોટો સ્ટેન્ડી, એવોર્ડ, મેડલ, કીચેન, I-card, નેમ પ્લેટ અને custom acrylic જેવી વ્યક્તિગત એક્રેલિક પ્રોડક્ટ્સ પર કેન્દ્રિત છે.",
            "પ્રોડક્ટ વિકલ્પો, artwork જરૂરિયાત અને અંતિમ production વિગતો manufacturing પહેલાં કન્ફર્મ થાય છે.",
          ],
        },
        {
          title: "અમે કેવી રીતે કામ કરીએ છીએ",
          body: [
            "પ્રોડક્ટ પસંદગી, customisation, proof review અને order tracking વ્યવસ્થિત રાખીએ છીએ જેથી નામ, તારીખ, જથ્થો અને artwork સ્પષ્ટ રીતે record થાય.",
            "Bulk, event અને custom કામમાં feasibility, ભાવ અને delivery કન્ફર્મ કર્યા પછી કામ આગળ વધે છે.",
          ],
        },
        {
          title: "અમારો અભિગમ",
          body: [
            "ચકાસ્યા વગર મોટા વચનો આપવાને બદલે અમે સ્પષ્ટ specification અને વાસ્તવિક commitmentને પ્રાથમિકતા આપીએ છીએ.",
            "ગ્રાહક artwork અને order માહિતી ખાનગી working data તરીકે રાખવામાં આવે છે, જો ગ્રાહક અલગથી public use માટે મંજૂરી ન આપે.",
          ],
        },
      ],
    },
    faq: {
      eyebrow: "ઓર્ડર પહેલાં મદદ",
      title: "વારંવાર પૂછાતા પ્રશ્નો.",
      intro:
        "આ જવાબો હાલની website workflow સમજાવે છે. Product-specific વિગતો product, quotation અથવા proofમાં કન્ફર્મ થાય છે.",
      sections: [
        {
          title: "Personalised order કેવી રીતે કરવો?",
          body: [
            "પ્રોડક્ટ પસંદ કરો, ઉપલબ્ધ personalisation વિગતો ઉમેરો અને checkout submit કરો. Quote-only, bulk, event અથવા custom acrylic માટે સંબંધિત request form વાપરો.",
          ],
        },
        {
          title: "Production પહેલાં proof મળશે?",
          body: [
            "જ્યાં digital proof જરૂરી હોય ત્યાં લાગુ proof અને order requirements કન્ફર્મ થયા પછી જ production શરૂ થાય છે.",
          ],
        },
        {
          title: "All India delivery છે?",
          body: [
            "Website All-India orders માટે રચાયેલ છે. Pincode serviceability, courier, charge અને expected delivery જરૂરી હોય ત્યાં payment પહેલાં કન્ફર્મ થાય છે.",
          ],
        },
        {
          title: "અલગ અલગ નામ સાથે bulk order કરી શકાય?",
          body: [
            "હા. લાગુ પડે ત્યાં bulk workflow quantity, notes અને Excel/CSV જેવી structured files લઈ શકે છે. Production પહેલાં data review થાય છે.",
          ],
        },
        {
          title: "Gujarati, Hindi, Marathi કે English print થઈ શકે?",
          body: [
            "Website language અને print language અલગ છે. Supported print languages પસંદ કરેલા product/template પર આધારિત છે અને production પહેલાં કન્ફર્મ થાય છે.",
          ],
        },
        {
          title: "Uploaded artworkનું શું થાય?",
          body: [
            "Customer filesને private order data તરીકે handle કરીએ છીએ. કામ માટે જરૂરી માહિતી જ upload કરો અને અનાવશ્યક identity documents ટાળો.",
          ],
        },
      ],
    },
    shipping: {
      eyebrow: "ડિલિવરી માહિતી",
      title: "શિપિંગ પોલિસી.",
      intro:
        "Shipping availability, courier charge અને timing destination, product અને production readiness પર આધારિત છે. જરૂરી હોય ત્યાં payment પહેલાં delivery વિગતો કન્ફર્મ થાય છે.",
      sections: [
        {
          title: "Serviceability અને charge",
          body: [
            "માન્ય delivery address અને pincode જરૂરી છે. Courier serviceability અને અંતિમ shipping charge માટે manual confirmation જરૂરી થઈ શકે છે.",
            "Checkout request માત્રથી delivery guarantee થતી નથી; order અને shipping arrangement કન્ફર્મ થવું જરૂરી છે.",
          ],
        },
        {
          title: "Dispatch timing",
          body: [
            "Personalised product માટે જરૂરી order details અને proof approval પૂર્ણ થયા પછી production થાય છે. તેથી dispatch timing product, quantity અને workload મુજબ બદલાય છે.",
            "Final confirmation પહેલાં બતાવેલી તારીખ estimate માનવી, જો order માટે સ્પષ્ટ રીતે confirmed ન હોય.",
          ],
        },
        {
          title: "Tracking",
          body: [
            "Courier tracking number અથવા link ઉપલબ્ધ થયા પછી order recordમાં ઉમેરાય છે.",
            "Dispatch પછી courier movement carrier સંભાળે છે; order સંબંધિત follow-upમાં Yash Laser મદદ કરી શકે છે.",
          ],
        },
        {
          title: "Address change",
          body: [
            "સરનામું સુધારવું હોય તો શક્ય તેટલું વહેલું સંપર્ક કરો. Packing, label creation અથવા dispatch પછી ફેરફાર શક્ય ન પણ હોય.",
          ],
        },
      ],
    },
    terms: {
      eyebrow: "Website અને order terms",
      title: "ઉપયોગ અને personalised orderની શરતો.",
      intro:
        "આ terms હાલની website workflow સમજાવે છે. Confirmed quotation, invoice, proof અથવા written order confirmationમાં વધારાની order-specific શરતો હોઈ શકે છે.",
      sections: [
        {
          title: "Product information અને pricing",
          body: [
            "Product description, options અને price સાચા રાખવાનો પ્રયત્ન કરીએ છીએ. Quote-required work, unusual size, bulk job, shipping અને special production જરૂરિયાત payment પહેલાં કન્ફર્મ થાય છે.",
            "Submitted request માત્રથી acceptance, price, production capacity અથવા delivery dateની guarantee થતી નથી.",
          ],
        },
        {
          title: "Customer content",
          body: [
            "નામ, તારીખ, spelling, logo અને અન્ય content સાચું આપવાની તથા submitted artwork વાપરવાનો અધિકાર હોવાની જવાબદારી customerની છે.",
            "જે file/request safely, lawfully અથવા યોગ્ય production standardથી બનાવી ન શકાય તેને અમે decline કરી શકીએ છીએ.",
          ],
        },
        {
          title: "Proof approval",
          body: [
            "Proof મળે ત્યારે visible text, નામ, layout અને artwork ધ્યાનથી ચેક કરો. Approval ચોક્કસ approved proof version પર લાગુ પડે છે.",
            "Systemમાં newer version બન્યા પછી revised proof જૂના actionable proofને supersede કરી શકે છે.",
          ],
        },
        {
          title: "Production અને changes",
          body: [
            "જરૂરી commercial, artwork અને approval conditions પૂર્ણ થયા પછી production શરૂ થાય છે.",
            "Confirmation પછી માંગેલા ફેરફાર price, timing અથવા feasibility બદલી શકે છે અને production શરૂ થયા પછી શક્ય ન પણ હોય.",
          ],
        },
        {
          title: "Website availability",
          body: [
            "Maintenance અથવા update દરમ્યાન website features બદલાઈ, મર્યાદિત અથવા થોડા સમય માટે unavailable થઈ શકે છે. Confirmed orders તેમના recorded details પ્રમાણે જ ચાલે છે.",
          ],
        },
      ],
    },
    replacement: {
      eyebrow: "Order issue support",
      title: "Replacement અને damage policy.",
      intro:
        "Personalised products ચોક્કસ customer માટે બને છે, તેથી reported issueને confirmed order, approved proof, production result અને delivery condition સામે review કરવામાં આવે છે.",
      sections: [
        {
          title: "Product damaged પહોંચે તો",
          body: [
            "Order number સાથે product અને packagingના સ્પષ્ટ photos મોકલી Yash Laserનો સંપર્ક કરો જેથી issue review થઈ શકે.",
            "શક્ય હોય ત્યાં સુધી review પૂરો થાય ત્યાં સુધી product અને packaging સાચવી રાખો.",
          ],
        },
        {
          title: "Production અથવા specification issue",
          body: [
            "Supplied product confirmed order અથવા approved production specificationથી નોંધપાત્ર રીતે અલગ હોય તો યોગ્ય corrective option review કરવામાં આવશે.",
            "Verified issue પ્રમાણે correction, reprint, replacement અથવા અન્ય agreed resolution થઈ શકે છે.",
          ],
        },
        {
          title: "Approved customer content",
          body: [
            "Approved proof સાથે મેળ ખાતાં નામ, spelling, તારીખ, layout અથવા artworkને production error કરતાં અલગ રીતે જોવામાં આવે છે. Approval પહેલાં proof ધ્યાનથી ચેક કરો.",
          ],
        },
        {
          title: "Resolution કેવી રીતે નક્કી થાય",
          body: [
            "Eligibility અને યોગ્ય resolution evidence, order stage, approved proof, product condition અને order-specific terms પર આધારિત છે.",
            "મદદ માટે Support pageમાં order reference અને issueની સ્પષ્ટ માહિતી મોકલો.",
          ],
        },
      ],
    },
  },
  hi: {
    about: {
      eyebrow: "Yash Laser · स्थापित 1997",
      title: "व्यक्तिगत प्रोडक्ट, व्यावहारिक प्रोडक्शन सोच के साथ.",
      intro:
        "Yash Laser प्रांतिज, गुजरात में स्थित है और गिफ्ट, उपलब्धि, पहचान, संस्था और इवेंट के लिए व्यक्तिगत ऐक्रेलिक प्रोडक्ट पर केंद्रित है.",
      sections: [
        { title: "हम क्या बनाते हैं", body: ["हमारी वर्तमान online range में फोटो स्टैंडी, अवॉर्ड, मेडल, कीचेन, I-card, नेम प्लेट और custom acrylic जैसे व्यक्तिगत ऐक्रेलिक प्रोडक्ट शामिल हैं.", "प्रोडक्ट विकल्प, artwork आवश्यकता और अंतिम production विवरण manufacturing से पहले कन्फर्म किए जाते हैं."] },
        { title: "हम कैसे काम करते हैं", body: ["प्रोडक्ट चयन, customisation, proof review और order tracking को व्यवस्थित रखा जाता है ताकि नाम, तारीख, मात्रा और artwork स्पष्ट रूप से record हों.", "Bulk, event और custom काम में feasibility, कीमत और delivery कन्फर्म होने के बाद काम आगे बढ़ता है."] },
        { title: "हमारा तरीका", body: ["बिना जांचे बड़े वादे करने के बजाय हम स्पष्ट specification और वास्तविक commitment को प्राथमिकता देते हैं.", "ग्राहक artwork और order जानकारी private working data रहती है, जब तक ग्राहक public use के लिए अलग से अनुमति न दे."] },
      ],
    },
    faq: {
      eyebrow: "ऑर्डर से पहले मदद",
      title: "अक्सर पूछे जाने वाले प्रश्न.",
      intro: "ये उत्तर वर्तमान website workflow समझाते हैं. Product-specific विवरण product, quotation या proof में कन्फर्म होते हैं.",
      sections: [
        { title: "Personalised order कैसे करें?", body: ["प्रोडक्ट चुनें, उपलब्ध personalisation विवरण जोड़ें और checkout submit करें. Quote-only, bulk, event या custom acrylic के लिए संबंधित request form का उपयोग करें."] },
        { title: "Production से पहले proof मिलेगा?", body: ["जहाँ digital proof आवश्यक है, लागू proof और order requirements कन्फर्म होने के बाद ही production शुरू होता है."] },
        { title: "All India delivery है?", body: ["Website All-India orders के लिए बनाई गई है. Pincode serviceability, courier, charge और expected delivery जहाँ आवश्यक हो payment से पहले कन्फर्म होते हैं."] },
        { title: "अलग-अलग नामों के साथ bulk order कर सकते हैं?", body: ["हाँ. जहाँ लागू हो bulk workflow quantities, notes और Excel/CSV जैसी structured files ले सकता है. Production से पहले data review होता है."] },
        { title: "Gujarati, Hindi, Marathi या English print हो सकता है?", body: ["Website language और print language अलग हैं. Supported print languages चुने गए product/template पर निर्भर हैं और production से पहले कन्फर्म होते हैं."] },
        { title: "Uploaded artwork का क्या होता है?", body: ["Customer files private order data के रूप में handle होती हैं. काम के लिए जरूरी जानकारी ही upload करें और अनावश्यक identity documents से बचें."] },
      ],
    },
    shipping: {
      eyebrow: "डिलीवरी जानकारी",
      title: "शिपिंग पॉलिसी.",
      intro: "Shipping availability, courier charge और timing destination, product और production readiness पर निर्भर हैं. जहाँ आवश्यक हो payment से पहले delivery विवरण कन्फर्म होते हैं.",
      sections: [
        { title: "Serviceability और charge", body: ["मान्य delivery address और pincode आवश्यक हैं. Courier serviceability और अंतिम shipping charge के लिए manual confirmation लग सकता है.", "Checkout request अपने-आप delivery guarantee नहीं है; order और shipping arrangement कन्फर्म होना आवश्यक है."] },
        { title: "Dispatch timing", body: ["Personalised product में आवश्यक order details और proof approval पूरा होने के बाद production होता है. इसलिए dispatch timing product, quantity और workload के अनुसार बदलता है.", "Final confirmation से पहले बताई गई तारीख estimate मानी जाए, जब तक order के लिए स्पष्ट रूप से confirmed न हो."] },
        { title: "Tracking", body: ["Courier tracking number या link उपलब्ध होने पर order record में जोड़ा जाता है.", "Dispatch के बाद courier movement carrier संभालता है; order follow-up में Yash Laser सहायता कर सकता है."] },
        { title: "Address change", body: ["पता सुधारना हो तो जितना जल्दी हो सके संपर्क करें. Packing, label creation या dispatch के बाद बदलाव संभव न भी हो."] },
      ],
    },
    terms: {
      eyebrow: "Website और order terms",
      title: "उपयोग और personalised order की शर्तें.",
      intro: "ये terms वर्तमान website workflow बताते हैं. Confirmed quotation, invoice, proof या written order confirmation में अतिरिक्त order-specific शर्तें हो सकती हैं.",
      sections: [
        { title: "Product information और pricing", body: ["हम product descriptions, options और prices सही रखने का प्रयास करते हैं. Quote-required work, unusual sizes, bulk jobs, shipping और special production जरूरतें payment से पहले कन्फर्म होती हैं.", "Submitted request अपने-आप acceptance, price, production capacity या delivery date की guarantee नहीं है."] },
        { title: "Customer content", body: ["नाम, तारीख, spelling, logo और अन्य content सही देने और submitted artwork उपयोग करने का अधिकार होने की जिम्मेदारी customer की है.", "ऐसी file/request जिसे safely, lawfully या उचित production standard में नहीं बनाया जा सकता, उसे decline किया जा सकता है."] },
        { title: "Proof approval", body: ["Proof मिलने पर visible text, नाम, layout और artwork ध्यान से जांचें. Approval उसी exact proof version पर लागू होता है.", "Newer version बनने पर revised proof पुराने actionable proof को supersede कर सकता है."] },
        { title: "Production और changes", body: ["आवश्यक commercial, artwork और approval conditions पूरी होने के बाद production शुरू होता है.", "Confirmation के बाद बदलाव price, timing या feasibility बदल सकते हैं और production शुरू होने के बाद संभव न भी हों."] },
        { title: "Website availability", body: ["Maintenance या update के दौरान website features बदल, सीमित या अस्थायी रूप से unavailable हो सकते हैं. Confirmed orders उनके recorded details के अनुसार चलते हैं."] },
      ],
    },
    replacement: {
      eyebrow: "Order issue support",
      title: "Replacement और damage policy.",
      intro: "Personalised products किसी खास customer के लिए बनते हैं, इसलिए reported issue को confirmed order, approved proof, production result और delivery condition के आधार पर review किया जाता है.",
      sections: [
        { title: "Product damaged पहुँचे तो", body: ["Order number के साथ product और packaging की स्पष्ट photos भेजकर Yash Laser से संपर्क करें ताकि issue review हो सके.", "जहाँ संभव हो review पूरा होने तक product और packaging संभालकर रखें."] },
        { title: "Production या specification issue", body: ["Supplied product confirmed order या approved production specification से materially अलग हो तो उचित corrective option review किया जाएगा.", "Verified issue के अनुसार correction, reprint, replacement या अन्य agreed resolution हो सकता है."] },
        { title: "Approved customer content", body: ["Approved proof से मेल खाने वाले नाम, spelling, तारीख, layout या artwork को production error से अलग माना जाता है. Approval से पहले proof ध्यान से देखें."] },
        { title: "Resolution कैसे तय होता है", body: ["Eligibility और उचित resolution evidence, order stage, approved proof, product condition और order-specific terms पर निर्भर है.", "सहायता के लिए Support page पर order reference और issue का स्पष्ट विवरण भेजें."] },
      ],
    },
  },
  mr: {
    about: {
      eyebrow: "Yash Laser · स्थापना 1997",
      title: "वैयक्तिक प्रॉडक्ट, व्यवहार्य प्रॉडक्शन दृष्टिकोनासह.",
      intro: "Yash Laser प्रांतिज, गुजरात येथे आहे आणि गिफ्ट, यश, ओळख, संस्था आणि इव्हेंटसाठी वैयक्तिक अॅक्रिलिक प्रॉडक्टवर लक्ष केंद्रित करते.",
      sections: [
        { title: "आम्ही काय बनवतो", body: ["सध्याच्या online range मध्ये फोटो स्टँडी, अवॉर्ड, मेडल, कीचेन, I-card, नेम प्लेट आणि custom acrylic यांसारखी वैयक्तिक अॅक्रिलिक प्रॉडक्ट आहेत.", "प्रॉडक्ट पर्याय, artwork गरज आणि अंतिम production तपशील manufacturingपूर्वी निश्चित केले जातात."] },
        { title: "आम्ही कसे काम करतो", body: ["प्रॉडक्ट निवड, customisation, proof review आणि order tracking व्यवस्थित ठेवतो, त्यामुळे नाव, तारीख, प्रमाण आणि artwork स्पष्टपणे record राहतात.", "Bulk, event आणि custom कामात feasibility, किंमत आणि delivery निश्चित झाल्यानंतर काम पुढे जाते."] },
        { title: "आमचा दृष्टिकोन", body: ["तपासणी न करता मोठी आश्वासने देण्यापेक्षा स्पष्ट specification आणि वास्तववादी commitmentला प्राधान्य देतो.", "ग्राहक artwork आणि order माहिती private working data म्हणून ठेवली जाते, जोपर्यंत ग्राहक public useसाठी स्वतंत्र परवानगी देत नाही."] },
      ],
    },
    faq: {
      eyebrow: "ऑर्डरपूर्वी मदत",
      title: "वारंवार विचारले जाणारे प्रश्न.",
      intro: "ही उत्तरे सध्याची website workflow समजावतात. Product-specific तपशील product, quotation किंवा proofमध्ये निश्चित होतात.",
      sections: [
        { title: "Personalised order कसा करायचा?", body: ["प्रॉडक्ट निवडा, उपलब्ध personalisation तपशील जोडा आणि checkout submit करा. Quote-only, bulk, event किंवा custom acrylicसाठी संबंधित request form वापरा."] },
        { title: "Productionपूर्वी proof मिळेल?", body: ["जिथे digital proof आवश्यक आहे तिथे लागू proof आणि order requirements निश्चित झाल्यानंतरच production सुरू होते."] },
        { title: "All India delivery आहे?", body: ["Website All-India ordersसाठी आहे. Pincode serviceability, courier, charge आणि expected delivery आवश्यकतेनुसार paymentपूर्वी निश्चित होतात."] },
        { title: "वेगवेगळ्या नावांसह bulk order करता येतो?", body: ["हो. लागू असल्यास bulk workflow quantities, notes आणि Excel/CSV सारख्या structured files घेऊ शकतो. Productionपूर्वी data review होतो."] },
        { title: "Gujarati, Hindi, Marathi किंवा English print होऊ शकते?", body: ["Website language आणि print language वेगळे आहेत. Supported print languages निवडलेल्या product/templateवर अवलंबून असून productionपूर्वी निश्चित होतात."] },
        { title: "Uploaded artworkचे काय होते?", body: ["Customer files private order data म्हणून handle केल्या जातात. कामासाठी आवश्यक माहितीच upload करा आणि अनावश्यक identity documents टाळा."] },
      ],
    },
    shipping: {
      eyebrow: "डिलिव्हरी माहिती",
      title: "शिपिंग पॉलिसी.",
      intro: "Shipping availability, courier charge आणि timing destination, product आणि production readinessवर अवलंबून आहेत. आवश्यक असल्यास paymentपूर्वी delivery तपशील निश्चित होतात.",
      sections: [
        { title: "Serviceability आणि charge", body: ["वैध delivery address आणि pincode आवश्यक आहेत. Courier serviceability आणि अंतिम shipping chargeसाठी manual confirmation लागू शकते.", "Checkout request म्हणजे आपोआप delivery guarantee नाही; order आणि shipping arrangement निश्चित असणे आवश्यक आहे."] },
        { title: "Dispatch timing", body: ["Personalised productसाठी आवश्यक order details आणि proof approval पूर्ण झाल्यावर production होते. त्यामुळे dispatch timing product, quantity आणि workloadनुसार बदलते.", "Final confirmationपूर्वी सांगितलेली तारीख estimate समजावी, जोपर्यंत orderसाठी स्पष्टपणे confirmed नसते."] },
        { title: "Tracking", body: ["Courier tracking number किंवा link उपलब्ध झाल्यावर order recordमध्ये जोडली जाते.", "Dispatchनंतर courier movement carrier हाताळतो; order follow-upमध्ये Yash Laser मदत करू शकते."] },
        { title: "Address change", body: ["पत्ता बदलायचा असल्यास शक्य तितक्या लवकर संपर्क करा. Packing, label creation किंवा dispatchनंतर बदल शक्य नसेल."] },
      ],
    },
    terms: {
      eyebrow: "Website आणि order terms",
      title: "वापर आणि personalised orderच्या अटी.",
      intro: "या terms सध्याची website workflow समजावतात. Confirmed quotation, invoice, proof किंवा written order confirmationमध्ये अतिरिक्त order-specific अटी असू शकतात.",
      sections: [
        { title: "Product information आणि pricing", body: ["Product descriptions, options आणि prices अचूक ठेवण्याचा प्रयत्न केला जातो. Quote-required work, unusual sizes, bulk jobs, shipping आणि special production गरजा paymentपूर्वी निश्चित होतात.", "Submitted requestमुळे आपोआप acceptance, price, production capacity किंवा delivery dateची guarantee होत नाही."] },
        { title: "Customer content", body: ["नाव, तारीख, spelling, logo आणि इतर content अचूक देणे आणि submitted artwork वापरण्याचा अधिकार असणे ही customerची जबाबदारी आहे.", "Safely, lawfully किंवा योग्य production standardमध्ये तयार न होणारी file/request decline केली जाऊ शकते."] },
        { title: "Proof approval", body: ["Proof मिळाल्यावर visible text, नाव, layout आणि artwork काळजीपूर्वक तपासा. Approval त्या exact proof versionवर लागू होते.", "Newer version तयार झाल्यावर revised proof जुना actionable proof supersede करू शकतो."] },
        { title: "Production आणि changes", body: ["आवश्यक commercial, artwork आणि approval conditions पूर्ण झाल्यावर production सुरू होते.", "Confirmationनंतरचे बदल price, timing किंवा feasibility बदलू शकतात आणि production सुरू झाल्यानंतर शक्य नसतील."] },
        { title: "Website availability", body: ["Maintenance किंवा updateदरम्यान website features बदलू, मर्यादित होऊ किंवा तात्पुरते unavailable राहू शकतात. Confirmed orders त्यांच्या recorded detailsनुसार चालतात."] },
      ],
    },
    replacement: {
      eyebrow: "Order issue support",
      title: "Replacement आणि damage policy.",
      intro: "Personalised products विशिष्ट customerसाठी बनतात, त्यामुळे reported issue confirmed order, approved proof, production result आणि delivery conditionच्या आधारावर review केला जातो.",
      sections: [
        { title: "Product damaged आल्यास", body: ["Order numberसोबत product आणि packagingचे स्पष्ट photos पाठवून Yash Laserशी संपर्क करा, म्हणजे issue review करता येईल.", "शक्य असल्यास review पूर्ण होईपर्यंत product आणि packaging जतन करा."] },
        { title: "Production किंवा specification issue", body: ["Supplied product confirmed order किंवा approved production specificationपेक्षा materially वेगळा असल्यास योग्य corrective option review केला जाईल.", "Verified issueनुसार correction, reprint, replacement किंवा दुसरा agreed resolution होऊ शकतो."] },
        { title: "Approved customer content", body: ["Approved proofशी जुळणारे नाव, spelling, तारीख, layout किंवा artwork production errorपेक्षा वेगळे मानले जाते. Approvalपूर्वी proof काळजीपूर्वक तपासा."] },
        { title: "Resolution कसा ठरतो", body: ["Eligibility आणि योग्य resolution evidence, order stage, approved proof, product condition आणि order-specific termsवर अवलंबून असतो.", "मदतीसाठी Support pageवर order reference आणि issueचा स्पष्ट तपशील द्या."] },
      ],
    },
  },
};
