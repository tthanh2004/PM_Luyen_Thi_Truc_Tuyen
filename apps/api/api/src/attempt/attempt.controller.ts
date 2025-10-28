import { Controller, Post, Body, Req } from '@nestjs/common';
import { AttemptService } from './attempt.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Controller('attempts')
export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}

  // 🟢 Bắt đầu bài thi
  @Post('start')
  async start(@Req() req, @Body() dto: StartAttemptDto) {
    const userId = 2; // tạm hardcode, sau này lấy từ JWT
    return this.attemptService.startAttempt(userId, dto);
  }

  // 🟢 Nộp bài
  @Post('submit')
  async submit(@Req() req, @Body() dto: SubmitAttemptDto) {
    const userId = 2; // tạm hardcode
    return this.attemptService.submitAttempt(userId, dto);
  }
}
