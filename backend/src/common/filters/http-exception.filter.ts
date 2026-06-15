import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Without this filter, NestJS returns different shapes for different errors.
// This ensures every error response always looks like:
// { statusCode, message, path, timestamp }
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();
    const status   = exception.getStatus();

    const body = exception.getResponse();
    // NestJS validation errors nest messages inside an object; unwrap them
    const message =
      typeof body === 'object' && 'message' in (body as object)
        ? (body as { message: string | string[] }).message
        : body;

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
