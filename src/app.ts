import {
  JsonRpcServer,
  JsonRpcServerConfig,
  JsonRpcRequestHandler,
  schemas,
} from './jsonrpc';

class Initialize extends JsonRpcRequestHandler<
  {
    mediation_url: string;
    host: string;
    port: number;
  },
  {}
> {
  method = 'initialize';
  validate = schemas.compile<any>({
    type: 'object',
    properties: {
      mediation_url: { type: 'string' },
      host: { type: 'string' },
      port: { type: 'number' },
    },
  });

  handleRequest(params: {
    mediation_url: string;
    host: string;
    port: number;
  }): {} {
    return {};
  }
}

const SOCKET_PATH = '/tmp/json-rpc-server.sock';
const config: JsonRpcServerConfig = {
  useSocket: process.argv.includes('--use-socket'),
  socketPath: SOCKET_PATH,
};
const server = new JsonRpcServer(config);
server.registerHandler(new Initialize());
export default server;
