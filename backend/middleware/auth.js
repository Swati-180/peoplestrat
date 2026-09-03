import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      if (token.startsWith('demo-token-')) {
        const role = token.split('-')[2];
        // Create a mock user object for demo purposes
        req.user = { id: 'demo-123', role: role, name: 'Demo User' };
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(401).json({
        success: false,
        error: 'Not authorized',
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Not authorized, no token',
    });
  }
};

export const managerOnly = (req, res, next) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === 'manager' || role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied: Manager or Admin role required',
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role || "").toLowerCase() === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Access denied: Admin role required',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || "").toLowerCase();
    const authorizedRoles = roles.map(r => r.toLowerCase());
    
    if (!req.user || !authorizedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: `Role ${req.user ? req.user.role : 'unauthenticated'} is not authorized to access this route` });
    }
    next();
  };
};
