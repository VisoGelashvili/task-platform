import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Apply this to any route that requires a valid JWT
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
