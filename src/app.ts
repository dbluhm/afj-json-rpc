import {
  JsonRpcServer,
  JsonRpcServerConfig,
  JsonRpcRequestHandler,
  schemas,
} from './jsonrpc';
import {
  InitConfig,
  Agent,
  KeyDerivationMethod,
  ConsoleLogger,
  LogLevel,
  HttpOutboundTransport,
  TrustPingEventTypes,
  BaseEvent,
  ConnectionEventTypes,
  ConnectionStateChangedEvent,
  DidExchangeState,
} from '@aries-framework/core';
import { agentDependencies, HttpInboundTransport } from '@aries-framework/node';
import { AskarModule } from '@aries-framework/askar';
import { ariesAskar } from '@hyperledger/aries-askar-nodejs';
import { triggerAndWaitForEvent } from './utils';

let agent: Agent | null;

interface InitializeParams {
  mediation_url: string;
  host: string;
  port: number;
}
interface InitializeResult {}
class Initialize extends JsonRpcRequestHandler<
  InitializeParams,
  InitializeResult
> {
  method = 'initialize';
  validate = schemas.compile<InitializeParams>({
    type: 'object',
    properties: {
      mediation_url: { type: 'string' },
      host: { type: 'string' },
      port: { type: 'number' },
    },
  });

  async handleRequest({
    mediation_url,
    host,
    port,
  }: InitializeParams): Promise<InitializeResult> {
    const key = ariesAskar.storeGenerateRawKey({});

    const config: InitConfig = {
      label: 'test-agent',
      logger: new ConsoleLogger(LogLevel.debug),
      walletConfig: {
        id: 'test',
        key: key,
        keyDerivationMethod: KeyDerivationMethod.Raw,
        storage: {
          type: 'sqlite',
          inMemory: true,
        },
      },
    };

    agent = new Agent({
      config,
      dependencies: agentDependencies,
      modules: {
        // Register the Askar module on the agent
        askar: new AskarModule({
          ariesAskar,
        }),
      },
    });

    agent.registerOutboundTransport(new HttpOutboundTransport());
    agent.registerInboundTransport(new HttpInboundTransport({ port: port }));

    agent.initialize();
    return {};
  }
}

class PingMediator extends JsonRpcRequestHandler<undefined, {}> {
  method = 'ping_mediator';
  validate = schemas.compile<undefined>({});
  async handleRequest(): Promise<{}> {
    if (!agent) {
      throw new Error('Agent not initialized');
    }

    const mediatorConnection =
      await agent?.mediationRecipient.findDefaultMediatorConnection();
    if (!mediatorConnection) {
      return {};
    }

    await triggerAndWaitForEvent(agent)
      .on(TrustPingEventTypes.TrustPingResponseReceivedEvent)
      .waitForCondition(
        (event: BaseEvent) =>
          event.payload.connectionId === mediatorConnection?.id
      )
      .triggeredBy(async () => {
        await agent?.connections.sendPing(mediatorConnection.id, {});
      })
      .wait();
    return {};
  }
}

interface ReceiveOOBInvitationParams {
  invitation: string;
}
interface OOBRecord {
  [key: string]: unknown;
}
class ReceiveOOBInvitation extends JsonRpcRequestHandler<
  ReceiveOOBInvitationParams,
  OOBRecord
> {
  method = 'receive_connection_invitation';
  validate = schemas.compile<ReceiveOOBInvitationParams>({
    type: 'object',
    properties: {
      invitation: { type: 'string' },
    },
  });
  async handleRequest({
    invitation,
  }: ReceiveOOBInvitationParams): Promise<OOBRecord> {
    if (!agent) {
      throw new Error('Agent not initialized');
    }
    console.log(invitation);
    const record = await triggerAndWaitForEvent(agent)
      .on(ConnectionEventTypes.ConnectionStateChanged)
      .waitForCondition(
        (event: BaseEvent) =>
          (event as ConnectionStateChangedEvent).payload.connectionRecord
            .state === DidExchangeState.Completed
      )
      .triggeredBy(async () => {
        return await agent?.oob.receiveInvitationFromUrl(invitation);
      })
      .wait();
    return record.toJSON();
  }
}

const SOCKET_PATH = '/tmp/json-rpc-server.sock';
const config: JsonRpcServerConfig = {
  useSocket: process.argv.includes('--use-socket'),
  socketPath: SOCKET_PATH,
};
const server = new JsonRpcServer(config);
server.registerHandler(new Initialize());
server.registerHandler(new PingMediator());
export default server;
