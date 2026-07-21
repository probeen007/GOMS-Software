import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wrench,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  ChevronRight,
  Star,
  ArrowRight,
} from 'lucide-react'
import Statistics from '../components/Statistics'
import FAQ from '../components/FAQ'
import Button from '../components/Button'

/* ─── DATA ─── */

const services = [
  {
    slug: 'engine-repair',
    icon: Wrench,
    title: 'Engine Repair',
    description:
      'Expert engine diagnostics, overhaul, and precision repair for all engine types and brands.',
    image:
      'assets/service-engine.jpg',
  },
  {
    slug: 'general-servicing',
    icon: Shield,
    title: 'General Servicing',
    description:
      'Full vehicle health checks, fluid top-ups, filter replacements, and preventive maintenance.',
    image:
      'assets/service-general.jpg',
  },
  {
    slug: 'electrical-repair',
    icon: Zap,
    title: 'Electrical Repair',
    description:
      'Battery servicing, ECU diagnostics, wiring repairs, and advanced electrical systems.',
    image:
      'assets/service-electrical.jpg',
  },
  {
    slug: 'brake-suspension',
    icon: CheckCircle,
    title: 'Brake & Suspension',
    description:
      'Brake pad replacements, disc resurfacing, shock absorber and suspension tuning.',
    image:
      'assets/service-brake.jpg',
  },
  {
    slug: 'denting-painting',
    icon: Star,
    title: 'Denting & Painting',
    description:
      'Professional body dent removal, scratch repair, and premium automotive painting.',
    image:
      'assets/service-denting.jpg',
  },
  {
    slug: 'oil-lubrication',
    icon: Clock,
    title: 'Oil & Lubrication',
    description:
      'Engine oil changes, lubrication of all moving parts, and complete drivetrain care.',
    image:
      'assets/service-oil.jpg',
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
  'assets/gallery-placeholder.jpg',
  'assets/gallery-placeholder.jpg',
  'assets/gallery-placeholder.jpg',
  'assets/gallery-placeholder.jpg',
]

/* ─── ANIMATION VARIANTS ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
}

/* ─── COMPONENT ─── */
export default function Home() {
  return (
    <div>
      {/* ══════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════ */}
      <section className="relative flex items-center" style={{ minHeight: '100vh' }}>
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="assets/hero.png"
            alt="P.M. Automobile Works Workshop"
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.30)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)',
            }}
          />
        </div>

        {/* Red left accent */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: '3px', background: '#E63946' }}
        />

        <div className="pm-container relative z-10" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ maxWidth: '680px' }}
          >
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-3 mb-6"
            >
              <div style={{ width: '32px', height: '2px', background: '#E63946' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: '#E63946',
                }}
              >
                Trusted Automobile Workshop
              </span>
            </motion.div>

            {/* Headline */}
            <div
              className="heading-display text-white mb-2"
              style={{ color: 'rgba(255,255,255,0.15)', fontSize: 'clamp(1rem,3vw,2rem)', marginBottom: '4px' }}
            >
              Since 1978
            </div>
            <h1 className="heading-display text-white mb-6">
              Complete Auto Care<br />
              <span style={{ color: '#E63946' }}>For Every</span> Journey
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: '16px',
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.75,
                marginBottom: '40px',
                maxWidth: '500px',
              }}
            >
              P.M. Automobile Works has been providing trusted, expert vehicle maintenance
              to Kathmandu since 1978. We service with genuine parts and professional
              technicians for reliable results.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-16">
              <Link to="/book" className="btn-primary" style={{ padding: '15px 36px', fontSize: '13px' }}>
                Book Appointment
              </Link>
              <Link to="/services" className="btn-secondary" style={{ padding: '14px 34px', fontSize: '13px' }}>
                Our Services
              </Link>
            </div>

            {/* Inline Stats */}
            <div className="flex gap-10 flex-wrap">
              {[
                { n: '45+', l: 'Years Experience' },
                { n: '15,000+', l: 'Vehicles Serviced' },
                { n: '25+', l: 'Service Bays' },
                { n: '100%', l: 'Customer Satisfaction' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                >
                  <div
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                      fontWeight: 800,
                      color: '#E63946',
                      lineHeight: 1,
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.4)',
                      marginTop: '4px',
                    }}
                  >
                    {s.l}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Hero right image card — workshop card floating */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          className="absolute right-0 top-0 bottom-0 w-2/5 hidden xl:block"
          style={{ pointerEvents: 'none' }}
        >
          <img
            src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=900&fit=crop&q=80"
            alt="Workshop interior"
            className="h-full w-full object-cover"
            style={{ opacity: 0.25 }}
          />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          ABOUT PREVIEW
      ══════════════════════════════════════════════ */}
      <section style={{ background: '#0D0D0D', padding: '120px 0' }}>
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
                className="relative overflow-hidden"
                style={{ borderRadius: '8px', aspectRatio: '4/3' }}
              >
                <img
                  src="assets/about.jpg"
                  alt="P.M. Automobile Works — Workshop"
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.85)' }}
                />
                {/* Stats overlay card */}
                <div
                  className="absolute bottom-6 right-6 text-center"
                  style={{
                    background: '#E63946',
                    borderRadius: '6px',
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
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    Years of Trust
                  </div>
                </div>
              </div>

              {/* Small floater */}
              <div
                className="absolute -left-6 top-12"
                style={{
                  background: '#111111',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
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
                    background: 'rgba(230,57,70,0.15)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle size={18} color="#E63946" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Quality Guaranteed</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>On all repairs & parts</div>
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
              <h2 className="heading-section text-white mb-6">
                Built on Trust.<br />Driven by Quality.
              </h2>
              <div className="red-line" />
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.8, margin: '20px 0 16px' }}>
                Founded in 1978, P.M. Automobile Works has grown from a small repair shop in
                Tripureshwor, Kathmandu, to one of Nepal's most respected automotive service centers.
                We've built our reputation one satisfied customer at a time.
              </p>
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.8, marginBottom: '32px' }}>
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
                        width: '32px',
                        height: '32px',
                        background: 'rgba(230,57,70,0.1)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color="#E63946" />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{t}</span>
                  </div>
                ))}
              </div>

              <Link to="/about" className="btn-primary" style={{ padding: '13px 28px' }}>
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
      <Statistics />

      {/* ══════════════════════════════════════════════
          SERVICES SECTION
      ══════════════════════════════════════════════ */}
      <section style={{ background: '#0A0A0A', padding: '120px 0' }}>
        <div className="pm-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div>
              <div className="section-label">Our Services</div>
              <h2 className="heading-section text-white mb-4">
                What We Offer
              </h2>
              <div className="red-line" />
              <p style={{ fontSize: '15px', color: '#6B7280', marginTop: '16px', maxWidth: '480px' }}>
                We offer a complete range of automotive services to keep your vehicle
                in prime condition. Our expert technicians use only the best tools and parts.
              </p>
            </div>
            <Link to="/services" className="btn-secondary" style={{ flexShrink: 0 }}>
              View All Services <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="pm-card block group"
                  style={{ overflow: 'hidden' }}
                >
                  {/* Image */}
                  <div style={{ height: '220px', overflow: 'hidden' }}>
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ filter: 'brightness(0.75)' }}
                    />
                  </div>

                  {/* Body */}
                  <div style={{ padding: '24px' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          background: 'rgba(230,57,70,0.12)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <service.icon size={20} color="#E63946" />
                      </div>
                      <h3 className="heading-card text-white">{service.title}</h3>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.7, marginBottom: '16px' }}>
                      {service.description}
                    </p>
                    <div
                      className="flex items-center gap-2 text-red-500 font-semibold uppercase tracking-widest transition-all duration-200 group-hover:gap-3"
                      style={{ fontSize: '11px' }}
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
      <section style={{ background: '#111111', padding: '120px 0' }}>
        <div className="pm-container">
          <div className="text-center mb-16">
            <div className="section-label">Why Choose Us</div>
            <h2 className="heading-section text-white mb-4">
              The P.M. Automobile Difference
            </h2>
            <div className="red-line red-line-center" />
            <p style={{ fontSize: '15px', color: '#6B7280', marginTop: '16px', maxWidth: '520px', margin: '16px auto 0' }}>
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
                className="text-center"
                style={{
                  padding: '32px 20px',
                  background: '#0D0D0D',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  transition: 'border-color 0.3s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(230,57,70,0.3)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                <div
                  className="mx-auto mb-5"
                  style={{
                    width: '56px',
                    height: '56px',
                    background: 'rgba(230,57,70,0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.icon size={26} color="#E63946" />
                </div>
                <h3
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'white',
                    marginBottom: '8px',
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.65 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          GALLERY PREVIEW
      ══════════════════════════════════════════════ */}
      <section style={{ background: '#0A0A0A', padding: '120px 0' }}>
        <div className="pm-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="section-label">Gallery</div>
              <h2 className="heading-section text-white">Our Workshop</h2>
              <div className="red-line" style={{ marginTop: '16px' }} />
            </div>
            <Link to="/gallery" className="btn-secondary" style={{ flexShrink: 0 }}>
              View Full Gallery <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {galleryImages.map((src, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
                className="relative overflow-hidden group"
                style={{ borderRadius: '6px', aspectRatio: '4/3', cursor: 'pointer' }}
              >
                <img
                  src={src}
                  alt={`Workshop ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  style={{ filter: 'brightness(0.7)' }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                  style={{ background: 'rgba(230,57,70,0.4)' }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronRight size={20} color="#E63946" />
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
          background: '#111111',
          padding: '60px 0',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="pm-container">
          <div className="text-center mb-10">
            <p
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#6B7280',
              }}
            >
              Brands We Service
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {brands.map((brand) => (
              <img
                key={brand.name}
                src={brand.logo}
                alt={brand.name}
                title={brand.name}
                style={{ height: '32px', filter: 'brightness(0) invert(1)', opacity: 0.35, transition: 'opacity 0.3s' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = '0.8')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = '0.35')}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════ */}
      <FAQ />

      {/* ══════════════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════════════ */}
      <section className="relative" style={{ padding: '120px 0', background: '#0A0A0A', overflow: 'hidden' }}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1920&h=600&fit=crop&q=80"
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.12)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, transparent, #0A0A0A)' }}
          />
        </div>

        <div className="pm-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
            style={{ maxWidth: '640px', margin: '0 auto' }}
          >
            <div className="section-label" style={{ textAlign: 'center' }}>Need Immediate Assistance?</div>
            <h2 className="heading-section text-white mb-4">
              Book Your Service Today
            </h2>
            <div className="red-line red-line-center" />
            <p style={{ fontSize: '15px', color: '#9CA3AF', margin: '20px 0 40px', lineHeight: 1.7 }}>
              Our team is ready to help you. Book your appointment today and experience
              Kathmandu's most trusted automotive care since 1978.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/book" className="btn-primary" style={{ padding: '15px 40px', fontSize: '13px' }}>
                Book Appointment
              </Link>
              <Link to="/contact" className="btn-secondary" style={{ padding: '14px 38px', fontSize: '13px' }}>
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
