const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token, authorization denied' });
  }

  const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

  try {
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || 'secretToken123');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token is not valid' });
  }
};
