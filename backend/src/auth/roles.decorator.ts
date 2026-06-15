import { SetMetadata } from '@nestjs/common';

// Usage: @Roles('admin') on a controller method
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
