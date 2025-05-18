import { Controller, Post, Body, } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LogindDto } from './dto/login.dto';
import { Profile } from './enum/profile.enum';
import { VerifyTokenDto } from './dto/verify-token.dto';

@Controller('auth/v1')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/register')
  registerUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  login(@Body() authPayloadDto: LogindDto) {
    return this.authService.login(authPayloadDto);
  }

  @Post('/login-google')
  loginGoogle(@Body() body: {token: string, profile: Profile}) {
    return this.authService.loginGoogle(body.token, body.profile);
  }

  @Post('/verify-token')
    verifyToken(@Body() body: VerifyTokenDto) {
        return this.authService.verifyToken(body.token);
    }
}
