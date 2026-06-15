import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { TaskDocument } from '../tasks/schemas/task.schema';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly index = 'tasks';
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly es: ElasticsearchService) {}

  // Runs once when NestJS finishes wiring the module graph.
  // Creates the ES index with explicit field mappings if it doesn't exist yet.
  async onModuleInit() {
    try {
      const exists = await this.es.indices.exists({ index: this.index });
      if (!exists) {
        await this.es.indices.create({
          index: this.index,
          mappings: {
            properties: {
              title:       { type: 'text' },       // full-text searchable
              description: { type: 'text' },       // full-text searchable
              status:      { type: 'keyword' },    // exact-match filter only
              priority:    { type: 'keyword' },    // exact-match filter only
              dueDate:     { type: 'date' },
              projectId:   { type: 'keyword' },    // used to scope results per project
              assigneeId:  { type: 'keyword' },
              createdById: { type: 'keyword' },
            },
          },
        });
        this.logger.log(`Created Elasticsearch index "${this.index}"`);
      }
    } catch (err) {
      // ES may still be starting up; tasks can be indexed retroactively
      this.logger.warn(`Could not initialise ES index: ${err.message}`);
    }
  }

  // Called by TasksService after every create or update
  async indexTask(task: TaskDocument): Promise<void> {
    await this.es.index({
      index: this.index,
      id: String(task._id),
      document: {
        title:       task.title,
        description: task.description ?? '',
        status:      task.status,
        priority:    task.priority,
        dueDate:     task.dueDate ?? null,
        projectId:   String(task.project),
        assigneeId:  task.assignee ? String(task.assignee) : null,
        createdById: String(task.createdBy),
      },
    });
  }

  // Called by TasksService after a task is deleted
  async removeTask(taskId: string): Promise<void> {
    try {
      await this.es.delete({ index: this.index, id: taskId });
    } catch {
      // Silently ignore: document may never have been indexed
    }
  }

  // Full-text search across title + description, with optional keyword filters.
  // projectIds restricts results to projects the calling user can actually see.
  async search(
    q: string,
    projectIds: string[],
    status?: string,
    priority?: string,
  ) {
    // "must" = what affects the relevance score
    const must: object[] = q
      ? [{
          multi_match: {
            query: q,
            fields: ['title^2', 'description'], // title matches worth 2× as much
            fuzziness: 'AUTO',                  // tolerates minor typos
          },
        }]
      : [{ match_all: {} }];

    // "filter" = hard constraints that don't affect score
    const filter: object[] = [{ terms: { projectId: projectIds } }];
    if (status)   filter.push({ term: { status } });
    if (priority) filter.push({ term: { priority } });

    const response = await this.es.search({
      index: this.index,
      query: { bool: { must, filter } },
    });

    return response.hits.hits.map((hit) => ({
      id:    hit._id,
      score: hit._score,
      ...(hit._source as object),
    }));
  }
}
