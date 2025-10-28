export class CreateExamDto {
  title: string;
  description?: string;
  durationMin: number;
  createdById: number;
}
