/**
 * 脉搏(潜水动态)路由
 */

import { Router } from 'express';
import { query, body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import * as pulseController from '../controllers/pulseController.js';

const router = Router();

/**
 * @route   GET /api/pulses
 * @desc    获取脉搏列表
 * @access  Public
 * @query   page, limit, search, sortBy, timeRange, country
 */
router.get(
  '/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('search').optional().trim(),
    query('sortBy').optional().isIn(['Latest', 'Most Liked', 'Most Commented']),
    query('timeRange').optional().isIn(['All Time', '24 Hours', '7 Days', '6 Months']),
    query('country').optional().trim(),
    validate
  ],
  pulseController.getPulses
);

/**
 * @route   GET /api/pulses/:id
 * @desc    获取脉搏详情
 * @access  Public
 */
router.get('/:id', optionalAuth, pulseController.getPulseById);

/**
 * @route   POST /api/pulses
 * @desc    发布新脉搏
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  [
    body('location').notEmpty().withMessage('请填写潜点位置'),
    body('visibility').optional().isInt({ min: 1 }),
    body('flow').optional().isIn(['None', 'Light', 'Moderate', 'Strong']),
    body('temp').isFloat({ min: -10, max: 40 }).withMessage('水温范围 -10°C ~ 40°C'),
    body('image').notEmpty().withMessage('请上传潜点照片'),
    body('tags').optional().isArray(),
    validate
  ],
  pulseController.createPulse
);

/**
 * @route   PUT /api/pulses/:id
 * @desc    更新脉搏
 * @access  Private (仅作者)
 */
router.put(
  '/:id',
  authenticate,
  pulseController.updatePulse
);

/**
 * @route   DELETE /api/pulses/:id
 * @desc    删除脉搏
 * @access  Private (仅作者)
 */
router.delete('/:id', authenticate, pulseController.deletePulse);

/**
 * @route   POST /api/pulses/:id/respect
 * @desc    点赞脉搏
 * @access  Private
 */
router.post('/:id/respect', authenticate, pulseController.respectPulse);

/**
 * @route   POST /api/pulses/:id/comment
 * @desc    评论脉搏
 * @access  Private
 */
router.post(
  '/:id/comment',
  authenticate,
  [
    body('content').notEmpty().withMessage('评论内容不能为空').isLength({ max: 500 }).withMessage('评论最多500字符'),
    body('parentId').optional().isUUID(),
    validate
  ],
  pulseController.commentPulse
);

/**
 * @route   DELETE /api/pulses/:id/comment/:commentId
 * @desc    删除评论 (仅评论作者或脉搏作者可删除)
 * @access  Private
 */
router.delete(
  '/:id/comment/:commentId',
  authenticate,
  pulseController.deleteComment
);

/**
 * @route   GET /api/pulses/:id/comments
 * @desc    获取脉搏评论
 * @access  Public
 */
router.get('/:id/comments', pulseController.getComments);

export default router;
