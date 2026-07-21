import { motion } from 'framer-motion'

interface Stat {
  number: string
  label: string
}

interface StatisticsProps {
  stats?: Stat[]
  dark?: boolean
}

const defaultStats: Stat[] = [
  { number: '45+', label: 'Years of Experience' },
  { number: '15,000+', label: 'Vehicles Serviced' },
  { number: '25+', label: 'Expert Technicians' },
  { number: '100%', label: 'Customer Satisfaction' },
]

export default function Statistics({ stats = defaultStats, dark = false }: StatisticsProps) {
  return (
    <section
      style={{
        background: dark ? '#0F172A' : '#F8FAFC',
        borderTop: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
        borderBottom: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
        padding: '64px 0',
      }}
    >
      <div className="pm-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="stat-number mb-2">{stat.number}</div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: dark ? '#94A3B8' : '#475569',
                }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

