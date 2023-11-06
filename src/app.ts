import { JsonRpcServer, JsonRpcServerConfig } from './jsonrpc';

const SOCKET_PATH = '/tmp/json-rpc-server.sock';
const config: JsonRpcServerConfig = {
  useSocket: process.argv.includes('--use-socket'),
  socketPath: SOCKET_PATH,
};
const server = new JsonRpcServer(config);
server.start();
