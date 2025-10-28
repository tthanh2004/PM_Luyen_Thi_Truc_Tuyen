import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

// Kiểu dữ liệu trả về khi liệt kê exam
type ExamListItem = {
  id: number;
  title: string;
  description: string | null;
  durationMin: number;
  createdAt: Date;
};

// Kiểu dữ liệu trả về khi get detail 1 exam (có thể có câu hỏi)
type ExamDetail = {
  id: number;
  title: string;
  description: string | null;
  durationMin: number;
  createdAt: Date;
  questions: Array<{
    id: number;
    content: string;
    type: string;
    options: Array<{
      id: number;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
} | null;

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  // Lấy danh sách đề thi
  async getAllExams(): Promise<ExamListItem[]> {
    const exams = await this.prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        createdAt: true,
      },
    });

    return exams;
  }

  // Lấy chi tiết 1 đề thi theo id
  async getExamById(id: number): Promise<ExamDetail> {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        createdAt: true,
        questions: {
          select: {
            id: true,
            content: true,
            type: true,
            options: {
              select: {
                id: true,
                text: true,
                isCorrect: true,
              },
            },
          },
        },
      },
    });

    return exam;
  }

  // Tạo đề thi mới
  async createExam(dto: CreateExamDto): Promise<ExamListItem> {
    const { title, description, durationMin, createdById } = dto;

    const exam = await this.prisma.exam.create({
      data: {
        title,
        description,
        durationMin,
        createdById,
      },
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        createdAt: true,
      },
    });

    return exam;
  }

  // Cập nhật đề thi
  async updateExam(id: number, dto: UpdateExamDto): Promise<ExamListItem> {
    const updated = await this.prisma.exam.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        createdAt: true,
      },
    });

    return updated;
  }

  // Xóa đề thi
  async deleteExam(id: number): Promise<{ success: true }> {
    await this.prisma.exam.delete({
      where: { id },
    });

    return { success: true };
  }
}
