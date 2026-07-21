import { motion } from 'framer-motion'

interface Brand {
  name: string
  logo: string
  fallbackUrl: string
}

const brands: Brand[] = [
  {
    name: 'Toyota',
    logo: '/assets/brands/toyota.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/toyota.svg',
  },
  {
    name: 'Hyundai',
    logo: '/assets/brands/hyundai.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/hyundai.svg',
  },
  {
    name: 'Suzuki',
    logo: '/assets/brands/suzuki.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/suzuki.svg',
  },
  {
    name: 'Kia',
    logo: '/assets/brands/kia.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/kia.svg',
  },
  {
    name: 'Honda',
    logo: '/assets/brands/honda.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/honda.svg',
  },
  {
    name: 'Nissan',
    logo: '/assets/brands/nissan.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/nissan.svg',
  },
  {
    name: 'Mahindra',
    logo: '/assets/brands/mahindra.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/mahindra.svg',
  },
  {
    name: 'Tata',
    logo: '/assets/brands/tata.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/tata.svg',
  },
  {
    name: 'Ford',
    logo: '/assets/brands/ford.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/ford.svg',
  },
  {
    name: 'BMW',
    logo: '/assets/brands/bmw.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/bmw.svg',
  },
  {
    name: 'Mercedes',
    logo: '/assets/brands/mercedes.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/mercedes.svg',
  },
  {
    name: 'Volkswagen',
    logo: '/assets/brands/volkswagen.svg',
    fallbackUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/volkswagen.svg',
  },
]

// Duplicate items for seamless infinite marquee loop
const marqueeBrands = [...brands, ...brands]

export default function BrandLogos() {
  return (
    <div
      className="relative overflow-hidden w-full py-6"
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
    >
      <motion.div
        className="flex items-center gap-16 md:gap-24 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          ease: 'linear',
          duration: 35,
          repeat: Infinity,
        }}
      >
        {marqueeBrands.map((b, i) => (
          <div
            key={`${b.name}-${i}`}
            className="flex items-center justify-center shrink-0 cursor-pointer group"
          >
            <img
              src={b.logo}
              alt={`${b.name} Official Logo`}
              title={b.name}
              onError={(e) => {
                const target = e.currentTarget
                if (target.src !== b.fallbackUrl) {
                  target.src = b.fallbackUrl
                }
              }}
              className="h-12 md:h-16 w-auto object-contain transition-all duration-300 transform group-hover:scale-110"
              style={{
                filter: 'grayscale(100%)',
                opacity: 0.6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'none'
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'grayscale(100%)'
                e.currentTarget.style.opacity = '0.6'
              }}
            />
          </div>
        ))}
      </motion.div>
    </div>
  )
}

