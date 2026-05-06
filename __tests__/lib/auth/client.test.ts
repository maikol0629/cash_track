const createAuthClient = jest.fn((options) => ({
  options,
  $Infer: { Session: { user: {} } },
  signIn: { social: jest.fn() },
  signOut: jest.fn(),
  useSession: jest.fn(),
}));

jest.mock('better-auth/react', () => ({
  createAuthClient,
}));

describe('authClient', () => {
  beforeEach(() => {
    jest.resetModules();
    createAuthClient.mockClear();
  });

  it('uses the default base URL when the env var is missing', () => {
    const previousUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    delete process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

    require('@/lib/auth/client');

    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000/api/auth',
    });

    process.env.NEXT_PUBLIC_BETTER_AUTH_URL = previousUrl;
  });

  it('uses the configured base URL when the env var is present', () => {
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL = 'https://example.com/api/auth';

    require('@/lib/auth/client');

    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'https://example.com/api/auth',
    });
  });
});
