/**
 * 数据库初始化脚本
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充数据...');

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@divepulse.com' },
      update: {},
      create: {
        uid: 'DP-AL01',
        email: 'alice@divepulse.com',
        password: hashedPassword,
        nickname: 'Alice Diving',
        bio: '热爱自由潜水的探索者',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'
      }
    }),
    prisma.user.upsert({
      where: { email: 'bob@divepulse.com' },
      update: {},
      create: {
        uid: 'DP-BB02',
        email: 'bob@divepulse.com',
        password: hashedPassword,
        nickname: 'Bob Scuba',
        bio: 'PADI认证教练',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
      }
    }),
    prisma.user.upsert({
      where: { email: 'carol@divepulse.com' },
      update: {},
      create: {
        uid: 'DP-CC03',
        email: 'carol@divepulse.com',
        password: hashedPassword,
        nickname: 'Carol Marine',
        bio: '水下摄影师',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol'
      }
    })
  ]);

  console.log(`✅ 创建了 ${users.length} 个用户`);

  // 创建标签
  const tagNames = ['蝠鲼', '珊瑚', '海龟', 'Mola Mola', '鲨鱼', '水母湖', '沉船', '微距', '大货', '夜潜'];
  const tags = await Promise.all(
    tagNames.map(name => 
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );

  console.log(`✅ 创建了 ${tags.length} 个标签`);

  // 创建脉搏数据
  const pulseData = [
    {
      location: '菲律宾 - 薄荷岛',
      country: 'PH',
      visibility: 30,
      flow: 'Light',
      temp: 28,
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
      weight: 45,
      geoHash: 'PH.BH',
      tags: ['珊瑚', '海龟', '微距'],
      userId: users[0].id
    },
    {
      location: '马尔代夫',
      country: 'MV',
      visibility: 40,
      flow: 'Moderate',
      temp: 27,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
      weight: 48,
      geoHash: 'MV.ML',
      tags: ['蝠鲼', '鲨鱼', '大货'],
      userId: users[1].id
    },
    {
      location: '印度尼西亚 - 四王岛',
      country: 'ID',
      visibility: 35,
      flow: 'None',
      temp: 29,
      image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=300&fit=crop',
      weight: 50,
      geoHash: 'ID.R4',
      tags: ['Mola Mola', '珊瑚', '蝠鲼'],
      userId: users[2].id
    },
    {
      location: '泰国 - 斯米兰',
      country: 'TH',
      visibility: 38,
      flow: 'Light',
      temp: 30,
      image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&h=300&fit=crop',
      weight: 44,
      geoHash: 'TH.SM',
      tags: ['海龟', '珊瑚', '大货'],
      userId: users[0].id
    },
    {
      location: '澳大利亚 - 大堡礁',
      country: 'AU',
      visibility: 22,
      flow: 'Light',
      temp: 25,
      image: 'https://images.unsplash.com/photo-1587139223877-04cb899fa3e8?w=400&h=300&fit=crop',
      weight: 42,
      geoHash: 'AU.GB',
      tags: ['Mola Mola', '海龟'],
      userId: users[1].id
    },
    {
      location: '帕劳',
      country: 'PW',
      visibility: 45,
      flow: 'Moderate',
      temp: 29,
      image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=400&h=300&fit=crop',
      weight: 40,
      geoHash: 'PW.PL',
      tags: ['水母湖', '鲨鱼'],
      userId: users[2].id
    }
  ];

  for (const data of pulseData) {
    const { tags: tagNames, ...pulseFields } = data;
    const pulse = await prisma.pulse.create({
      data: pulseFields
    });

    for (const tagName of tagNames) {
      const tag = tags.find(t => t.name === tagName);
      if (tag) {
        await prisma.pulseTag.create({
          data: { pulseId: pulse.id, tagId: tag.id }
        });
      }
    }

    // 随机添加点赞
    const randomUsers = users.filter(u => u.id !== pulseFields.userId);
    for (const user of randomUsers) {
      if (Math.random() > 0.5) {
        await prisma.respect.create({
          data: { userId: user.id, pulseId: pulse.id }
        });
      }
    }
  }

  console.log(`✅ 创建了 ${pulseData.length} 条脉搏数据`);

  // 创建拼潜
  await prisma.match.create({
    data: {
      userId: users[0].id,
      type: 'DIVE',
      title: '周末自由潜训练',
      description: '寻找潜伴一起练习法兰佐',
      location: '菲律宾薄荷岛',
      country: 'PH',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxPeople: 4
    }
  });

  await prisma.match.create({
    data: {
      userId: users[1].id,
      type: 'TRIP',
      title: '马尔代夫船宿行程',
      description: '7天6晚追寻鲸鲨',
      location: '马尔代夫马累',
      country: 'MV',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
      maxPeople: 12
    }
  });

  console.log('✅ 创建了 2 条拼潜数据');

  console.log('');
  console.log('🎉 数据填充完成！');
  console.log('');
  console.log('测试账号:');
  console.log('  - alice@divepulse.com / password123');
  console.log('  - bob@divepulse.com / password123');
  console.log('  - carol@divepulse.com / password123');
}

main()
  .catch((e) => {
    console.error('填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
