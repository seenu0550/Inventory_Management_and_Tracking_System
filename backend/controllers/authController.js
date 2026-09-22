const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role, phone, address, walletAddress } = req.body;

  if (await User.findOne({ email }))
    return res.status(400).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password, role, phone, address, walletAddress });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  });
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: 'Invalid email or password' });

  if (!user.isActive)
    return res.status(403).json({ message: 'Account is deactivated' });

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  });
};

const getProfile = async (req, res) => {
  res.json(req.user);
};

const updateProfile = async (req, res) => {
  const { name, phone, address, walletAddress, password } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (walletAddress) user.walletAddress = walletAddress;
  if (password) user.password = password;

  await user.save();
  res.json({ message: 'Profile updated', user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
};

// Admin only
const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

const updateUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = req.body.isActive;
  await user.save();
  res.json({ message: 'User status updated' });
};

module.exports = { register, login, getProfile, updateProfile, getAllUsers, updateUserStatus };
