import { JsonRpcHandler, JsonRpcRequestHandler } from '../src/jsonrpc/types';
import { JsonRpcServer } from '../src/jsonrpc/server';
import schemas from '../src/jsonrpc/schemas';
import { JsonRpcInvalidParamsError } from '../src/jsonrpc/errors';

let server: JsonRpcServer;
let handler: JsonRpcHandler<any, any>;

describe('JsonRpcServer', () => {
  beforeAll(() => {
    server = new JsonRpcServer({ useSocket: false });
    const schema = {};
    const validate = schemas.compile(schema);
    handler = {
      method: 'test',
      validate: validate,
      handler: () => ({ jsonrpc: '2.0', result: 'test', id: 1 }),
    };
    server.registerHandler(handler);
  });

  it('Can register a handler and process a request', async () => {
    const result = await server.handle(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        params: {},
        id: 1,
      })
    );
    expect(result).toEqual({
      jsonrpc: '2.0',
      result: 'test',
      id: 1,
    });
  });

  it('Returns errors on invalid requests', async () => {
    const result = await server.handle(
      JSON.stringify({
        method: 'test',
        params: {},
        id: 1,
      })
    );
    expect(result).toMatchObject({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid request',
      },
      id: 1,
    });
  });

  it('Returns errors on unable to parse request', async () => {
    const result = await server.handle('invalid');
    expect(result).toMatchObject({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error',
      },
      id: null,
    });
  });

  it('Returns errors on unknown method', async () => {
    const result = await server.handle(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'unknown',
        params: {},
        id: 1,
      })
    );
    expect(result).toMatchObject({
      jsonrpc: '2.0',
      error: {
        code: -32601,
        message: 'Method not found',
      },
      id: 1,
    });
  });

  it('Returns errors on invalid params', async () => {
    const schema = {};
    const validate = schemas.compile(schema);
    const handler: JsonRpcHandler<any, any> = {
      method: 'test',
      validate: validate,
      handler: () => {
        throw new JsonRpcInvalidParamsError(1);
      },
    };
    server.registerHandler(handler);
    const result = await server.handle(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        params: ['invalid'],
        id: 1,
      })
    );
    expect(result).toMatchObject({
      jsonrpc: '2.0',
      error: {
        code: -32602,
        message: 'Invalid params',
      },
      id: 1,
    });
  });

  it('Returns errors on other errors', async () => {
    const schema = {};
    const validate = schemas.compile(schema);
    const handler: JsonRpcHandler<any, any> = {
      method: 'test',
      validate: validate,
      handler: () => {
        throw new Error('Some error');
      },
    };
    server.registerHandler(handler);
    const result = await server.handle(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        params: ['invalid'],
        id: 1,
      })
    );
    expect(result).toMatchObject({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
      },
      id: 1,
    });
  });

  it('Can use a handler with explicilty empty params', async () => {
    const schema = {};
    const validate = schemas.compile<undefined>(schema);
    class TestHandler extends JsonRpcRequestHandler<undefined, { test: string }> {
      method = 'test';
      validate = validate;
      async handleRequest(): Promise<{ test: string }> {
        return { test: 'test' };
      }
    }
    const handler = new TestHandler();
    server.registerHandler(handler);
    const result = await server.handle(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'test',
        id: 1,
      })
    );
    expect(result).toMatchObject({
      jsonrpc: '2.0',
      result: { test: 'test' },
      id: 1,
    });
  });
});
