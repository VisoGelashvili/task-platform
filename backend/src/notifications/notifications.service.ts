import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";
import { UsersService } from "../users/users.service";

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private connection: any;
  private channel: any;
  private readonly queue = "task.assigned";
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private config: ConfigService,
    private usersService: UsersService,
  ) {}

  async onModuleInit() {
    try {
      this.connection = await amqp.connect(
        this.config.get<string>("RABBITMQ_URL"),
      );
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queue, { durable: true });
      this.channel.prefetch(1);
      this.channel.consume(this.queue, (msg: amqp.ConsumeMessage | null) =>
        this.handle(msg),
      );
      this.logger.log(`Listening on queue "${this.queue}"`);
    } catch (err) {
      this.logger.warn(`Could not connect to RabbitMQ: ${(err as Error).message}`);
    }
  }

  private async handle(msg: amqp.ConsumeMessage | null) {
    if (!msg) return;

    const payload = JSON.parse(msg.content.toString()) as {
      taskId: string;
      taskTitle: string;
      assigneeId: string;
      projectId: string;
    };

    const user = await this.usersService.findById(payload.assigneeId);
    if (user) {
      this.logger.log(
        `[Notification] → ${user.email}: You have been assigned to "${payload.taskTitle}"`,
      );
    }

    this.channel.ack(msg);
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
