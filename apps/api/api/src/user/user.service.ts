// src/user/user.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client'; // <-- quan trọng

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Nếu bạn muốn nhận role kiểu enum đúng chuẩn:
   */
  async create(data: {
    email: string;
    password: string;
    fullName?: string | null; // schema đã optional
    role?: Role; // <-- dùng enum Role, không phải string
  }) {
    const { email, password, fullName = null, role } = data;

    return this.prisma.user.create({
      data: {
        email,
        password,
        fullName, // có thể là null
        ...(role ? { role } : {}), // chỉ set role khi có (schema có default thì có thể bỏ)
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /**
   * Nếu bạn MUỐN nhận role là string từ FE, map sang enum:
   * (bỏ comment nếu cần dùng cách này)
   */
  async createFromRaw(data: {
    email: string;
    password: string;
    fullName?: string | null;
    role?: string; // từ FE
  }) {
    const { email, password, fullName = null, role } = data;
    let roleEnum: Role | undefined = undefined;
    if (role !== undefined) {
      const maybe = (Role as any)[role];
      if (!maybe) throw new BadRequestException('Invalid role');
      roleEnum = maybe as Role;
    }
    return this.prisma.user.create({
      data: {
        email,
        password,
        fullName,
        ...(roleEnum ? { role: roleEnum } : {}),
      },
    });
  }
}
