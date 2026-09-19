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
