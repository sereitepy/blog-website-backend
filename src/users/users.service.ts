import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const { search, role, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = { name: role };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          _count: {
            select: {
              articles: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.sanitizeUser(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        _count: {
          select: {
            articles: true,
            comments: true,
            savedArticles: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUserId: string,
    currentUserRole: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check permissions
    const isAdmin = ['admin', 'super_admin'].includes(currentUserRole);
    const isSelf = currentUserId === id;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Only admins can change role or isActive
    if (!isAdmin && (dto.roleId || dto.isActive !== undefined)) {
      throw new ForbiddenException(
        'Only admins can change roles or account status',
      );
    }

    // Validate roleId if provided
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });

      if (!role) {
        throw new BadRequestException('Invalid role ID');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        profilePicture: dto.profilePicture,
        roleId: dto.roleId,
        isActive: dto.isActive,
      },
      include: { role: true },
    });

    return this.sanitizeUser(updatedUser);
  }

  async delete(id: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent self-deletion
    if (currentUserId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  async getUserArticles(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              profilePicture: true,
            },
          },
          category: true,
          articleTags: true, // Changed from 'tags' to 'articleTags'
          _count: {
            select: {
              comments: true,
              views: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.article.count({ where: { authorId: userId } }),
    ]);

    return {
      data: articles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
