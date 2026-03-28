/**
 * 用户路由
 */

import { Router } from 'express';
import { param, body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = Router();

/**
 * @route   GET /api/users/:id
 * @desc    获取用户信息
 * @access  Public
 */
router.get('/:id', optionalAuth, userController.getUserById);

/**
 * @route   PUT /api/users/profile
 * @desc    更新个人资料
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  [
    body('nickname').optional().isLength({ min: 2, max: 20 }),
    body('avatar').optional().isURL(),
    body('bio').optional().isLength({ max: 200 }),
    validate
  ],
  userController.updateProfile
);

/**
 * @route   GET /api/users/:id/pulses
 * @desc    获取用户发布的脉搏
 * @access  Public
 */
router.get('/:id/pulses', userController.getUserPulses);

/**
 * @route   GET /api/users/:id/respects
 * @desc    获取用户点赞的脉搏
 * @access  Public
 */
router.get('/:id/respects', userController.getUserRespects);

export default router;
