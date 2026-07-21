import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn } from 'lucide-react'
import PageHero from '../components/PageHero'

const categories = ['All', 'Workshop', 'Engine Work', 'Body Work', 'Cars', 'Team']

const galleryItems = [
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Workshop',
    title: 'Main Workshop Bay',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Engine Work',
    title: 'Engine Diagnostics',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Engine Work',
    title: 'Engine Bay Inspection',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Cars',
    title: 'Luxury Service',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Body Work',
    title: 'Paint & Body Work',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Cars',
    title: 'Premium Vehicles',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Workshop',
    title: 'Brake Service Bay',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Engine Work',
    title: 'Electrical Systems',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Team',
    title: 'Expert Technicians',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Workshop',
    title: 'Wheel Alignment Bay',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Cars',
    title: 'Performance Testing',
  },
  {
    src: 'assets/gallery-placeholder.jpg',
    category: 'Body Work',
    title: 'Detail & Polish',
  },
]

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [lightbox, setLightbox] = useState<number | null>(null)

  const filtered =
    activeCategory === 'All'
      ? galleryItems
      : galleryItems.filter((g) => g.category === activeCategory)

  return (
    <div>
      <PageHero
        title="Gallery"
        subtitle="Take a look at our state-of-the-art facility, expert team, and the vehicles we service."
        breadcrumbs={[{ label: 'Gallery' }]}
        backgroundImage="assets/hero.png"
      />

      {/* Filter Bar */}
      <section style={{ background: '#111111', padding: '40px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="pm-container">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '9px 22px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeCategory === cat ? '#E63946' : 'transparent',
                  color: activeCategory === cat ? 'white' : 'rgba(255,255,255,0.5)',
                  border: activeCategory === cat ? '1px solid #E63946' : '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ background: '#0A0A0A', padding: '60px 0 120px' }}>
        <div className="pm-container">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => (
                <motion.div
                  key={item.src}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="relative group cursor-pointer overflow-hidden"
                  style={{ borderRadius: '6px', aspectRatio: '4/3' }}
                  onClick={() => setLightbox(galleryItems.indexOf(item))}
                >
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    style={{ filter: 'brightness(0.7)' }}
                  />
                  {/* Overlay */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#E63946',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      <ZoomIn size={20} color="white" />
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {item.title}
                    </span>
                  </div>

                  {/* Category badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '14px',
                      left: '14px',
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: '3px',
                      padding: '4px 10px',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {item.category}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.95)' }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'relative', maxWidth: '900px', width: '100%' }}
            >
              <img
                src={galleryItems[lightbox].src}
                alt={galleryItems[lightbox].title}
                style={{ width: '100%', borderRadius: '8px' }}
              />
              <button
                onClick={() => setLightbox(null)}
                style={{
                  position: 'absolute',
                  top: '-16px',
                  right: '-16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#E63946',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <X size={20} />
              </button>
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'white',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {galleryItems[lightbox].title}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
