import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from './cache/cache.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { SearchModule } from './search/search.module';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Makes ConfigService available everywhere without re-importing
    ConfigModule.forRoot({ isGlobal: true }),

    // Connects to MongoDB using the URI from .env
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

    CacheModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    SearchModule,
    EventsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
