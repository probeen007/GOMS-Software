import { Link } from 'react-router-dom'
import { motion, Variants } from 'framer-motion'
import {
  Wrench,
  ShieldCheck,
  Cpu,
  Disc,
  Paintbrush,
  Droplet,
  Clock,
  CheckCircle,
  ChevronRight,
  Star,
  ArrowRight,
  Calendar,
  Settings,
  Users,
  Award,
  Shield,
  Zap,
} from 'lucide-react'
import Statistics from '../components/Statistics'
import FAQ from '../components/FAQ'
import Button from '../components/Button'
import BrandLogos from '../components/BrandLogos'

/* ─── DATA ─── */

const services = [
  {
    slug: 'engine-repair',
    icon: Wrench,
    title: 'Engine Repair',
    description:
      'Expert engine diagnostics, overhaul, and precision repair for all engine types and brands.',
    image: '/assets/engine.jpg',
  },
  {
    slug: 'general-servicing',
    icon: ShieldCheck,
    title: 'General Servicing',
    description:
      'Full vehicle health checks, fluid top-ups, filter replacements, and preventive maintenance.',
    image: '/assets/general.jpg',
  },
  {
    slug: 'electrical-repair',
    icon: Cpu,
    title: 'Electrical Repair',
    description:
      'Battery servicing, ECU diagnostics, wiring repairs, and advanced electrical systems.',
    image: '/assets/wirring.jpg',
  },
  {
    slug: 'brake-suspension',
    icon: Disc,
    title: 'Brake & Suspension',
    description:
      'Brake pad replacements, disc resurfacing, shock absorber and suspension tuning.',
    image: '/assets/break.png',
  },
  {
    slug: 'denting-painting',
    icon: Paintbrush,
    title: 'Denting & Painting',
    description:
      'Professional body dent removal, scratch repair, and premium automotive painting.',
    image: '/assets/paint.png',
  },
  {
    slug: 'oil-lubrication',
    icon: Droplet,
    title: 'Oil & Lubrication',
    description:
      'Engine oil changes, lubrication of all moving parts, and complete drivetrain care.',
    image: '/assets/oil.png',
  },
]

const whyUs = [
  {
    icon: Shield,
    title: 'Experienced Technicians',
    desc: '45+ years of combined automotive excellence in Kathmandu',
  },
  {
    icon: Wrench,
    title: 'Modern Equipment',
    desc: 'State-of-the-art diagnostic and repair tools',
  },
  {
    icon: CheckCircle,
    title: 'Genuine Parts',
    desc: 'OEM and certified high-quality aftermarket parts only',
  },
  {
    icon: Clock,
    title: 'Fast & Reliable',
    desc: 'Quick turnaround without ever compromising quality',
  },
  {
    icon: Star,
    title: 'Affordable Pricing',
    desc: 'Competitive, transparent pricing with no hidden fees',
  },
]

const brands = [
  { name: 'Toyota', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg' },
  { name: 'Hyundai', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg' },
  { name: 'Suzuki', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo_2.svg' },
  { name: 'Kia', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Kia-logo.svg' },
  { name: 'Honda', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg' },
  { name: 'Nissan', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Nissan_2020_logo.svg' },
  { name: 'Mahindra', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Mahindra_Logo.png' },
]

const galleryImages = [
  '/assets/img1.jpg',
  '/assets/img2.jpg',
  '/assets/img3.jpg',
  '/assets/img4.jpg',
]

/* ─── ANIMATION VARIANTS ─── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
}


/* ─── COMPONENT ─── */
export default function Home() {
  return (
    <div>
      {/* ══════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════ */}
      <section className="relative bg-slate-950 text-white min-h-[85vh] flex flex-col justify-between overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/hero.png"
            alt="P.M. Automobile Works"
            className="w-full h-full object-cover"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1600&h=900&fit=crop&q=80";
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-900/65" />
        </div>

        {/* Hero Main Content */}
        <div className="pm-container relative z-10 pt-16 lg:pt-20 pb-16 flex-grow flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#E63946]"></span>
                <span className="text-[#E63946] text-xs md:text-sm font-extrabold tracking-widest uppercase">
                  TRUSTED AUTOMOBILE WORKSHOP
                </span>
                <span className="w-8 h-[2px] bg-[#E63946]"></span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none uppercase text-white font-sans">
                <span className="block text-2xl sm:text-3xl lg:text-4xl text-gray-100 font-bold mb-2">
                  SINCE 1978
                </span>
                COMPLETE AUTO CARE <br />
                <span className="text-white">FOR EVERY JOURNEY</span>
              </h1>

              {/* Description */}
              <p className="text-gray-300 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
                From routine maintenance to complex repairs, we provide expert service with
                genuine parts and modern technology.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/book"
                  className="bg-[#E63946] hover:bg-[#CC2936] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider px-7 py-4 rounded-lg flex items-center gap-2.5 shadow-lg hover:shadow-red-900/30 transition-all transform hover:-translate-y-0.5"
                >
                  <Calendar size={18} />
                  <span>BOOK APPOINTMENT</span>
                </Link>
                <Link
                  to="/services"
                  className="border-2 border-white/60 hover:border-white bg-white/5 hover:bg-white/15 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider px-7 py-4 rounded-lg flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5"
                >
                  <Settings size={18} />
                  <span>EXPLORE SERVICES</span>
                </Link>
              </div>
            </motion.div>

            {/* Right Card Overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-6 lg:p-8 text-slate-900 shadow-2xl max-w-md ml-auto">
                <div className="mb-6 pb-4 border-b border-slate-200">
                  <h3 className="text-xl font-black tracking-wider uppercase text-slate-900">P.M. AUTOMOBILE WORKS</h3>
                  <p className="text-[#E63946] text-xs font-extrabold tracking-widest uppercase mt-1">SINCE 1978</p>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E63946] shrink-0">
                      <Users size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 leading-none">5000+</div>
                      <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Happy Customers</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E63946] shrink-0">
                      <Award size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 leading-none">45+</div>
                      <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Years Experience</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E63946] shrink-0">
                      <Wrench size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 leading-none">25+</div>
                      <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Services Offered</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E63946] shrink-0">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 leading-none">100%</div>
                      <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Genuine Parts</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Bottom Floating White Stat Bar Card */}
        <div className="relative z-20 pm-container pb-8 -mt-6 lg:-mt-8">
          <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-gray-900 divide-y sm:divide-y-0 lg:divide-x divide-gray-100">
            <div className="flex items-center gap-4 pt-4 sm:pt-0">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#E63946] shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-black text-gray-900 leading-none">45+</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Years of Experience</div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 sm:pt-0 lg:pl-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#E63946] shrink-0">
                <Users size={24} />
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-black text-gray-900 leading-none">5000+</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Satisfied Customers</div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 sm:pt-0 lg:pl-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#E63946] shrink-0">
                <Wrench size={24} />
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-black text-gray-900 leading-none">25+</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Auto Services</div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 sm:pt-0 lg:pl-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#E63946] shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-black text-gray-900 leading-none">100%</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Quality & Genuine Parts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          ABOUT PREVIEW
      ══════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '120px 0' }}>
        <div className="pm-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Image side */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div
                className="relative overflow-hidden shadow-xl"
                style={{ borderRadius: '12px', aspectRatio: '4/3' }}
              >
                <img
                  src="/assets/about.jpg"
                  alt="P.M. Automobile Works — Workshop"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {

                    e.currentTarget.src = "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?w=800&h=600&fit=crop&q=80";
                  }}
                />
                {/* Stats overlay card */}
                <div
                  className="absolute bottom-6 right-6 text-center shadow-lg"
                  style={{
                    background: '#E63946',
                    borderRadius: '10px',
                    padding: '20px 24px',
                    minWidth: '110px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontSize: '3rem',
                      fontWeight: 900,
                      color: 'white',
                      lineHeight: 1,
                    }}
                  >
                    45+
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.9)',
                    }}
                  >
                    Years of Trust
                  </div>
                </div>
              </div>

              {/* Small floater */}
              <div
                className="absolute -left-4 top-8 shadow-xl"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    background: 'rgba(230,57,70,0.12)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle size={18} color="#E63946" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>Quality Guaranteed</div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>On all repairs & parts</div>
                </div>
              </div>
            </motion.div>

            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              viewport={{ once: true }}
            >
              <div className="section-label">Our Story</div>
              <h2 className="heading-section text-slate-900 mb-6">
                Built on Trust.<br />Driven by Quality.
              </h2>
              <div className="red-line" />
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.8, margin: '20px 0 16px' }}>
                Founded in 1978, P.M. Automobile Works has grown from a small repair shop in
                Kathmandu to one of Nepal's most respected automotive service centers.
                We've built our reputation one satisfied customer at a time.
              </p>
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.8, marginBottom: '32px' }}>
                From routine maintenance to complex engine rebuilds, our expert technicians use
                advanced diagnostic equipment and genuine spare parts to ensure your vehicle
                performs at its best — every single time.
              </p>

              {/* Values row */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { icon: Shield, t: 'Integrity' },
                  { icon: Star, t: 'Quality' },
                  { icon: Zap, t: 'Innovation' },
                  { icon: CheckCircle, t: 'Commitment' },
                ].map(({ icon: Icon, t }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        background: 'rgba(230,57,70,0.1)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color="#E63946" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{t}</span>
                  </div>
                ))}
              </div>

              <Link to="/about" className="btn-primary" style={{ padding: '14px 30px' }}>
                Read More About Us
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATISTICS
      ══════════════════════════════════════════════ */}
      <Statistics dark={false} />

      {/* ══════════════════════════════════════════════
          SERVICES SECTION
      ══════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '120px 0' }}>
        <div className="pm-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div>
              <div className="section-label">Our Services</div>
              <h2 className="heading-section text-slate-900 mb-4">
                What We Offer
              </h2>
              <div className="red-line" />
              <p style={{ fontSize: '15px', color: '#64748B', marginTop: '16px', maxWidth: '480px' }}>
                We offer a complete range of automotive services to keep your vehicle
                in prime condition. Our expert technicians use only the best tools and parts.
              </p>
            </div>
            <Link to="/services" className="btn-secondary" style={{ flexShrink: 0 }}>
              View All Services <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={service.slug}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
              >
                <Link
                  to={`/services/${service.slug}`}
                  className="block group overflow-hidden border border-slate-200 shadow-md hover:shadow-2xl hover:border-[#E63946] transition-all duration-300 rounded-2xl"
                  style={{ background: '#FFFFFF', color: '#0F172A', height: '100%' }}
                >
                  {/* Image */}
                  <div style={{ height: '220px', overflow: 'hidden' }}>
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&h=400&fit=crop&q=80";
                      }}
                    />
                  </div>

                  {/* Body */}
                  <div style={{ padding: '28px', background: '#FFFFFF' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          background: 'rgba(230,57,70,0.1)',
                          border: '1px solid rgba(230,57,70,0.15)',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <service.icon size={22} color="#E63946" />
                      </div>
                      <h3
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em',
                          color: '#0F172A',
                        }}
                      >
                        {service.title}
                      </h3>
                    </div>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7, marginBottom: '20px' }}>
                      {service.description}
                    </p>
                    <div
                      className="flex items-center gap-2 text-[#E63946] font-extrabold uppercase tracking-widest transition-all duration-200 group-hover:gap-3"
                      style={{ fontSize: '12px' }}
                    >
                      Learn More <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════
          WHY CHOOSE US
      ══════════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden bg-slate-950 text-white">
        {/* Background Image with Overlay like Hero section */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/general.jpg"
            alt="Why Choose Us Workshop"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1920&h=1080&fit=crop&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/85 to-slate-900/90" />
        </div>

        <div className="pm-container relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-2">
              <span className="w-8 h-[2px] bg-[#E63946]"></span>
              <span className="text-[#E63946] text-xs font-black tracking-widest uppercase">
                WHY CHOOSE US
              </span>
              <span className="w-8 h-[2px] bg-[#E63946]"></span>
            </div>
            <h2 className="heading-section text-white mb-4">
              The P.M. Automobile Difference
            </h2>
            <div className="w-16 h-[3px] bg-[#E63946] mx-auto mb-4" />
            <p style={{ fontSize: '15px', color: '#CBD5E1', maxWidth: '560px', margin: '12px auto 0' }}>
              Here is why thousands of car owners in Kathmandu choose us for their vehicle care.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {whyUs.map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
                className="text-center group"
                style={{
                  padding: '36px 20px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(-6px)'
                  el.style.borderColor = '#E63946'
                  el.style.boxShadow = '0 20px 40px rgba(230,57,70,0.25)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = 'translateY(0)'
                  el.style.borderColor = '#E2E8F0'
                  el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)'
                }}
              >
                <div
                  className="mx-auto mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'rgba(230,57,70,0.1)',
                    border: '1px solid rgba(230,57,70,0.15)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.icon size={28} color="#E63946" />
                </div>
                <h3
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#0F172A',
                    marginBottom: '8px',
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.65, fontWeight: 500 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════
          GALLERY PREVIEW
      ══════════════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', padding: '120px 0' }}>
        <div className="pm-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="section-label">Gallery</div>
              <h2 className="heading-section text-slate-900">Our Workshop</h2>
              <div className="red-line" style={{ marginTop: '16px' }} />
            </div>
            <Link to="/gallery" className="btn-secondary" style={{ flexShrink: 0 }}>
              View Full Gallery <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {galleryImages.map((src, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
                className="relative overflow-hidden group shadow-md"
                style={{ borderRadius: '10px', aspectRatio: '4/3', cursor: 'pointer' }}
              >
                <img
                  src={src}
                  alt={`Workshop ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=450&fit=crop&q=80";
                  }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                  style={{ background: 'rgba(230,57,70,0.5)' }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    }}
                  >
                    <ChevronRight size={22} color="#E63946" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BRANDS WE SERVICE
      ══════════════════════════════════════════════ */}
      <section
        style={{
          background: '#F8FAFC',
          padding: '60px 0',
          borderTop: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div className="pm-container">
          <div className="text-center mb-10">
            <p
              style={{
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#64748B',
              }}
            >
              Brands We Service
            </p>
          </div>
          <BrandLogos />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════ */}
      <FAQ dark={false} />

      {/* ══════════════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════════════ */}
      <section className="relative bg-[#E63946] text-white" style={{ padding: '100px 0', overflow: 'hidden' }}>
        <div className="pm-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
            style={{ maxWidth: '680px', margin: '0 auto' }}
          >
            <div className="inline-block text-xs font-black tracking-widest text-white/90 uppercase mb-3 bg-white/10 px-4 py-1.5 rounded-full">
              NEED IMMEDIATE ASSISTANCE?
            </div>
            <h2 className="heading-section text-white mb-4">
              Book Your Service Today
            </h2>
            <div className="w-16 h-[3px] bg-white mx-auto my-4" />
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.92)', margin: '20px 0 40px', lineHeight: 1.7 }}>
              Our team is ready to help you. Book your appointment today and experience
              Kathmandu's most trusted automotive care since 1978.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/book"
                className="bg-white text-[#E63946] hover:bg-slate-100 font-extrabold uppercase tracking-wider rounded-lg shadow-xl"
                style={{ padding: '15px 40px', fontSize: '13px' }}
              >
                Book Appointment
              </Link>
              <Link
                to="/contact"
                className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-extrabold uppercase tracking-wider rounded-lg"
                style={{ padding: '14px 38px', fontSize: '13px' }}
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}

