import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { ProjectsService } from '../projects/projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(
    private searchService: SearchService,
    private projectsService: ProjectsService,
  ) {}

  // GET /search/tasks?q=login&status=todo&priority=high
  @Get('tasks')
  async searchTasks(
    @Request() req,
    @Query('q') q = '',
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    // Fetch only the projects this user is allowed to see, then use their IDs
    // as a mandatory ES filter — users can never see tasks outside their projects
    const projects = await this.projectsService.findAllForUser(
      req.user.userId,
      req.user.role,
    );
    const projectIds = (projects as any[]).map((p) => String(p._id));

    if (projectIds.length === 0) return [];

    return this.searchService.search(q, projectIds, status, priority);
  }
}
