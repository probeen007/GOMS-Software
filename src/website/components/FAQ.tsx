import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: 'How often should I service my car?',
    a: 'We recommend servicing your vehicle every 5,000–10,000 km depending on the make and model, or every 6 months — whichever comes first. Regular servicing helps catch issues early, extending engine life and preventing costly repairs.',
  },
  {
    q: 'Do you use genuine parts?',
    a: 'Yes. P.M. Automobile Works uses only OEM-grade genuine parts and high-quality certified aftermarket components. All parts come with manufacturer warranties, ensuring long-term reliability for your vehicle.',
  },
  {
    q: 'How long does a general service take?',
    a: 'A standard general service typically takes 2–4 hours. More comprehensive services or repairs may take longer. We will provide you with an accurate estimate when you bring in your vehicle or book an appointment.',
  },
  {
    q: 'Do you provide warranty on repairs?',
    a: 'Yes. All our repair work is backed by a 3-month / 5,000 km warranty on parts and labor. If any issue arises related to our work within this period, we will fix it at no additional charge.',
  },
  {
    q: "Can I wait while my car is being serviced?",
    a: 'Absolutely. Our workshop has a comfortable waiting area with complimentary tea and WiFi. For longer jobs, we can arrange transportation or keep you updated via phone so you can return at your convenience.',
  },
  {
    q: 'Do you offer pick-up and drop-off facilities?',
    a: 'Yes, we offer pick-up and drop-off services for vehicles within Kathmandu valley at an additional charge. Please mention this requirement when booking your appointment and we will arrange accordingly.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept cash, eSewa, Khalti, bank transfer, and all major credit/debit cards. Payment is due upon completion of work. We provide detailed invoices for all services rendered.',
  },
  {
    q: 'Do you service all vehicle brands?',
    a: 'Yes. Our trained technicians service all brands including Toyota, Hyundai, Kia, Honda, Suzuki, Mahindra, Nissan, Ford, and more. We have specialized equipment for both Japanese and European vehicles.',
  },
]

interface FAQProps {
  limit?: number
  showTitle?: boolean
  dark?: boolean
}

export default function FAQ({ limit, showTitle = true, dark = false }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const displayFaqs = limit ? faqs.slice(0, limit) : faqs

  return (
    <section
      style={{
        background: dark ? '#0F172A' : '#FFFFFF',
        padding: '120px 0',
      }}
    >
      <div className="pm-container">
        {showTitle && (
          <div className="mb-16">
            <div className="section-label">FAQ</div>
            <h2 className={`heading-section mb-4 ${dark ? 'text-white' : 'text-slate-900'}`} style={{ maxWidth: '500px' }}>
              Frequently Asked Questions
            </h2>
            <div className="red-line" />
            <p style={{ fontSize: '15px', color: dark ? '#94A3B8' : '#475569', marginTop: '16px', maxWidth: '520px' }}>
              Got questions? We've got answers. Find everything you need to know about our services.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
          <div>
            {displayFaqs.slice(0, Math.ceil(displayFaqs.length / 2)).map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                dark={dark}
              />
            ))}
          </div>
          <div>
            {displayFaqs.slice(Math.ceil(displayFaqs.length / 2)).map((faq, i) => {
              const idx = Math.ceil(displayFaqs.length / 2) + i
              return (
                <FAQItem
                  key={idx}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openIndex === idx}
                  onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
                  dark={dark}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  dark?: boolean
}

export function FAQItem({ question, answer, isOpen, onToggle, dark = false }: FAQItemProps) {
  return (
    <div className="faq-item" style={{ borderBottomColor: dark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
      <button
        className="faq-question w-full text-left"
        onClick={onToggle}
        style={{ color: isOpen ? '#E63946' : (dark ? '#FFFFFF' : '#0F172A') }}
      >
        <span style={{ paddingRight: '16px', fontSize: '15px', fontWeight: 700 }}>{question}</span>
        <span
          className="flex-shrink-0 flex items-center justify-center transition-all duration-200"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: `1px solid ${isOpen ? '#E63946' : (dark ? 'rgba(255,255,255,0.2)' : '#CBD5E1')}`,
            background: isOpen ? 'rgba(230,57,70,0.1)' : (dark ? 'transparent' : '#F8FAFC'),
            color: isOpen ? '#E63946' : (dark ? 'rgba(255,255,255,0.6)' : '#64748B'),
          }}
        >
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="faq-answer" style={{ color: dark ? '#94A3B8' : '#475569' }}>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

