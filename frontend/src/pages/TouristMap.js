import React from 'react';
import { Container, Card } from 'react-bootstrap';

const TouristMap = () => {
  return (
    <Container fluid className="px-0 py-2" style={{ minHeight: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column' }}>
      <Card className="border-0 shadow-lg flex-grow-1 overflow-hidden" style={{ borderRadius: '15px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
        <Card.Header className="bg-gradient text-white d-flex justify-content-between align-items-center py-3" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.5rem' }}>🗺️</span>
            <div>
              <h5 className="mb-0 fw-bold">Interactive Tourism & Guide Discovery Map</h5>
              <small className="text-white-50">Explore attractions, find verified local guides, and plan routes across Jharkhand</small>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0 position-relative flex-grow-1" style={{ minHeight: '650px' }}>
          <iframe 
            src="/map-integrate/index.html" 
            title="Jharkhand Interactive Tourist Map"
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
            allow="geolocation"
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TouristMap;
