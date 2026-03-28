/**
 * Jest 测试设置文件
 */

// 设置测试环境
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing';

// 全局超时设置
if (typeof jest !== 'undefined') {
  jest.setTimeout(30000);
}

// 清理设置
beforeAll(() => {
  // 测试前的全局设置
});

afterAll(() => {
  // 测试后的全局清理
});
