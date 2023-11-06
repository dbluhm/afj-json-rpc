export class JsonRpcServerError extends Error {
  public readonly name: string;
  public readonly code: number;
  public readonly message: string;
  public readonly data: any;

  constructor(code: number, message: string, data: any) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = this.constructor.name;
    this.code = code;
    this.message = message;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class JsonRpcParseError extends JsonRpcServerError {
  constructor(data: any) {
    super(-32700, 'Parse error', data);
  }
}

export class JsonRpcInvalidRequestError extends JsonRpcServerError {
  constructor(data: any) {
    super(-32600, 'Invalid request', data);
  }
}

export class JsonRpcMethodNotFoundError extends JsonRpcServerError {
  constructor(data: any) {
    super(-32601, 'Method not found', data);
  }
}

export class JsonRpcInvalidParamsError extends JsonRpcServerError {
  constructor(data: any) {
    super(-32602, 'Invalid params', data);
  }
}

export class JsonRpcInternalError extends JsonRpcServerError {
  constructor(data: any) {
    super(-32603, 'Internal error', data);
  }
}
