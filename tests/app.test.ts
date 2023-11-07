import Server from '../src/app';

describe('Server', () => {
  it('handles initialize', () => {
    const initialize = Server.handlerForMethod('initialize');
    console.log(initialize?.validate.schema);
    const result = Server.handle(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          mediation_url: 'mediation_url',
          host: 'host',
          port: 1234,
        },
        id: 1,
      })
    );
    expect(result).toEqual({
      jsonrpc: '2.0',
      result: {},
      id: 1,
    });
  });
});
