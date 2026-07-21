import PageHero from '../components/PageHero'
import FAQ from '../components/FAQ'
import { Link } from 'react-router-dom'

export default function FAQPage() {
  return (
    <div>
      <PageHero
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about our services, pricing, and booking process."
        breadcrumbs={[{ label: 'FAQ' }]}
        backgroundImage="assets/hero.png"
      />

      <FAQ showTitle={false} dark={false} />

      {/* Still Have Questions? */}
      <section style={{ background: '#111111', padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="pm-container text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="section-label" style={{ textAlign: 'center' }}>Still Have Questions?</div>
          <h2 className="heading-section text-white mb-4">We Are Here to Help</h2>
          <div className="red-line red-line-center" />
          <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.7, margin: '20px 0 36px' }}>
            Can't find the answer you are looking for? Reach out to our team directly —
            we are always happy to help you with any queries about your vehicle.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact" className="btn-primary">Contact Us</Link>
            <Link to="/book" className="btn-secondary">Book Appointment</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
