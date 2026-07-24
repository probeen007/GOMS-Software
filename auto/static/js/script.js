
// Mobile Menu Toggle
function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenu.classList.toggle('active');
}

// Gallery Lightbox
function openLightbox(imgSrc) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  lightboxImg.src = imgSrc;
  lightbox.classList.add('active');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

// Gallery Filter
function filterGallery(category) {
  const items = document.querySelectorAll('.gallery-page-item');
  const buttons = document.querySelectorAll('.filter-btn');

  // Update active button
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  // Filter items
  items.forEach(item => {
    if (category === 'All' || item.dataset.category === category) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

function handleBookingSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('booking-submit-btn');
  const errorBox = document.getElementById('booking-error');
  errorBox.style.display = 'none';

  const data = new FormData(form);
  const payload = {
    fullName: (data.get('fullName') || '').trim(),
    phone: (data.get('phone') || '').trim(),
    email: (data.get('email') || '').trim(),
    vehicleMake: (data.get('vehicleMake') || '').trim(),
    vehicleModel: (data.get('vehicleModel') || '').trim(),
    year: (data.get('year') || '').trim(),
    plateNo: (data.get('plateNo') || '').trim(),
    preferredDate: data.get('preferredDate') || '',
    preferredTime: data.get('preferredTime') || '',
    service: data.get('service') || '',
    additionalNotes: (data.get('additionalNotes') || '').trim(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  fetch('/api/web-bookings/public', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || (result.errors && result.errors[0] && result.errors[0].msg) || 'Failed to submit appointment request.');
      }
      form.style.display = 'none';
      document.getElementById('booking-success').style.display = 'block';
      setTimeout(() => {
        form.reset();
        form.style.display = 'block';
        document.getElementById('booking-success').style.display = 'none';
      }, 6000);
    })
    .catch((err) => {
      errorBox.textContent = err.message || 'Something went wrong. Please call us instead.';
      errorBox.style.display = 'block';
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Book Appointment';
    });
}

function handleContactSubmit(e) {
  e.preventDefault();

  // Collect form values
  const name    = document.getElementById('contact-name').value.trim();
  const email   = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value.trim();
  const message = document.getElementById('contact-message').value.trim();

  // Build SMS message text
  const text =
    `New Contact Message:\n` +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Subject: ${subject}\n` +
    `Message: ${message}`;

  // Open WhatsApp with the pre-filled message to 9851351881
  window.open(`https://wa.me/9779851351881?text=${encodeURIComponent(text)}`, '_blank');

  // Show success message on the page too
  const form = e.target;
  form.style.display = 'none';
  document.getElementById('contact-success').style.display = 'block';
  setTimeout(() => {
    form.reset();
    form.style.display = 'block';
    document.getElementById('contact-success').style.display = 'none';
  }, 5000);
}

// Add scroll effect to navbar
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 20) {
    navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Set active nav link
  const currentPage = window.location.pathname;
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

  // Set min date for booking form
  const dateInput = document.getElementById('date-input');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }
});
