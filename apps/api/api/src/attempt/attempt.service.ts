import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Injectable()
export class AttemptService {
  constructor(private prisma: PrismaService) {}

  // 🟢 1. Bắt đầu bài thi
  async startAttempt(userId: number, dto: StartAttemptDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const attempt = await this.prisma.attempt.create({
      data: {
        examId: dto.examId,
        userId,
      },
      select: { id: true, examId: true, status: true, startedAt: true },
    });

    return attempt;
  }

  // 🟢 2. Nộp bài & chấm điểm
  async submitAttempt(userId: number, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: dto.attemptId },
      include: { exam: true },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId)
      throw new NotFoundException('Not your attempt');

    let total = 0;
    let correct = 0;

    for (const ans of dto.answers) {
      const option = await this.prisma.option.findUnique({
        where: { id: ans.selectedOptionId },
      });

      const isCorrect = option?.isCorrect ?? false;
      const score = isCorrect ? 1 : 0;

      await this.prisma.answer.create({
        data: {
          attemptId: dto.attemptId,
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId,
          isCorrect,
          score,
        },
      });

      total++;
      if (isCorrect) correct++;
    }

    const finalScore = (correct / total) * 10;

    await this.prisma.attempt.update({
      where: { id: dto.attemptId },
      data: {
        score: finalScore,
        status: 'GRADED',
        submittedAt: new Date(),
      },
    });

    return { attemptId: dto.attemptId, score: finalScore };
  }
}
