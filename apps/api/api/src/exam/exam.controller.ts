import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  ParseIntPipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  UploadedFile,
  UseInterceptors,
  UseGuards, // <--- 1. Thêm cái này
  Req, // <--- 2. Thêm cái này
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // <--- 3. Thêm cái này
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  // GET /exams
  @Get()
  async getAll() {
    return await this.examService.getAllExams();
  }

  // GET /exams/:id
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return await this.examService.getExamById(id);
  }

  // POST /exams
  // --- SỬA LẠI THEO CÁCH CHUẨN ---
  @Post()
  @UseGuards(AuthGuard('jwt')) // Bắt buộc phải có Token mới vào được hàm này
  async create(@Body() dto: CreateExamDto, @Req() req: any) {
    // req.user được tạo ra bởi JwtStrategy.validate()
    // Vì bạn đã sửa JwtStrategy trả về { id: ... } nên ở đây gọi .id
    const userId = req.user.id;

    console.log('User đang tạo đề là:', userId); // Log ra để kiểm tra

    const created = await this.examService.createExam(dto, userId);
    return created;
  }
  // -------------------------------

  // PATCH /exams/:id
  @Patch(':id')
  @UseGuards(AuthGuard('jwt')) // (Tùy chọn) Thường update cũng cần đăng nhập
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamDto,
  ) {
    return await this.examService.updateExam(id, dto);
  }

  // DELETE /exams/:id
  @Delete(':id')
  @UseGuards(AuthGuard('jwt')) // (Tùy chọn) Thường delete cũng cần đăng nhập
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.examService.deleteExam(id);
  }

  @Post('upload-pdf')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file')) // 'file' là tên field gửi từ frontend
  async uploadPdf(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // Max 5MB
          new FileTypeValidator({ fileType: 'application/pdf' }), // Chỉ nhận PDF
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // Gọi service xử lý buffer
    const questions = await this.examService.parseExamFromPdf(file.buffer);
    return { success: true, questions };
  }
}
