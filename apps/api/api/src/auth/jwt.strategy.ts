import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config'; // 1. Import ConfigService

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  // 2. Inject ConfigService vào constructor
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 3. Lấy secret từ ConfigService
      secretOrKey: config.get('JWT_SECRET') || 'MY_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
