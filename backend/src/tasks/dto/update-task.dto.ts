import {
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsDateString,
  IsMongoId,
} from "class-validator";
import { TaskStatus, TaskPriority } from "../schemas/task.schema";

export class UpdateTaskDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsMongoId()
  @IsOptional()
  assigneeId?: string;
}
