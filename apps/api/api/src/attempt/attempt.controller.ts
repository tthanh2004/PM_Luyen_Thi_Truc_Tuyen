import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // Dùng trực tiếp cái này cho gọn
import { AttemptService } from './attempt.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Controller('attempts')
export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}

  // SỬA 1: Dùng AuthGuard('jwt') thay vì JwtAuthGuard (trừ khi bạn đã tạo file riêng)
  @UseGuards(AuthGuard('jwt'))
  @Post('start')
  async startAttempt(@Request() req, @Body() body: StartAttemptDto) {
    // SỬA 2: req.user.id (Theo JwtStrategy mới) thay vì req.user.userId
    const userId = req.user.id;
    return this.attemptService.startAttempt(userId, body); // Truyền đúng userId xuống
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('submit')
  async submitAttempt(@Request() req, @Body() body: SubmitAttemptDto) {
    // SỬA 3: Tương tự ở trên
    const userId = req.user.id;
    return this.attemptService.submitAttempt(userId, body);
  }
}
