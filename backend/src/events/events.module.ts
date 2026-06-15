import { Module } from '@nestjs/common';
import { EventsService } from './events.service';

@Module({
  providers: [EventsService],
  exports: [EventsService], // TasksModule imports this so TasksService can publish
})
export class EventsModule {}
