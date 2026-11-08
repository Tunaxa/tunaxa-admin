import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { TimeclockController } from './timeclock.controller.js';
import { TimeclockService } from './timeclock.service.js';

/** Attendance: clocking in and out. */
@Module({
  imports: [AuthModule],
  controllers: [TimeclockController],
  providers: [TimeclockService],
})
export class TimeclockModule {}
