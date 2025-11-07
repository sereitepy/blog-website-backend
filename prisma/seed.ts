import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // 1. SEED ROLES
  // ============================================
  console.log('📝 Seeding roles...');

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: {
      name: 'super_admin',
      description:
        'Full system access, can manage admins and grant author permissions',
      permissions: {
        articles: ['create', 'read', 'update', 'delete', 'publish', 'archive'],
        users: ['create', 'read', 'update', 'delete', 'grant_author'],
        categories: ['create', 'read', 'update', 'delete'],
        tags: ['create', 'read', 'update', 'delete'],
        series: ['create', 'read', 'update', 'delete'],
        comments: ['create', 'read', 'update', 'delete', 'moderate'],
        media: ['upload', 'delete'],
      },
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description:
        'Can manage content and moderate, but cannot grant author permissions',
      permissions: {
        articles: ['create', 'read', 'update', 'delete', 'publish', 'archive'],
        users: ['read', 'update'],
        categories: ['create', 'read', 'update', 'delete'],
        tags: ['create', 'read', 'update', 'delete'],
        series: ['create', 'read', 'update', 'delete'],
        comments: ['create', 'read', 'update', 'delete', 'moderate'],
        media: ['upload', 'delete'],
      },
    },
  });

  const authorRole = await prisma.role.upsert({
    where: { name: 'author' },
    update: {},
    create: {
      name: 'author',
      description: 'Can write and manage their own articles',
      permissions: {
        articles: ['create', 'read', 'update', 'delete_own', 'publish_own'],
        categories: ['read'],
        tags: ['create', 'read'],
        series: ['create', 'read', 'update_own', 'delete_own'],
        comments: ['create', 'read', 'update_own', 'delete_own'],
        media: ['upload', 'delete_own'],
      },
    },
  });

  const readerRole = await prisma.role.upsert({
    where: { name: 'reader' },
    update: {},
    create: {
      name: 'reader',
      description: 'Can read articles, comment, and save articles',
      permissions: {
        articles: ['read'],
        comments: ['create', 'read', 'update_own', 'delete_own'],
        savedArticles: ['create', 'read', 'delete'],
      },
    },
  });

  console.log('✅ Roles created');

  // ============================================
  // 2. SEED SUPER ADMIN USER
  // ============================================
  console.log('👤 Seeding super admin user...');

  const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      passwordHash: hashedPassword,
      displayName: 'Super Administrator',
      roleId: superAdminRole.id,
      bio: 'System super administrator',
      isActive: true,
    },
  });

  console.log('✅ Super admin created:', superAdmin.email);

  // ============================================
  // 3. SEED SAMPLE ADMIN USER
  // ============================================
  console.log('👤 Seeding admin user...');

  const adminPassword = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      displayName: 'Content Admin',
      roleId: adminRole.id,
      bio: 'Content administrator and moderator',
      isActive: true,
    },
  });

  console.log('✅ Admin created:', admin.email);

  // ============================================
  // 4. SEED SAMPLE AUTHOR USER
  // ============================================
  console.log('👤 Seeding author user...');

  const authorPassword = await bcrypt.hash('Author123!', 10);

  const author = await prisma.user.upsert({
    where: { email: 'author@example.com' },
    update: {},
    create: {
      email: 'author@example.com',
      passwordHash: authorPassword,
      displayName: 'John Doe',
      roleId: authorRole.id,
      bio: 'Full-stack developer and technical writer',
      isActive: true,
    },
  });

  // Grant author permission
  await prisma.authorPermission.create({
    data: {
      userId: author.id,
      grantedBy: superAdmin.id,
      permissionEmail: author.email,
      notes: 'Initial seed - granted author permission',
      isActive: true,
    },
  });

  console.log('✅ Author created:', author.email);

  // ============================================
  // 5. SEED SAMPLE READER USER
  // ============================================
  console.log('👤 Seeding reader user...');

  const readerPassword = await bcrypt.hash('Reader123!', 10);

  const reader = await prisma.user.upsert({
    where: { email: 'reader@example.com' },
    update: {},
    create: {
      email: 'reader@example.com',
      passwordHash: readerPassword,
      displayName: 'Jane Smith',
      roleId: readerRole.id,
      bio: 'Passionate about learning web development',
      isActive: true,
    },
  });

  console.log('✅ Reader created:', reader.email);

  // ============================================
  // 6. SEED CATEGORIES
  // ============================================
  console.log('📁 Seeding categories...');

  const webDevCategory = await prisma.category.create({
    data: {
      slug: 'web-development',
      createdBy: superAdmin.id,
      translations: {
        create: [
          {
            language: 'EN',
            name: 'Web Development',
            description:
              'Articles about web development, frameworks, and best practices',
          },
          {
            language: 'KM',
            name: 'ការអភិវឌ្ឍន៍គេហទំព័រ',
            description:
              'អត្ថបទអំពីការអភិវឌ្ឍន៍គេហទំព័រ ក្របខ័ណ្ឌ និងការអនុវត្តល្អបំផុត',
          },
        ],
      },
    },
  });

  const programmingCategory = await prisma.category.create({
    data: {
      slug: 'programming',
      createdBy: superAdmin.id,
      translations: {
        create: [
          {
            language: 'EN',
            name: 'Programming',
            description:
              'General programming concepts, algorithms, and data structures',
          },
          {
            language: 'KM',
            name: 'ការសរសេរកម្មវិធី',
            description:
              'គំនិតសរសេរកម្មវិធីទូទៅ ក្បួនដោះស្រាយ និងរចនាសម្ព័ន្ធទិន្នន័យ',
          },
        ],
      },
    },
  });

  const designCategory = await prisma.category.create({
    data: {
      slug: 'design',
      createdBy: superAdmin.id,
      translations: {
        create: [
          {
            language: 'EN',
            name: 'Design',
            description:
              'UI/UX design, design systems, and creative techniques',
          },
          {
            language: 'KM',
            name: 'ការរចនា',
            description: 'ការរចនា UI/UX ប្រព័ន្ធរចនា និងបច្ចេកទេសច្នៃប្រឌិត',
          },
        ],
      },
    },
  });

  const tutorialsCategory = await prisma.category.create({
    data: {
      slug: 'tutorials',
      createdBy: superAdmin.id,
      translations: {
        create: [
          {
            language: 'EN',
            name: 'Tutorials',
            description: 'Step-by-step guides and learning resources',
          },
          {
            language: 'KM',
            name: 'មេរៀន',
            description: 'ការណែនាំជាជំហាន និងធនធានសិក្សា',
          },
        ],
      },
    },
  });

  console.log('✅ Categories created');

  // ============================================
  // 7. SEED TAGS
  // ============================================
  console.log('🏷️ Seeding tags...');

  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: 'JavaScript',
        slug: 'javascript',
        color: '#F7DF1E',
        createdBy: superAdmin.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'TypeScript',
        slug: 'typescript',
        color: '#3178C6',
        createdBy: superAdmin.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'React',
        slug: 'react',
        color: '#61DAFB',
        createdBy: superAdmin.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Node.js',
        slug: 'nodejs',
        color: '#339933',
        createdBy: superAdmin.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'NestJS',
        slug: 'nestjs',
        color: '#E0234E',
        createdBy: superAdmin.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Database',
        slug: 'database',
        color: '#336791',
        createdBy: superAdmin.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Frontend',
        slug: 'frontend',
        color: '#FF6B6B',
        createdBy: superAdmin.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Backend',
        slug: 'backend',
        color: '#4ECDC4',
        createdBy: superAdmin.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Tutorial',
        slug: 'tutorial',
        color: '#95E1D3',
        createdBy: superAdmin.id,
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Beginner',
        slug: 'beginner',
        color: '#A8E6CF',
        createdBy: superAdmin.id,
      },
    }),
  ]);

  console.log('✅ Tags created:', tags.length);

  // ============================================
  // 8. SEED SAMPLE ARTICLE
  // ============================================
  console.log('📝 Seeding sample article...');

  const sampleArticle = await prisma.article.create({
    data: {
      author: {
        connect: { id: author.id },
      },
      category: {
        connect: { id: webDevCategory.id },
      },
      slug: 'getting-started-with-nestjs',
      featuredImageUrl:
        'https://placehold.co/1200x630/E0234E/FFFFFF/png?text=NestJS',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      hasEnglish: true,
      hasKhmer: false,
      translations: {
        create: {
          language: 'EN',
          title: 'Getting Started with NestJS: A Complete Guide',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'NestJS is a progressive Node.js framework for building efficient and scalable server-side applications. In this guide, we will walk through everything you need to know to get started.',
                  },
                ],
              },
              {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: 'Why NestJS?' }],
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'NestJS provides an out-of-the-box application architecture which allows developers to create highly testable, scalable, and maintainable applications.',
                  },
                ],
              },
            ],
          },
          excerpt:
            'NestJS is a progressive Node.js framework for building efficient and scalable server-side applications. Learn how to get started in this comprehensive guide.',
          readTimeMinutes: 8,
          isPublished: true,
        },
      },
      articleTags: {
        create: [
          {
            tag: { connect: { id: tags.find((t) => t.slug === 'nestjs')!.id } },
          },
          {
            tag: { connect: { id: tags.find((t) => t.slug === 'nodejs')!.id } },
          },
          {
            tag: {
              connect: { id: tags.find((t) => t.slug === 'backend')!.id },
            },
          },
          {
            tag: {
              connect: { id: tags.find((t) => t.slug === 'tutorial')!.id },
            },
          },
        ],
      },
    },
  });

  console.log('✅ Sample article created');

  // ============================================
  // 9. SEED SAMPLE COMMENT
  // ============================================
  console.log('💬 Seeding sample comment...');

  await prisma.comment.create({
    data: {
      article: {
        connect: { id: sampleArticle.id },
      },
      user: {
        connect: { id: reader.id },
      },
      content:
        'Great article! This really helped me understand NestJS better. Thank you!',
    },
  });

  console.log('✅ Sample comment created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   - 4 Roles created');
  console.log('   - 4 Users created (super_admin, admin, author, reader)');
  console.log('   - 4 Categories created');
  console.log('   - 10 Tags created');
  console.log('   - 1 Sample article created');
  console.log('   - 1 Sample comment created');
  console.log('\n🔐 Login credentials:');
  console.log('   Super Admin: superadmin@example.com / SuperAdmin123!');
  console.log('   Admin: admin@example.com / Admin123!');
  console.log('   Author: author@example.com / Author123!');
  console.log('   Reader: reader@example.com / Reader123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
