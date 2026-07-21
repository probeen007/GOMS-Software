import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, ArrowRight, Phone, Shield, Star } from 'lucide-react'
import PageHero from '../components/PageHero'
import { allServices } from './Services'
import { FAQItem } from '../components/FAQ'
import { useState } from 'react'

const serviceDetails: Record<
  string,
  {
    longDesc: string
    process: { step: string; desc: string }[]
    benefits: { icon: typeof CheckCircle; title: string; desc: string }[]
    pricing: { label: string; price: string }[]
    faqs: { q: string; a: string }[]
  }
> = {
  'engine-repair': {
    longDesc:
      'Our engine repair service covers everything from simple tune-ups to full engine overhauls. Our certified technicians use the latest computerized diagnostics to pinpoint issues accurately, saving you time and money on unnecessary repairs.',
    process: [
      { step: '01', desc: 'Complete engine diagnostic scan using OBD-II tools' },
      { step: '02', desc: 'Detailed inspection and fault analysis report' },
      { step: '03', desc: 'Customer approval on repair plan and cost estimate' },
      { step: '04', desc: 'Precision repair using genuine OEM parts' },
      { step: '05', desc: 'Post-repair testing and quality verification' },
    ],
    benefits: [
      { icon: Shield, title: 'Improved Performance', desc: 'Restored power output and fuel efficiency' },
      { icon: Star, title: 'Better Fuel Economy', desc: 'Optimized combustion for maximum mileage' },
      { icon: CheckCircle, title: 'Reduced Emissions', desc: 'Cleaner exhaust and environmental compliance' },
      { icon: Clock, title: 'Longer Engine Life', desc: 'Extended engine lifespan with proper repairs' },
    ],
    pricing: [
      { label: 'Engine Diagnostic', price: 'From NPR 1,500' },
      { label: 'Timing Belt Replacement', price: 'From NPR 8,000' },
      { label: 'Engine Tune-Up', price: 'From NPR 4,500' },
      { label: 'Full Engine Overhaul', price: 'Contact for Quote' },
    ],
    faqs: [
      { q: 'How often should I service my engine?', a: 'We recommend an engine service every 5,000–10,000 km depending on your vehicle type and driving conditions. Regular servicing catches issues early and prevents major failures.' },
      { q: 'What are the signs of engine problems?', a: 'Watch for unusual noises (knocking, ticking), warning lights, smoke from the hood, loss of power, poor fuel economy, or oil leaks. Any of these warrant an immediate inspection.' },
      { q: 'Do you use genuine parts for engine repairs?', a: 'Yes. We use only OEM-grade genuine parts sourced directly from authorized dealers or certified suppliers. All parts come with manufacturer warranties.' },
      { q: 'How long does an engine repair take?', a: 'Simple repairs like a tune-up take 2–4 hours. More complex jobs like a full overhaul may take 3–5 days. We provide accurate timeframes after initial diagnosis.' },
    ],
  },
  'general-servicing': {
    longDesc:
      'Our comprehensive general servicing keeps your vehicle in peak condition. We follow manufacturer-specified service schedules and use genuine fluids and filters for optimal performance and longevity.',
    process: [
      { step: '01', desc: 'Vehicle intake and initial condition check' },
      { step: '02', desc: 'Engine oil and filter replacement' },
      { step: '03', desc: 'Air, fuel, and cabin filter inspection/replacement' },
      { step: '04', desc: 'All fluid levels check and top-up' },
      { step: '05', desc: 'Complete multi-point safety inspection' },
    ],
    benefits: [
      { icon: Shield, title: 'Prevents Breakdowns', desc: 'Regular servicing prevents unexpected failures' },
      { icon: Star, title: 'Better Resale Value', desc: 'Full service history increases vehicle value' },
      { icon: CheckCircle, title: 'Fuel Efficiency', desc: 'Clean filters and fresh oil improve economy' },
      { icon: Clock, title: 'Peace of Mind', desc: 'Drive with confidence knowing your car is checked' },
    ],
    pricing: [
      { label: 'Basic Service (Oil + Filter)', price: 'From NPR 2,500' },
      { label: 'Interim Service', price: 'From NPR 5,000' },
      { label: 'Full Service', price: 'From NPR 9,000' },
      { label: 'Major Service', price: 'From NPR 15,000' },
    ],
    faqs: [
      { q: 'How often should I get a general service?', a: 'Most vehicles require servicing every 5,000–10,000 km or every 6 months, whichever comes first. Check your owner manual for your specific model requirements.' },
      { q: 'What is included in a full service?', a: 'A full service includes engine oil and filter change, all fluid checks and top-ups, brake inspection, tyre pressure check, battery test, air filter, and a comprehensive 50-point safety check.' },
      { q: 'Do you provide a service report?', a: 'Yes. After every service, we provide a detailed inspection report highlighting items serviced, parts replaced, and any recommendations for future attention.' },
      { q: 'Can you service my car at my office?', a: 'Yes, we offer mobile servicing for basic services within Kathmandu valley. Please contact us to arrange a convenient time and location.' },
    ],
  },
}

// Fallback detail for services without custom details
const defaultDetail = {
  longDesc:
    'Our professional service team delivers expert care for your vehicle using the latest equipment and genuine OEM parts. We follow strict quality standards to ensure every job is done right the first time.',
  process: [
    { step: '01', desc: 'Initial vehicle inspection and problem identification' },
    { step: '02', desc: 'Detailed diagnosis and cost estimate provided' },
    { step: '03', desc: 'Customer approval before any work begins' },
    { step: '04', desc: 'Expert repair using genuine certified parts' },
    { step: '05', desc: 'Quality check and road test before delivery' },
  ],
  benefits: [
    { icon: Shield, title: 'Expert Technicians', desc: '25+ certified automotive professionals' },
    { icon: Star, title: 'Genuine Parts', desc: 'OEM-grade components with warranty' },
    { icon: CheckCircle, title: 'Quality Assured', desc: '3-month warranty on all repair work' },
    { icon: Clock, title: 'Fast Turnaround', desc: 'Efficient service with minimal downtime' },
  ],
  pricing: [
    { label: 'Basic Package', price: 'From NPR 2,000' },
    { label: 'Standard Package', price: 'From NPR 5,000' },
    { label: 'Premium Package', price: 'From NPR 10,000' },
    { label: 'Custom Quote', price: 'Contact Us' },
  ],
  faqs: [
    { q: 'Do you offer a warranty on this service?', a: 'Yes. All our services come with a 3-month / 5,000 km warranty on parts and labor.' },
    { q: 'How long does the service take?', a: 'Service time varies depending on the complexity. We provide accurate timeframes after initial inspection.' },
    { q: 'Do you use genuine parts?', a: 'Yes. We exclusively use OEM-grade genuine parts or certified high-quality aftermarket components.' },
    { q: 'Can I drop off my car without an appointment?', a: 'Walk-ins are welcome, however, booking in advance ensures a faster turnaround and a dedicated technician for your vehicle.' },
  ],
}

export default function ServiceDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const service = allServices.find((s) => s.slug === slug)
  if (!service) return <Navigate to="/services" replace />

  const detail = serviceDetails[slug] || defaultDetail
  const otherServices = allServices.filter((s) => s.slug !== slug).slice(0, 3)

  return (
    <div>
      <PageHero
        title={service.title}
        subtitle={service.shortDesc}
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: service.title },
        ]}
        backgroundImage={service.image}
      />

      {/* Main Content */}
      <section style={{ background: '#0A0A0A', padding: '80px 0' }}>
        <div className="pm-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left — Main */}
            <div className="lg:col-span-2">
              {/* Hero image */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '40px' }}
              >
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full object-cover"
                  style={{ height: '400px', filter: 'brightness(0.8)' }}
                />
              </motion.div>

              {/* Description */}
              <div className="mb-10">
                <div className="section-label">{service.title} Service</div>
                <h2 className="heading-section text-white mb-6">{service.title} Service</h2>
                <div className="red-line" />
                <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.8, marginTop: '20px' }}>
                  {detail.longDesc}
                </p>
              </div>

              {/* Our Process */}
              <div className="mb-12">
                <h3
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'white',
                    marginBottom: '24px',
                  }}
                >
                  Our Process
                </h3>
                <div className="space-y-4">
                  {detail.process.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-5"
                      style={{
                        background: '#111111',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '6px',
                        padding: '18px 22px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          fontSize: '1.8rem',
                          fontWeight: 800,
                          color: '#E63946',
                          lineHeight: 1,
                          flexShrink: 0,
                          minWidth: '40px',
                        }}
                      >
                        {p.step}
                      </span>
                      <p style={{ fontSize: '14px', color: '#D1D5DB', lineHeight: 1.6, paddingTop: '4px' }}>
                        {p.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-12">
                <h3
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'white',
                    marginBottom: '24px',
                  }}
                >
                  Benefits
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  {detail.benefits.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#111111',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '6px',
                        padding: '24px',
                      }}
                    >
                      <b.icon size={24} color="#E63946" style={{ marginBottom: '12px' }} />
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'white',
                          marginBottom: '6px',
                        }}
                      >
                        {b.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>{b.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-12">
                <h3
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'white',
                    marginBottom: '24px',
                  }}
                >
                  Pricing
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {detail.pricing.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#111111',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '6px',
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#D1D5DB', fontWeight: 500 }}>{p.label}</span>
                      <span style={{ fontSize: '13px', color: '#E63946', fontWeight: 700 }}>{p.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div>
                <h3
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'white',
                    marginBottom: '24px',
                  }}
                >
                  Frequently Asked Questions
                </h3>
                {detail.faqs.map((faq, i) => (
                  <FAQItem
                    key={i}
                    question={faq.q}
                    answer={faq.a}
                    isOpen={openFAQ === i}
                    onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                  />
                ))}
              </div>
            </div>

            {/* Right — Sidebar */}
            <div>
              {/* Book Appointment Card */}
              <div
                style={{
                  background: '#111111',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '32px',
                  position: 'sticky',
                  top: '100px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'white',
                    marginBottom: '8px',
                  }}
                >
                  Book This Service
                </div>
                <div className="red-line" style={{ marginBottom: '20px' }} />
                <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.7, marginBottom: '24px' }}>
                  Schedule your appointment online or call us directly. Our team will confirm within 24 hours.
                </p>

                {/* Benefits list */}
                <div className="space-y-3 mb-8">
                  {[
                    'Expert Certified Technicians',
                    'Genuine OEM Parts Only',
                    '3-Month Repair Warranty',
                    'Free Post-Service Inspection',
                    'Customer Satisfaction Guaranteed',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle size={14} color="#E63946" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#D1D5DB' }}>{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/book"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
                >
                  Book Appointment
                </Link>
                <a
                  href="tel:+9779851234567"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '13px 16px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.7)',
                    transition: 'border-color 0.2s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  <Phone size={16} /> Call Us Now
                </a>

                {/* Working hours */}
                <div
                  style={{
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: '#6B7280',
                      marginBottom: '12px',
                    }}
                  >
                    Working Hours
                  </div>
                  {[
                    { d: 'Sunday – Friday', t: '8:00 AM – 7:00 PM' },
                    { d: 'Saturday', t: '9:00 AM – 5:00 PM' },
                  ].map(({ d, t }, i) => (
                    <div key={i} className="flex justify-between mb-2">
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{d}</span>
                      <span style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Services */}
      <section style={{ background: '#111111', padding: '80px 0' }}>
        <div className="pm-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="section-label">More Services</div>
              <h2 className="heading-section text-white">Other Services</h2>
            </div>
            <Link to="/services" className="btn-secondary" style={{ flexShrink: 0 }}>
              All Services <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherServices.map((s, i) => (
              <Link
                key={s.slug}
                to={`/services/${s.slug}`}
                className="pm-card group block"
                style={{ overflow: 'hidden' }}
              >
                <div style={{ height: '180px', overflow: 'hidden' }}>
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: 'brightness(0.7)' }}
                  />
                </div>
                <div style={{ padding: '20px' }}>
                  <h4
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'white',
                      marginBottom: '6px',
                    }}
                  >
                    {s.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6, marginBottom: '12px' }}>
                    {s.shortDesc}
                  </p>
                  <div
                    className="flex items-center gap-2 transition-gap duration-200 group-hover:gap-3"
                    style={{ fontSize: '11px', color: '#E63946', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                  >
                    View Service <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
