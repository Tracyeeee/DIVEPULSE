/**
 * 标签控制器
 */

import { prisma } from '../app.js';
import { successResponse } from '../utils/response.js';

/**
 * 获取标签列表
 */
export const getTags = async (req, res, next) => {
  try {
    const { limit = 20, search } = req.query;

    const where = search ? { name: { contains: search } } : {};

    const tags = await prisma.tag.findMany({
      where,
      take: limit,
      orderBy: { pulses: { _count: 'desc' } },
      include: {
        _count: {
          select: { pulses: true }
        }
      }
    });

    const formatted = tags.map(t => ({
      name: t.name,
      pulseCount: t._count.pulses
    }));

    return successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取热门标签
 */
export const getPopularTags = async (req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { pulses: { _count: 'desc' } },
      take: 20,
      include: {
        _count: {
          select: { pulses: true }
        }
      }
    });

    const formatted = tags.map(t => ({
      name: t.name,
      pulseCount: t._count.pulses
    }));

    return successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};
