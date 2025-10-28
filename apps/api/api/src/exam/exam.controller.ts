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
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  // GET /exams
  @Get()
  async getAll() {
    const exams = await this.examService.getAllExams();

    return exams;
  }

  // GET /exams/:id
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const exam = await this.examService.getExamById(id);
    return exam;
  }

  // POST /exams
  @Post()
  async create(@Body() dto: CreateExamDto) {
    const created = await this.examService.createExam(dto);
    return created;
  }

  // PATCH /exams/:id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamDto,
  ) {
    const updated = await this.examService.updateExam(id, dto);
    return updated;
  }

  // DELETE /exams/:id
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const removed = await this.examService.deleteExam(id);
    return removed;
  }
}
