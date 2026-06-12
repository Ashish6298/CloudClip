const { validateUrl } = require('../../server/src/middleware/security');
const { ERROR_CODES } = require('../../shared/constants/constants.json');

describe('Security Validation Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  test('should fail if no URL is provided', () => {
    mockRequest.body = {};
    
    validateUrl(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ERROR_CODES.INVALID_URL
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should fail for unsupported domains', () => {
    mockRequest.body = { url: 'https://malicious-website.com/video123' };
    
    validateUrl(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ERROR_CODES.UNSUPPORTED_SITE
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should pass for supported domains (youtube, x, soundcloud)', () => {
    const supportedUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://soundcloud.com/artist/track',
      'https://x.com/user/status/12345',
      'https://vimeo.com/98765432'
    ];

    supportedUrls.forEach(url => {
      mockRequest.body = { url };
      nextFunction.mockClear();
      mockResponse.status.mockClear();
      
      validateUrl(mockRequest, mockResponse, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  test('should fail for malformed URLs', () => {
    mockRequest.body = { url: 'not_a_valid_url' };
    
    validateUrl(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ERROR_CODES.INVALID_URL,
        message: 'The provided value is not a valid HTTP/HTTPS URL'
      })
    );
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
