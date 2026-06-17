import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateProjectDto } from "./dto/create-project.dto";
import { AddMemberDto } from "./dto/add-member.dto";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(
      dto.name,
      dto.description,
      req.user.userId,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.projectsService.findAllForUser(req.user.userId, req.user.role);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req) {
    return this.projectsService.findOne(id, req.user.userId, req.user.role);
  }

  @Post(":id/members")
  addMember(
    @Param("id") id: string,
    @Body() dto: AddMemberDto,
    @Request() req,
  ) {
    return this.projectsService.addMember(
      id,
      dto.email,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(":id")
  @HttpCode(200)
  deleteProject(@Param("id") id: string, @Request() req) {
    return this.projectsService.delete(id, req.user.userId, req.user.role);
  }

  @Delete(":id/members/:memberId")
  removeMember(
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Request() req,
  ) {
    return this.projectsService.removeMember(
      id,
      memberId,
      req.user.userId,
      req.user.role,
    );
  }
}
