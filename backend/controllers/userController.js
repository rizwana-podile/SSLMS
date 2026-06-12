const User = require('../models/User');

const getUsers = async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};
  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
  res.json(users);
};

const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
};

const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { name, email, role, phone, isActive } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (phone !== undefined) user.phone = phone;
  if (isActive !== undefined) user.isActive = isActive;

  const updated = await user.save();
  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    phone: updated.phone,
    isActive: updated.isActive,
  });
};

const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  await user.deleteOne();
  res.json({ message: 'User removed' });
};

module.exports = { getUsers, getUserById, updateUser, deleteUser };
