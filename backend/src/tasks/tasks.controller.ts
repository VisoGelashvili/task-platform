import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

@Controller("projects/:projectId/tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(
    @Param("projectId") projectId: string,
    @Body() dto: CreateTaskDto,
    @Request() req,
  ) {
    return this.tasksService.create(
      projectId,
      dto,
      req.user.userId,
      req.user.role,
    );
  }

  @Get()
  findAll(@Param("projectId") projectId: string, @Request() req) {
    return this.tasksService.findAll(projectId, req.user.userId, req.user.role);
  }

  @Get(":taskId")
  findOne(
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Request() req,
  ) {
    return this.tasksService.findOne(
      projectId,
      taskId,
      req.user.userId,
      req.user.role,
    );
  }

  @Patch(":taskId")
  update(
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Body() dto: UpdateTaskDto,
    @Request() req,
  ) {
    return this.tasksService.update(
      projectId,
      taskId,
      dto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(":taskId")
  remove(
    @Param("projectId") projectId: string,
    @Param("taskId") taskId: string,
    @Request() req,
  ) {
    return this.tasksService.remove(
      projectId,
      taskId,
      req.user.userId,
      req.user.role,
    );
  }
}
