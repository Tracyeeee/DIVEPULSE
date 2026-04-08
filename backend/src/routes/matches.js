/**
 * 拼潜路由
 */

import { Router } from 'express';
import { query, body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import * as matchController from '../controllers/matchController.js';

const router = Router();

/**
 * @route   GET /api/matches
 * @desc    获取拼潜列表
 * @access  Public
 */
router.get(
  '/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('type').optional().isIn(['BOAT', 'CAR', 'ROOM', 'TEAM']),
    query('status').optional().isIn(['OPEN', 'FULL', 'CLOSED']),
    query('country').optional().trim(),
    validate
  ],
  matchController.getMatches
);

/**
 * @route   GET /api/matches/:id
 * @desc    获取拼潜详情
 * @access  Public
 */
router.get('/:id', optionalAuth, matchController.getMatchById);

/**
 * @route   POST /api/matches
 * @desc    发起拼潜
 * @access  Private
 * @body    支持两种格式:
 *          1. 标准格式: { type, title, location, startDate, endDate, maxPeople, description }
 *          2. 前端格式: { type, location, dateRange: { start, end }, total, note }
 */
router.post(
  '/',
  authenticate,
  [
    body('type').optional().isIn(['BOAT', 'CAR', 'ROOM', 'TEAM']).withMessage('type 必须是 BOAT/CAR/ROOM/TEAM'),
    body('location').optional({ nullable: true }).trim(),
    validate
  ],
  matchController.createMatch
);

/**
 * @route   PUT /api/matches/:id
 * @desc    更新拼潜
 * @access  Private (仅发起者)
 */
router.put('/:id', authenticate, matchController.updateMatch);

/**
 * @route   DELETE /api/matches/:id
 * @desc    删除拼潜
 * @access  Private (仅发起者)
 */
router.delete('/:id', authenticate, matchController.deleteMatch);

/**
 * @route   POST /api/matches/:id/join
 * @desc    参与拼潜
 * @access  Private
 */
router.post('/:id/join', authenticate, matchController.joinMatch);

/**
 * @route   POST /api/matches/:id/leave
 * @desc    退出拼潜
 * @access  Private
 */
router.post('/:id/leave', authenticate, matchController.leaveMatch);

/**
 * @route   GET /api/matches/my
 * @desc    获取我参与的拼潜
 * @access  Private
 */
router.get('/my/participating', authenticate, matchController.getMyParticipating);

/**
 * @route   POST /api/matches/:id/approve/:participantId
 * @desc    确认加入（仅发起者）
 * @access  Private
 */
router.post('/:id/approve/:participantId', authenticate, matchController.approveParticipant);

/**
 * @route   POST /api/matches/:id/reject/:participantId
 * @desc    拒绝加入（仅发起者）
 * @access  Private
 */
router.post('/:id/reject/:participantId', authenticate, matchController.rejectParticipant);

/**
 * @route   GET /api/matches/my/created
 * @desc    获取我发起的拼潜
 * @access  Private
 */
router.get('/my/created', authenticate, matchController.getMyCreated);

export default router;
