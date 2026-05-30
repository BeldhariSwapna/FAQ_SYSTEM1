const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};

    if (role && ['super_admin', 'admin', 'intern'].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-refreshToken -passwordResetToken -passwordResetExpires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-refreshToken -passwordResetToken -passwordResetExpires');
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['super_admin', 'admin', 'intern'].includes(role)) {
      return next(new AppError('Valid role is required (super_admin, admin, intern)', 400));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return next(new AppError('Only super admins can modify super admin accounts', 403));
    }

    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return next(new AppError('Only super admins can assign super admin role', 403));
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.promoteToAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.role !== 'intern') {
      return next(new AppError('Only interns can be promoted to admin', 400));
    }

    user.role = 'admin';
    await user.save();

    res.json({
      success: true,
      message: 'Intern promoted to admin successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.role === 'super_admin') {
      return next(new AppError('Cannot delete a super admin account', 403));
    }

    if (user._id.equals(req.user._id)) {
      return next(new AppError('Cannot delete your own account', 400));
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const Question = require('../models/Question');
    const Answer = require('../models/Answer');
    const Faq = require('../models/Faq');

    const [totalUsers, totalQuestions, totalAnswers, totalFaqs] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      Answer.countDocuments(),
      Faq.countDocuments(),
    ]);

    res.json({ totalUsers, totalQuestions, totalAnswers, totalFaqs });
  } catch (err) {
    next(err);
  }
};

