import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUserCheck, FaCertificate, FaMoneyBillWave, FaSpinner } from 'react-icons/fa';
import { ethers } from 'ethers';

const GuideDetail = ({ account, contracts }) => {
  // Get guide address from URL params
  const { address } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [allowance, setAllowance] = useState('0');

  // Load guide details on component mount
  useEffect(() => {
    if (contracts.guideRegistry && address) {
      loadGuideDetails();
    }
  }, [contracts.guideRegistry, address]);

  // Load token details when account changes
  useEffect(() => {
    if (contracts.paymentToken && account) {
      loadTokenDetails();
    }
  }, [contracts.paymentToken, account]);

  // Load guide details from the contract
  const loadGuideDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const details = await contracts.guideRegistry.getGuideDetails(address);
      
      // Check if guide exists and is verified
      if (!details[0] || details[0] === '') {
        setError('Guide not found');
        setLoading(false);
        return;
      }
      
      if (!details[2]) {
        setError('This guide is not verified');
        setLoading(false);
        return;
      }
      
      const guideData = {
        address,
        name: details[0],
        serviceType: details[1],
        isVerified: details[2],
        verificationDate: details[3].toString(),
        tokenId: details[4].toString()
      };
      
      setGuide(guideData);
    } catch (err) {
      console.error('Error loading guide details:', err);
      setError('Failed to load guide details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load token details
  const loadTokenDetails = async () => {
    try {
      // Get token symbol
      const symbol = await contracts.paymentToken.symbol();
      setTokenSymbol(symbol);
      
      // Get token decimals
      const decimals = await contracts.paymentToken.decimals();
      setTokenDecimals(decimals);
      
      // Get user's token balance
      const balance = await contracts.paymentToken.balanceOf(account);
      setTokenBalance(balance.toString());
      
      // Get allowance
      const paymentSystemAddress = await contracts.paymentSystem.getAddress();
      const currentAllowance = await contracts.paymentToken.allowance(account, paymentSystemAddress);
      setAllowance(currentAllowance.toString());
    } catch (err) {
      console.error('Error loading token details:', err);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === '0') return 'Not verified';
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  // Format token amount for display
  const formatTokenAmount = (amount) => {
    if (!amount) return '0';
    return ethers.formatUnits(amount, tokenDecimals);
  };

  // Handle payment amount input change
  const handleAmountChange = (e) => {
    setPaymentAmount(e.target.value);
  };

  // Handle service description input change
  const handleDescriptionChange = (e) => {
    setServiceDescription(e.target.value);
  };

  // Approve token spending
  const approveTokens = async () => {
    try {
      setProcessingPayment(true);
      setError('');
      setSuccess('');
      
      if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        setError('Please enter a valid payment amount');
        setProcessingPayment(false);
        return;
      }
      
      const paymentSystemAddress = await contracts.paymentSystem.getAddress();
      const amount = ethers.parseUnits(paymentAmount, tokenDecimals);
      
      // Approve tokens
      const tx = await contracts.paymentToken.approve(paymentSystemAddress, amount);
      await tx.wait();
      
      setSuccess('Token approval successful! You can now make the payment.');
      setAllowance(amount.toString());
    } catch (err) {
      console.error('Error approving tokens:', err);
      setError('Failed to approve tokens. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Make payment to guide
  const makePayment = async () => {
    try {
      setProcessingPayment(true);
      setError('');
      setSuccess('');
      
      if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        setError('Please enter a valid payment amount');
        setProcessingPayment(false);
        return;
      }
      
      if (!serviceDescription) {
        setError('Please enter a service description');
        setProcessingPayment(false);
        return;
      }
      
      const amount = ethers.parseUnits(paymentAmount, tokenDecimals);
      
      // Check if allowance is sufficient
      if (ethers.getBigInt(allowance) < amount) {
        setError('Please approve tokens first');
        setProcessingPayment(false);
        return;
      }
      
      // Make payment
      const tx = await contracts.paymentSystem.makePayment(
        address,
        amount,
        serviceDescription
      );
      
      await tx.wait();
      
      setSuccess('Payment successful!');
      setPaymentAmount('');
      setServiceDescription('');
      
      // Reload token details
      loadTokenDetails();
    } catch (err) {
      console.error('Error making payment:', err);
      setError('Failed to make payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Redirect if guide not found or not verified
  if (error === 'Guide not found' || error === 'This guide is not verified') {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {error}
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/guides')}>
              Back to Guides
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      {loading ? (
        <div className="spinner-container">
          <FaSpinner className="fa-spin" size={30} />
        </div>
      ) : guide ? (
        <>
          <Row className="my-4">
            <Col>
              <Card className="border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.05), rgba(139, 95, 74, 0.05))' }}>
                <Card.Body className="p-4 d-flex align-items-center justify-content-between flex-wrap">
                  <div>
                    <h2 style={{ color: '#1f2937', fontWeight: 'bold' }} className="mb-2">{guide.name}</h2>
                    <div className="text-muted mb-2"><strong style={{ color: '#d97706' }}>Service:</strong> {guide.serviceType}</div>
                  </div>
                  <div className="verification-badge m-0" style={{ fontSize: '1rem', padding: '10px 20px' }}>
                    <FaUserCheck className="me-2" /> Certified Local Guide
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col lg={7}>
              <Card className="mb-4 shadow-sm border-0">
                <Card.Body className="p-4">
                  <h4 style={{ color: '#1f2937', fontWeight: '600' }}>Guide Information</h4>
                  <hr style={{ borderColor: '#e0e0e0', opacity: 1 }} />
                  
                  <Row className="mb-3">
                    <Col sm={4}>
                      <strong>Service Type:</strong>
                    </Col>
                    <Col sm={8}>
                      {guide.serviceType}
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col sm={4}>
                      <strong>Wallet Address:</strong>
                    </Col>
                    <Col sm={8}>
                      <code>{guide.address}</code>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col sm={4}>
                      <strong>Verification Date:</strong>
                    </Col>
                    <Col sm={8}>
                      {formatDate(guide.verificationDate)}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              
              <Card className="nft-certificate mb-4 shadow-sm border-0" style={{ backgroundColor: '#f0fdf4', borderLeft: '5px solid #0284c7' }}>
                <Card.Body className="p-4">
                  <h4 style={{ color: '#1f2937', fontWeight: '600' }}>
                    <FaCertificate className="me-2" style={{ color: '#d97706' }} />
                    Digital Certification
                  </h4>
                  <hr style={{ borderColor: '#e0e0e0', opacity: 1 }} />
                  
                  <Row className="mb-3">
                    <Col sm={4}>
                      <strong>Certificate Type:</strong>
                    </Col>
                    <Col sm={8}>
                      Soulbound NFT (Non-transferable)
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col sm={4}>
                      <strong>Token ID:</strong>
                    </Col>
                    <Col sm={8}>
                      {guide.tokenId}
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col sm={4}>
                      <strong>Issuer:</strong>
                    </Col>
                    <Col sm={8}>
                      NexteraX Platform
                    </Col>
                  </Row>
                  
                  <div className="text-center mt-4">
                    <p className="text-muted">
                      This certificate is stored on the blockchain and cannot be transferred or forged.
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={5}>
              {account ? (
                <Card className="payment-form shadow-sm border-0">
                  <Card.Body className="p-4">
                    <h4 style={{ color: '#1f2937', fontWeight: '600' }}>
                      <FaMoneyBillWave className="me-2" style={{ color: '#d97706' }} />
                      Book & Pay
                    </h4>
                    <hr style={{ borderColor: '#e0e0e0', opacity: 1 }} />
                    
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                    
                    <div className="mb-4">
                      <p>
                        <strong>Your Balance:</strong> {formatTokenAmount(tokenBalance)} {tokenSymbol}
                      </p>
                    </div>
                    
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Amount ({tokenSymbol})</Form.Label>
                        <Form.Control
                          type="number"
                          value={paymentAmount}
                          onChange={handleAmountChange}
                          placeholder="Enter amount"
                          min="0"
                          step="0.01"
                          required
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Service Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={serviceDescription}
                          onChange={handleDescriptionChange}
                          placeholder="Describe the service you're paying for"
                          required
                        />
                      </Form.Group>
                      
                      <div className="d-grid gap-2">
                        <Button
                          variant="outline-primary"
                          onClick={approveTokens}
                          disabled={processingPayment || !paymentAmount}
                        >
                          {processingPayment ? (
                            <>
                              <FaSpinner className="me-2 fa-spin" />
                              Approving...
                            </>
                          ) : (
                            'Approve Tokens'
                          )}
                        </Button>
                        
                        <Button
                          variant="primary"
                          onClick={makePayment}
                          disabled={
                            processingPayment || 
                            !paymentAmount || 
                            !serviceDescription ||
                            ethers.getBigInt(allowance) < ethers.parseUnits(paymentAmount || '0', tokenDecimals)
                          }
                        >
                          {processingPayment ? (
                            <>
                              <FaSpinner className="me-2 fa-spin" />
                              Processing...
                            </>
                          ) : (
                            'Make Payment'
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="payment-form">
                  <Card.Body className="text-center">
                    <h4>Connect Wallet to Make Payments</h4>
                    <p className="mt-3">
                      You need to connect your wallet to make payments to this guide.
                    </p>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </>
      ) : (
        <Alert variant="danger">Failed to load guide details.</Alert>
      )}
    </Container>
  );
};

export default GuideDetail;