import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { FaUserCircle, FaMapMarkedAlt, FaRobot, FaGlobeAmericas, FaCommentDots } from 'react-icons/fa';

const TouristNavbar = ({ account, onLogout }) => {
  return (
    <Navbar bg="light" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand href="#home">NexteraX Tourist Panel</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/guides">
              <Nav.Link><FaUserCircle className="me-1" /> Verified Guides</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/map">
              <Nav.Link><FaMapMarkedAlt className="me-1" /> Tourist Map</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/ai-assistant">
              <Nav.Link><FaRobot className="me-1" /> AI Tourism Assistant</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/jharkhand360">
              <Nav.Link><FaGlobeAmericas className="me-1" /> Jharkhand 360 View</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/feedback">
              <Nav.Link><FaCommentDots className="me-1" /> Give Feedback</Nav.Link>
            </LinkContainer>
          </Nav>
          <Nav>
            {account && <Nav.Link>Welcome, {account.substring(0, 6)}...</Nav.Link>}
            <Button variant="danger" onClick={onLogout}>Logout</Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default TouristNavbar;
