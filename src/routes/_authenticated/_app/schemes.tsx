import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Landmark, ExternalLink, ShieldCheck, XCircle, CheckCircle2, FileText,
  Sparkles, Wheat, IndianRupee, ShieldAlert, Info, Tractor, Leaf, MapPin, Loader2,
} from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { translateStrings } from "@/lib/translate.functions";
import { VoiceInput } from "@/components/VoiceInput";

export const Route = createFileRoute("/_authenticated/_app/schemes")({
  component: SchemesPage,
});

/* ---------------- i18n strings for this page ---------------- */
const TR: Record<Lang, Record<string, string>> = {
  en: {
    header: "Government Benefits",
    title: "Schemes made simple for farmers",
    sub: "Check eligibility, learn benefits, and jump directly to official Government portals — Central and State — all in one place.",
    pmkAmount: "₹6,000 / year",
    pmkDesc: "PM-KISAN is a Government of India scheme that provides financial assistance of ₹6,000 per year to eligible farmer families in three installments of ₹2,000 each, paid directly to the beneficiary's bank account.",
    checkEligibility: "Check Eligibility",
    checkStatus: "Check PM-KISAN Status",
    disclaimer: "You'll be redirected to the official PM-KISAN portal (pmkisan.gov.in). Annadata AI does not store or access any personal PM-KISAN information.",
    eligTitle: "PM-KISAN Eligibility",
    eligSub: "Quick guide to who qualifies, benefits, and documents you need.",
    whoEligible: "Who is Eligible?",
    whoNot: "Who is Not Eligible?",
    benefits: "Benefits",
    docs: "Required Documents",
    stateSchemesTitle: "State-wise farmer schemes",
    stateSchemesSub: "Select your state to see the exclusive scheme available for farmers there.",
    selectState: "Select your state",
    eligibility: "Eligibility",
    visitPortal: "Visit Official Portal",
    noStateScheme: "No dedicated state scheme in our database yet — check the Central schemes above.",
    recoTitle: "Scheme Recommendation Engine",
    recoSub: "Answer 4 quick questions — get schemes matched to your farm.",
    state: "State", landSize: "Land size (acres)", crop: "Crop type", category: "Farmer category",
    selectCategory: "Select category",
    marginal: "Marginal (< 1 hectare)", small: "Small (1-2 hectares)", medium: "Medium (2-10 hectares)", large: "Large (> 10 hectares)", landless: "Landless / Tenant",
    recommend: "Recommend Schemes", recommended: "Recommended schemes for you",
    cropPh: "e.g. Paddy, Cotton, Tomato",
  },
  hi: {
    header: "सरकारी लाभ",
    title: "किसानों के लिए सरल योजनाएँ",
    sub: "पात्रता जाँचें, लाभ जानें और केंद्रीय व राज्य की आधिकारिक पोर्टल पर सीधे जाएँ — सब एक जगह।",
    pmkAmount: "₹6,000 / वर्ष",
    pmkDesc: "पीएम-किसान भारत सरकार की योजना है जो पात्र किसान परिवारों को ₹6,000 प्रति वर्ष तीन किश्तों में सीधे बैंक खाते में देती है।",
    checkEligibility: "पात्रता देखें",
    checkStatus: "पीएम-किसान स्थिति देखें",
    disclaimer: "आपको आधिकारिक पीएम-किसान पोर्टल (pmkisan.gov.in) पर भेजा जाएगा। अन्नदाता आपकी कोई निजी जानकारी संग्रहित नहीं करता।",
    eligTitle: "पीएम-किसान पात्रता",
    eligSub: "कौन पात्र है, लाभ और आवश्यक दस्तावेज़।",
    whoEligible: "कौन पात्र है?",
    whoNot: "कौन पात्र नहीं है?",
    benefits: "लाभ",
    docs: "आवश्यक दस्तावेज़",
    stateSchemesTitle: "राज्यवार किसान योजनाएँ",
    stateSchemesSub: "अपना राज्य चुनें और वहाँ की विशेष योजना देखें।",
    selectState: "अपना राज्य चुनें",
    eligibility: "पात्रता",
    visitPortal: "आधिकारिक पोर्टल पर जाएँ",
    noStateScheme: "अभी हमारे डेटाबेस में कोई राज्य योजना नहीं — ऊपर केंद्रीय योजनाएँ देखें।",
    recoTitle: "योजना सिफ़ारिश इंजन",
    recoSub: "4 सवालों के जवाब दें — अपने खेत के लिए योजनाएँ पाएँ।",
    state: "राज्य", landSize: "भूमि (एकड़)", crop: "फ़सल", category: "किसान श्रेणी",
    selectCategory: "श्रेणी चुनें",
    marginal: "सीमांत (< 1 हेक्टेयर)", small: "छोटा (1-2 हेक्टेयर)", medium: "मध्यम (2-10 हेक्टेयर)", large: "बड़ा (> 10 हेक्टेयर)", landless: "भूमिहीन / काश्तकार",
    recommend: "योजनाएँ सुझाएँ", recommended: "आपके लिए सुझाई गई योजनाएँ",
    cropPh: "जैसे धान, कपास, टमाटर",
  },
  mr: {
    header: "सरकारी लाभ",
    title: "शेतकऱ्यांसाठी सोप्या योजना",
    sub: "पात्रता तपासा, फायदे जाणून घ्या आणि अधिकृत केंद्र व राज्य पोर्टलवर थेट जा — सर्व एका ठिकाणी.",
    pmkAmount: "₹6,000 / वर्ष",
    pmkDesc: "पीएम-किसान ही केंद्र सरकारची योजना आहे जी पात्र शेतकरी कुटुंबांना दरवर्षी ₹6,000 तीन हप्त्यांत थेट बँक खात्यात देते.",
    checkEligibility: "पात्रता पहा",
    checkStatus: "पीएम-किसान स्थिती पहा",
    disclaimer: "तुम्हाला अधिकृत पीएम-किसान पोर्टलवर (pmkisan.gov.in) पाठवले जाईल. अन्नदाता कोणतीही वैयक्तिक माहिती साठवत नाही.",
    eligTitle: "पीएम-किसान पात्रता",
    eligSub: "पात्रता, फायदे आणि आवश्यक कागदपत्रे.",
    whoEligible: "कोण पात्र आहे?",
    whoNot: "कोण पात्र नाही?",
    benefits: "फायदे",
    docs: "आवश्यक कागदपत्रे",
    stateSchemesTitle: "राज्यनिहाय शेतकरी योजना",
    stateSchemesSub: "तुमचे राज्य निवडा आणि तिथली विशेष योजना पहा.",
    selectState: "तुमचे राज्य निवडा",
    eligibility: "पात्रता",
    visitPortal: "अधिकृत पोर्टलला भेट द्या",
    noStateScheme: "आमच्या डेटाबेसमध्ये अद्याप कोणतीही राज्य योजना नाही — वरील केंद्रीय योजना पहा.",
    recoTitle: "योजना शिफारस इंजिन",
    recoSub: "4 प्रश्नांची उत्तरे द्या — तुमच्या शेतासाठी योजना मिळवा.",
    state: "राज्य", landSize: "जमीन (एकर)", crop: "पीक", category: "शेतकरी वर्ग",
    selectCategory: "वर्ग निवडा",
    marginal: "सीमांत (< 1 हेक्टर)", small: "लहान (1-2 हेक्टर)", medium: "मध्यम (2-10 हेक्टर)", large: "मोठा (> 10 हेक्टर)", landless: "भूमिहीन / भाडेकरू",
    recommend: "योजना सुचवा", recommended: "तुमच्यासाठी सुचवलेल्या योजना",
    cropPh: "उदा. भात, कापूस, टोमॅटो",
  },
  ta: {
    header: "அரசு நலன்கள்",
    title: "விவசாயிகளுக்கான எளிய திட்டங்கள்",
    sub: "தகுதியை சரிபார்க்கவும், நன்மைகளை அறியவும், மைய மற்றும் மாநில அரசுப் போர்ட்டல்களுக்கு நேரடியாக செல்லவும்.",
    pmkAmount: "₹6,000 / வருடம்",
    pmkDesc: "பிஎம்-கிசான் என்பது தகுதியான விவசாயி குடும்பங்களுக்கு ஆண்டுக்கு ₹6,000-ஐ மூன்று தவணைகளில் நேரடியாக வழங்கும் மைய அரசு திட்டம்.",
    checkEligibility: "தகுதி பார்",
    checkStatus: "பிஎம்-கிசான் நிலை பார்",
    disclaimer: "நீங்கள் அதிகாரப்பூர்வ pmkisan.gov.in போர்ட்டலுக்கு அனுப்பப்படுவீர்கள். அன்னதாதா எந்த தனிப்பட்ட தகவலையும் சேமிக்காது.",
    eligTitle: "பிஎம்-கிசான் தகுதி",
    eligSub: "யார் தகுதியானவர், நன்மைகள் மற்றும் ஆவணங்கள்.",
    whoEligible: "யார் தகுதியானவர்?",
    whoNot: "யார் தகுதியற்றவர்?",
    benefits: "நன்மைகள்",
    docs: "தேவையான ஆவணங்கள்",
    stateSchemesTitle: "மாநில வாரியான விவசாய திட்டங்கள்",
    stateSchemesSub: "உங்கள் மாநிலத்தை தேர்ந்தெடுத்து சிறப்பு திட்டத்தை பாருங்கள்.",
    selectState: "மாநிலத்தை தேர்ந்தெடு",
    eligibility: "தகுதி",
    visitPortal: "அதிகாரப்பூர்வ போர்ட்டல்",
    noStateScheme: "இந்த மாநிலத்திற்கான திட்டம் இன்னும் இல்லை — மேலே உள்ள மைய திட்டங்களை பாருங்கள்.",
    recoTitle: "திட்ட பரிந்துரை இயந்திரம்",
    recoSub: "4 கேள்விகளுக்கு பதில் — உங்கள் பண்ணைக்கான திட்டங்களை பெறுங்கள்.",
    state: "மாநிலம்", landSize: "நிலம் (ஏக்கர்)", crop: "பயிர்", category: "விவசாயி வகை",
    selectCategory: "வகையை தேர்ந்தெடு",
    marginal: "சிறு (< 1 ஹெக்டேர்)", small: "சிறிய (1-2)", medium: "நடு (2-10)", large: "பெரிய (> 10)", landless: "நிலமற்ற / குத்தகை",
    recommend: "திட்டங்களை பரிந்துரை", recommended: "உங்களுக்கான பரிந்துரைகள்",
    cropPh: "எ.கா. நெல், பருத்தி, தக்காளி",
  },
  te: {
    header: "ప్రభుత్వ ప్రయోజనాలు",
    title: "రైతుల కోసం సులభమైన పథకాలు",
    sub: "అర్హతను తనిఖీ చేయండి, ప్రయోజనాలను తెలుసుకోండి మరియు కేంద్ర, రాష్ట్ర అధికారిక పోర్టళ్లకు నేరుగా వెళ్ళండి.",
    pmkAmount: "₹6,000 / సంవత్సరం",
    pmkDesc: "పీఎం-కిసాన్ అనేది అర్హులైన రైతు కుటుంబాలకు సంవత్సరానికి ₹6,000 మూడు వాయిదాలలో నేరుగా బ్యాంకు ఖాతాలో అందించే కేంద్ర ప్రభుత్వ పథకం.",
    checkEligibility: "అర్హత తనిఖీ",
    checkStatus: "పీఎం-కిసాన్ స్థితి",
    disclaimer: "మీరు అధికారిక pmkisan.gov.in పోర్టల్‌కి పంపబడతారు. అన్నదాత ఎలాంటి వ్యక్తిగత సమాచారాన్ని నిల్వ చేయదు.",
    eligTitle: "పీఎం-కిసాన్ అర్హత",
    eligSub: "ఎవరు అర్హులు, ప్రయోజనాలు మరియు అవసరమైన పత్రాలు.",
    whoEligible: "ఎవరు అర్హులు?",
    whoNot: "ఎవరు అర్హులు కారు?",
    benefits: "ప్రయోజనాలు",
    docs: "అవసరమైన పత్రాలు",
    stateSchemesTitle: "రాష్ట్రాల వారీగా రైతు పథకాలు",
    stateSchemesSub: "మీ రాష్ట్రాన్ని ఎంచుకుని ప్రత్యేక పథకాన్ని చూడండి.",
    selectState: "మీ రాష్ట్రాన్ని ఎంచుకోండి",
    eligibility: "అర్హత",
    visitPortal: "అధికారిక పోర్టల్‌కి వెళ్ళండి",
    noStateScheme: "ఈ రాష్ట్రానికి డేటాబేస్‌లో పథకం లేదు — పైన కేంద్ర పథకాలను చూడండి.",
    recoTitle: "పథక సిఫార్సు ఇంజిన్",
    recoSub: "4 ప్రశ్నలకు సమాధానం ఇవ్వండి — మీ వ్యవసాయానికి పథకాలు పొందండి.",
    state: "రాష్ట్రం", landSize: "భూమి (ఎకరాలు)", crop: "పంట", category: "రైతు వర్గం",
    selectCategory: "వర్గాన్ని ఎంచుకోండి",
    marginal: "అల్ప (< 1 హెక్టార్)", small: "చిన్న (1-2)", medium: "మధ్యస్థ (2-10)", large: "పెద్ద (> 10)", landless: "భూమి లేని / కౌలు",
    recommend: "పథకాలను సిఫార్సు చేయండి", recommended: "మీ కోసం సిఫార్సు చేసిన పథకాలు",
    cropPh: "ఉదా. వరి, పత్తి, టమోటా",
  },
};

/* ---------------- State-wise schemes ---------------- */
type StateScheme = {
  state: string;
  name: string;
  tagline: string;
  benefit: string;
  eligibility: string[];
  url: string;
};

const STATES = [
  "Andhra Pradesh","Telangana","Tamil Nadu","Karnataka","Kerala","Maharashtra",
  "Gujarat","Madhya Pradesh","Uttar Pradesh","Bihar","West Bengal","Punjab",
  "Haryana","Rajasthan","Odisha","Jharkhand","Chhattisgarh","Assam",
];

const STATE_LABELS: Record<Lang, Record<string, string>> = {
  en: Object.fromEntries(STATES.map((s) => [s, s])),
  hi: {
    "Andhra Pradesh":"आंध्र प्रदेश","Telangana":"तेलंगाना","Tamil Nadu":"तमिलनाडु","Karnataka":"कर्नाटक",
    "Kerala":"केरल","Maharashtra":"महाराष्ट्र","Gujarat":"गुजरात","Madhya Pradesh":"मध्य प्रदेश",
    "Uttar Pradesh":"उत्तर प्रदेश","Bihar":"बिहार","West Bengal":"पश्चिम बंगाल","Punjab":"पंजाब",
    "Haryana":"हरियाणा","Rajasthan":"राजस्थान","Odisha":"ओडिशा","Jharkhand":"झारखंड",
    "Chhattisgarh":"छत्तीसगढ़","Assam":"असम",
  },
  mr: {
    "Andhra Pradesh":"आंध्र प्रदेश","Telangana":"तेलंगणा","Tamil Nadu":"तमिळनाडू","Karnataka":"कर्नाटक",
    "Kerala":"केरळ","Maharashtra":"महाराष्ट्र","Gujarat":"गुजरात","Madhya Pradesh":"मध्य प्रदेश",
    "Uttar Pradesh":"उत्तर प्रदेश","Bihar":"बिहार","West Bengal":"पश्चिम बंगाल","Punjab":"पंजाब",
    "Haryana":"हरियाणा","Rajasthan":"राजस्थान","Odisha":"ओडिशा","Jharkhand":"झारखंड",
    "Chhattisgarh":"छत्तीसगड","Assam":"आसाम",
  },
  ta: {
    "Andhra Pradesh":"ஆந்திரப் பிரதேசம்","Telangana":"தெலங்காணா","Tamil Nadu":"தமிழ்நாடு","Karnataka":"கர்நாடகா",
    "Kerala":"கேரளா","Maharashtra":"மகாராஷ்டிரா","Gujarat":"குஜராத்","Madhya Pradesh":"மத்திய பிரதேசம்",
    "Uttar Pradesh":"உத்தரப் பிரதேசம்","Bihar":"பீகார்","West Bengal":"மேற்கு வங்காளம்","Punjab":"பஞ்சாப்",
    "Haryana":"ஹரியானா","Rajasthan":"ராஜஸ்தான்","Odisha":"ஒடிசா","Jharkhand":"ஜார்கண்ட்",
    "Chhattisgarh":"சத்தீஸ்கர்","Assam":"அசாம்",
  },
  te: {
    "Andhra Pradesh":"ఆంధ్రప్రదేశ్","Telangana":"తెలంగాణ","Tamil Nadu":"తమిళనాడు","Karnataka":"కర్ణాటక",
    "Kerala":"కేరళ","Maharashtra":"మహారాష్ట్ర","Gujarat":"గుజరాత్","Madhya Pradesh":"మధ్యప్రదేశ్",
    "Uttar Pradesh":"ఉత్తరప్రదేశ్","Bihar":"బీహార్","West Bengal":"పశ్చిమ బెంగాల్","Punjab":"పంజాబ్",
    "Haryana":"హరియాణా","Rajasthan":"రాజస్థాన్","Odisha":"ఒడిశా","Jharkhand":"జార్ఖండ్",
    "Chhattisgarh":"ఛత్తీస్‌గఢ్","Assam":"అస్సాం",
  },
};

const STATE_SCHEMES: Record<string, StateScheme> = {
  "Andhra Pradesh": {
    state: "Andhra Pradesh",
    name: "Annadata Sukhibhava",
    tagline: "AP State Government · Farmer welfare scheme",
    benefit: "₹20,000/year to eligible farmer families (₹6,000 PM-KISAN + ₹14,000 State top-up)",
    eligibility: [
      "Resident farmer families of Andhra Pradesh",
      "Landholding farmers including tenant farmers (as per AP guidelines)",
      "Must be enrolled in PM-KISAN",
      "Aadhaar linked with bank account",
    ],
    url: "https://annadathasukhibhava.ap.gov.in/",
  },
  "Telangana": {
    state: "Telangana",
    name: "Rythu Bharosa",
    tagline: "Telangana State Government · Investment support",
    benefit: "₹12,000/acre/year (₹6,000 per crop season) directly to farmer's account",
    eligibility: [
      "Landowning farmer of Telangana with valid Pattadar Passbook",
      "Aadhaar seeded bank account",
      "Both Kharif and Rabi seasons covered",
    ],
    url: "https://rythubharosa.telangana.gov.in/",
  },
  "Tamil Nadu": {
    state: "Tamil Nadu",
    name: "Kalaignar Kaaval Thittam (Crop Insurance) + CM Farmers Scheme",
    tagline: "Tamil Nadu Government",
    benefit: "Crop loss compensation + input subsidy for small & marginal farmers",
    eligibility: [
      "Resident farmer of Tamil Nadu",
      "Small or marginal landholding",
      "Registered with Agriculture Dept",
    ],
    url: "https://www.tn.gov.in/scheme/data_view/9143",
  },
  "Karnataka": {
    state: "Karnataka",
    name: "Raitha Siri / Krishi Bhagya",
    tagline: "Karnataka State Government",
    benefit: "₹10,000/hectare for millet growers · Farm pond & irrigation subsidy",
    eligibility: [
      "Karnataka resident farmer",
      "Growing eligible crops (millets, dryland farming)",
      "Land records (RTC/Pahani) in farmer's name",
    ],
    url: "https://raitamitra.karnataka.gov.in/",
  },
  "Kerala": {
    state: "Kerala",
    name: "Kerala Karshaka Kshema Nidhi (Farmer Welfare Pension)",
    tagline: "Government of Kerala",
    benefit: "Monthly pension of ₹1,600 for eligible farmers above 60",
    eligibility: [
      "Kerala resident farmer aged 60+",
      "Registered with Karshaka Kshema Nidhi Board",
      "Annual income within prescribed limit",
    ],
    url: "https://fwb.kerala.gov.in/",
  },
  "Maharashtra": {
    state: "Maharashtra",
    name: "Namo Shetkari Mahasanman Nidhi",
    tagline: "Government of Maharashtra",
    benefit: "₹6,000/year State top-up on PM-KISAN (total ₹12,000/year)",
    eligibility: [
      "PM-KISAN beneficiary in Maharashtra",
      "Aadhaar seeded bank account",
      "Land records in farmer's name",
    ],
    url: "https://nsmny.mahait.org/",
  },
  "Gujarat": {
    state: "Gujarat",
    name: "Mukhyamantri Kisan Sahay Yojana",
    tagline: "Government of Gujarat",
    benefit: "Up to ₹25,000/hectare for crop loss due to natural calamities",
    eligibility: [
      "All landholding farmers of Gujarat",
      "Crop loss between 33%-60% (₹20k/ha) or above 60% (₹25k/ha)",
      "Land records (7/12 utara)",
    ],
    url: "https://ikhedut.gujarat.gov.in/",
  },
  "Madhya Pradesh": {
    state: "Madhya Pradesh",
    name: "Mukhya Mantri Kisan Kalyan Yojana",
    tagline: "Government of Madhya Pradesh",
    benefit: "₹6,000/year State top-up on PM-KISAN (total ₹12,000/year)",
    eligibility: [
      "MP resident and PM-KISAN beneficiary",
      "Land records in Bhu-Abhilekh",
      "Aadhaar seeded bank account",
    ],
    url: "https://saara.mp.gov.in/",
  },
  "Uttar Pradesh": {
    state: "Uttar Pradesh",
    name: "UP Kisan Kalyan Mission",
    tagline: "Government of Uttar Pradesh",
    benefit: "Free crop insurance premium subsidy + input assistance",
    eligibility: [
      "UP resident farmer",
      "Small/marginal landholder preferred",
      "Registered on UP Agriculture portal",
    ],
    url: "https://upagripardarshi.gov.in/",
  },
  "Bihar": {
    state: "Bihar",
    name: "Bihar Kisan Samman Yojana / Diesel Subsidy",
    tagline: "Government of Bihar",
    benefit: "Diesel subsidy for irrigation + input assistance for paddy/wheat",
    eligibility: [
      "Bihar resident farmer",
      "Registered on DBT Agriculture Bihar portal",
      "Aadhaar linked account",
    ],
    url: "https://dbtagriculture.bihar.gov.in/",
  },
  "West Bengal": {
    state: "West Bengal",
    name: "Krishak Bandhu",
    tagline: "Government of West Bengal",
    benefit: "₹10,000/year (₹5,000 per season) + ₹2 lakh life insurance",
    eligibility: [
      "Farmer of West Bengal aged 18-60",
      "Landholder or Bargadar (sharecropper)",
      "Voter ID / Aadhaar of West Bengal",
    ],
    url: "https://krishakbandhu.net/",
  },
  "Punjab": {
    state: "Punjab",
    name: "Punjab Kisan Karza Rahat Yojana",
    tagline: "Government of Punjab",
    benefit: "Debt waiver up to ₹2 lakh for marginal & small farmers",
    eligibility: [
      "Punjab resident farmer",
      "Marginal (< 2.5 acres) or small (2.5-5 acres) landholder",
      "Outstanding institutional crop loan",
    ],
    url: "https://agri.punjab.gov.in/",
  },
  "Haryana": {
    state: "Haryana",
    name: "Bhavantar Bharpayee Yojana",
    tagline: "Government of Haryana",
    benefit: "Price difference compensation for horticulture crops (Tomato, Onion, Potato etc.)",
    eligibility: [
      "Haryana resident farmer",
      "Registered on Meri Fasal Mera Byora portal",
      "Growing notified horticulture crops",
    ],
    url: "https://fasal.haryana.gov.in/",
  },
  "Rajasthan": {
    state: "Rajasthan",
    name: "Mukhyamantri Kisan Mitra Urja Yojana",
    tagline: "Government of Rajasthan",
    benefit: "Up to ₹12,000/year electricity bill subsidy for agricultural connections",
    eligibility: [
      "Rajasthan farmer with metered agricultural connection",
      "Bill within prescribed limits",
      "Regular payment of dues",
    ],
    url: "https://energy.rajasthan.gov.in/",
  },
  "Odisha": {
    state: "Odisha",
    name: "KALIA (Krushak Assistance for Livelihood & Income Augmentation)",
    tagline: "Government of Odisha",
    benefit: "₹10,000/year for small & marginal farmers + ₹12,500 for landless agri-labour",
    eligibility: [
      "Odisha resident farmer",
      "Small/marginal landholder OR landless agri-labour",
      "Not an income taxpayer / government employee",
    ],
    url: "https://kalia.odisha.gov.in/",
  },
  "Jharkhand": {
    state: "Jharkhand",
    name: "Mukhyamantri Krishi Ashirwad Yojana",
    tagline: "Government of Jharkhand",
    benefit: "₹5,000/acre/year (up to 5 acres) to small & marginal farmers",
    eligibility: [
      "Jharkhand resident farmer",
      "Small/marginal landholder (≤ 5 acres)",
      "Land records in farmer's name",
    ],
    url: "https://jharkhand.gov.in/",
  },
  "Chhattisgarh": {
    state: "Chhattisgarh",
    name: "Rajiv Gandhi Kisan Nyay Yojana",
    tagline: "Government of Chhattisgarh",
    benefit: "Input subsidy of ₹9,000/acre/year for paddy & notified crops",
    eligibility: [
      "Chhattisgarh resident farmer",
      "Selling paddy at MSP through cooperative societies",
      "Land records in farmer's name",
    ],
    url: "https://rgkny.cg.nic.in/",
  },
  "Assam": {
    state: "Assam",
    name: "Chief Minister's Samagra Gramya Unnayan Yojana",
    tagline: "Government of Assam",
    benefit: "Integrated support: input subsidy, farm mechanisation & livestock",
    eligibility: [
      "Assam resident farmer",
      "Registered with Agriculture / Animal Husbandry Dept",
      "Aadhaar linked account",
    ],
    url: "https://agri-horti.assam.gov.in/",
  },
};

/* ---------------- Central schemes for recommender ---------------- */
type Scheme = {
  id: string;
  name: string;
  tagline: string;
  benefit: string;
  url: string;
  icon: typeof Landmark;
  color: string;
  why: (i: RecoInput) => string;
};

type RecoInput = { state: string; landSize: string; crop: string; category: string };

const ALL_SCHEMES: Scheme[] = [
  { id: "pmkisan", name: "PM-KISAN", tagline: "Pradhan Mantri Kisan Samman Nidhi", benefit: "₹6,000/year in 3 installments", url: "https://pmkisan.gov.in/", icon: IndianRupee, color: "from-emerald-500 to-green-600", why: () => "Direct income support for eligible landholding farmer families." },
  { id: "pmfby", name: "PMFBY Crop Insurance", tagline: "Pradhan Mantri Fasal Bima Yojana", benefit: "Insurance cover against crop loss", url: "https://pmfby.gov.in/", icon: ShieldAlert, color: "from-sky-500 to-blue-600", why: (i) => `Protects your ${i.crop || "crop"} against weather, pests and disease losses.` },
  { id: "shc", name: "Soil Health Card", tagline: "Government of India", benefit: "Free soil testing & nutrient advice", url: "https://soilhealth.dac.gov.in/", icon: Leaf, color: "from-lime-500 to-emerald-600", why: () => "Know your soil's nutrients to reduce fertilizer cost and boost yield." },
  { id: "kcc", name: "Kisan Credit Card", tagline: "Short-term crop loans at low interest", benefit: "Up to ₹3 lakh at 4% (with subvention)", url: "https://www.myscheme.gov.in/schemes/kcc", icon: Landmark, color: "from-amber-500 to-orange-600", why: () => "Affordable credit for seeds, fertilizer, labour and equipment." },
  { id: "pmksy", name: "PMKSY (Micro Irrigation)", tagline: "Pradhan Mantri Krishi Sinchayee Yojana", benefit: "Subsidy on drip / sprinkler systems", url: "https://pmksy.gov.in/", icon: Tractor, color: "from-cyan-500 to-teal-600", why: () => "Save water and get higher yield with subsidised micro-irrigation." },
];

/* ---------------- Page ---------------- */
function SchemesPage() {
  const { lang } = useI18n();
  const t = TR[lang] ?? TR.en;

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Landmark className="h-4 w-4" /> {t.header}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground max-w-2xl">{t.sub}</p>
      </div>

      <PmKisanCard t={t} />
      <StateSchemesCard t={t} />
      <SchemeRecommender t={t} />
    </div>
  );
}

/* ---------------- PM-KISAN ---------------- */
function PmKisanCard({ t }: { t: Record<string, string> }) {
  return (
    <Card className="overflow-hidden border-primary/20 shadow-elegant">
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500" />
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white grid place-items-center shadow-soft">
              <IndianRupee className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-2xl">PM-KISAN</CardTitle>
              <CardDescription className="mt-1">
                Pradhan Mantri Kisan Samman Nidhi · Government of India
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-0">
            {t.pmkAmount}
          </Badge>
        </div>
        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">{t.pmkDesc}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <EligibilityDialog t={t} />
          <Button
            asChild size="lg"
            className="w-full h-auto py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-soft"
          >
            <a href="https://pmkisan.gov.in/beneficiarystatus_new.aspx" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span className="font-semibold">{t.checkStatus}</span>
              <ExternalLink className="h-4 w-4 shrink-0 opacity-90" />
            </a>
          </Button>
        </div>
        <div className="flex gap-2 rounded-xl border bg-muted/40 p-3 text-xs sm:text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <p>{t.disclaimer}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EligibilityDialog({ t }: { t: Record<string, string> }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="w-full h-auto py-4 border-2 border-primary/30 hover:bg-primary/5">
          <FileText className="h-5 w-5 mr-2 shrink-0" />
          <span className="font-semibold">{t.checkEligibility}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-emerald-600" /> {t.eligTitle}
          </DialogTitle>
          <DialogDescription>{t.eligSub}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <Section title={t.whoEligible} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} tone="ok"
            items={["Farmer families owning cultivable land.","Aadhaar-linked beneficiaries.","Farmers with valid bank account details.","Farmers who have completed eKYC."]} />
          <Section title={t.whoNot} icon={<XCircle className="h-5 w-5 text-red-600" />} tone="bad"
            items={["Income taxpayers.","Institutional landholders.","Government employees (as per PM-KISAN rules).","Certain professional categories as defined by the scheme."]} />
          <Section title={t.benefits} icon={<Sparkles className="h-5 w-5 text-amber-500" />} tone="info"
            items={["₹6,000 per year.","Paid in three installments of ₹2,000 each.","Direct Benefit Transfer (DBT) to the beneficiary's bank account."]} />
          <Section title={t.docs} icon={<FileText className="h-5 w-5 text-primary" />} tone="info"
            items={["Aadhaar Card","Bank Account Details","Mobile Number","Land Ownership Records (if applicable)"]} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, icon, items, tone }: { title: string; icon: React.ReactNode; items: string[]; tone: "ok" | "bad" | "info"; }) {
  const bg = tone === "ok" ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/40"
    : tone === "bad" ? "bg-red-50/60 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/40" : "bg-muted/40";
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-2 font-semibold">{icon}{title}</div>
      <ul className="space-y-1.5 text-sm text-foreground/85">
        {items.map((it) => (
          <li key={it} className="flex gap-2"><span className="text-primary mt-1">•</span><span>{it}</span></li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- State-wise Schemes ---------------- */
function StateSchemesCard({ t }: { t: Record<string, string> }) {
  const { lang } = useI18n();
  const [state, setState] = useState<string>("");
  const scheme = useMemo(() => (state ? STATE_SCHEMES[state] : undefined), [state]);
  const translated = useTranslatedScheme(scheme, lang);
  const stateLabel = (s: string) => STATE_LABELS[lang]?.[s] ?? s;

  return (
    <Card className="overflow-hidden border-primary/20 shadow-elegant">
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white grid place-items-center shadow-soft">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-2xl">{t.stateSchemesTitle}</CardTitle>
            <CardDescription className="mt-1">{t.stateSchemesSub}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="max-w-sm">
          <Label>{t.state}</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder={t.selectState} /></SelectTrigger>
            <SelectContent>
              {STATES.map((s) => <SelectItem key={s} value={s}>{stateLabel(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {state && !scheme && (
          <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">{t.noStateScheme}</div>
        )}

        {scheme && translated && (
          <div className="rounded-2xl border bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-transparent dark:from-orange-950/20 dark:via-amber-950/10 p-5 animate-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-orange-700 dark:text-orange-300 font-semibold">{stateLabel(scheme.state)}</div>
                <h3 className="mt-1 text-xl sm:text-2xl font-bold text-foreground">{translated.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{translated.tagline}</p>
              </div>
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-0">
                <Sparkles className="h-3 w-3 mr-1" /> {t.official ?? "Official"}
              </Badge>
            </div>

            <div className="mt-4 rounded-xl border bg-background/70 p-4">
              <div className="flex items-center gap-2 font-semibold mb-1"><IndianRupee className="h-4 w-4 text-emerald-600" /> {t.benefits}</div>
              <p className="text-sm text-foreground/85">{translated.benefit}</p>
            </div>

            <div className="mt-3 rounded-xl border bg-background/70 p-4">
              <div className="flex items-center gap-2 font-semibold mb-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {t.eligibility}</div>
              <ul className="space-y-1.5 text-sm text-foreground/85">
                {translated.eligibility.map((e, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary mt-1">•</span><span>{e}</span></li>
                ))}
              </ul>
            </div>

            <Button asChild size="lg" className="mt-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white">
              <a href={scheme.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> {t.visitPortal} <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        {scheme && !translated && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
            <Loader2 className="h-4 w-4 animate-spin" /> {t.translating ?? "Translating…"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Translation hook ---------------- */
const TRANSLATION_CACHE = new Map<string, { name: string; tagline: string; benefit: string; eligibility: string[] }>();

function useTranslatedScheme(scheme: StateScheme | undefined, lang: Lang) {
  const translateFn = useServerFn(translateStrings);
  const [data, setData] = useState<{ name: string; tagline: string; benefit: string; eligibility: string[] } | null>(null);

  useEffect(() => {
    if (!scheme) { setData(null); return; }
    if (lang === "en") {
      setData({ name: scheme.name, tagline: scheme.tagline, benefit: scheme.benefit, eligibility: scheme.eligibility });
      return;
    }
    const cacheKey = `${scheme.state}|${lang}`;
    const cached = TRANSLATION_CACHE.get(cacheKey);
    if (cached) { setData(cached); return; }

    setData(null);
    let cancelled = false;
    const strings = [scheme.name, scheme.tagline, scheme.benefit, ...scheme.eligibility];
    translateFn({ data: { strings, targetLang: lang } })
      .then((res) => {
        if (cancelled) return;
        const [name, tagline, benefit, ...eligibility] = res.translations;
        const result = { name, tagline, benefit, eligibility };
        TRANSLATION_CACHE.set(cacheKey, result);
        setData(result);
      })
      .catch(() => {
        if (cancelled) return;
        setData({ name: scheme.name, tagline: scheme.tagline, benefit: scheme.benefit, eligibility: scheme.eligibility });
      });
    return () => { cancelled = true; };
  }, [scheme, lang, translateFn]);

  return data;
}

/* ---------------- Recommender ---------------- */
function SchemeRecommender({ t }: { t: Record<string, string> }) {
  const { lang } = useI18n();
  const [input, setInput] = useState<RecoInput>({ state: "", landSize: "", crop: "", category: "" });
  const [results, setResults] = useState<Scheme[] | null>(null);
  const stateLabel = (s: string) => STATE_LABELS[lang]?.[s] ?? s;

  // Match spoken state name (in any supported language) to canonical English state key
  function matchState(spoken: string): string | null {
    const norm = spoken.trim().toLowerCase();
    if (!norm) return null;
    for (const s of STATES) {
      if (s.toLowerCase() === norm) return s;
      for (const l of Object.keys(STATE_LABELS) as Lang[]) {
        if ((STATE_LABELS[l]?.[s] ?? "").toLowerCase() === norm) return s;
      }
    }
    // partial contains
    for (const s of STATES) {
      if (s.toLowerCase().includes(norm) || norm.includes(s.toLowerCase())) return s;
    }
    return null;
  }

  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    marginal: ["marginal", "सीमांत", "सीमांत", "சிறு", "అల్ప"],
    small: ["small", "छोटा", "लहान", "சிறிய", "చిన్న"],
    medium: ["medium", "मध्यम", "மத்திய", "நடு", "మధ్యస్థ"],
    large: ["large", "बड़ा", "मोठा", "பெரிய", "పెద్ద"],
    landless: ["landless", "tenant", "भूमिहीन", "நிலமற்ற", "కౌలు", "భూమి లేని"],
  };
  function matchCategory(spoken: string): string | null {
    const n = spoken.trim().toLowerCase();
    for (const [k, arr] of Object.entries(CATEGORY_KEYWORDS)) {
      if (arr.some((w) => n.includes(w.toLowerCase()))) return k;
    }
    return null;
  }

  function recommend() {
    const size = parseFloat(input.landSize || "0");
    const recs = ALL_SCHEMES.filter((s) => {
      if (s.id === "pmkisan") return input.category !== "landless" && size > 0;
      if (s.id === "kcc") return input.category !== "landless";
      if (s.id === "pmksy") return size >= 0.5;
      return true;
    });
    setResults(recs);
  }

  return (
    <Card className="overflow-hidden border-primary/20 shadow-elegant">
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center shadow-soft">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">{t.recoTitle}</CardTitle>
            <CardDescription className="mt-1">{t.recoSub}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>{t.state}</Label>
              <VoiceInput
                onTranscript={(text) => {
                  const m = matchState(text);
                  if (m) setInput((p) => ({ ...p, state: m }));
                }}
                size="sm"
                title={t.state}
              />
            </div>
            <Select value={input.state} onValueChange={(v) => setInput({ ...input, state: v })}>
              <SelectTrigger><SelectValue placeholder={t.selectState} /></SelectTrigger>
              <SelectContent>
                {STATES.map((s) => <SelectItem key={s} value={s}>{stateLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>{t.landSize}</Label>
              <VoiceInput
                onTranscript={(text) => {
                  const num = text.replace(/[^\d.]/g, "");
                  if (num) setInput((p) => ({ ...p, landSize: num }));
                }}
                size="sm"
                title={t.landSize}
              />
            </div>
            <Input type="number" min="0" step="0.1" placeholder="e.g. 2.5" value={input.landSize} onChange={(e) => setInput({ ...input, landSize: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>{t.crop}</Label>
              <VoiceInput
                onTranscript={(text) => setInput((p) => ({ ...p, crop: text.trim() }))}
                size="sm"
                title={t.crop}
              />
            </div>
            <Input placeholder={t.cropPh} value={input.crop} onChange={(e) => setInput({ ...input, crop: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>{t.category}</Label>
              <VoiceInput
                onTranscript={(text) => {
                  const m = matchCategory(text);
                  if (m) setInput((p) => ({ ...p, category: m }));
                }}
                size="sm"
                title={t.category}
              />
            </div>
            <Select value={input.category} onValueChange={(v) => setInput({ ...input, category: v })}>
              <SelectTrigger><SelectValue placeholder={t.selectCategory} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="marginal">{t.marginal}</SelectItem>
                <SelectItem value="small">{t.small}</SelectItem>
                <SelectItem value="medium">{t.medium}</SelectItem>
                <SelectItem value="large">{t.large}</SelectItem>
                <SelectItem value="landless">{t.landless}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={recommend} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
          <Sparkles className="h-4 w-4 mr-2" /> {t.recommend}
        </Button>

        {results && (
          <div className="space-y-3 pt-2 animate-fade-in">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Wheat className="h-4 w-4 text-primary" /> {t.recommended}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((s) => (
                <TranslatedSchemeCard key={s.id} scheme={s} input={input} lang={lang} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Translated Recommender Card ---------------- */
const RECO_CACHE = new Map<string, { name: string; tagline: string; benefit: string; why: string }>();

function TranslatedSchemeCard({ scheme, input, lang }: { scheme: Scheme; input: RecoInput; lang: Lang }) {
  const translateFn = useServerFn(translateStrings);
  const why = scheme.why(input);
  const [tr, setTr] = useState<{ name: string; tagline: string; benefit: string; why: string }>({
    name: scheme.name, tagline: scheme.tagline, benefit: scheme.benefit, why,
  });

  useEffect(() => {
    if (lang === "en") {
      setTr({ name: scheme.name, tagline: scheme.tagline, benefit: scheme.benefit, why });
      return;
    }
    const key = `${scheme.id}|${lang}|${why}`;
    const cached = RECO_CACHE.get(key);
    if (cached) { setTr(cached); return; }
    let cancelled = false;
    translateFn({ data: { strings: [scheme.name, scheme.tagline, scheme.benefit, why], targetLang: lang } })
      .then((res) => {
        if (cancelled) return;
        const [name, tagline, benefit, whyT] = res.translations;
        const out = { name, tagline, benefit, why: whyT };
        RECO_CACHE.set(key, out);
        setTr(out);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [scheme, lang, why, translateFn]);

  const Icon = scheme.icon;
  return (
    <a href={scheme.url} target="_blank" rel="noopener noreferrer"
      className="group rounded-2xl border bg-card p-4 hover:shadow-elegant transition-smooth">
      <div className="flex items-start gap-3">
        <div className={`h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br ${scheme.color} text-white grid place-items-center`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate">{tr.name}</h3>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground truncate">{tr.tagline}</p>
          <p className="mt-2 text-sm font-medium text-primary">{tr.benefit}</p>
          <p className="mt-1 text-xs text-foreground/70">{tr.why}</p>
        </div>
      </div>
    </a>
  );
}

