import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { CreateOptionDto } from './dto/create-option.dto';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // GET /questions/exam/:examId
  // -> Lấy toàn bộ câu hỏi thuộc 1 đề thi kèm các lựa chọn
  @Get('exam/:examId')
  async getByExam(@Param('examId', ParseIntPipe) examId: number) {
    return this.questionService.getQuestionsByExam(examId);
  }

  // POST /questions
  // -> Tạo 1 câu hỏi mới trong đề thi
  @Post()
  async createQuestion(@Body() dto: CreateQuestionDto) {
    return this.questionService.createQuestion(dto);
  }

  // PATCH /questions/:questionId
  @Patch(':questionId')
  async updateQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionService.updateQuestion(questionId, dto);
  }

  // DELETE /questions/:questionId
  @Delete(':questionId')
  async deleteQuestion(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.questionService.deleteQuestion(questionId);
  }

  // POST /questions/:questionId/options
  // -> thêm 1 lựa chọn trả lời cho câu hỏi
  @Post(':questionId/options')
  async addOption(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() body: Omit<CreateOptionDto, 'questionId'>,
  ) {
    const dto: CreateOptionDto = {
      questionId,
      text: body.text,
      isCorrect: body.isCorrect,
    };

    return this.questionService.addOption(dto);
  }
}
