import { IsInt, IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateQuestionDto {
  @IsInt()
  examId: number; // câu hỏi thuộc đề nào

  @IsString()
  @IsNotEmpty()
  content: string; // nội dung câu hỏi

  // kiểu câu hỏi: MCQ (trắc nghiệm), ESSAY (tự luận)
  @IsString()
  @IsOptional()
  @IsIn(['MCQ', 'ESSAY'])
  type?: 'MCQ' | 'ESSAY';
}
