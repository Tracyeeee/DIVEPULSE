/**
 * 消息路由
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { authenticate } from '../middleware/auth.js';
import * as messageController from '../controllers/messageController.js';

const router = Router();

/**
 * @route   GET /api/messages/conversations
 * @desc    获取会话列表
 * @access  Private
 */
router.get('/conversations', authenticate, messageController.getConversations);

/**
 * @route   GET /api/messages/conversations/:id
 * @desc    获取会话消息
 * @access  Private
 */
router.get('/conversations/:id', authenticate, messageController.getConversationMessages);

/**
 * @route   POST /api/messages
 * @desc    发送消息
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  [
    body('receiverId').isUUID().withMessage('接收者ID无效'),
    body('content').notEmpty().withMessage('消息内容不能为空').isLength({ max: 1000 }),
    body('type').optional().isIn(['TEXT', 'IMAGE']),
    validate
  ],
  messageController.sendMessage
);

/**
 * @route   PUT /api/messages/conversations/:id/read
 * @desc    标记消息为已读
 * @access  Private
 */
router.put('/conversations/:id/read', authenticate, messageController.markAsRead);

export default router;
