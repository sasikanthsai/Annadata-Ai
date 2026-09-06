import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Leaf, Camera, CloudSun, Sprout, ShieldCheck, Sparkles, Languages, Star, Code2, Server, Brain, FlaskConical, Tractor, Bot, Lightbulb, Quote, Layout, Database, Cloud, Globe, Smartphone, Puzzle, TrendingUp, Terminal, Crown, Award, Target, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n, LANG_LABELS, type Lang } from "@/lib/i18n";
import hero from "@/assets/hero-farmer.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Annadata AI — Crop Disease Detection & Smart Farming" },
      { name: "description", content: "Snap a photo, get an instant AI diagnosis, treatment plan, and your village's weather. Built for farmers." },
      { property: "og:title", content: "Annadata AI — Smart Agriculture Assistant" },
      { property: "og:description", content: "Instant AI crop disease detection, hyperlocal weather, and treatment guidance." },
      { property: "og:image", content: hero },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { lang, setLang } = useI18n();
  const tr = LANDING[lang] ?? LANDING.en;
  const navigate = useNavigate();
  void navigate;
  // Note: intentionally no auto-redirect. The landing page should always be
  // reachable — even when a farmer is signed in — so they can read about the
  // app, switch language, or navigate manually via "Sign in" / "Get started".

  return (
    <div className="min-h-screen">


      {/* Nav */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 text-primary-foreground font-display text-lg sm:text-xl font-bold min-w-0">
            <Leaf className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" /> <span className="truncate">{tr.appName}</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1.5 rounded-md bg-primary-foreground/15 backdrop-blur px-2 py-1">
              <Languages className="h-4 w-4 text-primary-foreground shrink-0" />
              <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
                <SelectTrigger className="h-8 w-[92px] sm:w-[120px] border-0 bg-transparent text-primary-foreground focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                    <SelectItem key={l} value={l}>{LANG_LABELS[l]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Link to="/auth" className="hidden sm:inline-flex"><Button variant="ghost" className="text-primary-foreground hover:bg-white/10">{tr.signIn}</Button></Link>
            <Link to="/auth"><Button size="sm" className="sm:h-10 sm:px-4 sm:text-base">{tr.getStarted}</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[88vh] min-h-[600px] flex items-center overflow-hidden">
        <img
          src={hero}
          alt="Lush green farmland at golden hour"
          className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
          width={1920}
          height={1024}
        />
        {/* Left readability wash + bottom fade so text and buttons stay legible */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
        <div className="relative max-w-7xl mx-auto px-6 text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 backdrop-blur px-3 py-1 text-sm font-medium mb-5">
              <Sparkles className="h-3.5 w-3.5" /> {tr.tagline}
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight drop-shadow-sm">
              {tr.heroTitle}
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/90 max-w-xl">
              {tr.heroBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth"><Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold shadow-elegant">{tr.startFree}</Button></Link>
              <Link to="/auth"><Button size="lg" variant="outline" className="border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary font-semibold backdrop-blur">{tr.haveAccount}</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">{tr.featuresTitle}</h2>
            <p className="mt-3 text-muted-foreground text-lg">{tr.featuresSub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: tr.f1t, body: tr.f1b },
              { icon: Sprout, title: tr.f2t, body: tr.f2b },
              { icon: CloudSun, title: tr.f3t, body: tr.f3b },
              { icon: ShieldCheck, title: tr.f4t, body: tr.f4b },
              { icon: Sparkles, title: tr.f5t, body: tr.f5b },
              { icon: Leaf, title: tr.f6t, body: tr.f6b },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl p-6 bg-white border border-border/60 shadow-soft hover:shadow-elegant transition-smooth">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold text-neutral-900">{title}</h3>
                <p className="mt-2 text-neutral-700">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
{/* =========================================================
    FOUNDER — PREMIUM FOUNDER EXPERIENCE
    ========================================================= */}

<section className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.10_0.035_155)] via-[oklch(0.18_0.055_155)] to-[oklch(0.08_0.025_155)] py-16 md:py-24 lg:py-28">

  {/* =======================================================
      AMBIENT LIGHTING
      ======================================================= */}

  <div className="pointer-events-none absolute inset-0 overflow-hidden">

    <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary-glow/15 blur-[130px]" />

    <div className="absolute -bottom-40 -right-40 h-[34rem] w-[34rem] rounded-full bg-[oklch(0.82_0.17_80)]/15 blur-[130px]" />

    <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />

  </div>

  {/* =======================================================
      SUBTLE GOLD PARTICLES
      ======================================================= */}

  <div className="pointer-events-none absolute inset-0 overflow-hidden">

    {[...Array(14)].map((_, i) => (
      <span
        key={i}
        className="absolute h-1 w-1 rounded-full bg-[oklch(0.88_0.16_82)]/40 animate-float-soft"
        style={{
          left: `${(i * 67) % 100}%`,
          top: `${(i * 47) % 100}%`,
          animationDelay: `${(i % 6) * 0.4}s`,
          animationDuration: `${4 + (i % 4)}s`,
        }}
      />
    ))}

  </div>

  <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

    {/* =====================================================
        SECTION INTRO
        ===================================================== */}

    <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">

      <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.85_0.15_80)]/30 bg-[oklch(0.85_0.15_80)]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[oklch(0.95_0.13_85)] backdrop-blur-md">

        <Crown className="h-3.5 w-3.5 fill-current" />

        Founder & Visionary

      </div>

      <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">

        Building Technology
        <span className="block bg-gradient-to-r from-[oklch(0.92_0.16_82)] via-[oklch(0.78_0.18_75)] to-[oklch(0.95_0.14_85)] bg-clip-text text-transparent">
          For Those Who Feed Us
        </span>

      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
        Annadata AI was created with one simple belief — modern technology
        should reach the farmer, speak the farmer's language, and make
        farming a little easier every day.
      </p>

    </div>

    {/* =====================================================
        MAIN FOUNDER CARD
        ===================================================== */}

    <div className="relative overflow-hidden rounded-[2rem] border border-[oklch(0.85_0.15_80)]/20 bg-white/[0.045] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-7 md:p-10 lg:p-12">

      {/* Top golden accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[oklch(0.88_0.16_82)] to-transparent opacity-80" />

      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-[oklch(0.85_0.15_80)]/10 blur-[90px]" />

      <div className="relative grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">

        {/* =================================================
            FOUNDER PORTRAIT
            ================================================= */}

        <div className="flex justify-center">

          <div className="relative">

            {/* Outer golden glow */}
            <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-[oklch(0.86_0.16_82)]/50 via-primary-glow/30 to-[oklch(0.86_0.16_82)]/40 blur-[55px] animate-glow-soft" />

            {/* Secondary halo */}
            <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-br from-[oklch(0.88_0.16_82)] via-primary-glow to-[oklch(0.78_0.16_75)] opacity-80 blur-md" />

            {/* Portrait frame */}
            <div className="relative h-[430px] w-[320px] overflow-hidden rounded-[2rem] border border-[oklch(0.92_0.16_82)]/70 bg-[oklch(0.12_0.035_155)] p-1 shadow-[0_20px_70px_rgba(0,0,0,0.45)] sm:h-[500px] sm:w-[370px] md:h-[540px] md:w-[400px]">

              <img
                src="https://i.postimg.cc/yY5nff57/Chat-GPT-Image-Jul-2-2026-08-59-48-AM.png"
                alt="Sasi Kanth Sai — Founder, Creator & Lead Developer of Annadata AI"
                className="h-full w-full rounded-[1.75rem] object-cover object-top"
              />

              {/* Bottom photo gradient */}
              <div className="absolute inset-x-1 bottom-1 h-40 rounded-b-[1.75rem] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Founder photo label */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">

                <div className="flex items-center gap-2 rounded-full border border-[oklch(0.92_0.16_82)]/60 bg-gradient-to-r from-[oklch(0.86_0.16_80)] to-[oklch(0.72_0.16_145)] px-5 py-2 text-xs font-extrabold text-[oklch(0.15_0.04_155)] shadow-[0_8px_30px_rgba(0,0,0,0.35)]">

                  <Star className="h-3.5 w-3.5 fill-current" />

                  Founder & Visionary

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            FOUNDER STORY
            ================================================= */}

        <div className="min-w-0 text-center lg:text-left">

          {/* Small label */}

          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[oklch(0.88_0.15_82)]">

            <span className="h-px w-8 bg-[oklch(0.88_0.15_82)]" />

            Founder of Annadata AI

            <span className="h-px w-8 bg-[oklch(0.88_0.15_82)] lg:hidden" />

          </div>

          {/* Name */}

          <h3 className="mt-4 font-display text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">

            Sasi Kanth
            <span className="bg-gradient-to-r from-[oklch(0.92_0.16_82)] via-[oklch(0.78_0.18_75)] to-[oklch(0.96_0.14_85)] bg-clip-text text-transparent">
              {" "}Sai
            </span>

          </h3>

          <p className="mt-3 text-lg font-semibold text-[oklch(0.88_0.15_82)]">
            Founder, Creator & Lead Developer
          </p>

          {/* Main story */}

          <p className="mt-7 text-base leading-8 text-white/90 md:text-lg">
            Sasi Kanth Sai is the Founder and Creator of{" "}
            <strong className="text-white">Annadata AI</strong>, a platform
            built to bring the power of Artificial Intelligence closer to
            the people who need it most — our farmers.
          </p>

          <p className="mt-4 text-base leading-8 text-white/70 md:text-lg">
            His vision is to make advanced agricultural technology
            <span className="font-semibold text-[oklch(0.90_0.15_82)]">
              {" "}simple, accessible, multilingual, and farmer-first.
            </span>
          </p>

          {/* =================================================
              GOLDEN FARMER MESSAGE
              ================================================= */}

          <div className="relative mt-8 overflow-hidden rounded-2xl border border-[oklch(0.88_0.16_82)]/35 bg-gradient-to-br from-[oklch(0.88_0.16_82)]/15 via-white/[0.04] to-primary/10 p-6 shadow-[0_15px_50px_rgba(0,0,0,0.2)]">

            {/* Gold glow */}
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[oklch(0.88_0.16_82)]/20 blur-3xl" />

            <div className="relative">

              <div className="mb-3 flex items-center justify-center gap-2 lg:justify-start">

                <Tractor className="h-5 w-5 text-[oklch(0.90_0.16_82)]" />

                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[oklch(0.90_0.16_82)]">
                  A Vision For Every Farmer
                </span>

              </div>

              <p className="font-display text-xl font-bold leading-relaxed text-white sm:text-2xl md:text-3xl">

                <span className="text-[oklch(0.90_0.16_82)]">
                  “Every farmer deserves
                </span>

                <br />

                an agronomist in their pocket.”

              </p>

              <p className="mt-4 text-sm leading-6 text-white/60">
                Technology should not replace the farmer's knowledge.
                It should strengthen it.
              </p>

            </div>

          </div>

          {/* =================================================
              FOUNDER HIGHLIGHTS — REDUCED
              ================================================= */}

          <div className="mt-7">

            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
              Core Expertise
            </p>

            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">

              {[
                { icon: Code2, label: "Full Stack Development" },
                { icon: Brain, label: "Artificial Intelligence" },
                { icon: FlaskConical, label: "Machine Learning" },
                { icon: Database, label: "Database Architecture" },
                { icon: Cloud, label: "Cloud & Deployment" },
                { icon: Tractor, label: "AgriTech Innovation" },
              ].map(({ icon: Icon, label }) => (

                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-medium text-white/75 backdrop-blur-md transition-all duration-300 hover:border-[oklch(0.85_0.15_80)]/35 hover:bg-[oklch(0.85_0.15_80)]/10 hover:text-white"
                >

                  <Icon className="h-3.5 w-3.5 text-[oklch(0.88_0.15_82)]" />

                  {label}

                </span>

              ))}

            </div>

          </div>

          {/* =================================================
              FARMER-FIRST MISSION
              ================================================= */}

          <div className="mt-8 flex items-start justify-center gap-3 text-left lg:justify-start">

            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[oklch(0.85_0.15_80)]/15 text-[oklch(0.90_0.16_82)]">

              <Users className="h-4 w-4" />

            </div>

            <div>

              <p className="font-semibold text-white">
                Farmer First. Technology Second.
              </p>

              <p className="mt-1 max-w-xl text-sm leading-6 text-white/55">
                Every feature of Annadata AI is designed with one question:
                how can this technology create real value for a farmer?
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

    {/* =====================================================
        BOTTOM GOLDEN MISSION
        ===================================================== */}

    <div className="mx-auto mt-10 max-w-5xl text-center md:mt-14">

      <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.85_0.15_80)]/20 bg-[oklch(0.85_0.15_80)]/[0.06] px-6 py-7 backdrop-blur-xl md:px-10 md:py-9">

        <div className="absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-[oklch(0.88_0.16_82)] to-transparent" />

        <div className="flex justify-center">

          <span className="text-2xl">🌾</span>

        </div>

        <p className="mt-3 font-display text-xl font-bold leading-relaxed text-white md:text-2xl">

          Empowering the hands that feed the world

          <span className="block bg-gradient-to-r from-[oklch(0.92_0.16_82)] to-[oklch(0.78_0.18_75)] bg-clip-text text-transparent">
            with intelligence that works for every farmer.
          </span>

        </p>

      </div>

    </div>

  </div>

</section>


      {/* CTA */}
      <section className="py-20 bg-gradient-hero">
        <div className="max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="font-display text-4xl md:text-5xl font-bold">{tr.ctaTitle}</h2>
          <p className="mt-3 text-white/90 text-lg">{tr.ctaSub}</p>
          <Link to="/auth"><Button size="lg" className="mt-7 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold">{tr.ctaBtn}</Button></Link>
        </div>
      </section>

      <footer className="py-10 text-center border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {tr.appName} · {tr.footer}
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 px-4 py-2 border border-primary/25 shadow-glow animate-glow-soft">
            <Sparkles className="h-4 w-4 text-primary-glow fill-primary-glow animate-float-soft" />
            <span className="text-sm font-medium text-foreground">created by</span>
            <span className="font-display text-base font-bold animate-shimmer-soft">Sasi Kanth Sai</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const LANDING: Record<string, Record<string, string>> = {
  en: {
    appName: "Annadata AI", signIn: "Sign in", getStarted: "Get started",
    tagline: "AI for smallholder farmers",
    heroTitle: "Spot crop disease before it spreads.",
    heroBody: "Snap a leaf, get an instant AI diagnosis with treatment, fertilizer, and prevention advice — plus your village's weather. Free for farmers.",
    startFree: "Start free", haveAccount: "I have an account",
    featuresTitle: "Everything a modern farmer needs",
    featuresSub: "From diagnosis to dosage. From dew to drought.",
    f1t: "AI disease detection", f1b: "Upload a photo. Our vision model identifies the disease with confidence scores in seconds.",
    f2t: "Expert recommendations", f2b: "Get clear treatment, fertilizer, and prevention guidance — backed by an agronomy database.",
    f3t: "Hyperlocal weather", f3b: "Real-time temperature, humidity, rainfall, and wind for your village from OpenWeather.",
    f4t: "Private & secure", f4b: "Your photos and history are yours. Encrypted and only visible to you.",
    f5t: "Prediction history", f5b: "Every scan saved. Track outbreaks across your fields over time.",
    f6t: "Built for mobile", f6b: "Works beautifully on your phone — even on patchy rural connections.",
    ctaTitle: "Save your harvest. Start now.", ctaSub: "Create your free farmer account in 30 seconds.", ctaBtn: "Get started free",
    footer: "Built with care for farmers everywhere",
  },
  hi: {
    appName: "अन्नदाता", signIn: "साइन इन", getStarted: "शुरू करें",
    tagline: "छोटे किसानों के लिए एआई",
    heroTitle: "फैलने से पहले फसल रोग पहचानें।",
    heroBody: "एक पत्ती की तस्वीर खींचें, तुरंत एआई निदान, उपचार, उर्वरक और रोकथाम सलाह पाएं — साथ ही अपने गाँव का मौसम। किसानों के लिए मुफ्त।",
    startFree: "मुफ्त शुरू करें", haveAccount: "मेरा खाता है",
    featuresTitle: "आधुनिक किसान के लिए सब कुछ",
    featuresSub: "निदान से खुराक तक। ओस से सूखे तक।",
    f1t: "एआई रोग पहचान", f1b: "फ़ोटो अपलोड करें। हमारा विज़न मॉडल सेकंडों में रोग की पहचान करता है।",
    f2t: "विशेषज्ञ सिफारिशें", f2b: "स्पष्ट उपचार, उर्वरक और रोकथाम मार्गदर्शन — कृषि डेटाबेस द्वारा समर्थित।",
    f3t: "स्थानीय मौसम", f3b: "तापमान, आर्द्रता, वर्षा और हवा — OpenWeather से सीधे आपके गाँव के लिए।",
    f4t: "निजी और सुरक्षित", f4b: "आपकी तस्वीरें और इतिहास केवल आपके हैं। एन्क्रिप्टेड।",
    f5t: "पूर्वानुमान इतिहास", f5b: "हर स्कैन सहेजा जाता है। समय के साथ अपने खेतों पर नज़र रखें।",
    f6t: "मोबाइल के लिए बना", f6b: "धीमे इंटरनेट पर भी आपके फ़ोन पर बढ़िया काम करता है।",
    ctaTitle: "अपनी फसल बचाएं। अभी शुरू करें।", ctaSub: "30 सेकंड में मुफ्त किसान खाता बनाएं।", ctaBtn: "मुफ्त शुरू करें",
    footer: "किसानों के लिए प्यार से बनाया गया",
  },
  mr: {
    appName: "अन्नदाता", signIn: "साइन इन", getStarted: "सुरू करा",
    tagline: "लहान शेतकऱ्यांसाठी एआय",
    heroTitle: "पसरण्यापूर्वी पीक रोग ओळखा.",
    heroBody: "पानाचा फोटो काढा, तत्काळ एआय निदान, उपचार, खत व प्रतिबंध सल्ला मिळवा — आणि तुमच्या गावाचे हवामान. शेतकऱ्यांसाठी मोफत.",
    startFree: "मोफत सुरू करा", haveAccount: "माझे खाते आहे",
    featuresTitle: "आधुनिक शेतकऱ्याला हवे ते सर्व",
    featuresSub: "निदानापासून मात्रा पर्यंत. दवापासून दुष्काळापर्यंत.",
    f1t: "एआय रोग ओळख", f1b: "फोटो अपलोड करा. आमचे व्हिजन मॉडेल काही सेकंदात रोग ओळखते.",
    f2t: "तज्ञ शिफारसी", f2b: "स्पष्ट उपचार, खत आणि प्रतिबंध मार्गदर्शन — कृषी डेटाबेसद्वारे समर्थित.",
    f3t: "स्थानिक हवामान", f3b: "तापमान, आर्द्रता, पाऊस आणि वारा — OpenWeather वरून तुमच्या गावासाठी.",
    f4t: "खाजगी आणि सुरक्षित", f4b: "तुमचे फोटो आणि इतिहास फक्त तुमचेच. एन्क्रिप्टेड.",
    f5t: "अंदाज इतिहास", f5b: "प्रत्येक स्कॅन जतन. वेळोवेळी तुमच्या शेतांचा मागोवा घ्या.",
    f6t: "मोबाइलसाठी बनवले", f6b: "कमकुवत इंटरनेटवरही फोनवर छान चालते.",
    ctaTitle: "तुमचे पीक वाचवा. आता सुरू करा.", ctaSub: "30 सेकंदात मोफत शेतकरी खाते तयार करा.", ctaBtn: "मोफत सुरू करा",
    footer: "शेतकऱ्यांसाठी प्रेमाने बनवले",
  },
  ta: {
    appName: "அன்னதாதா", signIn: "உள்நுழைய", getStarted: "தொடங்கு",
    tagline: "சிறு விவசாயிகளுக்கான AI",
    heroTitle: "பரவும் முன் பயிர் நோயை கண்டறியுங்கள்.",
    heroBody: "ஒரு இலையை படமெடுங்கள், உடனடி AI நோயறிதல், சிகிச்சை, உரம் மற்றும் தடுப்பு ஆலோசனை — மேலும் உங்கள் கிராமத்தின் வானிலை. விவசாயிகளுக்கு இலவசம்.",
    startFree: "இலவசமாக தொடங்கு", haveAccount: "எனக்கு கணக்கு உள்ளது",
    featuresTitle: "நவீன விவசாயிக்குத் தேவையான எல்லாம்",
    featuresSub: "கண்டறிதல் முதல் அளவு வரை. பனிமலர் முதல் வறட்சி வரை.",
    f1t: "AI நோய் கண்டறிதல்", f1b: "புகைப்படத்தை பதிவேற்றவும். எங்கள் பார்வை மாதிரி வினாடிகளில் நோயை கண்டறியும்.",
    f2t: "நிபுணர் பரிந்துரைகள்", f2b: "தெளிவான சிகிச்சை, உரம் மற்றும் தடுப்பு வழிகாட்டுதல் — வேளாண் தரவுத்தளத்தால் ஆதரிக்கப்படுகிறது.",
    f3t: "உள்ளூர் வானிலை", f3b: "வெப்பநிலை, ஈரப்பதம், மழை மற்றும் காற்று — OpenWeather இலிருந்து உங்கள் கிராமத்திற்காக.",
    f4t: "தனியார் & பாதுகாப்பானது", f4b: "உங்கள் புகைப்படங்களும் வரலாறும் உங்களுக்கே சொந்தம். மறைகுறியாக்கப்பட்டது.",
    f5t: "முன்னறிவிப்பு வரலாறு", f5b: "ஒவ்வொரு ஸ்கேனும் சேமிக்கப்படும். காலப்போக்கில் உங்கள் வயல்களில் தொற்றுகளைக் கண்காணிக்கவும்.",
    f6t: "மொபைலுக்காக கட்டப்பட்டது", f6b: "மெதுவான இணையத்திலும் உங்கள் போன்றில் அழகாக வேலை செய்கிறது.",
    ctaTitle: "உங்கள் அறுவடையை காப்பாற்றுங்கள். இப்போது தொடங்குங்கள்.", ctaSub: "30 வினாடிகளில் இலவச விவசாயி கணக்கை உருவாக்கவும்.", ctaBtn: "இலவசமாக தொடங்கு",
    footer: "எல்லா இடங்களிலும் விவசாயிகளுக்காக அக்கறையுடன் உருவாக்கப்பட்டது",
  },
  te: {
    appName: "అన్నదాత", signIn: "సైన్ ఇన్", getStarted: "ప్రారంభించు",
    tagline: "చిన్న రైతుల కోసం AI",
    heroTitle: "ప్రసరించే ముందు పంట వ్యాధిని గుర్తించండి.",
    heroBody: "ఒక ఆకు ఫోటో తీయండి, తక్షణ AI నిర్ధారణ, చికిత్స, ఎరువు మరియు నివారణ సలహా — మరియు మీ గ్రామం వాతావరణం. రైతులకు ఉచితం.",
    startFree: "ఉచితంగా ప్రారంభించు", haveAccount: "నా ఖాతా ఉంది",
    featuresTitle: "ఆధునిక రైతుకు అవసరమైన ప్రతిదీ",
    featuresSub: "నిర్ధారణ నుండి మోతాదు వరకు. మంచు నుండి ఎండుబాధ వరకు.",
    f1t: "AI వ్యాధి గుర్తింపు", f1b: "ఫోటో అప్‌లోడ్ చేయండి. మా విజన్ మోడల్ క్షణాల్లో వ్యాధిని గుర్తిస్తుంది.",
    f2t: "నిపుణుల సిఫార్సులు", f2b: "స్పష్టమైన చికిత్స, ఎరువు మరియు నివారణ మార్గదర్శన — వ్యవసాయ డేటాబేస్ ద్వారా మద్దతు.",
    f3t: "అత్యంత స్థానిక వాతావరణం", f3b: "ఉష్ణోగ్రత, తేమ, వర్షం మరియు గాలి — OpenWeather నుండి మీ గ్రామం కోసం.",
    f4t: "అంతరంగిక & సురక్షితం", f4b: "మీ ఫోటోలు మరియు చరిత్ర మీకే సొంతం. ఎన్క్రిప్ట్ చేయబడింది.",
    f5t: "భవిష్యవాణి చరిత్ర", f5b: "ప్రతి స్కాన్ సేవ్ చేయబడుతుంది. కాలక్రమేణా మీ పొలాల్లో వ్యాధులను ట్రాక్ చేయండి.",
    f6t: "మొబైల్ కోసం రూపొందించబడింది", f6b: "మీ ఫోన్‌లో అందంగా పనిచేస్తుంది — నెమ్మదైన ఇంటర్నెట్‌లో కూడా.",
    ctaTitle: "మీ పంటను కాపాడుకోండి. ఇప్పుడే ప్రారంభించండి.", ctaSub: "30 సెకన్లలో ఉచిత రైతు ఖాతాను సృష్టించండి.", ctaBtn: "ఉచితంగా ప్రారంభించు",
    footer: "ప్రతిచోట రైతుల కోసం జాగ్రత్తగా నిర్మించబడింది",
  },
};

