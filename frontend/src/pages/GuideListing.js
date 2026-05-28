import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUserCheck, FaSpinner, FaInfoCircle } from 'react-icons/fa';

const GuideListing = ({ account, contracts }) => {
  // State variables
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load guides on component mount
  useEffect(() => {
    if (contracts.guideRegistry) {
      loadVerifiedGuides();
    }
  }, [contracts.guideRegistry]);

  // Load verified guides from the contract
  const loadVerifiedGuides = async () => {
    try {
      setLoading(true);
      setError('');
      
      const guideAddresses = await contracts.guideRegistry.getAllGuideAddresses();
      
      const guidesData = await Promise.all(
        guideAddresses.map(async (address) => {
          const details = await contracts.guideRegistry.getGuideDetails(address);
          return {
            address,
            name: details[0],
            serviceType: details[1],
            isVerified: details[2],
            verificationDate: details[3].toString(),
            tokenId: details[4].toString()
          };
        })
      );
      
      // Filter only verified guides
      const verifiedGuides = guidesData.filter(guide => guide.isVerified);
      setGuides(verifiedGuides);
    } catch (err) {
      console.error('Error loading guides:', err);
      setError('Failed to load guides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === '0') return 'Not verified';
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h2 style={{ color: '#1f2937', fontWeight: 'bold', fontSize: '2.5rem' }}>Verified Guides</h2>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Discover our community of certified local experts ready to make your Jharkhand adventure unforgettable.
        </p>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {!account && (
        <Alert variant="warning">
          <FaInfoCircle className="me-2" />
          Please connect your wallet to interact with guides.
        </Alert>
      )}
      
      {loading ? (
        <div className="spinner-container">
          <FaSpinner className="fa-spin" size={30} />
        </div>
      ) : guides.length === 0 ? (
        <Alert variant="info">No verified guides available at the moment.</Alert>
      ) : (
        <Row>
          {guides.map((guide) => (
            <Col md={6} lg={4} key={guide.address} className="mb-4">
              <Card className="guide-card verified h-100">
                <Card.Body>
                  <div className="verification-badge">
                    <FaUserCheck className="me-1" /> Verified Guide
                  </div>
                  
                  <Card.Title>{guide.name}</Card.Title>
                  
                  <Card.Subtitle className="mb-3 text-muted">
                    {guide.serviceType}
                  </Card.Subtitle>
                  
                  <Card.Text>
                    <strong>Wallet:</strong> {formatAddress(guide.address)}
                  </Card.Text>
                  
                  <Card.Text>
                    <strong>Verified on:</strong> {formatDate(guide.verificationDate)}
                  </Card.Text>
                  
                  <Card.Text>
                    <strong>Certificate ID:</strong> {guide.tokenId}
                  </Card.Text>
                  
                  <Button 
                    as={Link} 
                    to={`/guide/${guide.address}`} 
                    variant="primary" 
                    className="w-100 mt-3"
                  >
                    View Details & Book
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default GuideListing;