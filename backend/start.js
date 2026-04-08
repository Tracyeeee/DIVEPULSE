/**
 * 一键启动脚本
 * 运行: node start.js
 * 依次执行: 生成 Prisma Client → 同步数据库 → 填充数据 → 启动服务
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function run(command, cwd) {
  console.log(`\n▶ ${command}`);
  try {
    execSync(command, {
      cwd: cwd || join(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });
    console.log(`✓ 完成`);
    return true;
  } catch (error) {
    console.error(`✗ 失败`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   DivePulse Backend 一键启动');
  console.log('═══════════════════════════════════════');

  // 1. 检查数据库文件
  const dbPath = join(__dirname, '..', 'prisma', 'dev.db');
  console.log(`\n[1/4] 检查数据库文件: ${dbPath}`);

  // 2. 生成 Prisma Client
  console.log('\n[2/4] 生成 Prisma Client...');
  if (!run('npx prisma generate', join(__dirname, '..'))) {
    console.error('Prisma Client 生成失败，请检查 schema.prisma');
    process.exit(1);
  }

  // 3. 同步数据库
  console.log('\n[3/4] 同步数据库结构...');
  if (!run('npx prisma db push', join(__dirname, '..'))) {
    console.error('数据库同步失败');
    process.exit(1);
  }

  // 4. 填充数据
  console.log('\n[4/4] 填充测试数据...');
  if (!run('node prisma/seed.js', join(__dirname, '..'))) {
    console.error('数据填充失败');
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('   启动后端服务...');
  console.log('═══════════════════════════════════════\n');

  // 5. 启动服务
  run('npm run dev', join(__dirname, '..'));
}

main().catch(err => {
  console.error('启动脚本错误:', err);
  process.exit(1);
});
