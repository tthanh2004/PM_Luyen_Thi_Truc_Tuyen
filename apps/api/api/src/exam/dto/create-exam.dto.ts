import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

// 1. Định nghĩa DTO cho Đáp án (Option)
export class CreateOptionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

// 2. Định nghĩa DTO cho Câu hỏi (Question)
export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  type: string; // 'MCQ' | 'ESSAY'

  @IsArray()
  @ValidateNested({ each: true }) // Validate từng phần tử trong mảng
  @Type(() => CreateOptionDto) // Ép kiểu dữ liệu sang OptionDto
  options: CreateOptionDto[];
}

// 3. Định nghĩa DTO cho Đề thi (Exam)
export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @Min(1)
  durationMin: number;

  // --- ĐÂY LÀ PHẦN BẠN ĐANG THIẾU ---
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
