import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../shared/ui/button";
import { Card, CardContent } from "../shared/ui/card";
import { FadeInUp } from "../components/PageTransitions";
import { Smartphone, Sparkles, BarChart3, Shield, Cpu, ArrowRightCircle, Download, Palette, Zap, Layers, ChevronRight, Globe, Share2, Heart, ChevronLeft, ShoppingCart } from "lucide-react";
import usePWAInstall from "../hooks/usePWAInstall";
import AnimatedNumber from "../components/AnimatedNumber";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../shared/ui/accordion";
import { ThemeToggle } from "../components/ThemeToggle";
import { toast } from "sonner";

// Mocha Medley palette
// #332820 (coffee-dk), #5A4D40 (coffee), #98867B (taupe), #D0C6BD (sand), #EFEDEA (off-white)
const colors = {
  coffeeDark: "#332820",
  coffee: "#5A4D40",
  taupe: "#98867B",
  sand: "#D0C6BD",
  offwhite: "#EFEDEA"
};

// Product Card Component with Image Carousel
const ProductCard = ({ title, description, originalPrice, salePrice, images, shopUrl }) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        {/* Image Carousel */}
        <div className="relative aspect-square bg-muted/50 overflow-hidden group">
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${title} - Image ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
              onError={(e) => {
                // Fallback to placeholder if image doesn't exist
                e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3E${encodeURIComponent(title)}%3C/text%3E%3C/svg%3E`;
              }}
            />
          ))}
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image Indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
          
          {/* Pricing */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold text-foreground">{salePrice}</span>
            {originalPrice && (
              <span className="text-lg text-muted-foreground line-through">{originalPrice}</span>
            )}
          </div>

          {/* Shop Now Button */}
          <Button 
            className="w-full" 
            onClick={() => window.open(shopUrl, '_blank')}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Shop Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Landing = () => {
  const { isInstallable, isInstalled, promptInstall, browser, getInstallInstructions } = usePWAInstall();
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  
  React.useEffect(() => {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem('pwaInstallDismissed');
    
    // Don't show if not mobile or previously dismissed
    if (!isMobile || dismissed === 'true') return;
    
    // Show prompt after 3 seconds for better UX
    const timer = setTimeout(() => {
      // Show prompt even if isInstallable hasn't been set yet (for iOS)
      // The browser might not fire beforeinstallprompt on iOS Safari
      setShowInstallPrompt(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled]);

  // Open native share sheet for iOS
  const openIOSShareSheet = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OdinRing',
          text: 'Check out OdinRing',
          url: window.location.href
        });
      } catch (err) {
        // User cancelled or share failed, that's okay
      }
    }
  };
  const featureTiles = [
    { Icon: Smartphone, title: 'Mobile‑first Experience', desc: 'Seamless gestures, crisp typography, and smooth transitions designed for small screens.' },
    { Icon: Palette, title: 'Premium Themes', desc: 'Curated palettes and typography with live previews and instant apply.' },
    { Icon: BarChart3, title: 'Insightful Analytics', desc: 'Understand your audience with views, clicks, and link performance.' },
    { Icon: Zap, title: 'NFC‑native Actions', desc: 'Direct‑mode redirects and ring‑aware events built into the platform.' },
    { Icon: Shield, title: 'Security & Privacy', desc: 'Protected endpoints, token‑based auth, and safe defaults across the stack.' },
    { Icon: Cpu, title: 'PWA & Performance', desc: 'Installable app experience with optimized loads and responsive interactions.' },
  ];
  const gradients = [
    `linear-gradient(135deg, ${colors.offwhite} 0%, ${colors.sand} 100%)`,
    `linear-gradient(135deg, ${colors.sand} 0%, ${colors.taupe} 100%)`,
    `linear-gradient(135deg, ${colors.offwhite} 0%, ${colors.taupe} 100%)`
  ];
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 md:py-6 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink">
              <img 
                src="/OdinRingLogo.png" 
                alt="OdinRing Logo" 
                className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 object-contain flex-shrink-0"
              />
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground truncate">OdinRing</h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
              <ThemeToggle />
              <Link to="/auth">
                <Button variant="outline" size="sm" className="border text-xs sm:text-sm px-2 sm:px-3 md:px-4 h-8 sm:h-9">
                  Sign In
                </Button>
              </Link>
              {!isInstalled && (
                <Button 
                  onClick={async () => {
                    try {
                      const result = await promptInstall();
                      // If iOS, directly open share sheet
                      if (result?.outcome === 'ios_instruction_required') {
                        await openIOSShareSheet();
                      }
                  } catch (error) {
                  }
                  }}
                  size="sm"
                  className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm px-2 sm:px-3 md:px-4 h-8 sm:h-9"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap hidden sm:inline">Download<span className="hidden md:inline"> App</span></span>
                  <span className="whitespace-nowrap sm:hidden">App</span>
                </Button>
              )}
              {isInstalled && (
                <Link to="/auth">
                  <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 h-8 sm:h-9">
                    <span className="whitespace-nowrap hidden sm:inline">Get<span className="hidden md:inline"> Started</span></span>
                    <span className="whitespace-nowrap sm:hidden">Start</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 text-foreground leading-tight">
            Your Digital Identity<br />
            <span className="text-muted-foreground">In One Tap</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto text-muted-foreground px-2">
            Transform your NFC ring into a powerful personal brand. Share your links, 
            showcase your content, and connect with others instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                Start Building Your Profile
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
              View Demo Profile
            </Button>
          </div>

          {/* PWA Install CTA */}
          {!isInstalled && (
            <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-2 sm:gap-3 px-2">
              <Button 
                onClick={async () => {
                  try {
                    const result = await promptInstall();
                    // If iOS, directly open share sheet
                    if (result?.outcome === 'ios_instruction_required') {
                      await openIOSShareSheet();
                    }
                  } catch (error) {
                  }
                }}
                variant="secondary" 
                className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base w-full sm:w-auto"
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Install OdinRing App</span>
              </Button>
              <Link to="/install" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline text-center">
                Or visit install page
              </Link>
            </div>
          )}
        </div>
      </section>

      

      {/* Sections */}
      {/* Stats - lightweight, natural numbers */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-2 text-foreground">Launch with confidence</h2>
          <p className="mb-8 text-muted-foreground">Early stats from our first cohort. We're improving every week.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: 1.4, suffix: 's', decimals: 1, label: 'Average profile load' },
              { value: 96.8, suffix: '%', decimals: 1, label: 'Successful taps (7 days)' },
              { value: 412, suffix: '', decimals: 0, label: 'Profiles live' },
              { value: 1980, suffix: '', decimals: 0, label: 'Links created' },
            ].map((s) => (
              <div key={s.label} className="w-full">
                <div className="relative rounded-2xl border border-border shadow-sm h-full text-left bg-card">
                  <div className="absolute inset-0 pointer-events-none opacity-[0.15] dark:opacity-5" style={{ backgroundImage: 'linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px)', backgroundSize: '18px 18px', backgroundPosition: 'center' }} />
                  <div className="relative p-6">
                    <div className="text-4xl font-bold mb-1 text-foreground">
                      <AnimatedNumber value={s.value} decimals={s.decimals} suffix={s.suffix} />
                    </div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1. Features (Editorial grid) */}
      <section className="py-14 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need to Shine</h2>
            <p className="mt-2 max-w-3xl mx-auto text-muted-foreground">A refined toolkit to launch, manage, and grow your digital identity with precision.</p>
          </div>

          {/* Four simple feature boxes using flex */}
          <div className="flex flex-nowrap gap-4 overflow-x-auto">
            {[
              { Icon: Smartphone, title: 'Mobile‑first Experience', desc: 'Secure interactions with smooth gestures and adaptive layouts.' },
              { Icon: Palette, title: 'Premium Themes', desc: 'Curated palettes, branding, and instant apply.' },
              { Icon: BarChart3, title: 'Insightful Analytics', desc: 'Views, clicks, and performance trends at a glance.' },
              { Icon: Cpu, title: 'PWA & Performance', desc: 'Installable, fast, and resilient experiences across devices.' },
            ].map((f) => (
              <div key={f.title} className="flex-1 basis-1/4 min-w-[16rem]">
                <div className="rounded-2xl border border-border shadow-sm h-full bg-card">
                  <div className="p-6">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-muted">
                      <f.Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1 text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. How it works */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Gradient band container to match reference */}
          <div className="rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 sm:px-10 pt-8 pb-20 text-center bg-gradient-to-b from-primary to-primary/80 text-primary-foreground">
              <h2 className="text-3xl font-bold">How it works</h2>
              <p className="mt-2 opacity-90">Set up in minutes. Customize deeply. Share everywhere.</p>
            </div>
            {/* Cards strip */}
            <div className="-mt-16 px-4 sm:px-6 lg:px-8 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Step 1 */}
                <Card className="relative border-0 shadow-md">
                  <CardContent className="pt-10 pb-6 px-5 text-center bg-card rounded-xl border border-border">
                    <div className="absolute left-1/2 -top-5 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow bg-primary text-primary-foreground">
                      <span className="text-sm font-semibold">1</span>
                    </div>
                    <div className="mx-auto mb-3 w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                      <Smartphone className="w-5 h-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1 text-foreground">Tap</h3>
                    <p className="text-sm text-muted-foreground">Activate your ring and connect your profile.</p>
                  </CardContent>
                </Card>
                {/* Step 2 */}
                <Card className="relative border-0 shadow-md">
                  <CardContent className="pt-10 pb-6 px-5 text-center bg-card rounded-xl border border-border">
                    <div className="absolute left-1/2 -top-5 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow bg-primary text-primary-foreground">
                      <span className="text-sm font-semibold">2</span>
                    </div>
                    <div className="mx-auto mb-3 w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                      <Palette className="w-5 h-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1 text-foreground">Customize</h3>
                    <p className="text-sm text-muted-foreground">Pick a theme, arrange links, and add branding.</p>
                  </CardContent>
                </Card>
                {/* Step 3 */}
                <Card className="relative border-0 shadow-md">
                  <CardContent className="pt-10 pb-6 px-5 text-center bg-card rounded-xl border border-border">
                    <div className="absolute left-1/2 -top-5 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow bg-primary text-primary-foreground">
                      <span className="text-sm font-semibold">3</span>
                    </div>
                    <div className="mx-auto mb-3 w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                      <Share2 className="w-5 h-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1 text-foreground">Share</h3>
                    <p className="text-sm text-muted-foreground">Share your profile or direct links anywhere.</p>
                  </CardContent>
                </Card>
                {/* Step 4 */}
                <Card className="relative border-0 shadow-md">
                  <CardContent className="pt-10 pb-6 px-5 text-center bg-card rounded-xl border border-border">
                    <div className="absolute left-1/2 -top-5 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow bg-primary text-primary-foreground">
                      <span className="text-sm font-semibold">4</span>
                    </div>
                    <div className="mx-auto mb-3 w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                      <BarChart3 className="w-5 h-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1 text-foreground">Analyze</h3>
                    <p className="text-sm text-muted-foreground">Learn from views, clicks, and top‑performing links.</p>
              </CardContent>
            </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Social Proof (logos + microcopy right after How it works) */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Trusted by early creators and teams</h2>
            <p className="mt-2 text-muted-foreground">Brands experimenting with modern, mobile‑first identity.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10" />

          {/* Clean testimonial cards */}
          <div className="mt-8 grid gap-4 md:gap-6 md:grid-cols-3">
            {[
              { quote: "A polished mobile profile in minutes. Simple and fast.", name: "Ava C.", role: "Creator" },
              { quote: "We use direct mode at booths—one tap, perfect hand‑off.", name: "Nikhil S.", role: "Founder" },
              { quote: "Lightweight analytics that tell us what matters weekly.", name: "Sara M.", role: "Designer" },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-border shadow-sm bg-card p-5">
                <p className="text-sm leading-relaxed mb-3 text-muted-foreground">
                  "{t.quote}"
                </p>
                <div className="text-sm font-semibold text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases - directly after Trust section */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground px-2">Built for real‑world moments</h2>
            <p className="mt-2 max-w-3xl mx-auto text-muted-foreground px-4 text-sm sm:text-base">Refined, real‑world workflows for creators, founders, and teams.</p>
          </div>

          {/* Premium mobile identity badge near heading */}
          <div className="flex justify-center mb-6 sm:mb-8 px-4">
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-card rounded-xl sm:rounded-2xl shadow-lg px-3 sm:px-4 py-2.5 sm:py-3 border border-border max-w-full">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-foreground flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-foreground leading-tight">Premium mobile identity</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight mt-0.5">Share in one tap—beautiful everywhere.</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center">
            {/* Image placeholder */}
            <div className="w-full max-w-[100%] sm:max-w-[90%] mx-auto aspect-[3/2] rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg bg-muted/20 p-2 sm:p-4">
              <img src="/image1.png" alt="OdinRing Preview" className="w-full h-full object-contain rounded-xl sm:rounded-2xl" />
            </div>

            {/* Steps (no timeline line) */}
            <div className="px-4 sm:px-0">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-6 text-foreground">
                Understand and apply the <span className="text-muted-foreground">tap‑to‑share flow.</span>
              </h3>

              <div className="space-y-6">
                {[
                  { num: '01', title: 'Setup & strategy', desc: 'Connect your ring, define your goal, and choose key destinations.' },
                  { num: '02', title: 'Design & customize', desc: 'Apply a premium theme, add branding, and arrange links with intent.' },
                  { num: '03', title: 'Launch & measure', desc: 'Share anywhere. Track views, taps, and top‑performing content.' },
                ].map((s) => (
                  <div key={s.num} className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center shadow">
                        {s.num}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{s.title}</div>
                      <p className="text-sm mt-1 text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Shop Our Products</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Premium NFC products to elevate your digital identity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Product 1: Odin Ring */}
            <ProductCard
              title="Odin Ring"
              description="Premium NFC ring for instant digital identity sharing. Sleek design meets cutting-edge technology."
              originalPrice="€66"
              salePrice="€46"
              images={[
                "/products/odin-ring-1.jpg",
                "/products/odin-ring-2.jpg",
                "/products/odin-ring-3.jpg"
              ]}
              shopUrl="https://buy.stripe.com/test_fZu4gz7f42oZfBY8mybo404"
            />

            {/* Product 2: Smart Business Card */}
            <ProductCard
              title="Smart Business Card"
              description="NFC-enabled business card that connects instantly. Share your profile with a simple tap."
              originalPrice="€34"
              salePrice="€28"
              images={[
                "/products/business-card-1.jpg",
                "/products/business-card-2.jpg",
                "/products/business-card-3.jpg"
              ]}
              shopUrl="https://buy.stripe.com/test_fZuaEX8j8e7HahE46ibo400"
            />

            {/* Product 3: Wearable NFC Band */}
            <ProductCard
              title="Wearable NFC Band"
              description="Comfortable NFC wristband for events and networking. Water-resistant and durable design."
              originalPrice="€21"
              salePrice="€17"
              images={[
                "/products/nfc-band-1.jpg",
                "/products/nfc-band-2.jpg",
                "/products/nfc-band-3.jpg"
              ]}
              shopUrl="https://buy.stripe.com/test_7sY6oHarggfPdtQ0U6bo403"
            />
          </div>
        </div>
      </section>

      {/* PWA Install Popup (mobile) */}
      {showInstallPrompt && !isInstalled && (() => {
        if (!browser) return null;
        
        const isStandalone = browser.isStandalone;
        const instructions = getInstallInstructions();
        
        if (isStandalone) return null;
        
        const canUsePrompt = isInstallable && (browser.isChrome || browser.isEdge || browser.isAndroid);
        
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setShowInstallPrompt(false); localStorage.setItem('pwaInstallDismissed', 'true'); }} />
            <div className="relative w-full sm:max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-6 h-6 text-foreground" />
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Install OdinRing</div>
                    <div className="text-sm mt-1 text-muted-foreground">
                      {instructions 
                        ? instructions.description 
                        : 'Get a fast, app‑like experience with offline support.'}
                    </div>
                  </div>
                </div>
                {canUsePrompt && (
                  <div className="mt-4 flex gap-3">
                    <Button onClick={async () => { 
                      try {
                        const result = await promptInstall();
                        // If iOS, directly open share sheet
                        if (result?.outcome === 'ios_instruction_required') {
                          setShowInstallPrompt(false);
                          await openIOSShareSheet();
                          return;
                        }
                      } catch (error) {
                      }
                      setShowInstallPrompt(false); 
                      localStorage.setItem('pwaInstallDismissed', 'true'); 
                    }} className="flex-1">Install</Button>
                    <Button variant="outline" onClick={() => { setShowInstallPrompt(false); localStorage.setItem('pwaInstallDismissed', 'true'); }} className="flex-1">Maybe later</Button>
                  </div>
                )}
                {!canUsePrompt && browser?.isIOS && (
                  <div className="mt-4">
                    <Button onClick={async () => { 
                      setShowInstallPrompt(false); 
                      await openIOSShareSheet();
                    }} className="w-full">Install</Button>
                  </div>
                )}
                {!canUsePrompt && !browser?.isIOS && (
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => { setShowInstallPrompt(false); localStorage.setItem('pwaInstallDismissed', 'true'); }} className="w-full">Got it</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Proof/Benefits bars section (after Use Cases) */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Left headline */}
          <div>
            <h3 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
              We craft advanced
              <br />
              <span className="text-muted-foreground">NFC ring experiences.</span>
            </h3>
            <p className="mt-6 text-lg text-muted-foreground">
              Tap‑to‑share identity with direct mode, premium themes, and analytics—
              built for events, networking, and on‑brand hand‑offs that feel instant.
            </p>
          </div>

          {/* Right progress bars */}
          <div>
            {[
              { label: 'Tap success (7 days)', value: 97 },
              { label: 'Profiles loading < 2s', value: 91 },
              { label: 'Repeat engagements (30 days)', value: 88 },
            ].map((m) => (
              <div key={m.label} className="mb-8 last:mb-0">
                <div className="mb-2 font-medium text-foreground">{m.label}</div>
                <div className="relative">
                  {/* Track */}
                  <div className="h-2 rounded-full bg-muted" />
                  {/* Fill */}
                  <div
                    className="absolute inset-y-0 left-0 h-2 rounded-full bg-primary"
                    style={{ width: `${m.value}%` }}
                  />
                  {/* Percent badge */}
                  <div
                    className="absolute -top-7 px-2 py-1 rounded-md text-xs font-semibold text-primary-foreground shadow bg-primary"
                    style={{ left: `calc(${m.value}% - 18px)` }}
                  >
                    {m.value}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-foreground">Frequently asked questions</h3>
            <p className="mt-2 text-muted-foreground">Everything about OdinRing, from tapping to privacy.</p>
          </div>
          <Accordion type="single" collapsible className="rounded-3xl overflow-hidden border border-border shadow-sm bg-card">
            <AccordionItem value="q1">
              <AccordionTrigger className="text-foreground">How does tap‑to‑share work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Your NFC ring opens your OdinRing profile instantly. You can enable Direct Mode to send people straight to a specific link like your intro deck or contact card.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger className="text-foreground">Do people need an app to view my profile?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No app required. Profiles are web‑based and optimized for mobile. You can also share via QR for devices without NFC.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger className="text-foreground">Can I customize branding and themes?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. Choose premium palettes, typography, and layouts. Upload your logo and set custom backgrounds for a fully on‑brand presence.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger className="text-foreground">What analytics do I get?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                See views, taps, and top‑performing links. Weekly summaries help you understand engagement and iterate quickly.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger className="text-foreground">Is my data secure?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We use token‑based authentication, protected endpoints, and safe defaults. You control what is public and what remains private.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
            <p className="text-sm md:text-base">&copy; 2024 OdinRing. Premium digital identity platform.</p>
            <p className="text-sm md:text-base flex flex-wrap items-center justify-center gap-x-2 gap-y-1 leading-none">
              <span>Crafted with</span>
              <span className="inline-flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-muted">
                <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 text-destructive" />
              </span>
              <span>by</span>
              <a href="https://linktr.ee/yashwanthbharadwaj" target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline inline-flex items-center text-foreground">
                Yashwanth Bharadwaj
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;