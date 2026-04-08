/**
 * 拼潜控制器
 * 支持前端格式: dateRange, total, note
 */

import { prisma } from '../app.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

/**
 * 格式化日期为前端期望的格式 (YYYY.MM.DD)
 */
const formatDateForFrontend = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

/**
 * 格式化日期范围为前端格式
 */
const formatDateRange = (startDate, endDate) => {
  return {
    start: formatDateForFrontend(startDate),
    end: formatDateForFrontend(endDate)
  };
};

/**
 * 将前端日期格式 (YYYY.MM.DD) 转换为 Date 对象
 */
const parseFrontendDate = (dateStr) => {
  if (!dateStr) return null;
  // 格式: 2026.04.05 或 2026-04-05
  const cleaned = dateStr.replace(/\./g, '-');
  return new Date(cleaned);
};

/**
 * 获取拼潜列表
 * GET /api/matches
 */
export const getMatches = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      country
    } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (country) where.country = country;

    const total = await prisma.match.count({ where });

    const matches = await prisma.match.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            uid: true,
            nickname: true,
            avatar: true
          }
        },
        participants: {
          where: { status: 'CONFIRMED' },
          select: { id: true }
        }
      }
    });

    // 格式化响应，适配前端数据结构
    // 人数只统计已确认（CONFIRMED）的参与者 + 发起者本人
    const formatted = matches.map(m => ({
      id: m.id,
      type: m.type,                    // BOAT, CAR, ROOM, TEAM
      location: m.location,
      dateRange: formatDateRange(m.startDate, m.endDate), // { start: "2026.04.05", end: "2026.04.10" }
      current: m.participants.length + 1, // 含发起者本人
      total: m.maxPeople,
      status: m.status.toLowerCase(),
      uid: m.user.uid,               // 发起人 UID (DP-XXXX)
      note: m.description,           // 备注
      description: m.description,   // 完整描述
      createdAt: m.createdAt
    }));

    return paginatedResponse(res, formatted, { page, limit, total });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取拼潜详情
 * GET /api/matches/:id
 */
export const getMatchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            uid: true,
            nickname: true,
            avatar: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                uid: true,
                nickname: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!match) {
      return errorResponse(res, '拼潜不存在', 404);
    }

    return successResponse(res, {
      id: match.id,
      type: match.type,
      location: match.location,
      dateRange: formatDateRange(match.startDate, match.endDate),
      current: match.participants.filter(p => p.status === 'CONFIRMED').length + 1,
      total: match.maxPeople,
      status: match.status.toLowerCase(),
      uid: match.user.uid,
      note: match.description,
      description: match.description,
      user: match.user,
      participants: match.participants.map(p => ({
        id: p.id,
        status: p.status.toLowerCase(),
        user: p.user
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 发起拼潜
 * POST /api/matches
 * 
 * 支持两种请求格式:
 * 1. 标准格式: { type, title, location, startDate, endDate, maxPeople, description }
 * 2. 前端格式: { type, location, dateRange: { start, end }, total, note }
 */
export const createMatch = async (req, res, next) => {
  try {
    const {
      type,
      title,
      description,
      location,
      country,
      startDate,
      endDate,
      maxPeople,
      // 前端格式字段
      dateRange,
      total,
      note
    } = req.body;

    // 兼容前端格式
    const finalType = (type || '').trim().toUpperCase() || 'BOAT'; // BOAT, CAR, ROOM, TEAM
    const finalLocation = (location || '').trim();
    const finalCountry = country || '';

    if (!finalLocation) {
      return errorResponse(res, '请填写目的地', 400);
    }
    
    // 处理日期: 支持 ISO8601 或前端格式 (YYYY.MM.DD)
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    
    if (dateRange) {
      finalStartDate = dateRange.start;
      finalEndDate = dateRange.end;
    }
    
    // 处理人数
    const finalMaxPeople = maxPeople || total || 2;
    
    // 处理描述/备注
    const finalDescription = description || note || title || '';

    // 解析日期
    const startDateObj = parseFrontendDate(finalStartDate) || new Date();
    const endDateObj = finalEndDate ? parseFrontendDate(finalEndDate) : null;

    const match = await prisma.match.create({
      data: {
        userId: req.user.id,
        type: finalType,
        title: title || `${location || ''} ${finalType}`,
        description: finalDescription,
        location: finalLocation,
        country: finalCountry,
        startDate: startDateObj,
        endDate: endDateObj,
        maxPeople: finalMaxPeople
      },
      include: {
        user: {
          select: {
            id: true,
            uid: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    return successResponse(res, {
      id: match.id,
      type: match.type,
      location: match.location,
      dateRange: formatDateRange(match.startDate, match.endDate),
      current: 1, // 发起时只有发起者
      total: match.maxPeople,
      status: 'open',
      uid: match.user.uid,
      note: match.description,
      description: match.description,
      createdAt: match.createdAt
    }, '发起成功', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 更新拼潜
 * PUT /api/matches/:id
 */
export const updateMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, '拼潜不存在', 404);
    }
    if (existing.userId !== req.user.id) {
      return errorResponse(res, '无权修改', 403);
    }

    const {
      type,
      title,
      description,
      location,
      startDate,
      endDate,
      maxPeople,
      total,
      status,
      dateRange,
      note
    } = req.body;

    const updateData = {};
    
    if (type) updateData.type = type;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (note !== undefined) updateData.description = note;
    if (location) updateData.location = location;
    if (maxPeople || total) updateData.maxPeople = maxPeople || total;
    if (status) updateData.status = status.toUpperCase();
    
    if (startDate || dateRange?.start) {
      updateData.startDate = parseFrontendDate(startDate || dateRange.start);
    }
    if (endDate !== undefined || dateRange?.end !== undefined) {
      const endDateVal = endDate !== undefined ? endDate : dateRange?.end;
      updateData.endDate = endDateVal ? parseFrontendDate(endDateVal) : null;
    }

    const match = await prisma.match.update({
      where: { id },
      data: updateData
    });

    return successResponse(res, {
      ...match,
      dateRange: formatDateRange(match.startDate, match.endDate)
    }, '更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 删除拼潜
 * DELETE /api/matches/:id
 */
export const deleteMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, '拼潜不存在', 404);
    }
    if (existing.userId !== req.user.id) {
      return errorResponse(res, '无权删除', 403);
    }

    await prisma.match.delete({ where: { id } });

    return successResponse(res, null, '删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 参与拼潜
 * POST /api/matches/:id/join
 */
export const joinMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        participants: {
          where: { status: 'CONFIRMED' },
          select: { id: true }
        }
      }
    });

    if (!match) {
      return errorResponse(res, '拼潜不存在', 404);
    }
    if (match.userId === req.user.id) {
      return errorResponse(res, '不能参与自己发起的拼潜', 400);
    }
    if (match.participants.length >= match.maxPeople - 1) {
      return errorResponse(res, '拼潜已满员', 400);
    }

    // 检查是否已参与
    const existing = await prisma.matchParticipant.findUnique({
      where: {
        matchId_userId: { matchId: id, userId: req.user.id }
      }
    });

    if (existing) {
      return errorResponse(res, '您已申请参与此拼潜', 400);
    }

    const participant = await prisma.matchParticipant.create({
      data: {
        matchId: id,
        userId: req.user.id,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            uid: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    return successResponse(res, {
      id: participant.id,
      status: participant.status.toLowerCase(),
      user: participant.user
    }, '申请成功，等待发起者确认');
  } catch (error) {
    next(error);
  }
};

/**
 * 退出拼潜
 * POST /api/matches/:id/leave
 */
export const leaveMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.matchParticipant.findUnique({
      where: {
        matchId_userId: { matchId: id, userId: req.user.id }
      }
    });

    if (!existing) {
      return errorResponse(res, '您未参与此拼潜', 400);
    }

    await prisma.matchParticipant.delete({
      where: { id: existing.id }
    });

    return successResponse(res, null, '已退出拼潜');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取我参与的拼潜
 * GET /api/matches/my/participating
 */
export const getMyParticipating = async (req, res, next) => {
  try {
    const participations = await prisma.matchParticipant.findMany({
      where: { userId: req.user.id },
      include: {
        match: {
          include: {
            user: {
              select: {
                id: true,
                uid: true,
                nickname: true,
                avatar: true
              }
            },
            participants: {
              where: { status: 'CONFIRMED' },
              select: { id: true }
            }
          }
        }
      }
    });

    const matches = participations.map(p => ({
      id: p.match.id,
      type: p.match.type,
      location: p.match.location,
      dateRange: formatDateRange(p.match.startDate, p.match.endDate),
      current: p.match.participants.length + 1, // 含发起者
      total: p.match.maxPeople,
      status: p.match.status.toLowerCase(),
      uid: p.match.user.uid,
      note: p.match.description,
      myStatus: p.status.toLowerCase()
    }));

    return successResponse(res, matches);
  } catch (error) {
    next(error);
  }
};

/**
 * 确认加入（仅发起者）
 * POST /api/matches/:id/approve/:participantId
 */
export const approveParticipant = async (req, res, next) => {
  try {
    const { id, participantId } = req.params;

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return errorResponse(res, '拼潜不存在', 404);
    }
    if (match.userId !== req.user.id) {
      return errorResponse(res, '只有发起者可以确认加入', 403);
    }

    const participant = await prisma.matchParticipant.findUnique({
      where: { id: participantId }
    });
    if (!participant) {
      return errorResponse(res, '该申请不存在', 404);
    }
    if (participant.matchId !== id) {
      return errorResponse(res, '该申请不属于此拼潜', 400);
    }
    if (participant.status === 'CONFIRMED') {
      return errorResponse(res, '该用户已确认加入', 400);
    }

    const updated = await prisma.matchParticipant.update({
      where: { id: participantId },
      data: { status: 'CONFIRMED' },
      include: {
        user: {
          select: { id: true, uid: true, nickname: true, avatar: true }
        }
      }
    });

    return successResponse(res, {
      id: updated.id,
      status: updated.status.toLowerCase(),
      user: updated.user
    }, '已确认该用户加入');
  } catch (error) {
    next(error);
  }
};

/**
 * 拒绝加入（仅发起者）
 * POST /api/matches/:id/reject/:participantId
 */
export const rejectParticipant = async (req, res, next) => {
  try {
    const { id, participantId } = req.params;

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return errorResponse(res, '拼潜不存在', 404);
    }
    if (match.userId !== req.user.id) {
      return errorResponse(res, '只有发起者可以拒绝加入', 403);
    }

    const participant = await prisma.matchParticipant.findUnique({
      where: { id: participantId }
    });
    if (!participant) {
      return errorResponse(res, '该申请不存在', 404);
    }
    if (participant.matchId !== id) {
      return errorResponse(res, '该申请不属于此拼潜', 400);
    }
    if (participant.status === 'CONFIRMED') {
      return errorResponse(res, '已确认用户无法被拒绝，请先将其移除', 400);
    }

    await prisma.matchParticipant.delete({ where: { id: participantId } });

    return successResponse(res, null, '已拒绝该申请');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取我发起的拼潜（含申请人列表）
 * GET /api/matches/my/created
 */
export const getMyCreated = async (req, res, next) => {
  try {
    const matches = await prisma.match.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { uid: true }
        },
        _count: {
          select: {
            participants: { where: { status: 'CONFIRMED' } }
          }
        },
        participants: {
          include: {
            user: {
              select: { id: true, uid: true, nickname: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const formatted = matches.map(m => ({
      id: m.id,
      type: m.type,
      location: m.location,
      dateRange: formatDateRange(m.startDate, m.endDate),
      current: m._count.participants + 1, // 只含已确认 + 发起者本人
      total: m.maxPeople,
      status: m.status.toLowerCase(),
      uid: m.user.uid,
      note: m.description,
      description: m.description,
      createdAt: m.createdAt,
      participants: m.participants.map(p => ({
        id: p.id,
        status: p.status.toLowerCase(),
        user: p.user,
        createdAt: p.createdAt
      }))
    }));

    return successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};
