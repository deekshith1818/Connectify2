import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Timeline } from '../components/ui/timeline';
import { TypingAnimation } from '../components/ui/typing-animation';
import { TextColor } from '../components/ui/text-color';
import { ConnectifyHero } from '../components/ConnectifyHero';
import { Menu, MenuItem, HoveredLink, ProductItem } from '../components/ui/navbar-menu';
import { motion } from 'framer-motion';
import { 
  Video, 
  Users, 
  Shield, 
  Zap, 
  Star, 
  MessageCircle, 
  Phone, 
  Mail,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Github,
  Rocket,
  Globe,
  Award,
  Heart,
  Plus,
  Link2,
  ArrowRight
} from 'lucide-react';
import { 
  PlusCircle, 
  LinkSimple, 
  VideoCamera 
} from '@phosphor-icons/react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  const features = [
    {
      icon: Video,
      title: "Crystal Clear Video",
      description: "HD video quality with adaptive bitrate for the best experience on any connection."
    },
    {
      icon: Users,
      title: "Group Meetings",
      description: "Host meetings with unlimited participants. Perfect for teams and large groups."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "End-to-end encryption ensures your conversations stay private and secure."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      company: "TechCorp",
      content: "Connectify has transformed how our remote team collaborates. The video quality is exceptional!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "CEO",
      company: "StartupXYZ",
      content: "We use Connectify for all our client meetings. It's reliable, fast, and professional.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Teacher",
      company: "Online Academy",
      content: "Perfect for online classes. My students love the clear audio and video quality.",
      rating: 5
    },
    {
      name: "David Park",
      role: "Engineering Lead",
      company: "DevStudio",
      content: "The AI assistant feature is game-changing. It transcribes our meetings perfectly!",
      rating: 5
    },
    {
      name: "Lisa Thompson",
      role: "HR Director",
      company: "GlobalCo",
      content: "Onboarding remote employees has never been easier. The screen sharing is flawless.",
      rating: 5
    },
    {
      name: "Alex Kumar",
      role: "Freelancer",
      company: "Self-employed",
      content: "Best video calling platform I've used. The quality even on slow connections is impressive.",
      rating: 5
    }
  ];

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" }
  ];

  // Connectify Journey Timeline Data
  const journeyData = [
    {
      title: "2024",
      content: (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">Global Launch & AI Integration</h4>
          </div>
          <p className="text-slate-600 text-sm md:text-base mb-6">
            Launched Connectify AI Assistant with real-time transcription, meeting summaries, 
            and voice-activated commands. Reached 1 million active users worldwide.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-2xl font-bold text-blue-600">1M+</div>
              <div className="text-sm text-slate-500">Active Users</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-2xl font-bold text-purple-600">50+</div>
              <div className="text-sm text-slate-500">Countries</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-2xl font-bold text-pink-600">99.9%</div>
              <div className="text-sm text-slate-500">Uptime</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="text-2xl font-bold text-green-600">4.9★</div>
              <div className="text-sm text-slate-500">User Rating</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2023",
      content: (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">Enterprise Features & Growth</h4>
          </div>
          <p className="text-slate-600 text-sm md:text-base mb-6">
            Introduced enterprise-grade security, whiteboard collaboration, and 
            screen sharing. Partnered with Fortune 500 companies for remote work solutions.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">End-to-end encryption with AES-256</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Interactive whiteboard with real-time sync</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">HD screen sharing up to 4K resolution</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Meeting recording & cloud storage</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2022",
      content: (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">Product Hunt Launch & Recognition</h4>
          </div>
          <p className="text-slate-600 text-sm md:text-base mb-6">
            Launched on Product Hunt and became #1 Product of the Day. Won "Best Video 
            Conferencing Solution" at TechCrunch Disrupt. Raised Series A funding.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              🏆 #1 Product Hunt
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              🎯 TechCrunch Winner
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              💰 $5M Series A
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "2021",
      content: (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">The Beginning</h4>
          </div>
          <p className="text-slate-600 text-sm md:text-base mb-6">
            Born from the need for better remote communication during challenging times. 
            A small team of passionate developers set out to create a video calling 
            experience that truly connects people.
          </p>
          <blockquote className="border-l-4 border-purple-500 pl-4 italic text-slate-600">
            "We believed video calls should feel like being in the same room. 
            That vision became Connectify."
            <footer className="text-sm text-slate-500 mt-2">— Founding Team</footer>
          </blockquote>
        </div>
      ),
    },
  ];

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(circle at 80% 20%, rgba(124,58,237,0.08), transparent 40%),
          radial-gradient(circle at 20% 80%, rgba(37,99,235,0.08), transparent 40%),
          linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, #f1f5f9 100%)
        `
      }}
    >
      {/* Navigation - Hover Menu Style */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Video className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Connectify</h1>
            </div>

            {/* Center Navigation Menu */}
            <div className="hidden md:block">
              <Menu setActive={setActive}>
                <MenuItem setActive={setActive} active={active} item="Features">
                  <div className="flex flex-col space-y-4 text-sm">
                    <HoveredLink href="#features">All Features</HoveredLink>
                    <HoveredLink href="#features">HD Video Calls</HoveredLink>
                    <HoveredLink href="#features">Screen Sharing</HoveredLink>
                    <HoveredLink href="#features">AI Assistant</HoveredLink>
                  </div>
                </MenuItem>
                <MenuItem setActive={setActive} active={active} item="Solutions">
                  <div className="grid grid-cols-2 gap-6 p-2">
                    <ProductItem
                      title="Teams"
                      href="/auth"
                      description="Collaborate with your team seamlessly"
                      icon={Users}
                    />
                    <ProductItem
                      title="Enterprise"
                      href="/auth"
                      description="Secure solutions for large organizations"
                      icon={Shield}
                    />
                    <ProductItem
                      title="Education"
                      href="/auth"
                      description="Virtual classrooms for learning"
                      icon={Globe}
                    />
                    <ProductItem
                      title="Events"
                      href="/auth"
                      description="Host webinars and virtual events"
                      icon={Star}
                    />
                  </div>
                </MenuItem>
                <MenuItem setActive={setActive} active={active} item="Company">
                  <div className="flex flex-col space-y-4 text-sm">
                    <HoveredLink href="#testimonials">Testimonials</HoveredLink>
                    <HoveredLink href="#">About Us</HoveredLink>
                    <HoveredLink href="#">Careers</HoveredLink>
                    <HoveredLink href="#">Contact</HoveredLink>
                  </div>
                </MenuItem>
              </Menu>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="hidden sm:inline-flex text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate("/auth")} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Connect</span>{' '}
                  <TypingAnimation 
                    text="with your loved ones" 
                    duration={80}
                    className="text-slate-900"
                  />
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl">
                  Bridge distances with crystal-clear video calls. Professional, secure, and designed for meaningful connections.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-[0_10px_30px_rgba(124,58,237,0.35)] hover:shadow-[0_15px_40px_rgba(124,58,237,0.45)] transition-all duration-300">
                  Start Free Call
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-white border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all">
                  <Video className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>End-to-end encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>HD quality</span>
                </div>
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <ConnectifyHero />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold text-slate-900"
            >
              How Connectify Works
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-slate-600 max-w-2xl mx-auto"
            >
              Start your video meeting in seconds — no downloads, no hassle
            </motion.p>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 -translate-y-1/2 z-0" />
            
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative z-10">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
                      <PlusCircle size={32} weight="duotone" className="text-white" />
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Create a Meeting</h3>
                    <p className="text-slate-600">Start a meeting instantly with a single click.</p>
                  </div>
                </div>
                {/* Arrow for mobile */}
                <div className="flex justify-center my-4 md:hidden">
                  <ArrowRight className="w-6 h-6 text-slate-300 rotate-90" />
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25">
                      <LinkSimple size={32} weight="duotone" className="text-white" />
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-purple-600 font-bold">2</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Share the Link</h3>
                    <p className="text-slate-600">Send the meeting link to anyone, anywhere.</p>
                  </div>
                </div>
                {/* Arrow for mobile */}
                <div className="flex justify-center my-4 md:hidden">
                  <ArrowRight className="w-6 h-6 text-slate-300 rotate-90" />
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/25">
                      <VideoCamera size={32} weight="duotone" className="text-white" />
                    </div>
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-pink-600 font-bold">3</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Start Video Call</h3>
                    <p className="text-slate-600">Join in HD video with crystal-clear audio.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Text Banner */}
      <section className="py-10 bg-slate-50">
        <TextColor />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Everything you need for perfect video calls
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Built with modern technology to deliver the best video calling experience
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline Section */}
      <section className="py-10 bg-white">
        <Timeline data={journeyData} />
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-slate-50 dark:bg-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Loved by teams worldwide
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              See what our users have to say about Connectify
            </p>
          </div>
        </div>
        
        {/* Auto-scrolling Carousel */}
        <div className="relative">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none dark:from-slate-800"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none dark:from-slate-800"></div>
          
          {/* Scrolling container */}
          <div className="flex animate-scroll-left">
            {/* First set of cards */}
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div key={index} className="flex-shrink-0 w-[350px] px-4">
                <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">"{testimonial.content}"</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">{testimonial.name[0]}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role} at {testimonial.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Video className="h-8 w-8 text-blue-400" />
                <h3 className="text-xl font-bold">Connectify</h3>
              </div>
              <p className="text-slate-400 max-w-xs">
                Making video calls simple, secure, and seamless for everyone.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Connect</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>support@connectify.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Connectify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
