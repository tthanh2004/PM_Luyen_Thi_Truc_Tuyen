import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateQuestionDto {
  @IsInt()
  @IsOptional()
  examId?: number;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  @IsIn(['MCQ', 'ESSAY'])
  type?: 'MCQ' | 'ESSAY';
}
