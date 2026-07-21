import { useState, FormEvent, ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, Clock, Shield, Star } from 'lucide-react'
import PageHero from '../components/PageHero'

const services = [
  'Engine Repair & Overhaul',
  'General Servicing',
  'Electrical Repair',
  'Brake & Suspension',
  'Denting & Painting',
  'Oil & Lubrication',
  'Wheel Alignment',
  'AC Service & Repair',
  'Transmission Service',
  'Exhaust System',
]

const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM',
]

interface FormData {
  fullName: string
  phone: string
  email: string
  plateNo: string
  vehicleMake: string
  vehicleModel: string
  year: string
  service: string
  preferredDate: string
  preferredTime: string
  additionalNotes: string
}

export default function BookAppointment() {
  const [form, setForm] = useState<FormData>({
    fullName: '', phone: '', email: '', plateNo: '',
    vehicleMake: '', vehicleModel: '', year: '',
    service: '', preferredDate: '', preferredTime: '',
    additionalNotes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/web-bookings/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError(data.message || (data.errors && data.errors[0]?.msg) || 'Failed to submit appointment. Please check your information.')
      }
    } catch (err) {
      console.error('Submit booking error:', err)
      setError('Network connection error. Please try again or contact us by phone.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div>
        <PageHero
          title="Book Appointment"
          breadcrumbs={[{ label: 'Book Appointment' }]}
          backgroundImage="assets/hero.png"
        />
        <section style={{ background: '#0A0A0A', padding: '120px 0', minHeight: '60vh' }}>
          <div className="pm-container">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
              style={{ maxWidth: '560px', margin: '0 auto' }}
            >
              <div style={{ width: '80px', height: '80px', background: 'rgba(230,57,70,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle size={40} color="#E63946" />
              </div>
              <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2.5rem', fontWeight: 800, textTransform: 'uppercase', color: 'white', marginBottom: '16px' }}>
                Appointment Requested!
              </h2>
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.7, marginBottom: '32px' }}>
                Thank you, <strong style={{ color: 'white' }}>{form.fullName}</strong>! Your appointment request has been received. Our team will contact you within 2 hours to confirm.
              </p>
              <button onClick={() => setSubmitted(false)} className="btn-primary">
                Book Another Appointment
              </button>
            </motion.div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      <PageHero
        title="Book Appointment"
        subtitle="Schedule your vehicle service with Kathmandu's most trusted auto workshop."
        breadcrumbs={[{ label: 'Book Appointment' }]}
        backgroundImage="assets/hero.png"
      />

      <section style={{ background: '#0A0A0A', padding: '80px 0 120px' }}>
        <div className="pm-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-2"
            >
              <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '48px' }}>
                <div className="section-label">Book Online</div>
                <h2 className="heading-section text-white mb-3">Appointment Details</h2>
                <div className="red-line" style={{ marginBottom: '36px' }} />

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', marginBottom: '24px' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <SectionDivider label="Personal Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <FormField label="Full Name *">
                      <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" required className="pm-input" />
                    </FormField>
                    <FormField label="Phone Number *">
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+977 98X-XXX-XXXX" required className="pm-input" />
                    </FormField>
                    <FormField label="Email Address" className="md:col-span-2">
                      <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className="pm-input" />
                    </FormField>
                  </div>

                  <SectionDivider label="Vehicle Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <FormField label="Make / Brand *">
                      <input type="text" name="vehicleMake" value={form.vehicleMake} onChange={handleChange} placeholder="e.g. Toyota" required className="pm-input" />
                    </FormField>
                    <FormField label="Model *">
                      <input type="text" name="vehicleModel" value={form.vehicleModel} onChange={handleChange} placeholder="e.g. Fortuner" required className="pm-input" />
                    </FormField>
                    <FormField label="Number Plate / Reg No.">
                      <input type="text" name="plateNo" value={form.plateNo} onChange={handleChange} placeholder="e.g. BA 1 PA 1234" className="pm-input" />
                    </FormField>
                    <FormField label="Model Year">
                      <input type="text" name="year" value={form.year} onChange={handleChange} placeholder="e.g. 2022" className="pm-input" />
                    </FormField>
                  </div>

                  <SectionDivider label="Appointment Info" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <FormField label="Service Required *">
                      <select name="service" value={form.service} onChange={handleChange} required className="pm-select">
                        <option value="">Select a service</option>
                        {services.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Preferred Time *">
                      <select name="preferredTime" value={form.preferredTime} onChange={handleChange} required className="pm-select">
                        <option value="">Select time slot</option>
                        {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Preferred Date *">
                      <input type="date" name="preferredDate" value={form.preferredDate} onChange={handleChange} required className="pm-input" min={new Date().toISOString().split('T')[0]} style={{ colorScheme: 'dark' }} />
                    </FormField>
                    <FormField label="Additional Notes">
                      <textarea name="additionalNotes" value={form.additionalNotes} onChange={handleChange} placeholder="Describe the issue..." rows={3} className="pm-textarea" style={{ minHeight: '56px' }} />
                    </FormField>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '15px 40px', fontSize: '13px', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Submitting Request...' : 'Submit Booking'}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="flex flex-col gap-6">
              <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '32px' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', color: 'white', marginBottom: '20px', letterSpacing: '0.05em' }}>
                  Appointment Info
                </div>
                <div className="space-y-5">
                  {[
                    { icon: Calendar, title: 'Flexible Scheduling', desc: 'Choose a date and time that works for you.' },
                    { icon: CheckCircle, title: 'Expert Technicians', desc: 'All work by certified professionals.' },
                    { icon: Shield, title: 'Quality Service', desc: '3-month warranty on repairs and parts.' },
                    { icon: Star, title: 'Customer Satisfaction', desc: '100% satisfaction guarantee.' },
                    { icon: Clock, title: 'Quick Turnaround', desc: 'Efficient service, minimal wait times.' },
                  ].map(({ icon: Icon, title, desc }, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div style={{ width: '36px', height: '36px', background: 'rgba(230,57,70,0.12)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color="#E63946" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '3px' }}>{title}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', aspectRatio: '4/3' }}>
                <img src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1920&h=800&fit=crop" alt="Book Your Appointment" className="w-full h-full object-cover" style={{ filter: 'brightness(0.6)' }} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '16px', paddingTop: '8px' }}>
      {label}
    </div>
  )
}

function FormField({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#D1D5DB', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
