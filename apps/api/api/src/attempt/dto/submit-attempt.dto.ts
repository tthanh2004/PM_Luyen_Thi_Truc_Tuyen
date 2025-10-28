import { IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerInput {
  @IsInt()
  questionId: number;

  @IsInt()
  selectedOptionId: number;
}

export class SubmitAttemptDto {
  @IsInt()
  attemptId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerInput)
  answers: AnswerInput[];
}
