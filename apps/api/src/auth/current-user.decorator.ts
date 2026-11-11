import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserPayload } from './current-user.interface.js';

export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext): CurrentUserPayload => {
  const req = ctx.switchToHttp().getRequest();
  return req.auth;
});
