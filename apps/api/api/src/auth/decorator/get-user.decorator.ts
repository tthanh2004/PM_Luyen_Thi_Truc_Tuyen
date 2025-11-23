import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // request.user có được nhờ JwtStrategy ở Bước 1
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
