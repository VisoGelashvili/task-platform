import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        node: config.get<string>('ES_URL'),
      }),
    }),
    ProjectsModule, // SearchController needs ProjectsService to scope results per user
  ],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService], // TasksModule imports this so TasksService can call indexTask
})
export class SearchModule {}
