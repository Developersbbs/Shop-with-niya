const jwt = require("jsonwebtoken");
const admin = require('../lib/firebase');
const Customer = require('../models/Customer');

// Simple user session store (in production, use Redis or database)
const userSessions = new Map();

/**
 * Hybrid authentication middleware that handles both Firebase ID tokens and JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateHybridToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ AUTH DEBUG: No Authorization header with Bearer token');
      return res.status(401).json({ 
        success: false, 
        error: "Authorization header with Bearer token is required" 
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔍 AUTH DEBUG: Token received, attempting authentication...');
    
    // First, try Firebase ID token verification
    if (admin && typeof admin.auth === 'function') {
      try {
        console.log('🔍 AUTH DEBUG: Attempting Firebase verification...');
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        console.log('✅ AUTH DEBUG: Firebase token verified for UID:', decodedToken.uid);
        
        // Find or create customer in database
        let customer = await Customer.findOne({ firebase_uid: decodedToken.uid });
        
        if (!customer) {
          // Create new customer if doesn't exist
          customer = new Customer({
            firebase_uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.display_name,
            phone: decodedToken.phone_number,
            image_url: decodedToken.picture,
            is_active: true
          });
          
          await customer.save();
          console.log(`✅ AUTH DEBUG: Created new customer: ${customer.email} with ID: ${customer._id}`);
        } else {
          console.log(`✅ AUTH DEBUG: Found existing customer with ID: ${customer._id}`);
        }

        // Attach customer info to request
        req.user = {
          id: customer._id,
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.display_name,
          customerId: customer._id
        };
        
        console.log('✅ AUTH DEBUG: req.user set successfully:', { id: req.user.id, email: req.user.email });
        return next();
      } catch (firebaseError) {
        console.log('⚠️  AUTH DEBUG: Firebase token verification failed:', firebaseError.message);
        // Continue to JWT verification fallback
      }
    }
    
    // Fallback to JWT token verification
    if (process.env.JWT_SECRET) {
      try {
        console.log('🔍 AUTH DEBUG: Attempting JWT verification...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log('✅ AUTH DEBUG: JWT token verified for user ID:', decoded.id);
        
        // Find customer by decoded info
        let customer = await Customer.findById(decoded.id);
        
        if (!customer) {
          console.log('❌ AUTH DEBUG: Customer not found for JWT user ID:', decoded.id);
          return res.status(401).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        req.user = {
          id: customer._id,
          email: customer.email,
          name: customer.name,
          customerId: customer._id
        };
        
        console.log('✅ AUTH DEBUG: req.user set successfully via JWT:', { id: req.user.id, email: req.user.email });
        return next();
      } catch (jwtError) {
        console.error("⚠️  AUTH DEBUG: JWT verification failed:", jwtError.message);
      }
    } else {
      console.log('⚠️  AUTH DEBUG: JWT_SECRET not configured, cannot verify JWT tokens');
    }
    
    // If both methods fail, return unauthorized
    console.log('❌ AUTH DEBUG: Both Firebase and JWT authentication failed');
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token',
      code: 'AUTH_ERROR'
    });
    
  } catch (error) {
    console.error('❌ AUTH DEBUG: Unexpected authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = {
  authenticateHybridToken
};
