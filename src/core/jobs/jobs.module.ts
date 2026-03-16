import { Module } from '@nestjs/common';
import { FxRefreshJob } from './fx-refresh.job';
import { FxModule } from '../fx/fx.module';

@Module({
  imports: [FxModule],
  providers: [FxRefreshJob],
})
export class JobsModule { } 
