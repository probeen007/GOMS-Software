import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, MapPin, Menu, X, ChevronDown, User, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

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
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const { user } = useAuth()
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
    <header className="sticky top-0 z-50 transition-all duration-300">
      {/* Top Bar - Dark Navy Background */}
      <div className="bg-[#0F172A] text-white py-2 border-b border-slate-800">
        <div className="pm-container">
          <div className="flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-6">
              <a
                href="tel:01-4525461"
                className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors"
              >
                <Phone size={13} className="text-[#E63946]" />
                <span>01-4525461/980-3296067</span>
              </a>
              <a
                href="mailto:pmautomobileworks@gmail.com"
                className="hidden md:flex items-center gap-2 text-gray-200 hover:text-white transition-colors"
              >
                <Mail size={13} className="text-[#E63946]" />
                <span>pmautomobileworks@gmail.com</span>
              </a>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-2 text-gray-200">
                <MapPin size={13} className="text-[#E63946]" />
                <span>Dhobidhara marg, Kathmandu, Nepal</span>
              </div>
              <Link
                to={user ? "/dashboard" : "/login"}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded transition-colors text-xs font-semibold"
              >
                {user ? <LayoutDashboard size={13} /> : <User size={13} />}
                <span>{user ? `Portal (${user.name})` : 'Staff Login'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav - Clean White Background */}
      <div
        className="bg-white transition-shadow duration-300 border-b border-gray-100"
        style={{
          boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.08)' : '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <div className="pm-container">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="P.M. Automobile Works"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.logo-fallback')) {
                    const span = document.createElement('span');
                    span.className = 'logo-fallback font-black text-xl text-gray-900 tracking-tight flex items-center gap-2';
                    span.innerHTML = '<span style="color:#E63946">P.M.</span> AUTOMOBILE WORKS';
                    parent.appendChild(span);
                  }
                }}
              />
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (location.pathname.startsWith(item.href + '/') && item.href !== '/')

                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      to={item.href}
                      className={`flex items-center gap-1 text-sm font-bold tracking-wide transition-colors py-2 ${
                        isActive
                          ? 'text-[#E63946]'
                          : 'text-gray-800 hover:text-[#E63946]'
                      }`}
                    >
                      {item.label}
                      {item.children && <ChevronDown size={14} className="opacity-70" />}
                    </Link>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {item.children && activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-1 py-2 bg-white rounded-xl shadow-xl border border-gray-100 min-w-[220px] z-50"
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              to={child.href}
                              className="block px-5 py-2.5 text-xs font-semibold text-gray-700 hover:text-[#E63946] hover:bg-red-50/50 transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </nav>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                to="/book"
                className="bg-[#E63946] hover:bg-[#CC2936] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Book Appointment
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              className="lg:hidden text-gray-800 p-2 hover:text-[#E63946] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
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
            className="lg:hidden overflow-hidden bg-white border-b border-gray-200 shadow-xl"
          >
            <div className="pm-container py-6">
              {navItems.map((item) => (
                <div key={item.href}>
                  <Link
                    to={item.href}
                    className={`block py-3 font-bold text-sm tracking-wide transition-colors ${
                      location.pathname === item.href ? 'text-[#E63946]' : 'text-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="pl-4 border-l-2 border-red-100 my-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="block py-2 text-xs font-medium text-gray-600 hover:text-[#E63946] transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <Link
                  to="/book"
                  className="bg-[#E63946] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-lg w-full text-center block shadow-md"
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
