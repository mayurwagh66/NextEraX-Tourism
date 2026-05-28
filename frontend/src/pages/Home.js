import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = ({ account, connectWallet }) => {
  // ─── Slider State ─────────────────────────────────────────────
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  // ─── Contact / Booking Form State ─────────────────────────────
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [bookingForm, setBookingForm] = useState({
    name: '', destination: '', date: '', duration: '', guests: '', phone: '', interests: ''
  });

  const slides = [
    {
      img: 'https://images.unsplash.com/photo-1730021155304-9ff1f0f33b29',
      title: 'Baidyanath Dham',
      desc: 'One of the twelve Jyotirlingas, a sacred pilgrimage destination'
    },
    {
      img: 'https://images.unsplash.com/photo-1696239107350-b7136e7099d3',
      title: 'Ancient Temples',
      desc: 'Rich architectural heritage showcasing centuries of cultural history'
    },
    {
      img: 'https://images.unsplash.com/photo-1704036178755-b53e462f7348',
      title: 'Betla National Park',
      desc: 'Home to majestic tigers and diverse wildlife in their natural habitat'
    },
    {
      img: 'https://images.unsplash.com/photo-1732520524359-d65ff5c3cb69',
      title: 'Wildlife Sanctuary',
      desc: 'Spotted deer roaming freely in Jharkhand\'s protected forests'
    },
    {
      img: 'https://images.unsplash.com/photo-1710125246865-851d06ad7dbc',
      title: 'Natural Habitats',
      desc: 'Serene water bodies providing sanctuary for local wildlife'
    }
  ];

  const destinations = [
    { name: 'Hundru Falls', type: 'waterfalls', description: '98-meter spectacular waterfall' },
    { name: 'Netarhat Hill Station', type: 'hills', description: 'Queen of Chotanagpur' },
    { name: 'Betla National Park', type: 'wildlife', description: 'Tiger reserve and wildlife sanctuary' },
    { name: 'Baidyanath Dham', type: 'temples', description: 'Sacred Jyotirlinga temple' },
    { name: 'Jonha Falls', type: 'waterfalls', description: 'Beautiful waterfall near Ranchi' },
    { name: 'Parasnath Hill', type: 'hills', description: 'Highest peak in Jharkhand' },
    { name: 'Hazaribagh Wildlife Sanctuary', type: 'wildlife', description: 'Rich biodiversity sanctuary' }
  ];

  const highlightCards = [
    {
      img: 'https://images.unsplash.com/photo-1587491618720-c79922211e02',
      title: 'Hundru Falls',
      desc: 'A spectacular 98-meter waterfall formed by the Subarnarekha River, offering breathtaking views and a refreshing retreat in nature\'s lap.'
    },
    {
      img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      title: 'Netarhat Hill Station',
      desc: 'Known as the "Queen of Chotanagpur," this hill station offers stunning sunrise and sunset views with pleasant weather year-round.'
    },
    {
      img: 'https://images.unsplash.com/photo-1704036178755-b53e462f7348',
      title: 'Betla National Park',
      desc: 'One of India\'s first tiger reserves, home to elephants, leopards, and over 180 bird species in 226 square kilometers of pristine wilderness.'
    },
    {
      img: 'https://images.unsplash.com/photo-1730021155304-9ff1f0f33b29',
      title: 'Baidyanath Dham',
      desc: 'One of the twelve sacred Jyotirlingas, this ancient temple complex attracts millions of devotees during the holy month of Shravan.'
    }
  ];

  // ─── Slider auto-play ────────────────────────────────────────
  const changeSlide = useCallback((dir) => {
    setSlideIndex(prev => {
      let next = prev + dir;
      if (next >= slides.length) next = 0;
      if (next < 0) next = slides.length - 1;
      return next;
    });
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(() => changeSlide(1), 5000);
    return () => clearInterval(timer);
  }, [changeSlide]);

  // ─── Scroll-reveal animation ─────────────────────────────────
  const observerRef = useRef(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('jh-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.jh-animate').forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  // ─── Smooth scroll helper ────────────────────────────────────
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ─── Search ──────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    const results = destinations.filter(d => {
      const matchesFilter = activeFilter === 'all' || d.type === activeFilter;
      const matchesQuery = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && (searchQuery === '' || matchesQuery);
    });
    setSearchResults(results);
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  // ─── Contact Form ────────────────────────────────────────────
  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you, ${contactForm.name}! Your message has been sent successfully. We'll get back to you at ${contactForm.email} within 24 hours.`);
    setContactForm({ name: '', email: '', message: '' });
  };

  // ─── Booking Form ────────────────────────────────────────────
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const destLabel = {
      netarhat: 'Netarhat Hill Station',
      betla: 'Betla National Park',
      hundru: 'Hundru Falls',
      baidyanath: 'Baidyanath Dham',
      custom: 'Custom Package'
    }[bookingForm.destination] || bookingForm.destination;

    alert(
      `Booking confirmed!\n\nDestination: ${destLabel}\nTravel Date: ${new Date(bookingForm.date).toLocaleDateString()}\nGuests: ${bookingForm.guests}\nContact: ${bookingForm.phone}\n\nOur travel coordinator will call you within 2 hours to finalize your Jharkhand adventure!`
    );
    setBookingForm({ name: '', destination: '', date: '', duration: '', guests: '', phone: '', interests: '' });
  };

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div className="jh-home">

      {/* ═══ HERO SECTION ═══ */}
      <section className="jh-hero" id="jh-home">
        <video className="jh-hero-video" autoPlay muted loop playsInline>
          <source src="https://videos.pexels.com/video-files/1851190/1851190-uhd_2560_1440_25fps.mp4" type="video/mp4" />
          <source src="https://videos.pexels.com/video-files/4827/4827-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>
        <div className="jh-hero-overlay"></div>
        <div className="jh-hero-content">
          <h1>Discover Jharkhand</h1>
          <p>The Land of Forests &amp; Waterfalls</p>

          {/* Search Box */}
          <div className="jh-search-container">
            <h3 className="jh-search-title">Find Your Perfect Destination</h3>
            <form className="jh-search-form" onSubmit={handleSearch}>
              <div className="jh-search-input-group">
                <input
                  type="text"
                  className="jh-search-input"
                  placeholder="Search destinations, attractions, activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="jh-search-btn">Search</button>
              </div>
              <div className="jh-search-filters">
                {['all', 'waterfalls', 'temples', 'wildlife', 'hills'].map(f => (
                  <button
                    key={f}
                    type="button"
                    className={`jh-filter-btn${activeFilter === f ? ' active' : ''}`}
                    onClick={() => handleFilterClick(f)}
                  >
                    {f === 'all' ? 'All' : f === 'hills' ? 'Hill Stations' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </form>

            {/* Search Results */}
            {searchResults && (
              <div className="jh-search-results">
                <p className="jh-results-count">Found {searchResults.length} destination{searchResults.length !== 1 ? 's' : ''}</p>
                {searchResults.map((r, i) => (
                  <div key={i} className="jh-result-item">
                    <strong>{r.name}</strong> — {r.description}
                  </div>
                ))}
                <button className="jh-clear-results" onClick={() => setSearchResults(null)}>Clear</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ IMAGE SLIDER ═══ */}
      <section className="jh-slider-section" id="jh-gallery">
        <div className="jh-slider-container">
          <h2 className="jh-section-title">Explore Jharkhand's Beauty</h2>
          <div className="jh-image-slider">
            {slides.map((s, i) => (
              <div key={i} className={`jh-slide${i === slideIndex ? ' active' : ''}`}>
                <img src={s.img} alt={s.title} loading="lazy" />
                <div className="jh-slide-content">
                  <h3 className="jh-slide-title">{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
            <button className="jh-nav-arrow jh-prev" onClick={() => changeSlide(-1)}>❮</button>
            <button className="jh-nav-arrow jh-next" onClick={() => changeSlide(1)}>❯</button>
          </div>
          <div className="jh-slider-dots">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`jh-dot${i === slideIndex ? ' active' : ''}`}
                onClick={() => setSlideIndex(i)}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ INTRO ═══ */}
      <section className="jh-intro-section">
        <div className="jh-container">
          <div className="jh-intro-content jh-animate">
            <h2>Welcome to Jharkhand</h2>
            <p>
              Jharkhand, literally meaning "The Land of Forests," is a state blessed with abundant natural beauty,
              rich mineral resources, and vibrant tribal culture. From cascading waterfalls and dense forests to ancient
              temples and wildlife sanctuaries, Jharkhand offers an enchanting blend of nature, spirituality, and
              adventure. Experience the pristine beauty of Netarhat, the wildlife diversity of Betla National Park,
              the spiritual aura of Baidyanath Dham, and the thundering magnificence of Hundru Falls.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ HIGHLIGHT CARDS ═══ */}
      <section className="jh-highlights-section" id="jh-destinations">
        <div className="jh-container">
          <h2 className="jh-section-title">Top Destinations</h2>
          <div className="jh-highlights-grid">
            {highlightCards.map((c, i) => (
              <div key={i} className="jh-highlight-card jh-animate">
                <img src={c.img} alt={c.title} loading="lazy" />
                <div className="jh-card-content">
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLAN YOUR TRIP — Contact & Booking ═══ */}
      <section className="jh-interactive-section" id="jh-plan-trip">
        <div className="jh-container">
          <h2 className="jh-section-title">Plan Your Journey</h2>
          <div className="jh-features-grid">

            {/* Contact Form */}
            <div className="jh-feature-box jh-animate">
              <h3>Get In Touch</h3>
              <p>Have questions about your Jharkhand adventure? Contact our travel experts for personalized recommendations.</p>
              <form className="jh-contact-form" onSubmit={handleContactSubmit}>
                <div className="jh-form-group">
                  <label htmlFor="jh-contact-name">Full Name</label>
                  <input id="jh-contact-name" type="text" required value={contactForm.name}
                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })} />
                </div>
                <div className="jh-form-group">
                  <label htmlFor="jh-contact-email">Email Address</label>
                  <input id="jh-contact-email" type="email" required value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })} />
                </div>
                <div className="jh-form-group">
                  <label htmlFor="jh-contact-message">Message</label>
                  <textarea id="jh-contact-message" rows="4" required value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}></textarea>
                </div>
                <button type="submit" className="jh-submit-btn">Send Message</button>
              </form>
            </div>

            {/* Booking Form */}
            <div className="jh-feature-box jh-animate">
              <h3>Plan Your Trip</h3>
              <p>Tell us your preferences and we'll tailor the perfect Jharkhand itinerary for you.</p>
              <form className="jh-booking-form" onSubmit={handleBookingSubmit}>
                <div className="jh-form-group">
                  <label htmlFor="jh-traveler-name">Full Name</label>
                  <input id="jh-traveler-name" type="text" required value={bookingForm.name}
                    onChange={e => setBookingForm({ ...bookingForm, name: e.target.value })} />
                </div>
                <div className="jh-form-group">
                  <label htmlFor="jh-booking-dest">Preferred Destination</label>
                  <select id="jh-booking-dest" required value={bookingForm.destination}
                    onChange={e => setBookingForm({ ...bookingForm, destination: e.target.value })}>
                    <option value="">Select Destination</option>
                    <option value="netarhat">Netarhat Hill Station</option>
                    <option value="betla">Betla National Park</option>
                    <option value="hundru">Hundru Falls</option>
                    <option value="baidyanath">Baidyanath Dham</option>
                    <option value="custom">Custom Package</option>
                  </select>
                </div>
                <div className="jh-form-group">
                  <label htmlFor="jh-booking-date">Travel Date</label>
                  <input id="jh-booking-date" type="date" required value={bookingForm.date}
                    onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })} />
                </div>
                <div className="jh-form-group">
                  <label htmlFor="jh-trip-duration">Trip Duration (Days)</label>
                  <select id="jh-trip-duration" required value={bookingForm.duration}
                    onChange={e => setBookingForm({ ...bookingForm, duration: e.target.value })}>
                    <option value="">Select Duration</option>
                    <option value="1-2">1-2 Days</option>
                    <option value="3-4">3-4 Days</option>
                    <option value="5-7">5-7 Days</option>
                    <option value="8+">8+ Days</option>
                  </select>
                </div>
                <div className="jh-form-group">
                  <label htmlFor="jh-booking-guests">Number of Guests</label>
                  <select id="jh-booking-guests" required value={bookingForm.guests}
                    onChange={e => setBookingForm({ ...bookingForm, guests: e.target.value })}>
                    <option value="">Select Guests</option>
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3-5">3-5 Guests</option>
                    <option value="6+">6+ Guests</option>
                  </select>
                </div>
                <div className="jh-form-group">
                  <label htmlFor="jh-booking-phone">Phone Number</label>
                  <input id="jh-booking-phone" type="tel" required value={bookingForm.phone}
                    onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })} />
                </div>
                <div className="jh-form-group">
                  <label htmlFor="jh-trip-interests">Interests</label>
                  <select id="jh-trip-interests" required value={bookingForm.interests}
                    onChange={e => setBookingForm({ ...bookingForm, interests: e.target.value })}>
                    <option value="">Choose Interests</option>
                    <option value="nature">Nature &amp; Waterfalls</option>
                    <option value="wildlife">Wildlife &amp; Safari</option>
                    <option value="spiritual">Spiritual &amp; Temples</option>
                    <option value="hills">Hill Stations &amp; Views</option>
                  </select>
                </div>
                <button type="submit" className="jh-submit-btn">Book Now</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="jh-footer" id="jh-contact">
        <div className="jh-container">
          <div className="jh-footer-content">
            <div className="jh-footer-section">
              <h3>Jharkhand Tourism</h3>
              <p>Discover the untamed beauty of Jharkhand — where forests whisper ancient stories and waterfalls sing songs of serenity.</p>
              <div className="jh-social-icons">
                <a href="#!" aria-label="Facebook">📘</a>
                <a href="#!" aria-label="Instagram">📷</a>
                <a href="#!" aria-label="Twitter">🐦</a>
                <a href="#!" aria-label="YouTube">📺</a>
              </div>
            </div>
            <div className="jh-footer-section">
              <h3>Quick Links</h3>
              <ul>
                <li><button className="jh-footer-link" onClick={() => scrollTo('jh-destinations')}>Popular Destinations</button></li>
                <li><Link to="/guides" className="jh-footer-link">Find Guides</Link></li>
                <li><Link to="/map" className="jh-footer-link">Interactive Map</Link></li>
                <li><button className="jh-footer-link" onClick={() => scrollTo('jh-plan-trip')}>Travel Planning</button></li>
              </ul>
            </div>
            <div className="jh-footer-section">
              <h3>Travel Info</h3>
              <ul>
                <li><a href="#!" className="jh-footer-link">Best Time to Visit</a></li>
                <li><a href="#!" className="jh-footer-link">Accommodation</a></li>
                <li><a href="#!" className="jh-footer-link">Transportation</a></li>
                <li><a href="#!" className="jh-footer-link">Travel Guidelines</a></li>
              </ul>
            </div>
            <div className="jh-footer-section">
              <h3>Contact Us</h3>
              <p>📍 Tourism Department, Jharkhand</p>
              <p>📞 +91-651-2446378</p>
              <p>✉️ info@jharkhandtourism.gov.in</p>
            </div>
          </div>
          <div className="jh-footer-bottom">
            <p>&copy; 2025 Jharkhand Tourism Platform. All Rights Reserved. Developed by Team NextEraX | <a href="#!">Privacy Policy</a> | <a href="#!">Terms of Service</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;