/**
 * 404 处理中间件
 */

import { errorResponse } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  return errorResponse(res, `路由 ${req.originalUrl} 不存在`, 404);
};
