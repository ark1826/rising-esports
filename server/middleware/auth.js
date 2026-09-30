import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized as admin, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 1. Check explicit admin role
    if (decoded.role === 'admin') {
      req.admin = decoded.id;
      return next();
    }

    // 2. Check static admin ID
    if (decoded.id === 'static-admin-id') {
      req.admin = decoded.id;
      return next();
    }

    // 3. Check if ID exists in Admin collection
    const adminUser = await Admin.findById(decoded.id);
    if (adminUser) {
      req.admin = adminUser._id;
      return next();
    }

    // Strictly reject users or invalid roles trying to access admin routes
    return res.status(403).json({ message: 'Access denied: Admin credentials required' });
  } catch (error) {
    res.status(401).json({ message: 'Not authorized as admin, token invalid or expired' });
  }
};

export const userProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

