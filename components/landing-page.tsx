'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getZoneTextClass, getZoneStyle, getZoneBgStyle } from '@/lib/utils/zone-colors';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Shield,
  BarChart3,
  Camera,
  Activity,
  CheckCircle,
  ArrowRight,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const [showQR, setShowQR] = useState(false);

  const features = [
    {
      icon: Activity,
      title: 'Simplified Symptom Tracking',
      description:
        'Finally understand what triggers your symptoms with our 4-category system: Digestion, Energy, Mind, Recovery',
      color: 'from-purple-400 to-pink-500',
    },
    {
      icon: Camera,
      title: 'Multi-Image AI Analysis',
      description:
        'Never guess about ingredients again. Take multiple photos and AI identifies everything, classifying each into health zones',
      color: 'from-green-400 to-emerald-500',
    },
    {
      icon: BarChart3,
      title: 'Zone-Based Intelligence',
      description:
        'See food impact at a glance - no complex numbers. Green, Yellow, Red zones cut through nutrition confusion',
      color: 'from-green-500 via-yellow-500 to-red-500',
    },
    {
      icon: Shield,
      title: 'Privacy-First Cloud',
      description:
        'Your health data stays private, always. Secure cloud storage with encryption and complete data ownership',
      color: 'from-blue-400 to-cyan-500',
    },
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/new logo.png"
                alt="eatZone logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-foreground">eatZone</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="text-foreground border-border hover:bg-accent hover:text-accent-foreground" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <Badge variant="secondary" className="mb-4">
              Symptom-Focused • AI-Powered • Privacy-First
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Connect Food to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500">
                Feeling
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Stop wondering which foods make you feel bad. Our AI identifies ingredients and shows you exactly
              how different foods affect your symptoms - so you can eat with confidence.
            </p>

            {/* Mobile CTA */}
            <div className="lg:hidden space-y-4">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link href="/signup">
                  Start Feeling Better <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Works best on mobile • Install as PWA • Syncs across devices
              </p>
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:block space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                  <Link href="/signup">
                    Start Feeling Better <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setShowQR(!showQR)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Mobile Access
                </Button>
              </div>

              {showQR && (
                <Card className="w-fit bg-card border border-border">
                  <CardContent className="p-4">
                    <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-gray-400" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Scan to open on mobile
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle
                    className={`h-4 w-4 ${getZoneTextClass('green')} mr-1`}
                  />
                  Zone-based ingredient analysis
                </div>
                <div className="flex items-center">
                  <CheckCircle
                    className={`h-4 w-4 ${getZoneTextClass('green')} mr-1`}
                  />
                  Secure cloud sync
                </div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="relative mx-auto w-64 h-[580px] lg:w-80 lg:h-[700px]">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gray-900 rounded-[2.5rem] p-2">
                <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden">
                  <img
                    src="/screenshots/step3-view-insights.png"
                    alt="eatZone Dashboard"
                    className="w-full h-full object-cover rounded-[2rem]"
                  />
                </div>
              </div>
            </div>

            {/* Desktop hint */}
            <div className="hidden lg:block absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <Badge variant="outline" className="text-xs">
                <Smartphone className="h-3 w-3 mr-1" />
                Optimized for mobile
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Stop Counting Calories. Start Understanding Food.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Most apps obsess over numbers - calories, macros, weight. We focus on what actually matters:
              how food makes you FEEL. Our zone system cuts through nutrition confusion with simple, visual insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center bg-card border border-border shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader>
                  <div
                    className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              How Zone Intelligence Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Four simple steps to understand your food&apos;s impact on your body
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
            {/* Step 1: Track Symptoms */}
            <div className="text-center">
              <div className="relative mx-auto w-64 h-80 mb-6">
                <div className="absolute inset-0 bg-gray-900 rounded-3xl p-1">
                  <div className="w-full h-full bg-white rounded-3xl overflow-hidden">
                    <img
                      src="/screenshots/step1-track-symptoms.png"
                      alt="Track symptoms interface"
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                1. Track Your Symptoms
              </h3>
              <p className="text-muted-foreground">
                Log symptoms across 4 key categories: Digestion, Energy, Mind, and Recovery with our simplified tracking system
              </p>
            </div>

            {/* Step 2: Analyze Foods */}
            <div className="text-center">
              <div className="relative mx-auto w-64 h-80 mb-6">
                <div className="absolute inset-0 bg-gray-900 rounded-3xl p-1">
                  <div className="w-full h-full bg-white rounded-3xl overflow-hidden">
                    <img
                      src="/screenshots/step2-analyze-foods.png"
                      alt="AI food analysis with zone colors"
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                2. Analyze Your Foods
              </h3>
              <p className="text-muted-foreground">
                AI identifies ingredients from photos and classifies each one into Green, Yellow, or Red zones with visual color coding
              </p>
            </div>

            {/* Step 3: View Insights */}
            <div className="text-center">
              <div className="relative mx-auto w-64 h-80 mb-6">
                <div className="absolute inset-0 bg-gray-900 rounded-3xl p-1">
                  <div className="w-full h-full bg-white rounded-3xl overflow-hidden">
                    <img
                      src="/screenshots/step3-view-insights.png"
                      alt="Dashboard with zone summary and food entries"
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                3. View Your Zone Insights
              </h3>
              <p className="text-muted-foreground">
                See your daily zone distribution and food history with clear visual summaries of your nutrition patterns
              </p>
            </div>

            {/* Step 4: Discover Patterns */}
            <div className="text-center">
              <div className="relative mx-auto w-64 h-80 mb-6">
                <div className="absolute inset-0 bg-gray-900 rounded-3xl p-1">
                  <div className="w-full h-full bg-white rounded-3xl overflow-hidden">
                    <img
                      src="/screenshots/step4-discover-patterns.png"
                      alt="Symptom timeline and pattern discovery"
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                4. Discover Patterns
              </h3>
              <p className="text-muted-foreground">
                Connect the dots between your food zones and symptoms with timeline views and pattern recognition
              </p>
            </div>
          </div>

          {/* Zone Legend */}
          <div className="max-w-4xl mx-auto mt-24 lg:mt-32">
            <Card className="p-8 bg-card border border-border shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Understanding Food Zones
                </h3>
                <p className="text-muted-foreground">
                  Find your feel-good foods and ditch the rest with our proven zone-based methodology
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={getZoneBgStyle('green')}>
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2" style={getZoneStyle('green', 'color')}>Green Zone</h4>
                  <p className="text-sm text-muted-foreground">
                    Whole, unprocessed foods that support optimal health
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={getZoneBgStyle('yellow')}>
                    <span className="text-white font-bold text-xl">!</span>
                  </div>
                  <h4 className="font-semibold mb-2" style={getZoneStyle('yellow', 'color')}>Yellow Zone</h4>
                  <p className="text-sm text-muted-foreground">
                    Foods to test individually - some work for you, others don&apos;t
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={getZoneBgStyle('red')}>
                    <span className="text-white font-bold text-xl">×</span>
                  </div>
                  <h4 className="font-semibold mb-2" style={getZoneStyle('red', 'color')}>Red Zone</h4>
                  <p className="text-sm text-muted-foreground">
                    Foods that no one should eat - avoid to prevent symptoms
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Science-Backed Methodology Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <BarChart3 className="h-3 w-3 mr-1" />
                Science-Backed
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Built on Elimination Diet Science
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our zone classifications aren't arbitrary. They're based on decades of
                elimination diet research and nutritional science. The same methodology
                trusted by nutrition professionals worldwide.
              </p>

              <div className="space-y-4">
                {[
                  'Based on established elimination diet principles',
                  'Zone classifications use peer-reviewed research',
                  'Method trusted by nutrition professionals',
                  'Scientifically grounded, not random AI decisions',
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle
                      className={`h-5 w-5 ${getZoneTextClass('green')} mr-3`}
                    />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="w-full h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center">
                <BarChart3 className="h-24 w-24 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-card border-2 border-primary/30 shadow-lg p-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Find Your Feel-Good Foods Today
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Stop being a passenger to your symptoms. Become the pilot of your recovery
              with proven zone-based methodology.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" asChild>
                <Link href="/signup">
                  Start Feeling Better <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Works offline • PWA installation • Cross-device sync
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-muted-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/new logo.png"
                  alt="eatZone logo"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                <span className="text-lg font-bold text-foreground">eatZone</span>
              </div>
              <p className="text-muted-foreground">
                Smart food tracking with zone-based ingredient intelligence.
                Understand your food&apos;s impact with AI-powered analysis.
              </p>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/signup"
                    className="hover:text-foreground transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-foreground transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <span className="text-muted-foreground/60">
                    Mobile App (Coming Soon)
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-4">Privacy & Science</h3>
              <ul className="space-y-2">
                <li>
                  <span className="text-muted-foreground">Encrypted cloud storage</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Complete data ownership</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Evidence-based zone methodology</span>
                </li>
                <li>
                  <span className="text-muted-foreground">
                    Export your data anytime
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 eatZone. Smart food tracking with zone intelligence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
