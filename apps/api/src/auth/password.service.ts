import { BadRequestException, Injectable } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    if (Array.from(password).length < 12 || Array.from(password).length > 128) {
      throw new BadRequestException('A senha deve ter entre 12 e 128 caracteres.');
    }
    return hash(password, { type: argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
  }

  async verify(encoded: string, password: string): Promise<boolean> {
    if (password.length === 0 || Array.from(password).length > 128) return false;
    try {
      return await verify(encoded, password);
    } catch {
      return false;
    }
  }
}
