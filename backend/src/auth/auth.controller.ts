import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { InviteDto } from './dto/invite.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Only an authenticated admin can invite new users
  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  invite(@Body() dto: InviteDto) {
    return this.authService.invite(dto);
  }

  // Public — the invitee uses their token to complete signup
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Public — returns a JWT on success
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Protected — returns the current user from the JWT payload
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req) {
    return req.user;
  }
}
