import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Injectable()
export class AttemptService {
  constructor(private prisma: PrismaService) {}

  async startAttempt(userId: number, dto: StartAttemptDto) {
    return this.prisma.attempt.create({
      data: {
        userId: userId, // Lưu ID người làm bài
        examId: dto.examId,
        startedAt: new Date(),
      },
    });
  }

  async submitAttempt(userId: number, dto: SubmitAttemptDto) {
    const { attemptId, answers } = dto;

    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId)
      throw new NotFoundException('Not your attempt');

    let total = 0;
    let correct = 0;

    for (const ans of answers) {
      const option = await this.prisma.option.findUnique({
        where: { id: ans.selectedOptionId },
      });

      const isCorrect = option?.isCorrect ?? false;
      const score = isCorrect ? 1 : 0;

      await this.prisma.answer.create({
        data: {
          attemptId,
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
      where: { id: attemptId },
      data: {
        score: finalScore,
        status: 'GRADED',
        submittedAt: new Date(),
      },
    });

    return { attemptId, score: finalScore };
  }
}
