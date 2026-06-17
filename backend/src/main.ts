import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { UsersService } from "./users/users.service";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors();

  await app.get(UsersService).ensureAdminExists();

  await app.listen(3000);
  console.log("Backend running on http://localhost:3000");
}
bootstrap();
