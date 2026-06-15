import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { InviteDto } from './dto/invite.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async invite({ email }: InviteDto) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered or invited');

    const inviteToken = randomBytes(32).toString('hex');
    await this.usersService.createInvite(email, inviteToken);

    // In production: email the user a link containing this token.
    // For now we return it directly so you can test with Postman/curl.
    return { message: 'Invite sent', inviteToken };
  }

  async register({ token, name, password }: RegisterDto) {
    const user = await this.usersService.findByInviteToken(token);
    if (!user) throw new BadRequestException('Invalid or expired invite token');
    if (user.isActive) throw new BadRequestException('Account already activated');

    const hashed = await bcrypt.hash(password, 10);
    await this.usersService.activateUser(String(user._id), name, hashed);
    return { message: 'Registration successful. You can now log in.' };
  }

  async login({ email, password }: LoginDto) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: String(user._id), email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
