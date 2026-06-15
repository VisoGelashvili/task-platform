import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project, ProjectSchema } from './schemas/project.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    UsersModule, // needed so ProjectsService can call usersService.findByEmail
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService], // TasksModule will import this in Phase 4
})
export class ProjectsModule {}
