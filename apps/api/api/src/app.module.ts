import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ExamModule } from './exam/exam.module';
import { QuestionModule } from './question/question.module';
import { AttemptModule } from './attempt/attempt.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ExamModule,
    QuestionModule,
    AttemptModule,
  ],
})
export class AppModule {}
