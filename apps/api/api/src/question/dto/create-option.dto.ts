import { IsBoolean, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateOptionDto {
  @IsInt()
  questionId: number;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}
