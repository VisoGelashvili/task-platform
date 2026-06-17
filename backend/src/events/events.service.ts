import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private connection: any;
  private channel: any;
  private readonly logger = new Logger(EventsService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    try {
      this.connection = await amqp.connect(
        this.config.get<string>("RABBITMQ_URL"),
      );
      this.channel = await this.connection.createChannel();
      this.logger.log("EventsService connected to RabbitMQ");
    } catch (err) {
      this.logger.warn(`Could not connect to RabbitMQ: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publish(queue: string, payload: object): Promise<void> {
    if (!this.channel) {
      this.logger.warn("RabbitMQ channel not ready — event dropped");
      return;
    }
    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
    this.logger.debug(`Published to "${queue}": ${JSON.stringify(payload)}`);
  }
}
