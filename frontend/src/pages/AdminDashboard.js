import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Tabs, Tab, Badge, ProgressBar } from 'react-bootstrap';
import { FaUserPlus, FaUserCheck, FaSpinner, FaChartLine, FaExclamationTriangle, FaCog, FaTrash, FaCheck } from 'react-icons/fa';

const AdminDashboard = ({ account, isAdmin, contracts }) => {
  const demoGuides = [
    { address: '0x1234567890abcdef1234567890abcdef12345678', name: 'Ramesh Munda', serviceType: 'Tribal Culture Expert', isVerified: true, verificationDate: Math.floor(Date.now()/1000 - 86400).toString(), tokenId: '101', govtId: 'XXXX-XXXX-1234' },
    { address: '0xabcdef1234567890abcdef1234567890abcdef12', name: 'Sita Soren', serviceType: 'Nature & Waterfalls', isVerified: true, verificationDate: Math.floor(Date.now()/1000 - 172800).toString(), tokenId: '102', govtId: 'XXXX-XXXX-5678' },
    { address: '0x7890abcdef1234567890abcdef1234567890abcd', name: 'Deepak Kumar', serviceType: 'History & Heritage', isVerified: false, verificationDate: '0', tokenId: '0', govtId: 'XXXX-XXXX-9012' },
    { address: '0xdef1234567890abcdef1234567890abcdef12345', name: 'Priya Singh', serviceType: 'Adventure & Trekking', isVerified: true, verificationDate: Math.floor(Date.now()/1000 - 432000).toString(), tokenId: '103', govtId: 'XXXX-XXXX-3456' }
  ];

  const demoReports = [
    { id: 1, user: '0x889...432', subject: 'Guide not arriving on time', status: 'Pending', date: '2026-05-27' },
    { id: 2, user: '0x112...999', subject: 'Excellent experience with Ramesh', status: 'Resolved', date: '2026-05-25' },
    { id: 3, user: '0x555...777', subject: 'Payment failed for homestay', status: 'Pending', date: '2026-05-28' },
  ];

  // State variables
  const [guides, setGuides] = useState(demoGuides);
  const [reports, setReports] = useState(demoReports);
  const [platformFee, setPlatformFee] = useState('2.5');
  const [maxGuides, setMaxGuides] = useState('50');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [newGuide, setNewGuide] = useState({
    address: '',
    name: '',
    serviceType: ''
  });

  // Load guides on component mount
  useEffect(() => {
    if (contracts && contracts.guideRegistry) {
      loadGuides();
    }
  }, [contracts]);

  const loadGuides = async () => {
    try {
      if (!contracts || !contracts.guideRegistry) {
        setGuides(demoGuides);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError('');
      
      const guideAddresses = await contracts.guideRegistry.getAllGuideAddresses();
      
      if (guideAddresses.length === 0) {
        setGuides(demoGuides);
        setLoading(false);
        return;
      }

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
      
      setGuides(guidesData);
    } catch (err) {
      console.error('Error loading guides:', err);
      setGuides(demoGuides);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGuide({
      ...newGuide,
      [name]: value
    });
  };

  const addGuide = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (!newGuide.address || !newGuide.name || !newGuide.serviceType) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      
      if (contracts && contracts.guideRegistry) {
        const tx = await contracts.guideRegistry.addGuide(
          newGuide.address,
          newGuide.name,
          newGuide.serviceType
        );
        await tx.wait();
        loadGuides();
      } else {
        // Mock add for Demo
        setGuides([...guides, {
          address: newGuide.address,
          name: newGuide.name,
          serviceType: newGuide.serviceType,
          isVerified: false,
          verificationDate: '0',
          tokenId: '0'
        }]);
      }
      
      setNewGuide({ address: '', name: '', serviceType: '' });
      setSuccess('Guide added successfully!');
    } catch (err) {
      console.error('Error adding guide:', err);
      setError('Failed to add guide.');
    } finally {
      setLoading(false);
    }
  };

  const verifyGuide = async (address) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (contracts && contracts.guideRegistry) {
        const tx = await contracts.guideRegistry.verifyGuide(address);
        await tx.wait();
        loadGuides();
      } else {
        // Mock verify for demo
        setGuides(guides.map(g => g.address === address ? { ...g, isVerified: true, verificationDate: Math.floor(Date.now()/1000).toString(), tokenId: '999' } : g));
      }
      setSuccess(`Guide ${address} verified successfully!`);
    } catch (err) {
      console.error('Error verifying guide:', err);
      setError('Failed to verify guide.');
    } finally {
      setLoading(false);
    }
  };

  const removeGuide = (address) => {
    if (window.confirm('Are you sure you want to revoke/remove this guide?')) {
      setGuides(guides.filter(g => g.address !== address));
      setSuccess(`Guide ${address} removed successfully.`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const resolveReport = (id) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'Resolved' } : r));
    setSuccess(`Report #${id} marked as Resolved.`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const saveParameters = (e) => {
    e.preventDefault();
    setSuccess('Platform parameters updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === '0') return 'Not verified';
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  if (!isAdmin) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">You do not have admin access to this page.</Alert>
      </Container>
    );
  }

  const monthlyData = [
    { month: 'Jan', bookings: 12, revenue: 0.5 },
    { month: 'Feb', bookings: 19, revenue: 0.8 },
    { month: 'Mar', bookings: 30, revenue: 1.2 },
    { month: 'Apr', bookings: 45, revenue: 2.1 },
    { month: 'May', bookings: 60, revenue: 3.5 },
    { month: 'Jun', bookings: 85, revenue: 4.2 },
  ];

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h2 style={{ color: '#1f2937', fontWeight: 'bold', fontSize: '2.5rem' }}>Admin Dashboard</h2>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Manage platform operations, verify guides, and oversee network activity.
        </p>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Tabs defaultActiveKey="guides" id="admin-tabs" className="mb-4" justify>
        {/* TAB 1: GUIDE MANAGEMENT */}
        <Tab eventKey="guides" title={<><FaUserCheck className="me-2" /> Manage Guides</>}>
          <Row>
            <Col lg={4}>
              <Card className="admin-section mb-4 shadow-sm" style={{ borderRadius: '15px', border: 'none' }}>
                <Card.Body>
                  <h4 className="mb-4 text-dark"><FaUserPlus className="me-2" />Add New Guide</h4>
                  <Form onSubmit={addGuide}>
                    <Form.Group className="mb-3">
                      <Form.Label>Wallet Address</Form.Label>
                      <Form.Control type="text" name="address" value={newGuide.address} onChange={handleInputChange} placeholder="0x..." required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Guide Name</Form.Label>
                      <Form.Control type="text" name="name" value={newGuide.name} onChange={handleInputChange} placeholder="Full Name" required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Service Type</Form.Label>
                      <Form.Control type="text" name="serviceType" value={newGuide.serviceType} onChange={handleInputChange} placeholder="e.g., City Tours" required />
                    </Form.Group>
                    <Button variant="primary" type="submit" disabled={loading} className="w-100" style={{ backgroundColor: '#0284c7', border: 'none' }}>
                      {loading ? <><FaSpinner className="me-2 fa-spin" /> Processing...</> : 'Add Guide'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={8}>
              <Card className="admin-section shadow-sm" style={{ borderRadius: '15px', border: 'none' }}>
                <Card.Body>
                  <h4 className="mb-4 text-dark">Registered Guides</h4>
                  {loading && guides.length === 0 ? (
                    <div className="text-center p-5"><FaSpinner className="fa-spin" size={30} /></div>
                  ) : guides.length === 0 ? (
                    <Alert variant="info">No guides registered yet.</Alert>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Name</th>
                            <th>Govt ID</th>
                            <th>Service Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {guides.map((guide) => (
                            <tr key={guide.address}>
                              <td><strong>{guide.name}</strong><br/><small className="text-muted">{guide.address.substring(0,8)}...</small></td>
                              <td><span className="text-muted" style={{ fontFamily: 'monospace' }}>{guide.govtId || 'Not Provided'}</span></td>
                              <td>{guide.serviceType}</td>
                              <td>
                                {guide.isVerified ? <Badge bg="success">Verified</Badge> : <Badge bg="warning" text="dark">Pending</Badge>}
                              </td>
                              <td>
                                {!guide.isVerified && (
                                  <Button variant="outline-success" size="sm" className="me-2" onClick={() => verifyGuide(guide.address)} disabled={loading}>
                                    <FaCheck /> Verify
                                  </Button>
                                )}
                                <Button variant="outline-danger" size="sm" onClick={() => removeGuide(guide.address)}>
                                  <FaTrash /> Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* TAB 2: ANALYTICS */}
        <Tab eventKey="analytics" title={<><FaChartLine className="me-2" /> Analytics</>}>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center shadow-sm" style={{ border: 'none', borderRadius: '15px', backgroundColor: '#f0f9ff' }}>
                <Card.Body>
                  <h1 style={{ color: '#0369a1', fontWeight: 'bold' }}>2,450</h1>
                  <p className="text-muted mb-0">Total Bookings</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center shadow-sm" style={{ border: 'none', borderRadius: '15px', backgroundColor: '#f0f9ff' }}>
                <Card.Body>
                  <h1 style={{ color: '#0369a1', fontWeight: 'bold' }}>142</h1>
                  <p className="text-muted mb-0">Verified Guides</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center shadow-sm" style={{ border: 'none', borderRadius: '15px', backgroundColor: '#f0f9ff' }}>
                <Card.Body>
                  <h1 style={{ color: '#0369a1', fontWeight: 'bold' }}>18.5 ETH</h1>
                  <p className="text-muted mb-0">Platform Revenue</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Card className="shadow-sm" style={{ border: 'none', borderRadius: '15px' }}>
            <Card.Body>
              <h4 className="mb-4">Platform Growth (6 Months)</h4>
              <div className="px-3">
                {monthlyData.map((data, idx) => (
                  <div key={idx} className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <strong>{data.month}</strong>
                      <span className="text-muted">{data.bookings} Bookings | {data.revenue} ETH</span>
                    </div>
                    <ProgressBar style={{ height: '10px' }}>
                      <ProgressBar striped variant="info" now={(data.bookings / 85) * 100} key={1} />
                    </ProgressBar>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 3: USER REPORTS */}
        <Tab eventKey="reports" title={<><FaExclamationTriangle className="me-2" /> User Reports</>}>
          <Card className="shadow-sm" style={{ border: 'none', borderRadius: '15px' }}>
            <Card.Body>
              <h4 className="mb-4">Recent Reports & Disputes</h4>
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Report ID</th>
                    <th>User</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>#{report.id}</td>
                      <td>{report.user}</td>
                      <td>{report.subject}</td>
                      <td>{report.date}</td>
                      <td>
                        {report.status === 'Resolved' ? <Badge bg="success">Resolved</Badge> : <Badge bg="danger">Pending</Badge>}
                      </td>
                      <td>
                        {report.status === 'Pending' && (
                          <Button variant="outline-success" size="sm" onClick={() => resolveReport(report.id)}>
                            <FaCheck /> Mark Resolved
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 4: PLATFORM PARAMETERS */}
        <Tab eventKey="parameters" title={<><FaCog className="me-2" /> Parameters</>}>
          <Row className="justify-content-center">
            <Col md={8}>
              <Card className="shadow-sm" style={{ border: 'none', borderRadius: '15px' }}>
                <Card.Body>
                  <h4 className="mb-4">Global Platform Settings</h4>
                  <Form onSubmit={saveParameters}>
                    <Form.Group className="mb-4">
                      <Form.Label>Platform Fee (%)</Form.Label>
                      <Form.Control type="number" step="0.1" value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} />
                      <Form.Text className="text-muted">Percentage of booking cost taken as platform revenue.</Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Max Guides per City</Form.Label>
                      <Form.Control type="number" value={maxGuides} onChange={(e) => setMaxGuides(e.target.value)} />
                      <Form.Text className="text-muted">Limit active verified guides to prevent over-saturation.</Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Check type="switch" id="auto-verification" label="Enable Auto-Verification AI for initial screening" defaultChecked />
                    </Form.Group>

                    <Button variant="primary" type="submit" style={{ backgroundColor: '#0284c7', border: 'none' }}>
                      Save Parameters
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminDashboard;