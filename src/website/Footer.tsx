import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Our Services', href: '/services' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Book Appointment', href: '/book' },
  { label: 'Contact Us', href: '/contact' },
]

const serviceLinks = [
  { label: 'Engine Repair', href: '/services/engine-repair' },
  { label: 'General Servicing', href: '/services' },
  { label: 'Electrical Repair', href: '/services' },
  { label: 'Brake & Suspension', href: '/services' },
  { label: 'Denting & Painting', href: '/services' },
  { label: 'Oil & Lubrication', href: '/services' },
]

const socialIcons = [
  { Icon: Facebook, href: '#', label: 'Facebook' },
  { Icon: Instagram, href: '#', label: 'Instagram' },
  { Icon: Twitter, href: '#', label: 'Twitter' },
  { Icon: Youtube, href: '#', label: 'YouTube' },
]

export default function Footer() {
  return (
    <footer
      style={{
        background: '#050505',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Main Footer */}
      <div className="pm-container" style={{ padding: '80px 40px 60px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center mb-6">
              <img
                src="/logo.png"
                alt="P.M. Automobile Works"
                style={{
                  height: '48px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </Link>
            <p
              className="mb-6"
              style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.7 }}
            >
              P.M. Automobile Works has been providing trusted, premium automotive
              care to Kathmandu since 1978. Complete auto care for every journey.
            </p>
            <div className="flex gap-3">
              {socialIcons.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = '#E63946'
                    el.style.color = 'white'
                    el.style.borderColor = '#E63946'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = 'rgba(255,255,255,0.06)'
                    el.style.color = 'rgba(255,255,255,0.5)'
                    el.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'white',
                marginBottom: '24px',
              }}
            >
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="flex items-center gap-2 transition-colors duration-200"
                    style={{ fontSize: '13px', color: '#6B7280' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'white')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#6B7280')}
                  >
                    <span
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: '#E63946',
                        flexShrink: 0,
                      }}
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Services */}
          <div>
            <h4
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'white',
                marginBottom: '24px',
              }}
            >
              Our Services
            </h4>
            <ul className="space-y-3">
              {serviceLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="flex items-center gap-2 transition-colors duration-200"
                    style={{ fontSize: '13px', color: '#6B7280' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'white')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#6B7280')}
                  >
                    <span
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: '#E63946',
                        flexShrink: 0,
                      }}
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Book */}
          <div>
            <h4
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'white',
                marginBottom: '24px',
              }}
            >
              Book Appointment
            </h4>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px', lineHeight: 1.7 }}>
              Get your vehicle serviced by our expert technicians. Book your slot today.
            </p>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <MapPin size={16} color="#E63946" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#6B7280' }}>
                  Tripureshwor, Kathmandu-11, Nepal
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} color="#E63946" style={{ flexShrink: 0 }} />
                <a
                  href="tel:+9779851234567"
                  style={{ fontSize: '13px', color: '#6B7280' }}
                  className="hover:text-white transition-colors"
                >
                  +977 985-123-4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} color="#E63946" style={{ flexShrink: 0 }} />
                <a
                  href="mailto:info@pmautomobileworks.com.np"
                  style={{ fontSize: '13px', color: '#6B7280' }}
                  className="hover:text-white transition-colors"
                >
                  info@pmautomobileworks.com.np
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} color="#E63946" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  <div>Sun–Fri: 8:00 AM – 7:00 PM</div>
                  <div>Saturday: 9:00 AM – 5:00 PM</div>
                </div>
              </li>
            </ul>
            <Link to="/book" className="btn-primary" style={{ fontSize: '12px', padding: '10px 24px' }}>
              Book Now
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 0',
        }}
      >
        <div
          className="pm-container flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ padding: '0 40px' }}
        >
          <p style={{ fontSize: '12px', color: '#4B5563' }}>
            © {new Date().getFullYear()} P.M. Automobile Works. All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              style={{ fontSize: '12px', color: '#4B5563' }}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              style={{ fontSize: '12px', color: '#4B5563' }}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
