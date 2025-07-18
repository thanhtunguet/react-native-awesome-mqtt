/* eslint-disable no-void */
import { NativeEventEmitter, Platform } from 'react-native';
import AwesomeMqtt from '../';

let mockEmitter: NativeEventEmitter;

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.AwesomeMqtt = {
    createClient: jest.fn(async () => 'client-ref-1'),
    removeClient: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    disconnectAll: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    publish: jest.fn(),
    reconnect: jest.fn(),
    isConnected: jest.fn(async () => false),
    isSubscribed: jest.fn(async () => false),
    getTopics: jest.fn(async () => []),
    // Mock addListener/removeListeners for NativeEventEmitter
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };

  RN.NativeEventEmitter = jest.fn(
    (nativeModule) => new RN.EventEmitter(nativeModule)
  );

  RN.Platform = {
    OS: 'android',
  };

  return RN;
});

const AwesomeMqttModule = require('react-native').NativeModules.AwesomeMqtt;

describe('AwesomeMqtt', () => {
  beforeEach(() => {
    mockEmitter = new NativeEventEmitter(AwesomeMqttModule);
  });
  afterEach(() => {
    jest.clearAllMocks();
    AwesomeMqtt.clients.length = 0;
    if (AwesomeMqtt.emitterSubscription) {
      AwesomeMqtt.emitterSubscription.remove();
      AwesomeMqtt.emitterSubscription = null;
    }
  });

  it('should create a client', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
    expect(AwesomeMqttModule.createClient).toHaveBeenCalledWith({
      protocol: 'tcp',
      host: 'localhost',
      port: 1883,
      user: '',
      pass: '',
      auth: false,
      clientId: 'test-client',
      tls: undefined,
    });
    expect(client).toBeInstanceOf(AwesomeMqtt);
    expect(client.ref).toBe('client-ref-1');
    expect(AwesomeMqtt.clients).toHaveLength(1);
  });

  it('should connect a client', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
    client.connect();
    expect(AwesomeMqttModule.connect).toHaveBeenCalledWith('client-ref-1');
  });

  it('should disconnect a client', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
    client.disconnect();
    expect(AwesomeMqttModule.disconnect).toHaveBeenCalledWith('client-ref-1');
  });

  it('should check if client is connected', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
    void client.isConnected();
    expect(AwesomeMqttModule.isConnected).toHaveBeenCalledWith('client-ref-1');
  });

  it('should subscribe to a topic', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
    client.subscribe('test/topic', 2);
    expect(AwesomeMqttModule.subscribe).toHaveBeenCalledWith(
      'client-ref-1',
      'test/topic',
      2
    );
  });

  it('should unsubscribe from a topic', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
    client.unsubscribe('test/topic');
    expect(AwesomeMqttModule.unsubscribe).toHaveBeenCalledWith(
      'client-ref-1',
      'test/topic'
    );
  });

  it('should publish a message', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
    client.publish('test/topic', 'hello', 1, true);
    expect(AwesomeMqttModule.publish).toHaveBeenCalledWith(
      'client-ref-1',
      'test/topic',
      'hello',
      1,
      true
    );
  });

  it('should handle incoming messages', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });

    const messagePromise = new Promise((resolve) => {
      client.message.subscribe((msg) => {
        resolve(msg);
      });
    });

    mockEmitter.emit('mqtt_events', {
      clientRef: 'client-ref-1',
      event: 'message',
      message: {
        topic: 'test/topic',
        data: 'hello',
      },
    });

    await expect(messagePromise).resolves.toEqual({
      clientRef: 'client-ref-1',
      event: 'message',
      message: {
        topic: 'test/topic',
        data: 'hello',
      },
    });
  });

  it('should handle connect event', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });

    const connectPromise = new Promise((resolve) => {
      client.on('connect', (data) => {
        resolve(data);
      });
    });

    mockEmitter.emit('mqtt_events', {
      clientRef: 'client-ref-1',
      event: 'connect',
    });

    await expect(connectPromise).resolves.toEqual({
      clientRef: 'client-ref-1',
      event: 'connect',
    });
  });

  it('should handle error event', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });

    const errorPromise = new Promise((resolve) => {
      client.on('error', (data) => {
        resolve(data);
      });
    });

    mockEmitter.emit('mqtt_events', {
      clientRef: 'client-ref-1',
      event: 'error',
    });

    await expect(errorPromise).resolves.toEqual({
      clientRef: 'client-ref-1',
      event: 'error',
    });
  });

  it('should handle closed event', async () => {
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });

    const closedPromise = new Promise((resolve) => {
      client.on('closed', (data) => {
        resolve(data);
      });
    });

    mockEmitter.emit('mqtt_events', {
      clientRef: 'client-ref-1',
      event: 'closed',
    });

    await expect(closedPromise).resolves.toEqual({
      clientRef: 'client-ref-1',
      event: 'closed',
    });
  });

  it('should remove a client', async () => {
    await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
    AwesomeMqtt.removeClient('client-ref-1');
    expect(AwesomeMqttModule.removeClient).toHaveBeenCalledWith('client-ref-1');
    expect(AwesomeMqtt.clients).toHaveLength(0);
  });

  it('should disconnect all clients', () => {
    AwesomeMqtt.disconnectAll();
    expect(AwesomeMqttModule.disconnectAll).toHaveBeenCalled();
  });

  it('should reconnect a client on android', async () => {
    Platform.OS = 'android';
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
    client.reconnect();
    expect(AwesomeMqttModule.reconnect).toHaveBeenCalledWith('client-ref-1');
  });

  it('should not reconnect a client on ios', async () => {
    Platform.OS = 'ios';
    const client = await AwesomeMqtt.createClient({
      uri: 'mqtt://localhost:1883',
      clientId: 'test-client',
    });
    client.reconnect();
    expect(AwesomeMqttModule.reconnect).not.toHaveBeenCalled();
  });
});
