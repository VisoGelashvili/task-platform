import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule], // NotificationsService needs UsersService to look up the assignee
  providers: [NotificationsService],
})
export class NotificationsModule {}
