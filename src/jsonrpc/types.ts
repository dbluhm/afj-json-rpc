import { ValidateFunction } from 'ajv';
import schemas from './schemas';
import * as schema_request from './request.schema.json';
import { JsonRpcInvalidRequestError } from './errors';

export interface JsonRpcRequest<TParams = any> {
  jsonrpc: string;
  method: string;
  params?: TParams;
  id?: string | number | null;
}

export const requestValidator: ValidateFunction<JsonRpcRequest<any>> =
  schemas.compile<JsonRpcRequest<any>>(schema_request);

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
  validate: ValidateFunction<TParams>;
  handler: (
    request: JsonRpcRequest<TParams>
  ) => Promise<JsonRpcResponse<TResult>> | JsonRpcResponse<TResult> | null;
}

export abstract class JsonRpcRequestHandler<TParams, TResult>
  implements JsonRpcHandler<TParams, TResult>
{
  abstract method: string;
  abstract validate: ValidateFunction<TParams>;
  async handler(
    request: JsonRpcRequest<TParams>
  ): Promise<JsonRpcResponse<TResult>> {
    if (!request.id) {
      throw new JsonRpcInvalidRequestError(request.id, 'id is required');
    }
    const result = await this.handleRequest(request.params);
    return {
      jsonrpc: '2.0',
      result: result,
      id: request.id,
    };
  }
  abstract handleRequest(params?: TParams): Promise<TResult>;
}

export abstract class JsonRpcNotificationHandler<TParams>
  implements JsonRpcHandler<TParams, void>
{
  abstract method: string;
  abstract validate: ValidateFunction<TParams>;
  abstract handler(request: JsonRpcRequest<TParams>): null;
}
