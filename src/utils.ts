import { BaseEvent, Agent } from '@aries-framework/core';

const TIMEDOUT = Symbol('TIMEDOUT');
export async function waitFor<TResult>(
  promise: Promise<TResult>,
  timeout: number = 2 * 60000
): Promise<TResult> {
  const delay = new Promise<typeof TIMEDOUT>((resolve, reject) => {
    setTimeout(resolve, timeout, TIMEDOUT);
  });
  const value = await Promise.race<TResult | typeof TIMEDOUT>([promise, delay]);
  if (value === TIMEDOUT) {
    throw new Error(`Timeout after ${timeout}ms`);
  }
  return value;
}

export class AsyncEvent {
  private isSet: boolean;
  private resolve: (() => void) | null;

  constructor() {
    this.isSet = false;
    this.resolve = null;
  }

  // Wait for the event to be set
  // Only supports one waiting function at a time
  public wait(): Promise<void> {
    if (this.isSet) {
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      this.resolve = resolve;
    });
  }

  // Set the event and resolve any waiting promises
  public set(): void {
    this.isSet = true;
    if (this.resolve) {
      this.resolve();
    }
  }

  // Reset the event
  public clear(): void {
    this.isSet = false;
  }
}

async function _triggerAndWaitforEvent(
  agent: Agent,
  event: string,
  condition: (data: BaseEvent) => boolean | Promise<boolean>,
  trigger: () => any | Promise<any>,
  timeout?: number
): Promise<any> {
  const deferred = new AsyncEvent();
  const listener = async (data: BaseEvent) => {
    if (await condition(data)) {
      agent.events.off(event, listener);
      deferred.set();
    }
  };
  agent.events.on(event, listener);
  try {
    const result = await trigger();
    await waitFor(deferred.wait(), timeout);
    return result;
  } catch (e) {
    agent.events.off(event, listener);
    throw e;
  }
}

class TriggerAndWaitForEvent {
  private agent: Agent;
  private event: string | undefined = undefined;
  private condition:
    | ((data: BaseEvent) => boolean | Promise<boolean>)
    | undefined;
  private trigger: (() => any | Promise<any>) | undefined;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  on(event: string) {
    this.event = event;
    return this;
  }

  waitForCondition(condition: (data: BaseEvent) => boolean | Promise<boolean>) {
    this.condition = condition;
    return this;
  }

  triggeredBy(trigger: () => any | Promise<any>) {
    this.trigger = trigger;
    return this;
  }

  async waitFor(timeout?: number): Promise<any> {
    if (this.event === undefined) {
      throw new Error('Event not set');
    }
    if (this.condition === undefined) {
      throw new Error('Condition not set');
    }
    if (this.trigger === undefined) {
      throw new Error('Trigger not set');
    }
    return _triggerAndWaitforEvent(
      this.agent,
      this.event,
      this.condition,
      this.trigger,
      timeout
    );
  }

  async wait(): Promise<any> {
    return this.waitFor();
  }
}

export function triggerAndWaitForEvent(agent: Agent): TriggerAndWaitForEvent {
  return new TriggerAndWaitForEvent(agent);
}
