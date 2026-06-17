import { Module } from "@nestjs/common";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { ConfigService } from "@nestjs/config";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        node: config.get<string>("ES_URL"),
      }),
    }),
    ProjectsModule,
  ],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
