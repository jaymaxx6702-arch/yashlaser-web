export const supportedLanguages = ["en", "gu", "hi", "mr"] as const;
export type UiLanguage = (typeof supportedLanguages)[number];

export type UiCopy = {
  home: string;
  collection: string;
  story: string;
  contact: string;
  trackOrder: string;
  cart: string;
  account: string;
  explore: string;
  madePersonal: string;
  allProducts: string;
  searchProducts: string;
  productType: string;
  allTypes: string;
  findProducts: string;
  productSingular: string;
  productPlural: string;
  page: string;
  of: string;
  noMatching: string;
  previous: string;
  next: string;
  sizesOptions: string;
  customisation: string;
  productInfo: string;
  personalise: string;
};

export const uiCopy: Record<UiLanguage, UiCopy> = {
  en: {
    home: "Home",
    collection: "Our collection",
    story: "Our story",
    contact: "Contact",
    trackOrder: "Track order",
    cart: "Cart",
    account: "Account",
    explore: "Explore products",
    madePersonal: "Made personal. Since 1997.",
    allProducts: "All products",
    searchProducts: "Search products",
    productType: "Product type",
    allTypes: "All types",
    findProducts: "Find products",
    productSingular: "product",
    productPlural: "products",
    page: "Page",
    of: "of",
    noMatching: "No matching products. Try another search or product type.",
    previous: "Previous",
    next: "Next",
    sizesOptions: "Sizes & options",
    customisation: "Customisation",
    productInfo: "Product information",
    personalise: "View & personalise",
  },
  gu: {
    home: "હોમ",
    collection: "અમારું કલેક્શન",
    story: "અમારી કહાની",
    contact: "સંપર્ક",
    trackOrder: "ઓર્ડર ટ્રેક કરો",
    cart: "કાર્ટ",
    account: "એકાઉન્ટ",
    explore: "પ્રોડક્ટ જુઓ",
    madePersonal: "વ્યક્તિગત બનાવેલું. 1997થી.",
    allProducts: "બધી પ્રોડક્ટ્સ",
    searchProducts: "પ્રોડક્ટ શોધો",
    productType: "પ્રોડક્ટ પ્રકાર",
    allTypes: "બધા પ્રકાર",
    findProducts: "પ્રોડક્ટ શોધો",
    productSingular: "પ્રોડક્ટ",
    productPlural: "પ્રોડક્ટ્સ",
    page: "પેજ",
    of: "માંથી",
    noMatching: "મેળ ખાતી પ્રોડક્ટ મળી નથી. બીજી શોધ અજમાવો.",
    previous: "પાછળ",
    next: "આગળ",
    sizesOptions: "સાઇઝ અને વિકલ્પો",
    customisation: "કસ્ટમાઇઝેશન",
    productInfo: "પ્રોડક્ટ માહિતી",
    personalise: "જુઓ અને કસ્ટમાઇઝ કરો",
  },
  hi: {
    home: "होम",
    collection: "हमारा कलेक्शन",
    story: "हमारी कहानी",
    contact: "संपर्क",
    trackOrder: "ऑर्डर ट्रैक करें",
    cart: "कार्ट",
    account: "अकाउंट",
    explore: "प्रोडक्ट देखें",
    madePersonal: "व्यक्तिगत रूप से बनाया गया। 1997 से।",
    allProducts: "सभी प्रोडक्ट",
    searchProducts: "प्रोडक्ट खोजें",
    productType: "प्रोडक्ट प्रकार",
    allTypes: "सभी प्रकार",
    findProducts: "प्रोडक्ट खोजें",
    productSingular: "प्रोडक्ट",
    productPlural: "प्रोडक्ट",
    page: "पेज",
    of: "में से",
    noMatching: "कोई मेल खाता प्रोडक्ट नहीं मिला। दूसरी खोज आज़माएँ।",
    previous: "पिछला",
    next: "अगला",
    sizesOptions: "साइज़ और विकल्प",
    customisation: "कस्टमाइज़ेशन",
    productInfo: "प्रोडक्ट जानकारी",
    personalise: "देखें और कस्टमाइज़ करें",
  },
  mr: {
    home: "होम",
    collection: "आमचे कलेक्शन",
    story: "आमची कथा",
    contact: "संपर्क",
    trackOrder: "ऑर्डर ट्रॅक करा",
    cart: "कार्ट",
    account: "अकाउंट",
    explore: "प्रॉडक्ट पहा",
    madePersonal: "वैयक्तिक बनवलेले. 1997 पासून.",
    allProducts: "सर्व प्रॉडक्ट",
    searchProducts: "प्रॉडक्ट शोधा",
    productType: "प्रॉडक्ट प्रकार",
    allTypes: "सर्व प्रकार",
    findProducts: "प्रॉडक्ट शोधा",
    productSingular: "प्रॉडक्ट",
    productPlural: "प्रॉडक्ट",
    page: "पेज",
    of: "पैकी",
    noMatching: "जुळणारे प्रॉडक्ट सापडले नाही. दुसरा शोध वापरा.",
    previous: "मागील",
    next: "पुढील",
    sizesOptions: "साइझ आणि पर्याय",
    customisation: "कस्टमायझेशन",
    productInfo: "प्रॉडक्ट माहिती",
    personalise: "पहा आणि कस्टमाइझ करा",
  },
};

export function isUiLanguage(value: string): value is UiLanguage {
  return (supportedLanguages as readonly string[]).includes(value);
}


export const categoryCopy: Record<
  UiLanguage,
  Record<string, { name: string; shortName: string; description: string }>
> = {
  en: {
    standees: { name: "Acrylic Photo Standee / 3D Cutout", shortName: "Photo Standees", description: "A favourite moment, given a place of its own." },
    awards: { name: "Trophies & Medals", shortName: "Trophies & Medals", description: "A meaningful way to recognise every achievement." },
    keychains: { name: "Keychains", shortName: "Keychains", description: "Little keepsakes with a personal connection." },
    "id-cards": { name: "I-Cards", shortName: "I-Cards", description: "A considered identity for your organisation." },
    "name-plates": { name: "Name Plates", shortName: "Name Plates", description: "Make your space unmistakably yours." },
    other: { name: "Other Customized Products", shortName: "More Personal Creations", description: "Pen holders, clocks, home temples and decorative keepsakes." },
  },
  gu: {
    standees: { name: "એક્રેલિક ફોટો સ્ટેન્ડી / 3D કટઆઉટ", shortName: "ફોટો સ્ટેન્ડી", description: "તમારી યાદગાર ક્ષણને સુંદર રીતે પ્રદર્શિત કરો." },
    awards: { name: "ટ્રોફી અને મેડલ", shortName: "ટ્રોફી અને મેડલ", description: "દરેક સિદ્ધિને સન્માન આપવા માટે વ્યક્તિગત પસંદગી." },
    keychains: { name: "કીચેન", shortName: "કીચેન", description: "નાની વસ્તુમાં વ્યક્તિગત યાદનો સ્પર્શ." },
    "id-cards": { name: "આઈ-કાર્ડ", shortName: "આઈ-કાર્ડ", description: "શાળા, સંસ્થા અને કંપની માટે વ્યવસ્થિત ઓળખ." },
    "name-plates": { name: "નેમ પ્લેટ", shortName: "નેમ પ્લેટ", description: "ઘર, ઓફિસ અથવા ડેસ્ક માટે વ્યક્તિગત ઓળખ." },
    other: { name: "અન્ય કસ્ટમ પ્રોડક્ટ્સ", shortName: "વધુ કસ્ટમ ક્રિએશન્સ", description: "પેન હોલ્ડર, ઘડિયાળ, મંદિર અને ડેકોરેટિવ પ્રોડક્ટ્સ." },
  },
  hi: {
    standees: { name: "ऐक्रेलिक फोटो स्टैंडी / 3D कटआउट", shortName: "फोटो स्टैंडी", description: "अपनी यादगार तस्वीर को खूबसूरती से प्रदर्शित करें।" },
    awards: { name: "ट्रॉफी और मेडल", shortName: "ट्रॉफी और मेडल", description: "हर उपलब्धि को सम्मान देने के लिए व्यक्तिगत विकल्प।" },
    keychains: { name: "कीचेन", shortName: "कीचेन", description: "छोटी चीज़ में आपकी व्यक्तिगत याद।" },
    "id-cards": { name: "आई-कार्ड", shortName: "आई-कार्ड", description: "स्कूल, संस्था और कंपनी के लिए व्यवस्थित पहचान।" },
    "name-plates": { name: "नेम प्लेट", shortName: "नेम प्लेट", description: "घर, ऑफिस या डेस्क के लिए व्यक्तिगत पहचान।" },
    other: { name: "अन्य कस्टम प्रोडक्ट", shortName: "और कस्टम क्रिएशन", description: "पेन होल्डर, घड़ी, मंदिर और सजावटी प्रोडक्ट।" },
  },
  mr: {
    standees: { name: "अॅक्रिलिक फोटो स्टँडी / 3D कटआउट", shortName: "फोटो स्टँडी", description: "तुमची खास आठवण सुंदरपणे प्रदर्शित करा." },
    awards: { name: "ट्रॉफी आणि मेडल", shortName: "ट्रॉफी आणि मेडल", description: "प्रत्येक यशाचा वैयक्तिक सन्मान." },
    keychains: { name: "कीचेन", shortName: "कीचेन", description: "लहान वस्तूमध्ये वैयक्तिक आठवणीचा स्पर्श." },
    "id-cards": { name: "आय-कार्ड", shortName: "आय-कार्ड", description: "शाळा, संस्था आणि कंपनीसाठी नीटनेटकी ओळख." },
    "name-plates": { name: "नेम प्लेट", shortName: "नेम प्लेट", description: "घर, ऑफिस किंवा डेस्कसाठी वैयक्तिक ओळख." },
    other: { name: "इतर कस्टम प्रॉडक्ट", shortName: "अधिक कस्टम क्रिएशन्स", description: "पेन होल्डर, घड्याळ, मंदिर आणि सजावटीची उत्पादने." },
  },
};

export const homeCopy: Record<
  UiLanguage,
  {
    eyebrow: string;
    title: string;
    description: string;
    explore: string;
    inspiration: string;
    sectionEyebrow: string;
    sectionTitle: string;
    sectionDescription: string;
    featuredEyebrow: string;
    featuredTitle: string;
    allProducts: string;
    bulkTitle: string;
    bulkDescription: string;
  }
> = {
  en: {
    eyebrow: "Thoughtfully personal. Since 1997.",
    title: "Personal products for memories, milestones and identity.",
    description: "Explore customised gifts, awards, standees, keychains, I-cards and name plates by Yash Laser.",
    explore: "Explore the collection",
    inspiration: "Browse categories",
    sectionEyebrow: "A little inspiration",
    sectionTitle: "Something personal. For every part of life.",
    sectionDescription: "Choose a category, personalise your product and approve a digital proof before production.",
    featuredEyebrow: "The showroom edit",
    featuredTitle: "Ideas worth making yours.",
    allProducts: "View all products",
    bulkTitle: "Bulk, event or custom requirement?",
    bulkDescription: "Send quantities, dates, files and notes in one organised request.",
  },
  gu: {
    eyebrow: "વિચારપૂર્વક વ્યક્તિગત. 1997થી.",
    title: "યાદો, સિદ્ધિઓ અને ઓળખ માટે વ્યક્તિગત પ્રોડક્ટ્સ.",
    description: "Yash Laserના કસ્ટમ ગિફ્ટ્સ, એવોર્ડ્સ, સ્ટેન્ડી, કીચેન, આઈ-કાર્ડ અને નેમ પ્લેટ જુઓ.",
    explore: "કલેક્શન જુઓ",
    inspiration: "કેટેગરી જુઓ",
    sectionEyebrow: "તમારા માટે વિચારો",
    sectionTitle: "જીવનની દરેક ખાસ ક્ષણ માટે કંઈક વ્યક્તિગત.",
    sectionDescription: "કેટેગરી પસંદ કરો, પ્રોડક્ટ કસ્ટમાઇઝ કરો અને ઉત્પાદન પહેલાં ડિજિટલ પ્રૂફ મંજૂર કરો.",
    featuredEyebrow: "પસંદગીની પ્રોડક્ટ્સ",
    featuredTitle: "તમારી બનાવવા જેવી પસંદગીઓ.",
    allProducts: "બધી પ્રોડક્ટ્સ જુઓ",
    bulkTitle: "બલ્ક, ઇવેન્ટ અથવા ખાસ કસ્ટમ કામ છે?",
    bulkDescription: "જથ્થો, તારીખ, ફાઇલ અને સૂચનાઓ એક જ વ્યવસ્થિત રિક્વેસ્ટમાં મોકલો.",
  },
  hi: {
    eyebrow: "सोच-समझकर व्यक्तिगत। 1997 से।",
    title: "यादों, उपलब्धियों और पहचान के लिए व्यक्तिगत प्रोडक्ट।",
    description: "Yash Laser के कस्टम गिफ्ट, अवॉर्ड, स्टैंडी, कीचेन, आई-कार्ड और नेम प्लेट देखें।",
    explore: "कलेक्शन देखें",
    inspiration: "कैटेगरी देखें",
    sectionEyebrow: "आपके लिए प्रेरणा",
    sectionTitle: "जीवन के हर खास हिस्से के लिए कुछ व्यक्तिगत।",
    sectionDescription: "कैटेगरी चुनें, प्रोडक्ट कस्टमाइज़ करें और उत्पादन से पहले डिजिटल प्रूफ मंज़ूर करें।",
    featuredEyebrow: "चुने हुए प्रोडक्ट",
    featuredTitle: "ऐसे विचार जिन्हें आप अपना बना सकते हैं।",
    allProducts: "सभी प्रोडक्ट देखें",
    bulkTitle: "बल्क, इवेंट या खास कस्टम आवश्यकता?",
    bulkDescription: "मात्रा, तारीख, फ़ाइल और नोट्स एक व्यवस्थित रिक्वेस्ट में भेजें।",
  },
  mr: {
    eyebrow: "विचारपूर्वक वैयक्तिक. 1997 पासून.",
    title: "आठवणी, यश आणि ओळख यांसाठी वैयक्तिक प्रॉडक्ट.",
    description: "Yash Laserचे कस्टम गिफ्ट, अवॉर्ड, स्टँडी, कीचेन, आय-कार्ड आणि नेम प्लेट पहा.",
    explore: "कलेक्शन पहा",
    inspiration: "कॅटेगरी पहा",
    sectionEyebrow: "तुमच्यासाठी प्रेरणा",
    sectionTitle: "जीवनातील प्रत्येक खास भागासाठी काहीतरी वैयक्तिक.",
    sectionDescription: "कॅटेगरी निवडा, प्रॉडक्ट कस्टमाइझ करा आणि उत्पादनापूर्वी डिजिटल प्रूफ मंजूर करा.",
    featuredEyebrow: "निवडक प्रॉडक्ट",
    featuredTitle: "तुमचे बनवण्यासारखे विचार.",
    allProducts: "सर्व प्रॉडक्ट पहा",
    bulkTitle: "बल्क, इव्हेंट किंवा खास कस्टम गरज?",
    bulkDescription: "प्रमाण, तारीख, फाइल आणि नोट्स एका व्यवस्थित रिक्वेस्टमध्ये पाठवा.",
  },
};
