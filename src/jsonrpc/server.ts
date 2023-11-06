import { createServer, Server } from 'net';
import { createInterface } from 'readline';
import {
  JsonRpcHandler,
  JsonRpcRequest,
  JsonRpcResponse,
  requestValidator,
} from './types';
import { JsonRpcInvalidRequestError, JsonRpcParseError } from './errors';

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

  public start(): void {
    if (this.config.useSocket) {
      this.startSocketServer();
    } else {
      this.startStdioServer();
    }
  }

  private parseRequest(data: string): JsonRpcRequest<any> {
    let request: JsonRpcRequest<any>;
    try {
      request = JSON.parse(data.toString());
    } catch (e) {
      throw new JsonRpcParseError(e);
    }

    if (requestValidator(request)) {
      return request;
    } else {
      throw new JsonRpcInvalidRequestError(requestValidator.errors);
    }
  }

  private startSocketServer(): void {
    this.server = createServer(socket => {
      socket.on('data', data => {
        const request: JsonRpcRequest<any> = JSON.parse(data.toString());
        const response = this.handleRequest(request);
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
      const request: JsonRpcRequest<any> = JSON.parse(line);
      const response = this.handleRequest(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    });
  }

  public registerHandler<TParams, TResult>(
    handler: JsonRpcHandler<TParams, TResult>
  ): void {
    this.method_to_handler.set(handler.method, handler);
  }

  private handleRequest(
    request: JsonRpcRequest<any>
  ): JsonRpcResponse<any> | null {
    let result: any;
    let error: any = null;
    const handler = this.method_to_handler.get(request.method);
    if (!handler) {
      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      };
    } else if (!handler.validate(request.params)) {
      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        error: {
          code: -32602,
          message: `Invalid params: ${handler.validate.errors}`,
        },
      };
    } else {
      try {
        return handler.handler(request);
      } catch (e) {
        return {
          jsonrpc: '2.0',
          id: request.id ?? null,
          error: { code: -32603, message: `Unexpected error: ${e}` },
        };
      }
    }
  }
}
