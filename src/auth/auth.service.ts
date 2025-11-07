import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestAuthorDto } from './dto/request-author.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Get reader role (create if doesn't exist)
    let readerRole = await this.prisma.role.findUnique({
      where: { name: 'reader' },
    });

    if (!readerRole) {
      readerRole = await this.prisma.role.create({
        data: {
          name: 'reader',
          permissions: { read: true },
          description: 'Default reader role',
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        bio: dto.bio,
        roleId: readerRole.id,
      },
      include: {
        role: true,
      },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role.name);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role.name);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        _count: {
          select: {
            articles: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        profilePicture: dto.profilePicture,
      },
      include: { role: true },
    });

    return this.sanitizeUser(user);
  }

  async requestAuthorPermission(userId: string, dto: RequestAuthorDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already an author or admin
    if (['author', 'admin', 'super_admin'].includes(user.role.name)) {
      throw new BadRequestException('You already have author permissions');
    }

    // Check if there's already an active request
    const existingRequest = await this.prisma.authorPermission.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (existingRequest) {
      throw new ConflictException('You already have a pending author request');
    }

    // Create author permission request (pending approval)
    const request = await this.prisma.authorPermission.create({
      data: {
        userId,
        grantedBy: userId, // Temporarily set to self, admin will update when approving
        permissionEmail: dto.permissionEmail,
        notes: dto.notes,
        isActive: false, // Pending approval
      },
    });

    return {
      message: 'Author permission request submitted successfully',
      request: {
        id: request.id,
        email: request.permissionEmail,
        notes: request.notes,
        createdAt: request.grantedAt,
      },
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return this.sanitizeUser(user);
  }
}
