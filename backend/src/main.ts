import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Strips any properties from request bodies that aren't in the DTO class
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Standardises all error responses to { statusCode, message, path, timestamp }
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors();

  // Seed one admin account on first run so there's someone who can invite others
  await app.get(UsersService).ensureAdminExists();

  await app.listen(3000);
  console.log('Backend running on http://localhost:3000');
}
bootstrap();
