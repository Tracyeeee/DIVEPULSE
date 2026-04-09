/**
 * 认证控制器
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/response.js';

// 生成 JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * 生成唯一 UID (DP-XXXX 格式)
 */
const generateUid = async () => {
  // 生成4位随机数字 (1000-9999)
  const num = Math.floor(1000 + Math.random() * 9000);
  const uid = `DP-${num}`;
  const exists = await prisma.user.findUnique({ where: { uid } });
  if (exists) return generateUid();
  return uid;
};

/**
 * 生成6位数字验证码
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 发送OTP验证码
 * POST /api/auth/otp/send
 */
export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    // 生成6位验证码
    const code = generateOtp();

    // 清理该邮箱的旧验证码（未使用的）
    await prisma.otpCode.deleteMany({
      where: { email, used: false }
    });

    // 存储验证码 (5分钟有效期)
    await prisma.otpCode.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
        used: false
      }
    });

    // TODO: 实际发送邮件
    // 在生产环境中，应该使用邮件服务发送验证码
    console.log(`[OTP] 验证码已发送到 ${email}: ${code}`);

    return successResponse(res, {
      message: '验证码已发送',
      // 开发环境返回验证码，生产环境应移除
      _debug: process.env.NODE_ENV === 'development' ? code : undefined
    }, '发送成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 使用OTP验证码登录
 * POST /api/auth/otp/login
 */
export const loginWithOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    // 查询最新未使用的验证码
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return errorResponse(res, '验证码错误或已过期', 400);
    }

    if (otpRecord.attempts >= 3) {
      // 标记为已使用，防止暴力破解
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true }
      });
      return errorResponse(res, '验证码错误次数过多，请重新获取', 400);
    }

    // 增加尝试次数
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 }
    });

    // 验证码不匹配（已扣 attempts）
    if (otpRecord.attempts + 1 >= 3) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true }
      });
      return errorResponse(res, '验证码错误次数过多，请重新获取', 400);
    }

    // 验证成功，标记为已使用
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true }
    });

    // 查找或创建用户
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // 新用户自动注册
      user = await prisma.user.create({
        data: {
          email,
          password: '', // OTP登录用户无密码
          nickname: `Diver-${Math.floor(Math.random() * 10000)}`,
          uid: await generateUid()
        }
      });
    }

    // 生成 Token
    const token = generateToken(user.id);

    return successResponse(res, {
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        isAnonymous: user.isAnonymous
      },
      token
    }, '登录成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 用户名密码注册
 * POST /api/auth/register/username
 */
export const registerByUsername = async (req, res, next) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return errorResponse(res, '两次密码不匹配', 400);
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return errorResponse(res, '该用户名已被占用', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nickname: username,
        uid: await generateUid(),
      },
      select: {
        id: true,
        uid: true,
        username: true,
        nickname: true,
        avatar: true,
        isAnonymous: true,
      },
    });

    const token = generateToken(user.id);
    return successResponse(res, { user, token }, '注册成功', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 用户名密码登录
 * POST /api/auth/login/username
 */
export const loginByUsername = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return errorResponse(res, '用户名或密码错误', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return errorResponse(res, '用户名或密码错误', 401);
    }

    const token = generateToken(user.id);
    return successResponse(res, {
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        isAnonymous: user.isAnonymous,
      },
      token,
    }, '登录成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 用户注册
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, nickname } = req.body;

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(res, '该邮箱已被注册', 409);
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname: nickname || `Diver-${Math.floor(Math.random() * 10000)}`,
        uid: await generateUid()
      },
      select: {
        id: true,
        uid: true,
        email: true,
        nickname: true,
        avatar: true,
        isAnonymous: true,
        createdAt: true
      }
    });

    // 生成 Token
    const token = generateToken(user.id);

    return successResponse(res, { user, token }, '注册成功', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 用户登录
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, '邮箱或密码错误', 401);
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return errorResponse(res, '邮箱或密码错误', 401);
    }

    // 生成 Token
    const token = generateToken(user.id);

    return successResponse(res, {
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        isAnonymous: user.isAnonymous
      },
      token
    }, '登录成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        uid: true,
        email: true,
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

    return successResponse(res, user, '获取成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 修改密码
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return errorResponse(res, '当前密码错误', 400);
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    return successResponse(res, null, '密码修改成功');
  } catch (error) {
    next(error);
  }
};
