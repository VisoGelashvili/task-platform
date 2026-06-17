import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Project, ProjectDocument } from "./schemas/project.schema";
import { UsersService } from "../users/users.service";
import { CacheService } from "../cache/cache.service";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private usersService: UsersService,
    private cacheService: CacheService,
  ) {}

  private projectCacheKey(userId: string) {
    return `projects:user:${userId}`;
  }

  async create(
    name: string,
    description: string,
    ownerId: string,
  ): Promise<ProjectDocument> {
    const project = await this.projectModel.create({
      name,
      description,
      owner: ownerId,
      members: [ownerId],
    });

    await this.cacheService.del(this.projectCacheKey(ownerId));
    return project;
  }

  async findAllForUser(userId: string, role: string) {
    if (role !== "admin") {
      const key = this.projectCacheKey(userId);
      const cached = await this.cacheService.get(key);
      if (cached) return cached;
    }

    const filter = role === "admin" ? {} : { members: userId };

    const projects = await this.projectModel
      .find(filter)
      .populate("owner members", "name email")
      .lean()
      .exec();

    if (role !== "admin") {
      await this.cacheService.set(this.projectCacheKey(userId), projects, 60);
    }

    return projects;
  }

  async findOne(id: string, userId: string, role: string) {
    const project = await this.projectModel.findById(id).lean().exec();
    if (!project) throw new NotFoundException("Project not found");

    const memberIds: string[] = (project.members as any[]).map((m) =>
      String(m),
    );
    const ownerId = String(project.owner);

    const isMember = memberIds.includes(userId);
    if (role !== "admin" && !isMember) {
      throw new ForbiddenException("You are not a member of this project");
    }

    const [ownerDoc, memberDocs] = await Promise.all([
      this.usersService.findById(ownerId),
      this.usersService.findManyByIds(memberIds),
    ]);

    const toMember = (u: any) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
    });

    return {
      _id: String((project as any)._id),
      name: project.name,
      description: project.description,
      createdAt: (project as any).createdAt,
      updatedAt: (project as any).updatedAt,
      owner: ownerDoc ? toMember(ownerDoc) : null,
      members: (memberDocs as any[]).map(toMember),
    };
  }

  async addMember(
    projectId: string,
    email: string,
    requesterId: string,
    requesterRole: string,
  ) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) throw new NotFoundException("Project not found");

    this.assertOwnerOrAdmin(
      project,
      requesterId,
      requesterRole,
      "add members to",
    );

    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive)
      throw new NotFoundException("No active user with that email");

    const alreadyMember = project.members.some(
      (m) => String(m) === String(user._id),
    );
    if (alreadyMember) throw new ConflictException("User is already a member");

    project.members.push(user._id as Types.ObjectId);
    await project.save();

    await this.cacheService.del(
      this.projectCacheKey(requesterId),
      this.projectCacheKey(String(user._id)),
    );

    return { message: `${user.name ?? user.email} added to project` };
  }

  async removeMember(
    projectId: string,
    memberId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) throw new NotFoundException("Project not found");

    this.assertOwnerOrAdmin(
      project,
      requesterId,
      requesterRole,
      "remove members from",
    );

    if (String(project.owner) === memberId) {
      throw new BadRequestException("Cannot remove the project owner");
    }

    project.members = project.members.filter((m) => String(m) !== memberId);
    await project.save();

    await this.cacheService.del(
      this.projectCacheKey(requesterId),
      this.projectCacheKey(memberId),
    );

    return { message: "Member removed" };
  }

  async delete(projectId: string, userId: string, role: string) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) throw new NotFoundException("Project not found");
    this.assertOwnerOrAdmin(project, userId, role, "delete");
    await this.projectModel.deleteOne({ _id: projectId });

    const keys = project.members.map((m) => this.projectCacheKey(String(m)));
    if (keys.length) await this.cacheService.del(...keys);
    return { message: "Project deleted" };
  }

  async assertMembership(
    projectId: string,
    userId: string,
    role: string,
  ): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) throw new NotFoundException("Project not found");
    const isMember = project.members.some((m) => String(m) === userId);
    if (role !== "admin" && !isMember) {
      throw new ForbiddenException("You are not a member of this project");
    }
    return project;
  }

  private assertOwnerOrAdmin(
    project: ProjectDocument,
    requesterId: string,
    requesterRole: string,
    action: string,
  ) {
    const isOwner = String(project.owner) === requesterId;
    if (requesterRole !== "admin" && !isOwner) {
      throw new ForbiddenException(
        `Only the project owner can ${action} this project`,
      );
    }
  }
}
