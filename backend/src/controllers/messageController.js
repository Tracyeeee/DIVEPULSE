/**
 * 消息控制器
 */

import { prisma } from '../app.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * 获取会话列表
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
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
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const formatted = conversations.map(c => {
      const otherParticipant = c.participants.find(p => p.userId !== userId)?.user;
      const lastMessage = c.messages[0];
      return {
        id: c.id,
        participant: otherParticipant,
        lastMessage,
        updatedAt: c.updatedAt
      };
    });

    return successResponse(res, formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * 获取会话消息
 */
export const getConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查用户是否有权限
    const participation = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId: id, userId }
      }
    });

    if (!participation) {
      return errorResponse(res, '无权访问此会话', 403);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            uid: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    // 更新已读时间
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId } },
      data: { lastReadAt: new Date() }
    });

    return successResponse(res, messages);
  } catch (error) {
    next(error);
  }
};

/**
 * 发送消息
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, type = 'TEXT' } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return errorResponse(res, '不能给自己发消息', 400);
    }

    // 查找或创建会话
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: receiverId } } }
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: senderId }, { userId: receiverId }]
          }
        }
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId,
        content,
        type
      },
      include: {
        sender: {
          select: {
            id: true,
            uid: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    // 更新会话时间
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    return successResponse(res, message, '发送成功', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 标记消息为已读
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId } },
      data: { lastReadAt: new Date() }
    });

    return successResponse(res, null, '已标记为已读');
  } catch (error) {
    next(error);
  }
};
