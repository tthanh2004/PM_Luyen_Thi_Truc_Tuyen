import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
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

  // Đăng ký tài khoản mới
  async register(data: RegisterDto) {
    const { email, password, fullName } = data;

    // Check email tồn tại chưa
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Tạo user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hash,
        fullName,
        role: 'STUDENT', // mặc định
      },
    });

    // Tạo JWT
    const accessToken = await this.signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Trả về (ẩn password)
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
    };
  }

  // Đăng nhập
  async login(data: LoginDto) {
    const { email, password } = data;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    // So sánh password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const accessToken = await this.signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
    };
  }

  // Helper tạo JWT
  private async signToken(params: {
    userId: number;
    email: string;
    role: string;
  }): Promise<string> {
    const { userId, email, role } = params;

    // payload đưa vào JWT
    const payload: Record<string, any> = {
      sub: userId,
      email,
      role,
    };

    // options khi ký JWT
    const options: any = {
      secret: process.env.JWT_SECRET ?? 'dev_secret',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '30m',
    };

    return this.jwt.signAsync(payload, options);
  }
}
