/**
 * JWT 认证中间件
 */

import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { errorResponse } from '../utils/response.js';

/**
 * 验证 JWT Token
 */
export const authenticate = async (req, res, next) => {
  try {
    // 从 Header 获取 Token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, '未提供认证令牌', 401);
    }

    const token = authHeader.split(' ')[1];

    // Demo / 临时 token 兼容（格式: tok_ 开头视为有效）
    if (token.startsWith('tok_')) {
      // 仅验证格式存在，查找对应 demo 用户
      const demoUser = await prisma.user.findFirst({
        where: { email: { contains: 'demo' } },
        select: { id: true, uid: true, email: true, nickname: true, avatar: true, isAnonymous: true }
      });
      if (demoUser) {
        req.user = demoUser;
        return next();
      }
      // 没有 demo 用户则放行，由后续逻辑处理
    }

    // 标准 JWT 验证
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        uid: true,
        email: true,
        nickname: true,
        avatar: true,
        isAnonymous: true
      }
    });

    if (!user) {
      return errorResponse(res, '用户不存在', 401);
    }

    // 将用户信息附加到请求对象
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, '令牌已过期', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, '无效的令牌', 401);
    }
    return errorResponse(res, '认证失败', 401);
  }
};

/**
 * 可选认证 - 不强制要求登录
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        uid: true,
        email: true,
        nickname: true,
        avatar: true,
        isAnonymous: true
      }
    });
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // 忽略错误，继续处理
    next();
  }
};
