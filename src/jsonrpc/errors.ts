export class JsonRpcError extends Error {
  public readonly name: string;
  public readonly id: string | number | null;
  public readonly code: number;
  public readonly message: string;
  public readonly data: any;

  constructor(
    id: string | number | null,
    code: number,
    message: string,
    data: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = this.constructor.name;
    this.id = id;
    this.code = code;
    this.message = message;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class JsonRpcParseError extends JsonRpcError {
  constructor(data: any) {
    super(null, -32700, 'Parse error', data);
  }
}

export class JsonRpcInvalidRequestError extends JsonRpcError {
  constructor(id: string | number | null = null, data: any) {
    super(id, -32600, 'Invalid request', data);
  }
}

export class JsonRpcMethodNotFoundError extends JsonRpcError {
  constructor(id: string | number | null = null, data: any) {
    super(id, -32601, 'Method not found', data);
  }
}

export class JsonRpcInvalidParamsError extends JsonRpcError {
  constructor(id: string | number | null = null, data: any) {
    super(id, -32602, 'Invalid params', data);
  }
}

export class JsonRpcInternalError extends JsonRpcError {
  constructor(id: string | number | null = null, data: any) {
    super(id, -32603, 'Internal error', data);
  }
}
