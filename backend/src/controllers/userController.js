/**
 * 用户控制器
 */

import { prisma } from '../app.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * 获取用户信息
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        uid: true,
        nickname: true,
        avatar: true,
        bio: true,
        isAnonymous: true,
        createdAt: true,
        _count: {
          select: {
            pulses: true,
            respects: true
          }
        }
      }
    });

    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    return successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新个人资料
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { nickname, avatar, bio, isAnonymous } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        nickname,
        avatar,
        bio,
        isAnonymous
      },
      select: {
        id: true,
        uid: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        isAnonymous: true
      }
    });

    return successResponse(res, user, '更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户发布的脉搏
 */
export const getUserPulses = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pulses = await prisma.pulse.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: { include: { tag: true } },
        _count: {
          select: { respects: true, comments: true }
        }
      }
    });

    const formatted = pulses.map(p => ({
      ...p,
      tags: p.tags.map(pt => pt.tag.name),
      respectCount: p._count.respects,
      commentCount: p._count.comments
    }));

    return successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户点赞的脉搏
 */
export const getUserRespects = async (req, res, next) => {
  try {
    const { id } = req.params;

    const respects = await prisma.respect.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        pulse: {
          include: {
            user: {
              select: {
                id: true,
                uid: true,
                nickname: true,
                avatar: true,
                isAnonymous: true
              }
            },
            tags: { include: { tag: true } },
            _count: {
              select: { respects: true, comments: true }
            }
          }
        }
      }
    });

    const formatted = respects.map(r => ({
      ...r.pulse,
      tags: r.pulse.tags.map(pt => pt.tag.name),
      respectCount: r.pulse._count.respects,
      commentCount: r.pulse._count.comments
    }));

    return successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};
