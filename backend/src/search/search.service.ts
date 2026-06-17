import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { TaskDocument } from "../tasks/schemas/task.schema";

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly index = "tasks";
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly es: ElasticsearchService) {}

  async onModuleInit() {
    try {
      const exists = await this.es.indices.exists({ index: this.index });
      if (!exists) {
        await this.es.indices.create({
          index: this.index,
          mappings: {
            properties: {
              title: { type: "text" },
              description: { type: "text" },
              status: { type: "keyword" },
              priority: { type: "keyword" },
              dueDate: { type: "date" },
              projectId: { type: "keyword" },
              assigneeId: { type: "keyword" },
              createdById: { type: "keyword" },
            },
          },
        });
        this.logger.log(`Created Elasticsearch index "${this.index}"`);
      }
    } catch (err) {
      this.logger.warn(`Could not initialise ES index: ${(err as Error).message}`);
    }
  }

  async indexTask(task: TaskDocument): Promise<void> {
    await this.es.index({
      index: this.index,
      id: String(task._id),
      document: {
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ?? null,
        projectId: String(task.project),
        assigneeId: task.assignee ? String(task.assignee) : null,
        createdById: String(task.createdBy),
      },
    });
  }

  async removeTask(taskId: string): Promise<void> {
    try {
      await this.es.delete({ index: this.index, id: taskId });
    } catch {}
  }

  async search(
    q: string,
    projectIds: string[],
    status?: string,
    priority?: string,
  ) {
    const must: object[] = q
      ? [
          {
            multi_match: {
              query: q,
              fields: ["title^2", "description"],
              fuzziness: "AUTO",
            },
          },
        ]
      : [{ match_all: {} }];

    const filter: object[] = [{ terms: { projectId: projectIds } }];
    if (status) filter.push({ term: { status } });
    if (priority) filter.push({ term: { priority } });

    const response = await this.es.search({
      index: this.index,
      query: { bool: { must, filter } },
    });

    return response.hits.hits.map((hit) => ({
      id: hit._id,
      score: hit._score,
      ...(hit._source as object),
    }));
  }
}
