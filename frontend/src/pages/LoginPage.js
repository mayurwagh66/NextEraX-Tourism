import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../styles/GuideAuth.css'; // Import custom CSS for this page

const LoginPage = () => {
  const navigate = useNavigate();

  const handleGuideLogin = () => {
    // Logic for Guide Login
    console.log("Guide Login clicked");
    // Example: navigate('/guide-dashboard');
  };

  const handleRegisterAsGuide = () => {
    // Logic for Register as Guide
    console.log("Register as Guide clicked");
    // Example: navigate('/guide-registration');
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <Container fluid className="guide-auth-container">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col md={8} lg={6} xl={5}>
          <Card className="guide-auth-card p-4 p-md-5">
            <Card.Body className="text-center">
              <h1 className="mb-3 guide-auth-title">Guide</h1>
              <p className="mb-4 guide-auth-description">
                Login to manage your profile or register as a new guide.
              </p>
              <div className="d-grid gap-3">
                <Button 
                  variant="primary" 
                  className="guide-auth-button guide-login-button"
                  onClick={handleGuideLogin}
                >
                  Guide Login
                </Button>
                <Button 
                  variant="secondary" 
                  className="guide-auth-button register-guide-button"
                  onClick={handleRegisterAsGuide}
                >
                  Register as Guide
                </Button>
              </div>
              <Button 
                variant="link" 
                className="back-button mt-4"
                onClick={handleBack}
              >
                Back
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
