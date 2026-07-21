import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Star, Zap, CheckCircle, Users, Award, Clock } from 'lucide-react'
import PageHero from '../components/PageHero'
import Statistics from '../components/Statistics'
import BrandLogos from '../components/BrandLogos'

const values = [
  {
    icon: Shield,
    title: 'Integrity',
    desc: 'We are transparent in every service, every quote, and every interaction with our customers.',
  },
  {
    icon: Star,
    title: 'Quality',
    desc: 'We use only genuine, certified parts and follow manufacturer-approved service procedures.',
  },
  {
    icon: Zap,
    title: 'Innovation',
    desc: 'We continuously update our tools, techniques, and training to stay ahead in automotive care.',
  },
  {
    icon: CheckCircle,
    title: 'Commitment',
    desc: 'We stand behind every repair with guarantees and a dedication to long-term relationships.',
  },
]

const team = [
  {
    name: 'Prakash Maharjan',
    role: 'Founder & Chief Mechanic',
    exp: '45+ Years',
    image: '/assets/im5.jpg',
  },
  {
    name: 'Bikash Shrestha',
    role: 'Head of Engine Diagnostics',
    exp: '20+ Years',
    image: '/assets/img6.jpg',
  },
  {
    name: 'Sushil Tamang',
    role: 'Electrical Systems Expert',
    exp: '15+ Years',
    image: '/assets/img7.jpg',
  },
  {
    name: 'Raju Gurung',
    role: 'Body & Paint Specialist',
    exp: '18+ Years',
    image: '/assets/img8.jpg',
  },
]

const achievements = [
  { icon: Award, label: 'Best Auto Workshop', sub: 'Kathmandu — 2019, 2022' },
  { icon: Users, label: '15,000+ Customers', sub: 'Served over four decades' },
  { icon: Clock, label: 'Since 1978', sub: 'Over 45 years in business' },
  { icon: CheckCircle, label: 'ISO Certified', sub: 'Quality management system' },
]

const brandLogos = [
  { name: 'Toyota', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg' },
  { name: 'Hyundai', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg' },
  { name: 'Suzuki', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo_2.svg' },
  { name: 'Kia', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Kia-logo.svg' },
  { name: 'Honda', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg' },
  { name: 'Nissan', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Nissan_2020_logo.svg' },
  { name: 'Mahindra', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Mahindra_Logo.png' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
}

export default function AboutUs() {
  return (
    <div>
      <PageHero
        title="About Us"
        subtitle="Kathmandu's most trusted automotive service center since 1978."
        breadcrumbs={[{ label: 'About Us' }]}
        backgroundImage="/assets/hero.png"
      />

      {/* ── Our Story ── */}
      <section style={{ background: '#0A0A0A', padding: '120px 0' }}>
        <div className="pm-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="section-label">Our Story</div>
              <h2 className="heading-section text-white mb-4">
                P.M. Automobile Works
              </h2>
              <h3
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: '#E63946',
                  letterSpacing: '0.05em',
                  marginBottom: '20px',
                }}
              >
                Built on Trust. Driven by Quality.
              </h3>
              <div className="red-line" />
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.8, margin: '20px 0 16px' }}>
                P.M. Automobile Works was founded in 1978 by Prakash Maharjan in the heart of
                Tripureshwor, Kathmandu. What began as a humble two-bay repair shop grew steadily
                over the decades, built on a foundation of honest workmanship and genuine care
                for every customer's vehicle.
              </p>
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.8, marginBottom: '16px' }}>
                Today, we operate from a fully equipped, modern workshop with over 25 trained
                technicians, computerized diagnostic systems, and a commitment to using only
                genuine OEM parts. We service all major vehicle brands — from Japanese sedans
                to European SUVs.
              </p>
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.8, marginBottom: '36px' }}>
                Over 15,000 vehicles have passed through our workshop. Each one received the same
                meticulous attention that earned us Kathmandu's trust — and we intend to keep it
                that way for the next 45 years.
              </p>

              {/* Checklist */}
              {[
                'Fully equipped modern diagnostic workshop',
                'Home & office pick-up and drop-off service',
                'Certified and continuously trained technicians',
                'Genuine OEM and high-grade aftermarket parts',
                'Transparent pricing with detailed invoices',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <CheckCircle size={16} color="#E63946" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: '#D1D5DB' }}>{item}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              viewport={{ once: true }}
            >
              {/* Main Image */}
              <div
                style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '16px', aspectRatio: '4/3' }}
              >
                <img
                  src="/assets/about.jpg"
                  alt="P.M. Automobile Works Workshop"
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.8)' }}
                />
              </div>

              {/* Two-col image row */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  '/assets/img6.jpg',
                  '/assets/img7.jpg',
                ].map((src, i) => (
                  <div key={i} style={{ borderRadius: '6px', overflow: 'hidden', aspectRatio: '4/3' }}>
                    <img
                      src={src}
                      alt={`Workshop ${i + 1}`}
                      className="w-full h-full object-cover"
                      style={{ filter: 'brightness(0.75)' }}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Statistics ── */}
      <Statistics />

      {/* ── Our Values ── */}
      <section style={{ background: '#111111', padding: '120px 0' }}>
        <div className="pm-container">
          <div className="text-center mb-16">
            <div className="section-label">Our Values</div>
            <h2 className="heading-section text-white mb-4">What Drives Us</h2>
            <div className="red-line red-line-center" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
                style={{
                  background: '#0D0D0D',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '36px 28px',
                  textAlign: 'center',
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
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <v.icon size={26} color="#E63946" />
                </div>
                <h3
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'white',
                    marginBottom: '10px',
                  }}
                >
                  {v.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.7 }}>{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Well Equipped Workshop ── */}
      <section className="relative py-32 bg-gray-900 overflow-hidden">
        <img
          src="/assets/general.jpg"
          alt="Well Equipped Workshop"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="pm-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              style={{ position: 'relative' }}
            >
              <div style={{ borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/11' }}>
                <img
                  src="/assets/engine.jpg"
                  alt="Well Equipped Workshop"
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.7)' }}
                />
              </div>

              {/* Achievement badges */}
              <div
                className="absolute -right-8 bottom-8 grid grid-cols-2 gap-3"
                style={{ maxWidth: '240px' }}
              >
                {achievements.map(({ icon: Icon, label, sub }, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#111111',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '14px',
                    }}
                  >
                    <Icon size={20} color="#E63946" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>{label}</div>
                    <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              viewport={{ once: true }}
            >
              <div className="section-label">Our Workshop</div>
              <h2 className="heading-section text-white mb-6">
                Well Equipped Workshop
              </h2>
              <div className="red-line" />
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.8, margin: '20px 0 16px' }}>
                Our workshop in Tripureshwor, Kathmandu is equipped with modern computerized
                diagnostic machines, hydraulic lifts, wheel alignment equipment, and a
                dedicated paint booth for body and paint work.
              </p>
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.8, marginBottom: '32px' }}>
                We invest continuously in the latest automotive technology to ensure our
                technicians have everything they need to diagnose and repair your vehicle
                correctly the first time — saving you time and money.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { n: '45+', l: 'Years Experience' },
                  { n: '15,000+', l: 'Vehicle Serviced' },
                  { n: '25+', l: 'Service Bays' },
                  { n: '100%', l: 'Customer Satisfaction' },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#111111',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '6px',
                      padding: '20px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '2.2rem',
                        fontWeight: 800,
                        color: '#E63946',
                        lineHeight: 1,
                        marginBottom: '4px',
                      }}
                    >
                      {s.n}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280' }}>
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Brands We Service ── */}
      <section
        style={{
          background: '#111111',
          padding: '64px 0',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="pm-container">
          <div className="text-center mb-10">
            <div className="section-label">Brands We Service</div>
          </div>
          <BrandLogos />
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#E63946', padding: '80px 0' }}>
        <div className="pm-container text-center">
          <h2
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'white',
              marginBottom: '16px',
            }}
          >
            Ready to Experience the Difference?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>
            Book your appointment today and let Kathmandu's most trusted workshop take care of your vehicle.
          </p>
          <Link
            to="/book"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 36px',
              background: 'white',
              color: '#E63946',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              borderRadius: '4px',
              transition: 'transform 0.2s ease',
            }}
          >
            Book Appointment
          </Link>
        </div>
      </section>
    </div>
  )
}
