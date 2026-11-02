import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersController } from './users.controller.js';

@Module({ imports: [AuthModule, PrismaModule], controllers: [UsersController] })
export class UsersModule {}
