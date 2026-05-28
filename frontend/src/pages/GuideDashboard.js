import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Tabs, Tab, Badge, ProgressBar } from 'react-bootstrap';
import { FaUserEdit, FaWallet, FaCalendarCheck, FaChartBar, FaCheckCircle, FaTimesCircle, FaCertificate, FaCoins } from 'react-icons/fa';

const GuideDashboard = ({ account, isGuide }) => {
  // Mock Data States
  const [profile, setProfile] = useState({
    name: 'Ramesh Munda',
    expertise: 'Tribal Culture & Heritage',
    languages: 'English, Hindi, Mundari',
    govtId: 'XXXX-XXXX-1234',
    bio: 'Experienced local guide specializing in authentic tribal village experiences and local history.'
  });

  const [wallet, setWallet] = useState({
    dailyRate: 0.05,
    nftStatus: 'Approved',
    nftId: '#101',
    balance: 1.25
  });

  const [isAvailable, setIsAvailable] = useState(true);

  const [bookings, setBookings] = useState([
    { id: 'BK-001', tourist: '0x1A2B...3C4D', date: '2026-06-01', duration: '2 Days', status: 'Pending' },
    { id: 'BK-002', tourist: '0x9F8E...7D6C', date: '2026-06-05', duration: '1 Day', status: 'Accepted' },
    { id: 'BK-003', tourist: '0x5555...4444', date: '2026-05-20', duration: '3 Days', status: 'Completed' },
  ]);

  const [successMsg, setSuccessMsg] = useState('');

  // Handlers
  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleRateChange = (e) => {
    setWallet({ ...wallet, dailyRate: e.target.value });
  };

  const saveProfile = (e) => {
    e.preventDefault();
    showSuccess('Profile updated successfully!');
  };

  const saveRate = (e) => {
    e.preventDefault();
    showSuccess('Daily rate and wallet settings saved securely!');
  };

  const acceptBooking = (id) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Accepted' } : b));
    showSuccess(`Booking ${id} accepted!`);
  };

  const declineBooking = (id) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Declined' } : b));
    showSuccess(`Booking ${id} declined.`);
  };

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    showSuccess(`Availability set to ${!isAvailable ? 'Available' : 'Unavailable'}`);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (!isGuide) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">You must be logged in as a Guide to view this dashboard.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h2 style={{ color: '#1f2937', fontWeight: 'bold', fontSize: '2.5rem' }}>Guide Portal</h2>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Manage your bookings, availability, verify your profile, and track your earnings securely.
        </p>
      </div>

      {successMsg && <Alert variant="success" className="text-center">{successMsg}</Alert>}

      <Tabs defaultActiveKey="profile" id="guide-tabs" className="mb-4" justify>
        
        {/* TAB 1: PROFILE */}
        <Tab eventKey="profile" title={<><FaUserEdit className="me-2" /> Registration & Profile</>}>
          <Row className="justify-content-center">
            <Col md={8}>
              <Card className="shadow-sm" style={{ border: 'none', borderRadius: '15px' }}>
                <Card.Body>
                  <h4 className="mb-4"><FaUserEdit className="me-2" />Profile Setup</h4>
                  <Form onSubmit={saveProfile}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control type="text" name="name" value={profile.name} onChange={handleProfileChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Area of Expertise</Form.Label>
                      <Form.Select name="expertise" value={profile.expertise} onChange={handleProfileChange}>
                        <option>Nature & Waterfalls</option>
                        <option>Tribal Culture & Heritage</option>
                        <option>Wildlife & Adventure</option>
                        <option>Religious & Temple Tours</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Languages Spoken</Form.Label>
                      <Form.Control type="text" name="languages" value={profile.languages} onChange={handleProfileChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Government ID (Aadhaar / Voter ID)</Form.Label>
                      <Form.Control type="text" name="govtId" value={profile.govtId} onChange={handleProfileChange} placeholder="Enter ID Number for Verification" />
                      <Form.Text className="text-muted">This is required for Admin verification and is kept strictly confidential.</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Short Bio</Form.Label>
                      <Form.Control as="textarea" rows={3} name="bio" value={profile.bio} onChange={handleProfileChange} />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="w-100" style={{ backgroundColor: '#0284c7', border: 'none' }}>
                      Update Profile
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* TAB 2: WALLET & RATES */}
        <Tab eventKey="wallet" title={<><FaWallet className="me-2" /> Wallet & Rates</>}>
          <Row>
            <Col lg={5} className="mb-4">
              <Card className="shadow-sm h-100" style={{ border: 'none', borderRadius: '15px', backgroundColor: '#f8fafc' }}>
                <Card.Body className="text-center">
                  <h4 className="mb-4"><FaCertificate className="me-2 text-warning" />Soulbound NFT Status</h4>
                  {wallet.nftStatus === 'Approved' ? (
                    <>
                      <div className="mb-3 text-success">
                        <FaCheckCircle size={60} />
                      </div>
                      <h5 className="text-success">Verified Guide</h5>
                      <p className="text-muted">Your Identity is verified via blockchain.</p>
                      <Badge bg="info" className="p-2 fs-6">Certificate ID: {wallet.nftId}</Badge>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 text-secondary">
                        <FaTimesCircle size={60} />
                      </div>
                      <h5>Pending Verification</h5>
                      <p className="text-muted">Awaiting admin approval for your NFT certificate.</p>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={7}>
              <Card className="shadow-sm" style={{ border: 'none', borderRadius: '15px' }}>
                <Card.Body>
                  <h4 className="mb-4"><FaCoins className="me-2" />Payment Settings</h4>
                  <Alert variant="info">Payments are secured via Smart Contracts. Funds are locked in escrow upon booking and released post-tour.</Alert>
                  
                  <Form onSubmit={saveRate}>
                    <Form.Group className="mb-4">
                      <Form.Label>Set Daily Rate (ETH)</Form.Label>
                      <Form.Control type="number" step="0.01" value={wallet.dailyRate} onChange={handleRateChange} />
                      <Form.Text className="text-muted">Current exchange rate: ~₹25,000 / ETH</Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center mb-4 p-3 border rounded">
                      <div>
                        <h6 className="mb-0">Current Wallet Balance</h6>
                        <small className="text-muted">Available for withdrawal</small>
                      </div>
                      <h4 className="text-success mb-0">{wallet.balance} ETH</h4>
                    </div>

                    <Button variant="primary" type="submit" style={{ backgroundColor: '#0284c7', border: 'none' }}>
                      Save Payment Settings
                    </Button>
                    <Button variant="outline-success" className="ms-3">
                      Withdraw Funds
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* TAB 3: BOOKINGS */}
        <Tab eventKey="bookings" title={<><FaCalendarCheck className="me-2" /> Bookings & Availability</>}>
          <Card className="shadow-sm mb-4" style={{ border: 'none', borderRadius: '15px' }}>
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">Current Availability Status</h5>
                <small className="text-muted">Toggle your availability to accept new tourist bookings.</small>
              </div>
              <Form.Check 
                type="switch" 
                id="availability-switch"
                checked={isAvailable}
                onChange={toggleAvailability}
                label={isAvailable ? <Badge bg="success">Accepting Tours</Badge> : <Badge bg="danger">Unavailable</Badge>}
                style={{ transform: 'scale(1.2)' }}
              />
            </Card.Body>
          </Card>

          <Card className="shadow-sm" style={{ border: 'none', borderRadius: '15px' }}>
            <Card.Body>
              <h4 className="mb-4">Booking Requests</h4>
              <Table hover responsive className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Booking ID</th>
                    <th>Tourist Wallet</th>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td><strong>{booking.id}</strong></td>
                      <td>{booking.tourist}</td>
                      <td>{booking.date}</td>
                      <td>{booking.duration}</td>
                      <td>
                        <Badge bg={
                          booking.status === 'Accepted' ? 'primary' :
                          booking.status === 'Completed' ? 'success' :
                          booking.status === 'Declined' ? 'danger' : 'warning'
                        }>
                          {booking.status}
                        </Badge>
                      </td>
                      <td>
                        {booking.status === 'Pending' && (
                          <>
                            <Button variant="outline-success" size="sm" className="me-2" onClick={() => acceptBooking(booking.id)}>Accept</Button>
                            <Button variant="outline-danger" size="sm" onClick={() => declineBooking(booking.id)}>Decline</Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 4: ANALYTICS */}
        <Tab eventKey="analytics" title={<><FaChartBar className="me-2" /> Real-time Analytics</>}>
           <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center shadow-sm" style={{ border: 'none', borderRadius: '15px', backgroundColor: '#f0f9ff' }}>
                <Card.Body>
                  <h1 style={{ color: '#0369a1', fontWeight: 'bold' }}>42</h1>
                  <p className="text-muted mb-0">Total Tours Completed</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center shadow-sm" style={{ border: 'none', borderRadius: '15px', backgroundColor: '#f0f9ff' }}>
                <Card.Body>
                  <h1 style={{ color: '#d97706', fontWeight: 'bold' }}>4.9/5</h1>
                  <p className="text-muted mb-0">Average Tourist Rating</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center shadow-sm" style={{ border: 'none', borderRadius: '15px', backgroundColor: '#dcfce7' }}>
                <Card.Body>
                  <h1 style={{ color: '#15803d', fontWeight: 'bold' }}>1.25 ETH</h1>
                  <p className="text-muted mb-0">Total Earnings</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="shadow-sm" style={{ border: 'none', borderRadius: '15px' }}>
            <Card.Body>
              <h4 className="mb-4">Performance Metrics</h4>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <strong>Profile Completion</strong>
                  <span className="text-muted">100%</span>
                </div>
                <ProgressBar variant="success" now={100} />
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <strong>Booking Acceptance Rate</strong>
                  <span className="text-muted">95%</span>
                </div>
                <ProgressBar variant="info" now={95} />
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <strong>Response Time (under 2 hours)</strong>
                  <span className="text-muted">88%</span>
                </div>
                <ProgressBar variant="warning" now={88} />
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default GuideDashboard;
