import { createServer, Server } from 'net';
import { createInterface } from 'readline';
import {
  JsonRpcHandler,
  JsonRpcRequest,
  JsonRpcResponse,
  requestValidator,
} from './types';
import {
  JsonRpcError,
  JsonRpcInternalError,
  JsonRpcInvalidParamsError,
  JsonRpcInvalidRequestError,
  JsonRpcMethodNotFoundError,
  JsonRpcParseError,
} from './errors';

export interface JsonRpcServerConfig {
  useSocket: boolean;
  socketPath?: string;
}

export class JsonRpcServer {
  private server: Server | null = null;
  private config: JsonRpcServerConfig;
  private method_to_handler: Map<string, JsonRpcHandler<any, any>>;

  constructor(config: JsonRpcServerConfig) {
    this.config = config;
    this.method_to_handler = new Map();
  }

  public registerHandler<TParams, TResult>(
    handler: JsonRpcHandler<TParams, TResult>
  ): void {
    this.method_to_handler.set(handler.method, handler);
  }

  public handlerForMethod(method: string): JsonRpcHandler<any, any> | null {
    return this.method_to_handler.get(method) ?? null;
  }

  public start(): void {
    if (this.config.useSocket) {
      this.startSocketServer();
    } else {
      this.startStdioServer();
    }
  }

  private startSocketServer(): void {
    this.server = createServer(socket => {
      socket.on('data', data => {
        const response = this.handle(data.toString());
        if (response) {
          socket.write(JSON.stringify(response));
        }
      });
    });

    this.server.listen(this.config.socketPath, () => {
      console.log(`Server listening on socket ${this.config.socketPath}`);
    });
  }

  private startStdioServer(): void {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on('line', line => {
      const response = this.handle(line);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    });
  }

  private parseRequest(data: string): JsonRpcRequest<any> {
    let request: any;
    try {
      request = JSON.parse(data.toString());
    } catch (e) {
      throw new JsonRpcParseError(e);
    }

    if (requestValidator(request)) {
      return request;
    } else {
      throw new JsonRpcInvalidRequestError(request.id ?? null, requestValidator.errors);
    }
  }

  private async handleRequest(
    request: JsonRpcRequest<any>
  ): Promise<JsonRpcResponse<any> | null> {
    const handler = this.method_to_handler.get(request.method);
    if (!handler) {
      throw new JsonRpcMethodNotFoundError(request.id, request.method);
    } else if (!handler.validate(request.params)) {
      throw new JsonRpcInvalidParamsError(request.id, handler.validate.errors);
    } else {
      try {
        return await handler.handler(request);
      } catch (e) {
        if (!(e instanceof JsonRpcError)) {
          throw new JsonRpcInternalError(request.id, e);
        }
        throw e;
      }
    }
  }

  public async handle(data: string): Promise<JsonRpcResponse<any> | null> {
    try {
      const request: JsonRpcRequest<any> = this.parseRequest(data);
      return await this.handleRequest(request);
    } catch (e) {
      if (e instanceof JsonRpcError) {
        return {
          jsonrpc: '2.0',
          id: e.id,
          error: {
            code: e.code,
            message: e.message,
            data: e.data,
          },
        };
      } else {
        throw e;
      }
    }
  }
}
