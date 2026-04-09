/**
 * 认证路由
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = Router();

/**
 * @route   POST /api/auth/register/username
 * @desc    用户名密码注册
 * @access  Public
 */
router.post(
  '/register/username',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('用户名需3-20个字符')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('用户名只能包含字母、数字和下划线'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码至少6位'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('两次密码不匹配');
        }
        return true;
      }),
    validate,
  ],
  authController.registerByUsername
);

/**
 * @route   POST /api/auth/login/username
 * @desc    用户名密码登录
 * @access  Public
 */
router.post(
  '/login/username',
  [
    body('username').trim().notEmpty().withMessage('请输入用户名'),
    body('password').notEmpty().withMessage('请输入密码'),
    validate,
  ],
  authController.loginByUsername
);

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('请提供有效的邮箱'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
    body('nickname').optional().isLength({ min: 2, max: 20 }).withMessage('昵称2-20字符'),
    validate
  ],
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('请提供有效的邮箱'),
    body('password').notEmpty().withMessage('密码不能为空'),
    validate
  ],
  authController.login
);

/**
 * @route   POST /api/auth/otp/send
 * @desc    发送OTP验证码到邮箱
 * @access  Public
 */
router.post(
  '/otp/send',
  [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址'),
    validate
  ],
  authController.sendOtp
);

/**
 * @route   POST /api/auth/otp/login
 * @desc    使用OTP验证码登录
 * @access  Public
 */
router.post(
  '/otp/login',
  [
    body('email').isEmail().withMessage('请提供有效的邮箱'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('验证码为6位'),
    validate
  ],
  authController.loginWithOtp
);

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PUT /api/auth/password
 * @desc    修改密码
 * @access  Private
 */
router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('请输入当前密码'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位'),
    validate
  ],
  authController.changePassword
);

export default router;
