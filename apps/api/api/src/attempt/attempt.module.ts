import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttemptController } from './attempt.controller';
import { AttemptService } from './attempt.service';

@Module({
  controllers: [AttemptController],
  providers: [AttemptService, PrismaService],
})
export class AttemptModule {}
