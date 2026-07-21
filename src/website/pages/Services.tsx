import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wrench,
  ShieldCheck,
  Cpu,
  Disc,
  Paintbrush,
  Droplet,
  ArrowRight,
  Phone,
} from 'lucide-react'
import PageHero from '../components/PageHero'

export const allServices = [
  {
    slug: 'engine-repair',
    icon: Wrench,
    title: 'Engine Repair',
    shortDesc: 'Expert engine diagnostics, overhaul, and precision repair for all brands.',
    image: '/assets/engine.jpg',
    features: [
      'Engine Overhaul',
      'Timing Belt Replacement',
      'Fuel System Repair',
      'Engine Tuning',
      'Performance Optimization',
    ],
  },
  {
    slug: 'general-servicing',
    icon: ShieldCheck,
    title: 'General Servicing',
    shortDesc: 'Full vehicle health checks, fluid replacements, and preventive maintenance.',
    image: '/assets/general.jpg',
    features: [
      'Oil & Filter Change',
      'Air Filter Replacement',
      'Spark Plug Service',
      'Coolant Flush',
      'Multi-Point Inspection',
    ],
  },
  {
    slug: 'electrical-repair',
    icon: Cpu,
    title: 'Electrical Repair',
    shortDesc: 'Battery, ECU diagnostics, wiring repairs, and advanced electrical systems.',
    image: '/assets/wirring.jpg',
    features: [
      'Battery Replacement',
      'Alternator Repair',
      'ECU Diagnostics',
      'Wiring Harness Repair',
      'Lighting Systems',
    ],
  },
  {
    slug: 'brake-suspension',
    icon: Disc,
    title: 'Brake & Suspension',
    shortDesc: 'Brake pad replacements, disc servicing, and full suspension tuning.',
    image: '/assets/break.png',
    features: [
      'Brake Pad Replacement',
      'Disc Resurfacing',
      'ABS System Repair',
      'Shock Absorbers',
      'Wheel Alignment',
    ],
  },
  {
    slug: 'denting-painting',
    icon: Paintbrush,
    title: 'Denting & Painting',
    shortDesc: 'Professional dent removal, scratch repair, and premium automotive painting.',
    image: '/assets/paint.png',
    features: [
      'Dent Removal',
      'Panel Beating',
      'Full Body Painting',
      'Spot Paint Repair',
      'Rust Treatment',
    ],
  },
  {
    slug: 'oil-lubrication',
    icon: Droplet,
    title: 'Oil & Lubrication',
    shortDesc: 'Engine oil changes, drivetrain lubrication, and complete fluid maintenance.',
    image: '/assets/oil.png',
    features: [
      'Synthetic Oil Change',
      'Gear Box Oil',
      'Differential Fluid',
      'Power Steering Fluid',
      'Brake Fluid Flush',
    ],
  },
]


const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
}

export default function Services() {
  return (
    <div>
      <PageHero
        title="Our Services"
        subtitle="A complete range of automotive services delivered by expert technicians using genuine parts."
        breadcrumbs={[{ label: 'Services' }]}
        backgroundImage="/assets/hero.png"
      />

      {/* Intro */}
      <section style={{ background: '#FFFFFF', padding: '80px 0 60px' }}>
        <div className="pm-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="section-label">What We Do</div>
              <h2 className="heading-section text-slate-900 mb-4">
                Complete Automotive Solutions
              </h2>
              <div className="red-line" />
            </div>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.8 }}>
              We offer a complete range of automotive services to keep your vehicle in the best
              condition. Our expert technicians use advanced tools, genuine spare parts, and
              follow manufacturer-approved procedures for reliable, long-lasting results.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ background: '#F8FAFC', padding: '0 0 120px' }}>
        <div className="pm-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allServices.map((service, i) => (
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
                  <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&h=400&fit=crop&q=80";
                      }}
                    />
                    {/* Red badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        background: '#E63946',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'white',
                      }}
                    >
                      Professional
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '24px', background: '#FFFFFF' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          background: 'rgba(230,57,70,0.1)',
                          border: '1px solid rgba(230,57,70,0.15)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <service.icon size={20} color="#E63946" />
                      </div>
                      <h3
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: '#0F172A',
                        }}
                      >
                        {service.title}
                      </h3>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.7, marginBottom: '16px' }}>
                      {service.shortDesc}
                    </p>

                    {/* Features */}
                    <ul className="mb-5 space-y-2">
                      {service.features.slice(0, 3).map((f, fi) => (
                        <li key={fi} className="flex items-center gap-2">
                          <div
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: '#E63946',
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className="flex items-center gap-2 font-bold uppercase tracking-widest transition-all duration-200 group-hover:gap-3"
                      style={{ fontSize: '11px', color: '#E63946' }}
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

      {/* CTA Banner */}
      <section
        className="relative"
        style={{
          background: '#FFFFFF',
          padding: '80px 0',
          borderTop: '1px solid #E2E8F0',
        }}
      >
        <div className="pm-container">
          <div
            className="flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl"
            style={{
              background: '#E63946',
              borderRadius: '12px',
              padding: '48px 56px',
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'white',
                  marginBottom: '8px',
                }}
              >
                Need Immediate Assistance?
              </h3>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)' }}>
                Our team is ready to help you. Book your appointment today.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 flex-shrink-0">
              <Link
                to="/book"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 28px',
                  background: 'white',
                  color: '#E63946',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s',
                }}
              >
                Book Appointment
              </Link>
              <a
                href="tel:01-4525461"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 28px',
                  background: 'transparent',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.6)',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Phone size={14} /> Call Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

