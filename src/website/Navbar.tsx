import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, MapPin, Menu, X, ChevronDown } from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Engine Repair', href: '/services/engine-repair' },
      { label: 'General Servicing', href: '/services/general-servicing' },
      { label: 'Electrical Repair', href: '/services/electrical-repair' },
      { label: 'Brake & Suspension', href: '/services/brake-suspension' },
      { label: 'Denting & Painting', href: '/services/denting-painting' },
      { label: 'Oil & Lubrication', href: '/services/oil-lubrication' },
    ],
  },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact Us', href: '/contact' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setActiveDropdown(null)
  }, [location.pathname])

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(5,5,5,0.98)' : '#0A0A0A',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top Bar */}
      <div style={{ background: '#E63946', padding: '8px 0' }}>
        <div className="pm-container">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-6">
              <a
                href="tel:+9779851234567"
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
                style={{ fontSize: '12px', fontWeight: 500 }}
              >
                <Phone size={13} />
                <span>+977 985-123-4567</span>
              </a>
              <a
                href="mailto:info@pmautomobile.com.np"
                className="hidden md:flex items-center gap-2 text-white hover:text-white/80 transition-colors"
                style={{ fontSize: '12px', fontWeight: 500 }}
              >
                <Mail size={13} />
                <span>info@pmautomobileworks.com.np</span>
              </a>
            </div>
            <div
              className="hidden md:flex items-center gap-2 text-white/90"
              style={{ fontSize: '12px' }}
            >
              <MapPin size={13} />
              <span>Tripureshwor, Kathmandu, Nepal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="pm-container">
        <div className="flex items-center justify-between" style={{ height: '72px' }}>
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="P.M. Automobile Works"
              style={{
                height: '52px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={item.href}
                  className={`nav-link flex items-center gap-1 ${
                    location.pathname === item.href ||
                    location.pathname.startsWith(item.href + '/') && item.href !== '/'
                      ? 'active'
                      : ''
                  }`}
                >
                  {item.label}
                  {item.children && <ChevronDown size={14} />}
                </Link>

                {/* Dropdown */}
                <AnimatePresence>
                  {item.children && activeDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 py-2"
                      style={{
                        background: '#111111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        minWidth: '200px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                      }}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="block px-5 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                          style={{ fontSize: '13px', fontWeight: 500 }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              to="/book"
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: '12px' }}
            >
              Book Appointment
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden"
            style={{
              background: '#111111',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="pm-container py-6">
              {navItems.map((item) => (
                <div key={item.href}>
                  <Link
                    to={item.href}
                    className={`block py-3 font-semibold uppercase tracking-wide transition-colors ${
                      location.pathname === item.href ? 'text-red-500' : 'text-white/70'
                    }`}
                    style={{ fontSize: '13px', letterSpacing: '0.1em' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="pl-4 border-l border-white/10">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="block py-2 text-white/50 hover:text-white transition-colors"
                          style={{ fontSize: '13px' }}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-6 pt-6 border-t border-white/10">
                <Link
                  to="/book"
                  className="btn-primary w-full justify-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
