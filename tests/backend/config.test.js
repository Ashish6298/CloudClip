const path = require('path');

describe('Configuration Loader', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.resetModules();
  });

  test('should load default port and env when not specified', () => {
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    
    const config = require('../../server/src/config/config');
    
    expect(config.PORT).toBe(5000);
    expect(config.NODE_ENV).toBe('development');
  });

  test('should parse environment variables properly', () => {
    process.env.PORT = '8080';
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'http://testsite.com';
    process.env.DOWNLOAD_DIR = 'test-downloads';

    const config = require('../../server/src/config/config');

    expect(config.PORT).toBe(8080);
    expect(config.NODE_ENV).toBe('production');
    expect(config.CLIENT_URL).toBe('http://testsite.com');
    expect(config.DOWNLOAD_DIR).toContain('test-downloads');
  });
});
