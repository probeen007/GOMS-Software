import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeroProps {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  backgroundImage?: string
  overlay?: boolean
}

export default function PageHero({
  title,
  subtitle,
  breadcrumbs = [],
  backgroundImage = 'assets/hero.png',
  overlay = true,
}: PageHeroProps) {
  return (
    <section
      className="relative flex items-end"
      style={{ height: '280px', minHeight: '280px' }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt={title}
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.35)' }}
        />
        {overlay && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.92) 100%)',
            }}
          />
        )}
      </div>

      {/* Red left accent line */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{ width: '3px', background: '#E63946' }}
      />

      <div className="pm-container relative z-10 pb-12">
        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <div className="breadcrumb mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                <ChevronRight size={12} />
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-white transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="active">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          className="heading-hero text-white mb-3"
          style={{ maxWidth: '700px' }}
        >
          {title}
        </h1>

        {/* Red accent line */}
        <div className="red-line" />

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', maxWidth: '560px', marginTop: '12px' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
