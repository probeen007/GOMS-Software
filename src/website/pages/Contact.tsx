import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'
import PageHero from '../components/PageHero'

export default function Contact() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [sent, setSent] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  const contactInfo = [
    {
      icon: MapPin,
      label: 'Location',
      value: 'Tripureshwor, Kathmandu-11, Bagmati Province, Nepal',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+977 985-123-4567',
      href: 'tel:+9779851234567',
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'info@pmautomobileworks.com.np',
      href: 'mailto:info@pmautomobileworks.com.np',
    },
    {
      icon: Clock,
      label: 'Working Hours',
      value: 'Sun–Fri: 8 AM–7 PM · Sat: 9 AM–5 PM',
    },
  ]

  return (
    <div>
      <PageHero
        title="Contact Us"
        subtitle="Get in touch with our team. We are here to help with any enquiry about your vehicle."
        breadcrumbs={[{ label: 'Contact Us' }]}
        backgroundImage="/assets/hero.png"
      />

      <section style={{ background: '#0A0A0A', padding: '80px 0 120px' }}>
        <div className="pm-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left — Info */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="section-label">Get in Touch</div>
              <h2 className="heading-section text-white mb-4">Contact Information</h2>
              <div className="red-line" style={{ marginBottom: '32px' }} />

              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.8, marginBottom: '36px' }}>
                Have questions about your vehicle, our services, or pricing? Reach out to us directly.
                Our team is available Sunday through Saturday to assist you.
              </p>

              {/* Contact Cards */}
              <div className="space-y-4 mb-10">
                {contactInfo.map(({ icon: Icon, label, value, href }, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      background: '#111111',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '6px',
                      padding: '20px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        background: 'rgba(230,57,70,0.12)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} color="#E63946" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: '#6B7280',
                          marginBottom: '4px',
                        }}
                      >
                        {label}
                      </div>
                      {href ? (
                        <a
                          href={href}
                          style={{ fontSize: '14px', color: 'white', fontWeight: 500 }}
                          className="hover:text-red-400 transition-colors"
                        >
                          {value}
                        </a>
                      ) : (
                        <div style={{ fontSize: '14px', color: 'white', fontWeight: 500 }}>{value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social */}
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#6B7280',
                    marginBottom: '16px',
                  }}
                >
                  Follow Us
                </div>
                <div className="flex gap-3">
                  {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        background: '#111111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.5)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement
                        el.style.background = '#E63946'
                        el.style.color = 'white'
                        el.style.borderColor = '#E63946'
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement
                        el.style.background = '#111111'
                        el.style.color = 'rgba(255,255,255,0.5)'
                        el.style.borderColor = 'rgba(255,255,255,0.08)'
                      }}
                    >
                      <Icon size={18} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div
                style={{
                  marginTop: '32px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  height: '240px',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <iframe
                  title="P.M. Automobile Works Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.1!2d85.3096!3d27.6966!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjfCsDQxJzQ4LjAiTiA4NcKwMTgnMzQuNiJF!5e0!3m2!1sen!2snp!4v1625000000000!5m2!1sen!2snp"
                  width="100%"
                  height="240"
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Right — Form */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <div
                style={{
                  background: '#111111',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '8px',
                  padding: '48px',
                }}
              >
                <div className="section-label">Send a Message</div>
                <h3
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'white',
                    marginBottom: '8px',
                    letterSpacing: '0.04em',
                  }}
                >
                  Get In Touch
                </h3>
                <div className="red-line" style={{ marginBottom: '32px' }} />

                {sent ? (
                  <div className="text-center" style={{ padding: '40px 0' }}>
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        background: 'rgba(230,57,70,0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                      }}
                    >
                      <Send size={28} color="#E63946" />
                    </div>
                    <h4 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '12px', textTransform: 'uppercase' }}>
                      Message Sent!
                    </h4>
                    <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '24px' }}>
                      Thank you for reaching out. We will get back to you within 24 hours.
                    </p>
                    <button onClick={() => setSent(false)} className="btn-secondary" style={{ fontSize: '12px' }}>
                      Send Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          placeholder="Your name"
                          required
                          className="pm-input"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          required
                          className="pm-input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+977 98X-XXX-XXXX"
                          className="pm-input"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Subject
                        </label>
                        <input
                          type="text"
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          placeholder="How can we help?"
                          className="pm-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Your Message *
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us about your vehicle or enquiry..."
                        required
                        className="pm-textarea"
                        rows={6}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ padding: '14px 36px', fontSize: '13px' }}
                    >
                      Send Message
                      <Send size={16} />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
