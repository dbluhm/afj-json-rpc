import {
  InitConfig,
  Agent,
  KeyDerivationMethod,
  ConsoleLogger,
  LogLevel,
  HttpOutboundTransport,
} from "@aries-framework/core";
import { agentDependencies, HttpInboundTransport } from "@aries-framework/node";
import { AskarModule } from "@aries-framework/askar";
import { ariesAskar } from "@hyperledger/aries-askar-nodejs";

const key = ariesAskar.storeGenerateRawKey({});

const config: InitConfig = {
  label: "docs-agent-nodejs",
  logger: new ConsoleLogger(LogLevel.debug),
  walletConfig: {
    id: "wallet-id",
    key: key,
    keyDerivationMethod: KeyDerivationMethod.Raw,
    storage: {
      type: "sqlite",
      inMemory: true,
    },
  },
};

const agent = new Agent({
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
agent.registerInboundTransport(new HttpInboundTransport({ port: 3001 }));

agent.initialize();
