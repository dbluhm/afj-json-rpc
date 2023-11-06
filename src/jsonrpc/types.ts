import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import * as schema_request from './request.schema.json';

export interface JsonRpcRequest<TParams = any> {
  jsonrpc: string;
  method: string;
  params?: TParams;
  id?: string | number | null;
}

export const requestValidator: ValidateFunction<JsonRpcRequest<any>> =
  new Ajv().compile<JsonRpcRequest<any>>(schema_request);

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
