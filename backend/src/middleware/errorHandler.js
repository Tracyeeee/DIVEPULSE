/**
 * 统一错误处理中间件
 */

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma 错误处理
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          message: '该记录已存在',
          errors: err.meta
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: '记录不存在'
        });
    }
  }

  // 自定义错误
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }

  // 默认错误
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message
  });
};
