import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'; // <--- Đã thêm BadRequestException
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { QuestionType } from '@prisma/client';

// --- 1. SỬA LỖI IMPORT PDF ---
// Dùng require để tránh lỗi "expression is not callable" với thư viện cũ

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

// --- 2. KHAI BÁO INTERFACE (Fix lỗi TempQuestion) ---
export interface TempQuestion {
  content: string;
  type: string;
  options: { text: string; isCorrect: boolean }[];
}

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  // 1. Lấy danh sách
  async getAllExams() {
    return await this.prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        createdAt: true,
      },
    });
  }

  // 2. Lấy chi tiết
  async getExamById(id: number) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { id: 'asc' },
          include: {
            options: true,
          },
        },
      },
    });

    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  // 3. TẠO ĐỀ THI
  async createExam(dto: CreateExamDto, userId: number) {
    const { title, durationMin, questions } = dto;

    return await this.prisma.exam.create({
      data: {
        title,
        durationMin,
        createdBy: {
          connect: { id: userId },
        },
        questions: {
          create: questions.map((q) => ({
            content: q.content,
            type: q.type as QuestionType,
            options: {
              create: q.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });
  }

  // 4. CẬP NHẬT ĐỀ THI
  async updateExam(id: number, dto: UpdateExamDto) {
    const { title, durationMin, questions } = dto;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin chung
      const updatedExam = await tx.exam.update({
        where: { id },
        data: { title, durationMin },
      });

      // 2. Nếu có thay đổi câu hỏi
      if (questions && questions.length > 0) {
        // A. Lấy danh sách lượt thi cũ
        const oldAttempts = await tx.attempt.findMany({
          where: { examId: id },
          select: { id: true },
        });
        const oldAttemptIds = oldAttempts.map((a) => a.id);

        // B. Xóa sạch câu trả lời liên quan
        if (oldAttemptIds.length > 0) {
          await tx.answer.deleteMany({
            where: { attemptId: { in: oldAttemptIds } },
          });
          await tx.attempt.deleteMany({
            where: { id: { in: oldAttemptIds } },
          });
        }

        // D. Lấy danh sách câu hỏi cũ
        const oldQuestions = await tx.question.findMany({
          where: { examId: id },
          select: { id: true },
        });
        const oldQuestionIds = oldQuestions.map((q) => q.id);

        // E. Xóa Options cũ
        if (oldQuestionIds.length > 0) {
          await tx.option.deleteMany({
            where: { questionId: { in: oldQuestionIds } },
          });
        }

        // F. Cuối cùng: Xóa Questions cũ
        await tx.question.deleteMany({
          where: { examId: id },
        });

        // 3. Tạo câu hỏi mới
        for (const q of questions) {
          await tx.question.create({
            data: {
              examId: id,
              content: q.content,
              type: q.type as QuestionType,
              options: {
                create: q.options.map((opt) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                })),
              },
            },
          });
        }
      }
      return updatedExam;
    });
  }

  // 5. Xóa đề thi
  async deleteExam(id: number) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');

    const questions = await this.prisma.question.findMany({
      where: { examId: id },
      select: { id: true },
    });
    const questionIds = questions.map((q) => q.id);

    if (questionIds.length > 0) {
      await this.prisma.answer.deleteMany({
        where: { questionId: { in: questionIds } },
      });
      await this.prisma.option.deleteMany({
        where: { questionId: { in: questionIds } },
      });
      await this.prisma.question.deleteMany({
        where: { id: { in: questionIds } },
      });
    }

    const attempts = await this.prisma.attempt.findMany({
      where: { examId: id },
      select: { id: true },
    });
    const attemptIds = attempts.map((a) => a.id);

    if (attemptIds.length > 0) {
      await this.prisma.answer.deleteMany({
        where: { attemptId: { in: attemptIds } },
      });
      await this.prisma.attempt.deleteMany({
        where: { id: { in: attemptIds } },
      });
    }

    await this.prisma.exam.delete({ where: { id } });

    return { success: true, message: 'Deleted successfully' };
  }

  async parseExamFromPdf(fileBuffer: Buffer) {
    try {
      const data = await pdf(fileBuffer);
      const text = data.text;
      return this.extractQuestionsFromText(text);
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Không thể đọc file PDF');
    }
  }

  private extractQuestionsFromText(text: string) {
    // Chuẩn hóa xuống dòng
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanText.split('\n');

    const questions: TempQuestion[] = [];

    // FIX LỖI TYPE: Khai báo rõ kiểu hoặc null
    let currentQuestion: TempQuestion | null = null;

    // --- 3. SỬA REGEX (Fix lỗi unnecessary escape) ---
    // Bỏ dấu \ trước dấu . và : trong []
    const questionStartRegex = /^(Câu|Bài|Question)?\s*\d+[.:]\s*(.*)/i;

    // Bỏ dấu \ trước dấu . ) : trong []
    const optionRegex = /([A-D])\s*[.):]\s*(.*?)(?=\s+[A-D]\s*[.):]|$)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 1. Kiểm tra câu hỏi mới
      const qMatch = line.match(questionStartRegex);
      if (qMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }

        // Khởi tạo object mới
        currentQuestion = {
          content: qMatch[2] || 'Nội dung câu hỏi...',
          type: 'MCQ',
          options: [],
        };
        continue;
      }

      // 2. Kiểm tra đáp án (Chỉ chạy khi currentQuestion KHÔNG null)
      if (currentQuestion) {
        const optionsInLine = [...line.matchAll(optionRegex)];

        if (optionsInLine.length > 0) {
          optionsInLine.forEach((match) => {
            let rawText = match[2].trim();
            let isCorrect = false;

            // Logic tìm dấu hiệu đúng
            if (rawText.startsWith('*')) {
              isCorrect = true;
              rawText = rawText.substring(1).trim();
            }
            const correctSuffixRegex = /\((True|Đúng|Correct)\)$/i;
            if (correctSuffixRegex.test(rawText)) {
              isCorrect = true;
              rawText = rawText.replace(correctSuffixRegex, '').trim();
            }

            // TypeScript giờ đã hiểu currentQuestion không null ở đây
            currentQuestion!.options.push({
              text: rawText,
              isCorrect: isCorrect,
            });
          });
        } else {
          // Nối dòng cho câu hỏi dài
          if (currentQuestion.options.length === 0) {
            currentQuestion.content += ' ' + line;
          }
        }
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  }
}
