import React from 'react';
import { Container, Card } from 'react-bootstrap';

const AiTourismAssistant = () => {
  return (
    <Container fluid className="px-0" style={{ height: 'calc(100vh - 80px)', width: '100vw', overflow: 'hidden' }}>
      <iframe 
        src="/ai-assistant/index.html" 
        title="Jharkhand Tourism Assistant"
        style={{ 
          border: 'none', 
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </Container>
  );
};

export default AiTourismAssistant;
