import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const { email, password, fullName } = data;

    // check tồn tại email
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // hash password
    const hash = await bcrypt.hash(password, 10);

    // tạo user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hash,
        fullName,
        role: 'STUDENT', // mặc định sinh viên
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    // tạo token
    const token = await this.signToken(user.id, user.email, user.role);

    return {
      user,
      accessToken: token,
    };
  }

  async login(data: LoginDto) {
    const { email, password } = data;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const pwMatch = await bcrypt.compare(password, user.password);
    if (!pwMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.signToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  async signToken(
    userId: number,
    email: string,
    role: string,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '30m',
    });
  }
}
