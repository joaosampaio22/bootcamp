import { Module } from '@nestjs/common';
import { EnvironmentModule } from './common/environment.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SubjectsModule } from './subjects/subjects.module.js';
import { UsersModule } from './users/users.module.js';

@Module({ imports: [EnvironmentModule, HealthModule, AuthModule, SubjectsModule, UsersModule] })
export class AppModule {}
