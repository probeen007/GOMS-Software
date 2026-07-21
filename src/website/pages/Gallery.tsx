import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn } from 'lucide-react'
import PageHero from '../components/PageHero'

const categories = ['All', 'Workshop', 'Engine Work', 'Body Work', 'Cars', 'Team']

const galleryItems = [
  {
    src: '/assets/img1.jpg',
    category: 'Workshop',
    title: 'Main Workshop Bay',
  },
  {
    src: '/assets/engine.jpg',
    category: 'Engine Work',
    title: 'Engine Diagnostics',
  },
  {
    src: '/assets/img2.jpg',
    category: 'Engine Work',
    title: 'Engine Bay Inspection',
  },
  {
    src: '/assets/img3.jpg',
    category: 'Cars',
    title: 'Luxury Service',
  },
  {
    src: '/assets/paint.png',
    category: 'Body Work',
    title: 'Paint & Body Work',
  },
  {
    src: '/assets/img4.jpg',
    category: 'Cars',
    title: 'Premium Vehicles',
  },
  {
    src: '/assets/break.png',
    category: 'Workshop',
    title: 'Brake Service Bay',
  },
  {
    src: '/assets/wirring.jpg',
    category: 'Engine Work',
    title: 'Electrical Systems',
  },
  {
    src: '/assets/im5.jpg',
    category: 'Team',
    title: 'Expert Technicians',
  },
  {
    src: '/assets/img6.jpg',
    category: 'Workshop',
    title: 'Wheel Alignment Bay',
  },
  {
    src: '/assets/im9.jpg',
    category: 'Cars',
    title: 'Performance Testing',
  },
  {
    src: '/assets/about.jpg',
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
        backgroundImage="/assets/hero.png"
      />

      {/* Filter Bar */}
      <section style={{ background: '#F8FAFC', padding: '40px 0', borderBottom: '1px solid #E2E8F0' }}>
        <div className="pm-container">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '9px 22px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeCategory === cat ? '#E63946' : '#FFFFFF',
                  color: activeCategory === cat ? 'white' : '#475569',
                  border: activeCategory === cat ? '1px solid #E63946' : '1px solid #CBD5E1',
                  boxShadow: activeCategory === cat ? '0 4px 12px rgba(230,57,70,0.25)' : 'none',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ background: '#FFFFFF', padding: '60px 0 120px' }}>
        <div className="pm-container">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <motion.div
                  key={item.src}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="relative group cursor-pointer overflow-hidden shadow-md hover:shadow-xl transition-shadow rounded-xl"
                  style={{ aspectRatio: '4/3' }}
                  onClick={() => setLightbox(galleryItems.indexOf(item))}
                >
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=450&fit=crop&q=80";
                    }}
                  />
                  {/* Overlay */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'rgba(15,23,42,0.75)' }}
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
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      }}
                    >
                      <ZoomIn size={20} color="white" />
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
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
                      background: 'rgba(15,23,42,0.85)',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'white',
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
            style={{ background: 'rgba(15,23,42,0.95)' }}
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
                style={{ width: '100%', borderRadius: '12px' }}
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1000&h=750&fit=crop&q=80";
                }}
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
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}
              >
                <X size={20} />
              </button>
              <div
                style={{
                  marginTop: '16px',
                  fontSize: '15px',
                  fontWeight: 800,
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

