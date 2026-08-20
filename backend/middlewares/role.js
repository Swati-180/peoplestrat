// RBAC Middleware

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || "").toLowerCase();
    const authorizedRoles = roles.map(r => r.toLowerCase());
    
    if (!req.user || !authorizedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: `Role ${req.user ? req.user.role : 'unauthenticated'} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = authorize;
