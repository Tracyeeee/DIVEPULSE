/**
 * 脉搏控制器
 * 适配前端数据结构，包含 time, isAnonymous, isRespected 等字段
 */

import { prisma } from '../app.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

// 时间范围转换为毫秒
const TIME_RANGES = {
  'All Time': Infinity,
  '24 Hours': 24 * 60 * 60 * 1000,
  '7 Days': 7 * 24 * 60 * 60 * 1000,
  '6 Months': 180 * 24 * 60 * 60 * 1000
};

/**
 * 计算相对时间 (适配前端 time 字段)
 * @param {Date} date - 创建时间
 * @returns {string} - 相对时间字符串，如 "2h", "1d", "3w", "2m"
 */
const calculateRelativeTime = (date) => {
  const now = Date.now();
  const created = new Date(date).getTime();
  const diffMs = now - created;
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (hours < 24) {
    return `${hours}h`;
  } else if (days < 7) {
    return `${days}d`;
  } else if (weeks < 4) {
    return `${weeks}w`;
  } else {
    return `${months}m`;
  }
};

/**
 * 检查用户是否点赞
 */
const checkIfRespected = async (pulseId, userId) => {
  if (!userId) return false;
  const respect = await prisma.respect.findUnique({
    where: { userId_pulseId: { userId, pulseId } }
  });
  return !!respect;
};

/**
 * 格式化脉搏数据 (适配前端)
 */
const formatPulse = async (pulse, userId) => {
  return {
    id: pulse.id,
    location: pulse.location,
    country: pulse.country,
    visibility: pulse.visibility,
    flow: pulse.flow,
    temp: pulse.temp,
    time: calculateRelativeTime(pulse.createdAt),  // 相对时间
    image: pulse.image,
    weight: pulse.weight,
    geoHash: pulse.geoHash,
    depth: pulse.depth,
    duration: pulse.duration,
    isAnonymous: pulse.isAnonymous,
    createdAt: pulse.createdAt,
    user: {
      id: pulse.user.id,
      uid: pulse.user.uid,
      nickname: pulse.user.nickname,
      avatar: pulse.user.avatar,
      isAnonymous: pulse.user.isAnonymous
    },
    tags: pulse.tags.map(pt => pt.tag.name),
    respectCount: pulse._count.respects,
    commentCount: pulse._count.comments,
    isRespected: await checkIfRespected(pulse.id, userId)
  };
};

/**
 * 获取脉搏列表
 * GET /api/pulses
 * 
 * 查询参数:
 * - page: 页码
 * - limit: 每页数量
 * - search: 搜索关键词
 * - sortBy: 排序 (Latest, Most Liked, Most Commented)
 * - timeRange: 时间范围 (All Time, 24 Hours, 7 Days, 6 Months)
 * - country: 国家代码
 */
export const getPulses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'Most Liked',
      timeRange = 'All Time',
      country = ''
    } = req.query;

    // 构建查询条件
    const where = {};

    // 搜索条件
    if (search) {
      where.OR = [
        { location: { contains: search } },
        { tags: { some: { tag: { name: { contains: search } } } } }
      ];
    }

    // 国家筛选
    if (country) {
      where.country = country;
    }

    // 时间范围筛选
    const rangeMs = TIME_RANGES[timeRange] || Infinity;
    if (rangeMs !== Infinity) {
      where.createdAt = { gte: new Date(Date.now() - rangeMs) };
    }

    // 计算排序
    let orderBy = [];
    switch (sortBy) {
      case 'Latest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'Most Commented':
        orderBy = [{ comments: { _count: 'desc' } }, { createdAt: 'desc' }];
        break;
      case 'Most Liked':
      default:
        orderBy = [{ respects: { _count: 'desc' } }, { createdAt: 'desc' }];
        break;
    }

    // 查询总数
    const total = await prisma.pulse.count({ where });

    // 查询数据
    const pulses = await prisma.pulse.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
        tags: {
          include: { tag: true }
        },
        _count: {
          select: {
            respects: true,
            comments: true
          }
        }
      }
    });

    // 格式化数据 (适配前端)
    const userId = req.user?.id;
    const formattedPulses = await Promise.all(
      pulses.map(pulse => formatPulse(pulse, userId))
    );

    return paginatedResponse(res, formattedPulses, {
      page,
      limit,
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取脉搏详情
 * GET /api/pulses/:id
 */
export const getPulseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pulse = await prisma.pulse.findUnique({
      where: { id },
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
        tags: {
          include: { tag: true }
        },
        _count: {
          select: {
            respects: true,
            comments: true
          }
        }
      }
    });

    if (!pulse) {
      return errorResponse(res, '脉搏不存在', 404);
    }

    const formatted = await formatPulse(pulse, req.user?.id);
    return successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * 发布新脉搏
 * POST /api/pulses
 */
export const createPulse = async (req, res, next) => {
  try {
    const {
      location,
      country,
      visibility,
      flow,
      temp,
      image,
      weight,
      geoHash,
      depth,
      duration,
      isAnonymous,
      tags
    } = req.body;

    // 处理标签
    let tagConnect = [];
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          create: { name: tagName },
          update: {}
        });
        tagConnect.push({ tagId: tag.id });
      }
    }

    const pulse = await prisma.pulse.create({
      data: {
        userId: req.user.id,
        location,
        country: country || '',
        visibility: visibility || 10,
        flow: flow || 'None',
        temp,
        image,
        weight: weight || null,
        geoHash: geoHash || null,
        depth: depth || null,
        duration: duration || null,
        isAnonymous: isAnonymous || false,
        tags: {
          create: tagConnect
        }
      },
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
        tags: {
          include: { tag: true }
        },
        _count: {
          select: {
            respects: true,
            comments: true
          }
        }
      }
    });

    const formatted = await formatPulse(pulse, req.user.id);
    return successResponse(res, formatted, '发布成功', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新脉搏
 * PUT /api/pulses/:id
 */
export const updatePulse = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 检查权限
    const existing = await prisma.pulse.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, '脉搏不存在', 404);
    }
    if (existing.userId !== req.user.id) {
      return errorResponse(res, '无权修改', 403);
    }

    const {
      location,
      visibility,
      flow,
      temp,
      image,
      weight,
      depth,
      duration
    } = req.body;

    const pulse = await prisma.pulse.update({
      where: { id },
      data: {
        location,
        visibility,
        flow,
        temp,
        image,
        weight,
        depth,
        duration
      }
    });

    return successResponse(res, pulse, '更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 删除脉搏
 * DELETE /api/pulses/:id
 */
export const deletePulse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.pulse.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, '脉搏不存在', 404);
    }
    if (existing.userId !== req.user.id) {
      return errorResponse(res, '无权删除', 403);
    }

    await prisma.pulse.delete({ where: { id } });

    return successResponse(res, null, '删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 点赞脉搏
 * POST /api/pulses/:id/respect
 */
export const respectPulse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pulse = await prisma.pulse.findUnique({ where: { id } });
    if (!pulse) {
      return errorResponse(res, '脉搏不存在', 404);
    }

    // 检查是否已点赞
    const existing = await prisma.respect.findUnique({
      where: { userId_pulseId: { userId: req.user.id, pulseId: id } }
    });

    if (existing) {
      // 取消点赞
      await prisma.respect.delete({
        where: { userId_pulseId: { userId: req.user.id, pulseId: id } }
      });
      return successResponse(res, { action: 'unliked' }, '已取消点赞');
    } else {
      // 添加点赞
      await prisma.respect.create({
        data: { userId: req.user.id, pulseId: id }
      });
      return successResponse(res, { action: 'liked' }, '点赞成功');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 评论脉搏
 * POST /api/pulses/:id/comment
 */
export const commentPulse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;

    const pulse = await prisma.pulse.findUnique({ where: { id } });
    if (!pulse) {
      return errorResponse(res, '脉搏不存在', 404);
    }

    const comment = await prisma.comment.create({
      data: {
        userId: req.user.id,
        pulseId: id,
        content,
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            uid: true,
            nickname: true,
            avatar: true,
            isAnonymous: true
          }
        }
      }
    });

    return successResponse(res, comment, '评论成功', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取脉搏评论
 * GET /api/pulses/:id/comments
 */
export const getComments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comments = await prisma.comment.findMany({
      where: { pulseId: id, parentId: null },
      orderBy: { createdAt: 'desc' },
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
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                uid: true,
                nickname: true,
                avatar: true,
                isAnonymous: true
              }
            }
          }
        }
      }
    });

    return successResponse(res, comments);
  } catch (error) {
    next(error);
  }
};

/**
 * 删除评论
 * DELETE /api/pulses/:id/comment/:commentId
 * 
 * 权限验证:
 * - 评论作者可以删除自己的评论
 * - 脉搏作者可以删除任何评论
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { id: pulseId, commentId } = req.params;

    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        pulse: {
          select: { userId: true }
        }
      }
    });

    if (!comment) {
      return errorResponse(res, '评论不存在', 404);
    }

    // 验证权限: 评论作者或脉搏作者
    const isCommentAuthor = comment.userId === req.user.id;
    const isPulseAuthor = comment.pulse.userId === req.user.id;

    if (!isCommentAuthor && !isPulseAuthor) {
      return errorResponse(res, '无权删除此评论', 403);
    }

    // 删除评论及其回复
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { id: commentId },
          { parentId: commentId }
        ]
      }
    });

    return successResponse(res, null, '删除成功');
  } catch (error) {
    next(error);
  }
};
