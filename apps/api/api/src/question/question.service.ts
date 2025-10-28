import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { CreateOptionDto } from './dto/create-option.dto';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  // Lấy tất cả câu hỏi của 1 đề kèm options
  async getQuestionsByExam(examId: number) {
    const examExists = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, title: true },
    });
    if (!examExists) {
      throw new NotFoundException('Exam not found');
    }

    const questions = await this.prisma.question.findMany({
      where: { examId },
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
    });

    return {
      exam: examExists,
      questions,
    };
  }

  // Tạo câu hỏi mới
  async createQuestion(dto: CreateQuestionDto) {
    const { examId, content, type } = dto;

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const question = await this.prisma.question.create({
      data: {
        examId,
        content,
        type: type ?? 'MCQ',
      },
      select: {
        id: true,
        examId: true,
        content: true,
        type: true,
      },
    });

    return question;
  }

  // Cập nhật câu hỏi
  async updateQuestion(questionId: number, dto: UpdateQuestionDto) {
    // đảm bảo câu hỏi tồn tại
    const exists = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Question not found');
    }

    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data: dto,
      select: {
        id: true,
        examId: true,
        content: true,
        type: true,
      },
    });

    return updated;
  }

  // ✅ XÓA CÂU HỎI AN TOÀN
  async deleteQuestion(questionId: number) {
    // 1. Kiểm tra tồn tại
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // 2. Xoá tất cả option thuộc câu hỏi đó
    await this.prisma.option.deleteMany({
      where: { questionId },
    });

    // 3. (nếu sau này bạn có Answer cho câu hỏi này trong bài làm thì xoá ở đây luôn)
    // await this.prisma.answer.deleteMany({
    //   where: { questionId },
    // });

    // 4. Xoá câu hỏi
    await this.prisma.question.delete({
      where: { id: questionId },
    });

    return { success: true };
  }

  // Thêm phương án trả lời cho câu hỏi
  async addOption(dto: CreateOptionDto) {
    const { questionId, text, isCorrect } = dto;

    const q = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!q) {
      throw new NotFoundException('Question not found');
    }

    const option = await this.prisma.option.create({
      data: {
        questionId,
        text,
        isCorrect,
      },
      select: {
        id: true,
        questionId: true,
        text: true,
        isCorrect: true,
      },
    });

    return option;
  }
}
