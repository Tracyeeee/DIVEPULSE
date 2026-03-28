/**
 * 请求验证中间件
 */

import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

/**
 * 验证请求结果
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '验证失败',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};
