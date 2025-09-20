const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const blockchainService = require('../services/blockchainService');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Mock user database (in production, use a proper database)
const users = new Map();

// Pre-register demo users
const demoUsers = [
  {
    address: 'collector@demo.com',
    privateKey: 'demo_collector_private_key_2024',
    role: 1, // COLLECTOR
    name: 'Demo Collector',
    organization: 'Collector Group Demo',
    phone: '+91-9876543210',
    email: 'collector@demo.com',
    password: 'demo123'
  },
  {
    address: 'tester@demo.com',
    privateKey: 'demo_tester_private_key_2024',
    role: 2, // TESTER
    name: 'Demo Tester',
    organization: 'Testing Labs Demo',
    phone: '+91-9876543211',
    email: 'tester@demo.com',
    password: 'demo123'
  },
  {
    address: 'processor@demo.com',
    privateKey: 'demo_processor_private_key_2024',
    role: 3, // PROCESSOR
    name: 'Demo Processor',
    organization: 'Processing Unit Demo',
    phone: '+91-9876543212',
    email: 'processor@demo.com',
    password: 'demo123'
  },
  {
    address: 'manufacturer@demo.com',
    privateKey: 'demo_manufacturer_private_key_2024',
    role: 4, // MANUFACTURER
    name: 'Demo Manufacturer',
    organization: 'Manufacturing Plant Demo',
    phone: '+91-9876543213',
    email: 'manufacturer@demo.com',
    password: 'demo123'
  }
];

// Initialize demo users on startup
async function initializeDemoUsers() {
  console.log('🎭 Initializing demo users...');
  
  for (const demoUser of demoUsers) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(demoUser.password, 10);
      
      // Store user data
      users.set(demoUser.address, {
        address: demoUser.address,
        privateKey: demoUser.privateKey,
        role: demoUser.role,
        name: demoUser.name,
        organization: demoUser.organization,
        phone: demoUser.phone,
        email: demoUser.email,
        password: hashedPassword,
        createdAt: new Date(),
        isActive: true
      });
      
      console.log(`✅ Demo user registered: ${demoUser.name} (${demoUser.email}) - Role: ${demoUser.role}`);
    } catch (error) {
      console.error(`❌ Failed to register demo user ${demoUser.email}:`, error);
    }
  }
  
  console.log(`🎉 ${demoUsers.length} demo users initialized successfully`);
}

// Initialize demo users when module loads
initializeDemoUsers().catch(console.error);
// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const {
      address,
      privateKey,
      role,
      name,
      organization,
      phone,
      email,
      password
    } = req.body;

    // Validate input
    if (!address || !privateKey || !role || !name || !organization || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if user already exists
    if (users.has(address)) {
      return res.status(400).json({
        success: false,
        error: 'User already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Register user on blockchain
    const blockchainResult = await blockchainService.registerUser(
      address,
      role,
      name,
      organization
    );

    if (!blockchainResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to register user on blockchain',
        details: blockchainResult.error
      });
    }

    // Store user data (in production, use encrypted storage)
    users.set(address, {
      address,
      privateKey: privateKey, // In production, encrypt this
      role,
      name,
      organization,
      phone,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      isActive: true
    });

    // Generate JWT token
    const token = jwt.sign(
      { address, role, name },
      process.env.JWT_SECRET || 'herbionyx_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        address,
        role,
        name,
        organization,
        phone,
        email
      },
      blockchain: blockchainResult
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { address, password } = req.body;

    if (!address || !password) {
      return res.status(400).json({
        success: false,
        error: 'Address and password are required'
      });
    }

    // Check if user exists
    const user = users.get(address);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active on blockchain
    const userInfo = await blockchainService.getUserInfo(address);
    if (!userInfo || !userInfo.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is deactivated'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        address: user.address, 
        role: user.role, 
        name: user.name 
      },
      process.env.JWT_SECRET || 'herbionyx_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        address: user.address,
        role: user.role,
        name: user.name,
        organization: user.organization,
        phone: user.phone,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'herbionyx_secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = users.get(req.user.address);
    const blockchainUserInfo = await blockchainService.getUserInfo(req.user.address);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        address: user.address,
        role: user.role,
        name: user.name,
        organization: user.organization,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt,
        blockchain: blockchainUserInfo
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      details: error.message
    });
  }
});

// Get user private key (for blockchain transactions)
router.get('/private-key', authenticateToken, (req, res) => {
  try {
    const user = users.get(req.user.address);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      privateKey: user.privateKey
    });
  } catch (error) {
    console.error('Private key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get private key',
      details: error.message
    });
  }
});

module.exports = router; // ✅ default export for Express
module.exports.authenticateToken = authenticateToken; // ✅ still export middleware
module.exports.users = users; // ✅ still export in-memory users
