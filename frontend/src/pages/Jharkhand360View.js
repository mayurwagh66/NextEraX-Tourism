import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const Jharkhand360View = () => {
  const [activeFeature, setActiveFeature] = useState(null);

  const features = [
    {
      id: '360',
      title: '360° Panoramic Explorer',
      description: 'Explore the spectacular sights and landscapes of Jharkhand in fully immersive 360-degree street-level views powered by Mapillary.',
      icon: '🗺️',
      url: '/jharkhand360.html',
      themecolor: '#1f2937'
    },
    {
      id: 'ar',
      title: 'AR.js Marker Scanner',
      description: 'Experience augmented reality! Scan printed markers to see interactive historical details and virtual tourism guide cards in AR.',
      icon: '📱',
      url: '/place-info/index.html',
      themeColor: '#d97706'
    },
    {
      id: 'vr',
      title: 'Virtual Reality Streetview',
      description: 'Step into a virtual reality streetscape of Jharkhand tourist attractions. Designed for high fidelity visual immersion.',
      icon: '🕶️',
      url: '/street-view/jharkhand_arvr_streetview.html',
      themeColor: '#764ba2'
    },
    {
      id: 'nav',
      title: 'Navigation Streetview',
      description: 'Virtually navigate the scenic roadways and pathways connecting Jharkhand\'s top waterfalls and historic temple sites.',
      icon: '🧭',
      url: '/navigation/jharkhand_nav_streetview.html',
      themeColor: '#1d3557'
    }
  ];

  if (activeFeature) {
    const selected = features.find(f => f.id === activeFeature);
    return (
      <Container fluid className="px-0 py-2" style={{ minHeight: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column' }}>
        <Card className="border-0 shadow-lg flex-grow-1 overflow-hidden" style={{ borderRadius: '15px' }}>
          <Card.Header className="text-white d-flex justify-content-between align-items-center py-3" style={{ background: `linear-gradient(135deg, ${selected.themeColor}, #111)` }}>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '1.5rem' }}>{selected.icon}</span>
              <div>
                <h5 className="mb-0 fw-bold">{selected.title}</h5>
                <small className="text-white-50">{selected.description}</small>
              </div>
            </div>
            <Button 
              variant="outline-light" 
              className="fw-bold px-3" 
              style={{ borderRadius: '20px' }}
              onClick={() => setActiveFeature(null)}
            >
              ↩ Back to Console
            </Button>
          </Card.Header>
          <Card.Body className="p-0 position-relative flex-grow-1" style={{ minHeight: '650px' }}>
            <iframe 
              src={selected.url} 
              title={selected.title}
              width="100%" 
              height="100%" 
              style={{ 
                border: 'none', 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'block'
              }}
              allow="camera; geolocation; microphone; xr-spatial-tracking"
            />
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #fdfbfb 0%, #f4f6f8 100%)', minHeight: 'calc(100vh - 80px)', padding: '4rem 0', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative light background glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(118,75,162,0.05) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(29,53,87,0.05) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />

      <Container className="position-relative" style={{ zIndex: 1 }}>
        <div className="text-center mb-5">
          <div className="d-inline-block px-4 py-1 mb-3 rounded-pill" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', color: '#6c757d', fontSize: '0.85rem', letterSpacing: '2px', fontWeight: 'bold' }}>
            NEXT-GEN TOURISM
          </div>
          <h2 className="fw-bold mb-3" style={{ color: '#2b2b2b', fontSize: '2.8rem', letterSpacing: '-0.5px' }}>
            Immersive Jharkhand 360° & AR/VR Console
          </h2>
          <p style={{ color: '#6c757d', maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Interact with next-generation tourism technologies. Journey virtually through historic temples, cascading water basins, and dense woodlands in breathtaking fidelity.
          </p>
        </div>

        <Row className="g-4">
          {features.map((feature) => (
            <Col md={6} key={feature.id}>
              <div 
                className="h-100"
                style={{ 
                  borderRadius: '24px', 
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.05), 0 15px 35px ${feature.themeColor}25`;
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.querySelector('.glow-btn').style.background = feature.themeColor;
                  e.currentTarget.querySelector('.glow-btn').style.color = '#fff';
                  e.currentTarget.querySelector('.glow-btn').style.boxShadow = `0 8px 20px ${feature.themeColor}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.03)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.querySelector('.glow-btn').style.background = 'rgba(0,0,0,0.04)';
                  e.currentTarget.querySelector('.glow-btn').style.color = '#495057';
                  e.currentTarget.querySelector('.glow-btn').style.boxShadow = 'none';
                }}
                onClick={() => setActiveFeature(feature.id)}
              >
                {/* Subtle Accent Line */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: `linear-gradient(90deg, ${feature.themeColor}, transparent)` }} />
                
                <div className="p-4 d-flex flex-column flex-grow-1 mt-2">
                  <div className="d-flex align-items-center gap-4 mb-4">
                    <div 
                      className="d-flex align-items-center justify-content-center shadow-sm"
                      style={{ 
                        width: '70px', 
                        height: '70px', 
                        borderRadius: '20px', 
                        background: '#ffffff',
                        border: `1px solid ${feature.themeColor}30`,
                        fontSize: '2.2rem' 
                      }}
                    >
                      {feature.icon}
                    </div>
                    <h4 className="fw-bold mb-0" style={{ color: '#2b2b2b', fontSize: '1.5rem', letterSpacing: '0.2px' }}>{feature.title}</h4>
                  </div>
                  
                  <p className="flex-grow-1 mb-4" style={{ color: '#6c757d', fontSize: '1.05rem', lineHeight: '1.7' }}>
                    {feature.description}
                  </p>
                  
                  <Button 
                    className="glow-btn w-100 fw-bold border-0 mt-auto" 
                    style={{ 
                      background: 'rgba(0,0,0,0.04)',
                      color: '#495057', 
                      borderRadius: '14px',
                      padding: '14px',
                      transition: 'all 0.4s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      fontSize: '0.9rem'
                    }}
                  >
                    Launch Experience ➔
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default Jharkhand360View;
