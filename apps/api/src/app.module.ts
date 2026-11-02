import { Module } from '@nestjs/common';
import { EnvironmentModule } from './common/environment.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SubjectsModule } from './subjects/subjects.module.js';
import { UsersModule } from './users/users.module.js';
import { FocusModule } from './focus/focus.module.js';
import { ContentsModule } from './contents/contents.module.js';
import { ContinuityModule } from './continuity/continuity.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';

@Module({ imports: [EnvironmentModule, HealthModule, AuthModule, SubjectsModule, UsersModule, FocusModule, ContentsModule, ContinuityModule, DashboardModule, ReviewsModule] })
export class AppModule {}
