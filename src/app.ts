import { createServer, Server } from 'net';
import { createInterface } from 'readline';

interface JsonRpcRequest<TParams> {
  jsonrpc: string;
  method: string;
  params: TParams;
  id?: string | number | null;
}

interface JsonRpcSuccessResponse<TResult> {
  jsonrpc: '2.0';
  result: TResult;
  id: string | number;
}

interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number | null;
}

type JsonRpcResponse<TResult> =
  | JsonRpcSuccessResponse<TResult>
  | JsonRpcErrorResponse;

class JsonRpcServer {
  private server: Server | null = null;
  private socketPath: string;

  constructor(socketPath: string) {
    this.socketPath = socketPath;
  }

  public start(): void {
    if (process.argv.includes('--use-socket')) {
      this.startSocketServer();
    } else {
      this.startStdioServer();
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

    this.server.listen(this.socketPath, () => {
      console.log(`Server listening on socket ${this.socketPath}`);
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

  private handleRequest(
    request: JsonRpcRequest<any>
  ): JsonRpcResponse<any> | null {
    if (!request.id) {
      console.log('Notification:', request.method, request.params);
      return null;
    }

    let result: any;
    let error: any = null;
    switch (request.method) {
      case 'sayHello':
        result = `Hello, ${request.params.name}!`;
        break;
      default:
        error = { code: -32601, message: 'Method not found' };
        break;
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result,
      error,
    };
  }
}

const SOCKET_PATH = '/tmp/json-rpc-server.sock';
const server = new JsonRpcServer(SOCKET_PATH);
server.start();
