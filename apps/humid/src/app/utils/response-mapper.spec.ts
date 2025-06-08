import { ResponseMapper } from './response-mapper';

describe('ResponseMapper', () => {
  describe('constructor', () => {
    it('should create instance with correct properties', () => {
      const statusCode = 200;
      const message = 'Test message';
      const data = { test: 'data' };

      const response = new ResponseMapper(statusCode, message, data);

      expect(response.statusCode).toBe(statusCode);
      expect(response.message).toBe(message);
      expect(response.data).toBe(data);
    });

    it('should handle null data', () => {
      const statusCode = 404;
      const message = 'Not found';
      const data = null;

      const response = new ResponseMapper(statusCode, message, data);

      expect(response.statusCode).toBe(statusCode);
      expect(response.message).toBe(message);
      expect(response.data).toBeNull();
    });
  });

  describe('success static method', () => {
    it('should create success response with default values', () => {
      const data = { test: 'success' };

      const response = ResponseMapper.success(data);

      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('Success');
      expect(response.data).toBe(data);
      expect(response).toBeInstanceOf(ResponseMapper);
    });

    it('should create success response with custom message', () => {
      const data = { test: 'success' };
      const customMessage = 'Operation completed successfully';

      const response = ResponseMapper.success(data, customMessage);

      expect(response.statusCode).toBe(200);
      expect(response.message).toBe(customMessage);
      expect(response.data).toBe(data);
    });

    it('should create success response with custom message and status code', () => {
      const data = { test: 'created' };
      const customMessage = 'Resource created';
      const statusCode = 201;

      const response = ResponseMapper.success(data, customMessage, statusCode);

      expect(response.statusCode).toBe(statusCode);
      expect(response.message).toBe(customMessage);
      expect(response.data).toBe(data);
    });
  });

  describe('error static method', () => {
    it('should create error response with default status code', () => {
      const message = 'Something went wrong';
      const error = { errorCode: 'E001', details: 'Error details' };

      const response = ResponseMapper.error(message, undefined, error);

      expect(response.statusCode).toBe(400);
      expect(response.message).toBe(message);
      expect(response.data).toBe(error);
      expect(response).toBeInstanceOf(ResponseMapper);
    });

    it('should create error response with custom status code', () => {
      const message = 'Resource not found';
      const statusCode = 404;
      const error = { errorCode: 'E404', resource: 'User' };

      const response = ResponseMapper.error(message, statusCode, error);

      expect(response.statusCode).toBe(statusCode);
      expect(response.message).toBe(message);
      expect(response.data).toBe(error);
    });
  });
});
