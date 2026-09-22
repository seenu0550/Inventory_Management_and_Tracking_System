const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, updateProfile, getAllUsers, updateUserStatus } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'supplier', 'warehouse_manager', 'distributor', 'retailer'])
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin routes
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/status', protect, authorize('admin'), updateUserStatus);

module.exports = router;
