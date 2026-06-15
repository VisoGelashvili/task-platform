import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { ProjectsService } from '../projects/projects.service';
import { SearchService } from '../search/search.service';
import { EventsService } from '../events/events.service';
import { CacheService } from '../cache/cache.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private projectsService: ProjectsService,
    private searchService: SearchService,
    private eventsService: EventsService,
    private cacheService: CacheService,
  ) {}

  private taskCacheKey(projectId: string) {
    return `tasks:project:${projectId}`;
  }

  async create(
    projectId: string,
    dto: CreateTaskDto,
    userId: string,
    role: string,
  ): Promise<TaskDocument> {
    const project = await this.projectsService.assertMembership(projectId, userId, role);

    if (dto.assigneeId) {
      const isAssigneeMember = project.members.some((m) => String(m) === dto.assigneeId);
      if (!isAssigneeMember) {
        throw new BadRequestException('Assignee must be a member of this project');
      }
    }

    const { assigneeId, ...rest } = dto;
    const task = await this.taskModel.create({
      ...rest,
      project: projectId,
      createdBy: userId,
      ...(assigneeId && { assignee: assigneeId }),
    });

    await this.searchService.indexTask(task);
    await this.cacheService.del(this.taskCacheKey(projectId));

    if (assigneeId) {
      await this.eventsService.publish('task.assigned', {
        taskId: String(task._id),
        taskTitle: task.title,
        assigneeId,
        projectId,
      });
    }

    return task;
  }

  async findAll(projectId: string, userId: string, role: string) {
    await this.projectsService.assertMembership(projectId, userId, role);

    const key = this.taskCacheKey(projectId);
    const cached = await this.cacheService.get(key);
    if (cached) return cached; // cache HIT

    const tasks = await this.taskModel
      .find({ project: projectId })
      .populate('assignee createdBy', 'name email')
      .lean() // plain objects — safe to serialise into Redis
      .exec();

    await this.cacheService.set(key, tasks, 30);
    return tasks;
  }

  async findOne(
    projectId: string,
    taskId: string,
    userId: string,
    role: string,
  ): Promise<TaskDocument> {
    await this.projectsService.assertMembership(projectId, userId, role);
    const task = await this.taskModel
      .findOne({ _id: taskId, project: projectId })
      .populate('assignee createdBy', 'name email')
      .exec();
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
    userId: string,
    role: string,
  ): Promise<TaskDocument> {
    const project = await this.projectsService.assertMembership(projectId, userId, role);

    const task = await this.taskModel.findOne({ _id: taskId, project: projectId }).exec();
    if (!task) throw new NotFoundException('Task not found');

    if (dto.assigneeId) {
      const isAssigneeMember = project.members.some((m) => String(m) === dto.assigneeId);
      if (!isAssigneeMember) {
        throw new BadRequestException('Assignee must be a member of this project');
      }
    }

    const { assigneeId, ...rest } = dto;
    const previousAssigneeId = task.assignee ? String(task.assignee) : null;
    const newAssigneeId =
      assigneeId !== undefined ? (assigneeId || null) : previousAssigneeId;

    const updated = await this.taskModel
      .findByIdAndUpdate(
        taskId,
        { ...rest, ...(assigneeId !== undefined && { assignee: assigneeId || null }) },
        { new: true },
      )
      .populate('assignee createdBy', 'name email')
      .exec();

    await this.searchService.indexTask(updated);
    await this.cacheService.del(this.taskCacheKey(projectId));

    if (newAssigneeId && newAssigneeId !== previousAssigneeId) {
      await this.eventsService.publish('task.assigned', {
        taskId: String(task._id),
        taskTitle: updated.title,
        assigneeId: newAssigneeId,
        projectId,
      });
    }

    return updated;
  }

  async remove(
    projectId: string,
    taskId: string,
    userId: string,
    role: string,
  ): Promise<{ message: string }> {
    const project = await this.projectsService.assertMembership(projectId, userId, role);

    const task = await this.taskModel.findOne({ _id: taskId, project: projectId }).exec();
    if (!task) throw new NotFoundException('Task not found');

    const isCreator = String(task.createdBy) === userId;
    const isProjectOwner = String(project.owner) === userId;
    if (role !== 'admin' && !isCreator && !isProjectOwner) {
      throw new ForbiddenException('Only the task creator or project owner can delete this task');
    }

    await task.deleteOne();
    await this.searchService.removeTask(String(task._id));
    await this.cacheService.del(this.taskCacheKey(projectId));

    return { message: 'Task deleted' };
  }
}
