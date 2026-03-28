/**
 * 标签路由
 */

import { Router } from 'express';
import { query } from 'express-validator';
import { validate } from '../middleware/validator.js';
import * as tagController from '../controllers/tagController.js';

const router = Router();

/**
 * @route   GET /api/tags
 * @desc    获取热门标签
 * @access  Public
 */
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('search').optional().trim(),
    validate
  ],
  tagController.getTags
);

/**
 * @route   GET /api/tags/popular
 * @desc    获取热门标签 (按脉搏数量排序)
 * @access  Public
 */
router.get('/popular', tagController.getPopularTags);

export default router;
