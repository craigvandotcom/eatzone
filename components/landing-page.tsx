'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getZoneTextClass } from '@/lib/utils/zone-colors';
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
  Utensils,
  Activity,
  CheckCircle,
  ArrowRight,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [showQR, setShowQR] = useState(false);

  const features = [
    {
      icon: Camera,
      title: 'AI-Powered Capture',
      description:
        'Take a photo of your food or drink and let AI analyze it for you',
      color: 'from-green-400 to-emerald-500',
    },
    {
      icon: Shield,
      title: 'Privacy by Design',
      description:
        'Your health data never leaves your device - complete privacy guaranteed',
      color: 'from-blue-400 to-cyan-500',
    },
    {
      icon: BarChart3,
      title: 'Visual Insights',
      description:
        "Beautiful charts and progress tracking to understand your body's patterns",
      color: 'from-purple-400 to-pink-500',
    },
    {
      icon: Smartphone,
      title: 'Comprehensive Tracking',
      description: 'Monitor foods, symptoms, and more in one unified app',
      color: 'from-amber-400 to-orange-500',
    },
  ];

  const trackingCategories = [
    {
      icon: Utensils,
      name: 'Foods',
      color: getZoneTextClass('green'),
      description: 'Ingredient analysis',
    },
    {
      icon: Activity,
      name: 'Symptoms',
      color: getZoneTextClass('red'),
      description: 'Health monitoring',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg"></div>
              <span className="text-xl font-bold text-gray-900">Puls</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <Badge variant="secondary" className="mb-4">
              Private • Offline-First • AI-Powered
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Your Body&apos;s{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
                Compass
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Track your health inputs and outputs with high-speed logging and
              AI-powered insights. All while keeping your data completely
              private on your device.
            </p>

            {/* Mobile CTA */}
            <div className="lg:hidden space-y-4">
              <Button size="lg" className="w-full" asChild>
                <Link href="/signup">
                  Start Tracking <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Works best on mobile • Install as PWA for native experience
              </p>
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:block space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowQR(!showQR)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Mobile Access
                </Button>
              </div>

              {showQR && (
                <Card className="w-fit">
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
                  No account required to try
                </div>
                <div className="flex items-center">
                  <CheckCircle
                    className={`h-4 w-4 ${getZoneTextClass('green')} mr-1`}
                  />
                  Data stays on your device
                </div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="relative mx-auto w-64 h-[500px] lg:w-80 lg:h-[600px]">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gray-900 rounded-[2.5rem] p-2">
                <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden">
                  {/* Mock App Interface */}
                  <div className="h-full bg-gradient-to-br from-blue-50 to-green-50 p-4">
                    <div className="text-center mb-8">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Your Body Compass
                      </h3>
                      <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Mock tracking buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      {trackingCategories.map((category, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-3 shadow-sm"
                        >
                          <category.icon
                            className={`h-6 w-6 ${category.color} mb-2`}
                          />
                          <p className="text-xs font-medium text-gray-900">
                            {category.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
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
      <section className="bg-muted/50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              High-Speed Logging, Clear Insights
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Designed for busy lives. Capture your health data in seconds, then
              get powerful insights without compromising your privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow"
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

      {/* Privacy Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Shield className="h-3 w-3 mr-1" />
                Privacy First
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Your Data Stays With You
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Unlike other health apps, we believe your personal health data
                should remain personal. Everything is stored locally on your
                device using advanced encryption.
              </p>

              <div className="space-y-4">
                {[
                  'No cloud storage of personal data',
                  'AI processing happens securely',
                  'Export your data anytime',
                  'No tracking or analytics',
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle
                      className={`h-5 w-5 ${getZoneTextClass('green')} mr-3`}
                    />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl flex items-center justify-center">
                <Shield className="h-24 w-24 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-500 to-green-500 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Start Understanding Your Body Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands who&apos;ve discovered patterns in their health with
            completely private tracking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">
                Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-blue-600"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <p className="text-sm text-blue-100 mt-6">
            No credit card required • Works offline • Install as app
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded"></div>
                <span className="text-lg font-bold text-white">Puls</span>
              </div>
              <p className="text-gray-400">
                Your Body&apos;s Compass - Private health tracking with AI
                insights.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/signup"
                    className="hover:text-white transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <span className="text-gray-500">
                    Mobile App (Coming Soon)
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Privacy</h3>
              <ul className="space-y-2">
                <li>
                  <span className="text-gray-400">No data collection</span>
                </li>
                <li>
                  <span className="text-gray-400">Local storage only</span>
                </li>
                <li>
                  <span className="text-gray-400">
                    Open source (Coming Soon)
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Puls. Built with privacy in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
