import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SubjectsController } from './subjects.controller.js';
import { SubjectsService } from './subjects.service.js';

@Module({ imports: [AuthModule, PrismaModule], controllers: [SubjectsController], providers: [SubjectsService] })
export class SubjectsModule {}
