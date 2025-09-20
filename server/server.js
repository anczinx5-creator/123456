const express = require('express');
const cors = require('cors');
const path = require('path');
const ipfsService = require('./services/ipfsService');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test IPFS connection on startup
async function testServices() {
  console.log('🔧 Testing external services...');
  
  // Test Hyperledger Fabric connection
  try {
    const fabricService = require('./services/fabricService');
    await fabricService.connect();
    console.log('✅ Hyperledger Fabric network connection successful');
  } catch (error) {
    console.log('❌ Hyperledger Fabric network connection failed:', error.message);
    console.log('💡 Please start the Fabric network using: cd fabric-network/scripts && ./network.sh up');
  }
  
  // Test IPFS/Pinata connection
  const ipfsTest = await ipfsService.testConnection();
  if (ipfsTest.success) {
    console.log('✅ IPFS/Pinata connection successful');
  } else {
    console.log('❌ IPFS/Pinata connection failed:', ipfsTest.error);
    console.log('💡 Please configure Pinata API keys in .env file');
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '🌿 HerbionYX API Server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    network: 'hyperledger-fabric',
    ipfsConfigured: !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY)
  });
});

// IPFS test endpoint
app.get('/test-ipfs', async (req, res) => {
  const result = await ipfsService.testConnection();
  res.json(result);
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/collection', require('./routes/collection'));
app.use('/api/quality', require('./routes/quality'));
app.use('/api/processing', require('./routes/processing'));
app.use('/api/manufacturing', require('./routes/manufacturing'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/ipfs', require('./routes/ipfs'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`🌿 HerbionYX API Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 IPFS Test: http://localhost:${PORT}/test-ipfs`);
  console.log(`🔗 Connected to Hyperledger Fabric network`);
  
  // Test services after server starts
  setTimeout(testServices, 1000);
});