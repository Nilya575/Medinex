import { Link } from 'react-router-dom'
import {
  Activity,
  FileText,
  Pill,
  Users,
  Cloud,
  ArrowRight,
} from 'lucide-react'

import { Button } from '../components/ui/Button'

export default function Landing() {
  const features = [
    {
      icon: <FileText size={24} />,
      title: 'Digital Health Records',
      desc: 'Store and access your complete medical history securely with structured smart records.',
    },
    {
      icon: <Pill size={24} />,
      title: 'AI Prescription Tracking',
      desc: 'Doctors can instantly upload prescriptions that sync in real time across devices.',
    },
    {
      icon: <Users size={24} />,
      title: 'Multi-Doctor Access',
      desc: 'Enable specialists to collaborate securely for better healthcare decisions.',
    },
    {
      icon: <Cloud size={24} />,
      title: 'Cloud Based Access',
      desc: 'Access your healthcare information securely from anywhere anytime.',
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">

      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-teal-500/20 blur-[140px]" />
      </div>

      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-5"
        style={{
          background: 'rgba(5,10,25,0.72)',
          backdropFilter: 'blur(22px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/20">
            <Activity size={18} className="text-white" />
          </div>

          <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-2xl font-black text-transparent">
            Medinex
          </span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-sm font-medium">
          <a className="text-cyan-400" href="#home">
            Home
          </a>

          <a
            className="text-slate-400 transition hover:text-white"
            href="#features"
          >
            Features
          </a>

          <a
            className="text-slate-400 transition hover:text-white"
            href="#about"
          >
            About
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>

          <Link to="/register">
            <Button variant="primary" size="sm">
              Register
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        id="home"
        className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-between gap-16 px-6 py-24 md:flex-row"
      >

        {/* Left */}
        <div className="relative z-10 flex-1">

          <h1 className="mb-8 text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
            Smart Medical
            <br />

            History Tracking
            <br />

            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-cyan-500 bg-clip-text text-transparent">
              For Better Care
            </span>
          </h1>

          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
            Experience next-generation healthcare management with secure AI-enabled
            medical records, prescription tracking, and seamless doctor collaboration.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link to="/register">
              <Button
                variant="primary"
                size="lg"
                iconRight={<ArrowRight size={18} />}
              >
                Get Started
              </Button>
            </Link>

            <a href="#features">
              <Button variant="outline" size="lg">
                Explore Features
              </Button>
            </a>
          </div>
        </div>

        {/* Right */}
        <div className="relative flex-1 flex items-center justify-center animate-float">

          {/* Background Glow */}
          <div className="absolute w-[650px] h-[650px] rounded-full bg-cyan-500/20 blur-[180px]" />

          {/* Floating Top Card */}
          <div className="absolute top-10 -left-6 z-30 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-2xl shadow-2xl">
            <p className="text-xs tracking-wide text-slate-300">
              AI Health Analysis
            </p>

            <h4 className="mt-1 text-sm font-semibold text-white">
              Smart Monitoring
            </h4>
          </div>

          {/* Floating Bottom Card */}
          <div className="absolute bottom-10 -right-4 z-30 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-2xl shadow-2xl">
            <p className="text-xs tracking-wide text-slate-300">
              Cloud Protected
            </p>

            <h4 className="mt-1 text-sm font-semibold text-white">
              Secure Access
            </h4>
          </div>

          {/* Main Image Container */}
          <div
            className="group relative overflow-hidden rounded-[26px] border border-white/10"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 30px 120px rgba(0,0,0,0.55)',
            }}
          >

            {/* Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-tr from-cyan-500/20 via-transparent to-teal-500/10" />

            {/* Digital Grid */}
            <div
              className="absolute inset-0 z-20 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                backgroundSize: '42px 42px',
              }}
            />

            {/* Bottom Blend */}
            <div className="absolute inset-x-0 bottom-0 z-20 h-44 bg-gradient-to-t from-[#050816] via-[#050816]/40 to-transparent" />

            {/* Shine Effect */}
            <div className="absolute -left-20 -top-20 z-20 h-72 w-72 rotate-12 bg-white/10 blur-3xl" />

            {/* Image */}
            <img
              src="https://www.chesshealthsolutions.com/wp-content/uploads/2023/10/iStock-1473559425.jpg"
              alt="Healthcare"
              className="w-full h-auto object-contain opacity-85 transition duration-700 group-hover:scale-105"
            />

            {/* Border Ring */}
            <div className="absolute inset-0 rounded-[26px] ring-1 ring-white/10" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto max-w-7xl border-t border-white/10 px-6 py-24"
      >
        <div className="mb-16 text-center">
          <h2 className="mb-5 text-4xl font-black md:text-5xl">
            Premium Features
          </h2>

          <p className="mx-auto max-w-3xl text-lg text-slate-400">
            Everything you need to manage your healthcare experience with speed,
            security, and intelligence.
          </p>
        </div>

        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:border-cyan-400/40 hover:shadow-[0_20px_80px_rgba(6,182,212,0.15)]"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-110">
                {feature.icon}
              </div>

              <h3 className="mb-4 text-xl font-bold">
                {feature.title}
              </h3>

              <p className="leading-relaxed text-slate-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="border-t border-white/10 bg-white/[0.02] px-6 py-24 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-4xl font-black md:text-5xl">
            About Medinex
          </h2>

          <div className="space-y-6 text-lg leading-relaxed text-slate-400">
            <p>
              Medinex transforms modern healthcare by enabling secure and instant
              access to patient records, prescriptions, and AI-powered medical
              insights.
            </p>

            <p>
              Built with intelligent cloud infrastructure and modern security,
              Medinex ensures seamless healthcare collaboration between patients,
              doctors, and specialists.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/30 px-6 py-10 text-center text-sm text-slate-500 backdrop-blur-xl">
        <p>© 2026 Medinex • Smart Healthcare Platform</p>
      </footer>
    </div>
  )
}