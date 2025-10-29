import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  // Lấy danh sách đề thi (metadata)
  async getAllExams() {
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

  // Lấy chi tiết 1 đề thi (kèm câu hỏi+options)
  async getExamById(id: number) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        createdAt: true,
        questions: {
          orderBy: { id: 'asc' },
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

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return exam;
  }

  // Tạo đề thi mới
  async createExam(dto: CreateExamDto) {
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
  async updateExam(id: number, dto: UpdateExamDto) {
    // check tồn tại trước
    const exists = await this.prisma.exam.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Exam not found');
    }

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

  // Xóa đề thi (kèm dữ liệu liên quan) ✅
  async deleteExam(id: number) {
    // 1. Kiểm tra exam có tồn tại không
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // 2. Xóa dữ liệu con theo thứ tự an toàn

    // 2.1 Tìm toàn bộ câu hỏi thuộc đề này
    const questions = await this.prisma.question.findMany({
      where: { examId: id },
      select: { id: true },
    });
    const questionIds = questions.map((q) => q.id);

    if (questionIds.length > 0) {
      // 2.2 Xóa đáp án học viên (Answer) liên quan tới các câu hỏi đó
      await this.prisma.answer.deleteMany({
        where: {
          questionId: { in: questionIds },
        },
      });

      // 2.3 Xóa phương án lựa chọn (Option) của các câu hỏi đó
      await this.prisma.option.deleteMany({
        where: {
          questionId: { in: questionIds },
        },
      });

      // 2.4 Xóa chính các câu hỏi
      await this.prisma.question.deleteMany({
        where: { id: { in: questionIds } },
      });
    }

    // 2.5 Xóa các attempt (bài làm) liên quan tới exam này
    // - trước tiên xóa Answer theo attempt (phòng trường hợp answer trỏ qua attempt)
    const attempts = await this.prisma.attempt.findMany({
      where: { examId: id },
      select: { id: true },
    });
    const attemptIds = attempts.map((a) => a.id);

    if (attemptIds.length > 0) {
      await this.prisma.answer.deleteMany({
        where: {
          attemptId: { in: attemptIds },
        },
      });

      await this.prisma.attempt.deleteMany({
        where: {
          id: { in: attemptIds },
        },
      });
    }

    // 3. Cuối cùng xóa exam
    await this.prisma.exam.delete({
      where: { id },
    });

    return { success: true };
  }
}
