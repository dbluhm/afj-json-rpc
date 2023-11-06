import { describe } from 'node:test';
import { requestValidator } from '../src/jsonrpc/types';

describe('jsonrpc/types', () => {
  it('should validate a valid request', () => {
    const validRequest = {
      jsonrpc: '2.0',
      method: 'subtract',
      params: [42, 23],
      id: 1,
    };
    expect(requestValidator(validRequest)).toBeTruthy();
  });

  it('should validate a request without params', () => {
    const validRequest = {
      jsonrpc: '2.0',
      method: 'someMethod',
      id: 1,
    };
    expect(requestValidator(validRequest)).toBeTruthy();
  });

  it('should validate a request without an id (AKA a notification)', () => {
    const validRequest = {
      jsonrpc: '2.0',
      method: 'notify',
      params: ['something happened'],
    };
    expect(requestValidator(validRequest)).toBeTruthy();
  });

  it('should validate a request with named parameters', () => {
    const validRequest = {
      jsonrpc: '2.0',
      method: 'subtract',
      params: { subtrahend: 23, minuend: 42 },
      id: 3,
    };
    expect(requestValidator(validRequest)).toBeTruthy();
  });

  it('should not validate a request missing a method', () => {
    const invalidRequest = {
      jsonrpc: '2.0',
      id: 1,
    };
    expect(requestValidator(invalidRequest)).toBeFalsy();
  });

  it('should not validate a request with a bad method value', () => {
    const invalidRequest = {
      jsonrpc: '2.0',
      method: 10,
      id: 1,
    };
    expect(requestValidator(invalidRequest)).toBeFalsy();
  });

  it('should not validate a request missing jsonrpc', () => {
    const invalidRequest = {
      method: 'subtract',
      params: [42, 23],
      id: 1,
    };
    expect(requestValidator(invalidRequest)).toBeFalsy();
  });

  it('should not validate a request with bad jsonrpc value', () => {
    const invalidRequest = {
      jsonrpc: '1.0',
      method: 'subtract',
      params: [42, 23],
      id: 1,
    };
    expect(requestValidator(invalidRequest)).toBeFalsy();
  });

  it('should not validate a request containing extra properties', () => {
    const invalidRequest = {
      jsonrpc: '2.0',
      method: 'subtract',
      params: [42, 23],
      id: 1,
      junk: 'junk',
    };
    expect(requestValidator(invalidRequest)).toBeFalsy();
  });
});
