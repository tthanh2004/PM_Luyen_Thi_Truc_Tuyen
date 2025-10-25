import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.register({}), // ta cấu hình trong service khi sign
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
