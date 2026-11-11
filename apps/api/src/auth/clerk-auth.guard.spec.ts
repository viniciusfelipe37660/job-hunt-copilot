import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from './clerk-auth.guard.js';

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(),
}));

function makeContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers, auth: undefined }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('ClerkAuthGuard', () => {
  let guard: ClerkAuthGuard;
  let reflector: Reflector;
  let config: ConfigService;

  beforeEach(() => {
    reflector = new Reflector();
    config = {
      get: vi.fn((key: string) =>
        key === 'CLERK_SECRET_KEY' ? 'sk_test_x' : key === 'WEB_APP_URL' ? 'http://localhost:3000' : undefined,
      ),
    } as unknown as ConfigService;
    guard = new ClerkAuthGuard(reflector, config);
    vi.mocked(verifyToken).mockReset();
  });

  it('allows public routes without a token', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = makeContext({});

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('rejects requests with no bearer token', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const ctx = makeContext({});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when verifyToken throws', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    vi.mocked(verifyToken).mockRejectedValue(new Error('invalid signature'));
    const ctx = makeContext({ authorization: 'Bearer bad-token' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the Clerk user id to the request on a valid token', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'user_123' } as any);
    const request = { headers: { authorization: 'Bearer good-token' }, auth: undefined as any };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.auth).toEqual({ clerkUserId: 'user_123' });
    expect(verifyToken).toHaveBeenCalledWith('good-token', {
      secretKey: 'sk_test_x',
      authorizedParties: ['http://localhost:3000'],
    });
  });
});
