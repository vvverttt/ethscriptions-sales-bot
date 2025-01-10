import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppService } from '@/app.service';

import { EvmService } from '@/services/evm.service';
import { DataService } from '@/services/data.service';
import { TwitterService } from '@/services/twitter.service';
import { ImageService } from '@/services/image.service';
import { CollectionService } from '@/services/collection.service';
import { UtilService } from '@/services/util.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 24 * 60 * 60 * 1000,
    }),
  ],
  controllers: [],
  providers: [
    AppService,
    EvmService,
    DataService,
    TwitterService,
    ImageService,
    CollectionService,
    UtilService
  ],
})
export class AppModule {}

