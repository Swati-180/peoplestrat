import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OrganizationMembership from '../models/OrganizationMembership.js';

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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      const userId = decoded.id;
      req.user = await User.findById(userId).select('-password');

      if (!req.user) {
        console.log(`[AUTH DEBUG] User not found for JWT id: ${userId}`);
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      // Phase 2: Active Organization Context Verification
      const requestedOrgId = req.headers['x-organization-id'] || req.body?.organizationId || req.query?.organizationId;
      
      if (requestedOrgId) {
        // Validate Membership
        const membership = await OrganizationMembership.findOne({
          userId: req.user._id,
          organizationId: requestedOrgId,
          status: 'active'
        });

        if (!membership) {
          return res.status(403).json({ 
            success: false, 
            error: 'Access denied: You are not a member of this organization.' 
          });
        }

        // Expose Organization Context to Controllers
        req.organizationId = requestedOrgId;
        req.organizationRole = membership.role;
        req.membership = membership;
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
  // Use organization role if present, fallback to global role
  const role = (req.organizationRole || req.user?.role || "").toLowerCase();
  
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
  const role = (req.organizationRole || req.user?.role || "").toLowerCase();
  
  if (role === 'admin') {
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
    const role = (req.organizationRole || req.user?.role || "").toLowerCase();
    const authorizedRoles = roles.map(r => r.toLowerCase());
    
    if (!req.user || !authorizedRoles.includes(role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Role ${role || 'unauthenticated'} is not authorized to access this route` 
      });
    }
    next();
  };
};

export const requireOrganization = (req, res, next) => {
  if (!req.organizationId) {
    return res.status(401).json({ success: false, error: 'Organization context required' });
  }
  next();
};
