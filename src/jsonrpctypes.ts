import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';

export interface JsonRpcRequest<TParams> {
  jsonrpc: string;
  method: string;
  params?: TParams;
  id?: string | number | null;
}

const requestSchema: JSONSchemaType<JsonRpcRequest<any>> = {
  type: 'object',
  properties: {
    jsonrpc: { type: 'string', const: '2.0' },
    method: {
      type: 'string',
      pattern: '^(?!rpc\\.).+', // Method names must not start with 'rpc.'
    },
    params: {
      type: 'null',
      nullable: true,
      anyOf: [{ type: 'array' }, { type: 'object' }, { type: 'null' }],
      additionalProperties: true,
    },
    id: {
      type: 'null',
      nullable: true,
      anyOf: [
        { type: 'string' },
        { type: 'integer', not: { type: 'number', multipleOf: 1.0 } }, // No fractional parts
        { type: 'null' },
      ],
    },
  },
  required: ['jsonrpc', 'method'],
  additionalProperties: false,
};

export const requestValidator: ValidateFunction<JsonRpcRequest<any>> =
  new Ajv().compile(requestSchema);

export interface JsonRpcSuccessResponse<TResult> {
  jsonrpc: '2.0';
  result: TResult;
  id: string | number;
}

export interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number | null;
}

export type JsonRpcResponse<TResult> =
  | JsonRpcSuccessResponse<TResult>
  | JsonRpcErrorResponse;

export interface JsonRpcHandler<TParams, TResult> {
  method: string;
  schema: JSONSchemaType<TParams>;
  validate: ValidateFunction<TParams>;
  handler: (request: JsonRpcRequest<TParams>) => JsonRpcResponse<TResult>;
}
