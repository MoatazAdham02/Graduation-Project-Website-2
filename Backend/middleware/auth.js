import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Authorization header must be "Bearer <token>"'
      });
    }

    const token = authHeader.slice(7);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: JWT_SECRET not defined'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}
