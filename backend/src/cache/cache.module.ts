import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';

// @Global() means any module that imports CacheModule automatically has
// CacheService available without needing to list it in their own imports.
// We use this so we don't have to import CacheModule in every feature module.
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
