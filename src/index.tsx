import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import urlParse from 'url-parse';
import { Subject } from 'rxjs';

declare namespace AwesomeMqtt {
  export interface ClientOptions {
    uri: string;
    clientId: string;
    username?: string;
    password?: string;
    tls?: boolean;
    debug?: boolean;
  }

  export interface ClientNativeOptions {
    protocol: 'tcp' | 'mqtt';
    host: string;
    port: number;
    user?: string;
    pass?: string;
    auth?: boolean;
    tls?: boolean;
    clientId?: string;
  }

  export type Qos = 0 | 1 | 2;

  export type ClientRef = string;

  export interface AwesomeMqttModule {
    createClient(options: AwesomeMqtt.ClientNativeOptions): Promise<ClientRef>;

    subscribe(clientRef: ClientRef, topic: string, qos?: AwesomeMqtt.Qos): void;

    unsubscribe(clientRef: ClientRef, topic: string): void;

    publish(
      clientRef: ClientRef,
      topic: string,
      message: string | object,
      qos?: AwesomeMqtt.Qos,
      retain?: boolean
    ): void;

    connect(clientRef: ClientRef): void;

    disconnect(clientRef: ClientRef): void;

    reconnect(clientRef: ClientRef): void;

    isConnected(clientRef: ClientRef): Promise<boolean>;

    isSubscribed(clientRef: ClientRef, topic: string): Promise<boolean>;

    removeClient(clientRef: ClientRef): void;

    disconnectAll(): void;
  }

  export type Promiseable<T> = T | Promise<T>;

  export type ClosedCallback = (data: NativeEvent) => Promiseable<void>;
  export type ErrorCallback = (error: Error) => Promiseable<void>;
  export type ConnectCallback = (data: NativeEvent) => Promiseable<void>;

  export interface NativeEvent {
    clientRef: ClientRef;

    event: 'connect' | 'error' | 'closed' | 'message';

    message?: any;
  }

  export interface EventHandlers {
    on(event: 'connect', callback: ConnectCallback): Promiseable<void>;

    on(event: 'error', callback: ErrorCallback): Promiseable<void>;

    on(event: 'closed', callback: ClosedCallback): Promiseable<void>;
  }
}

const AwesomeMqttModule: AwesomeMqtt.AwesomeMqttModule =
  NativeModules.AwesomeMqtt;

const emitter: NativeEventEmitter = new NativeEventEmitter(
  AwesomeMqttModule as any
);

export default class AwesomeMqtt implements AwesomeMqtt.EventHandlers {
  on(
    event: 'connect',
    callback: AwesomeMqtt.ConnectCallback
  ): AwesomeMqtt.Promiseable<void>;

  // eslint-disable-next-line no-dupe-class-members
  on(
    event: 'error',
    callback: AwesomeMqtt.ErrorCallback
  ): AwesomeMqtt.Promiseable<void>;

  // eslint-disable-next-line no-dupe-class-members
  on(
    event: 'closed',
    callback: AwesomeMqtt.ClosedCallback
  ): AwesomeMqtt.Promiseable<void>;

  // eslint-disable-next-line no-dupe-class-members
  on(
    event: 'connect' | 'error' | 'closed',
    callback:
      | AwesomeMqtt.ConnectCallback
      | AwesomeMqtt.ErrorCallback
      | AwesomeMqtt.ClosedCallback
  ): AwesomeMqtt.Promiseable<void> {
    this.eventHandlers[event] = callback;
  }

  /**
   * Default QoS is set to 2
   */
  public static readonly DEFAULT_QOS: AwesomeMqtt.Qos = 2;

  private static allClients: AwesomeMqtt[] = [];

  private static emitterSubscription: EmitterSubscription | null = null;

  /**
   * Get all clients
   */
  public static get clients(): AwesomeMqtt[] {
    return this.allClients;
  }

  /**
   * Message subject
   *
   * @type {Subject<AwesomeMqtt.NativeEvent>}
   */
  public readonly message: Subject<AwesomeMqtt.NativeEvent> = new Subject<AwesomeMqtt.NativeEvent>();

  public eventHandlers: Record<string, Function> = {};

  /**
   * Create new client
   */
  public static async createClient(
    options: AwesomeMqtt.ClientOptions
  ): Promise<AwesomeMqtt> {
    const { uri, clientId, username = '', password = '', tls, debug } = options;
    const { hostname, port } = urlParse(uri);

    const nativeOptions: AwesomeMqtt.ClientNativeOptions = {
      protocol: 'tcp',
      host: hostname ?? 'localhost',
      port: Number(port ?? 1883),
      user: username,
      pass: password,
      auth: !!(username || password),
      clientId,
      tls,
    };

    const clientRef: AwesomeMqtt.ClientRef = await AwesomeMqttModule.createClient(
      nativeOptions
    );

    if (debug) {
      console.log('Client created with options', nativeOptions);
    }

    return new AwesomeMqtt(clientRef, debug);
  }

  public get ref(): string {
    return this.clientRef;
  }

  public remove() {
    AwesomeMqttModule.removeClient(this.clientRef);
  }

  public constructor(
    private readonly clientRef: string,
    private readonly debug: boolean = false
  ) {
    AwesomeMqtt.allClients.push(this);
    if (!AwesomeMqtt.emitterSubscription) {
      AwesomeMqtt.emitterSubscription = emitter.addListener(
        'mqtt_events',
        (data: AwesomeMqtt.NativeEvent) => {
          AwesomeMqtt.clients
            .find((client) => client.clientRef === data.clientRef)
            ?.handleEvent(data);
        }
      );
    }
  }

  /**
   * Handle native event
   *
   * @param data {AwesomeMqtt.NativeEvent}
   */
  public handleEvent(data: AwesomeMqtt.NativeEvent) {
    if (this.debug) {
      console.table(data);
    }
    switch (data.event) {
      case 'message':
        this.message.next(data);
        break;

      case 'closed':
      case 'connect':
      case 'error':
        if (this.eventHandlers.hasOwnProperty(data.event)) {
          if (typeof this.eventHandlers[data.event] === 'function') {
            this.eventHandlers[data.event](data);
          }
        }
        break;

      default:
        break;
    }
  }

  /**
   * Publish message to broker
   * @param topic {string} - Topic string
   * @param message {string | object} - Message content to be string or object
   * @param qos {AwesomeMqtt.Qos} - QoS number
   * @param retain {boolean} - Message to be retained or not
   */
  public publish(
    topic: string,
    message: string | object,
    qos: AwesomeMqtt.Qos = AwesomeMqtt.DEFAULT_QOS,
    retain: boolean = false
  ): void {
    if (this.debug) {
      console.log(message);
    }
    AwesomeMqttModule.publish(this.clientRef, topic, message, qos, retain);
  }

  /**
   * Subscribe to a topic with a specific QoS
   * @param topic {string} - Topic string
   * @param qos {AwesomeMqtt.Qos} - QoS number
   */
  public subscribe(
    topic: string,
    qos: AwesomeMqtt.Qos = AwesomeMqtt.DEFAULT_QOS
  ): void {
    AwesomeMqttModule.subscribe(this.clientRef, topic, qos);
  }

  /**
   * Unsubscribe from a topic
   * @param topic {string} - Topic string
   */
  public unsubscribe(topic: string): void {
    AwesomeMqttModule.unsubscribe(this.clientRef, topic);
  }

  /**
   * Close connection
   */
  public disconnect(): void {
    AwesomeMqttModule.disconnect(this.clientRef);
  }

  /**
   * Create connection
   */
  public connect(): void {
    AwesomeMqttModule.connect(this.clientRef);
  }

  /**
   * Check if this client is connected
   */
  public isConnected(): Promise<boolean> {
    return AwesomeMqttModule.isConnected(this.clientRef);
  }

  /**
   * Check if the topic is subscribed
   */
  public isSubscribed(topic: string): Promise<boolean> {
    return AwesomeMqttModule.isSubscribed(this.clientRef, topic);
  }

  /**
   * Disconnect all client
   */
  public static disconnectAll(): void {
    AwesomeMqttModule.disconnectAll();
  }

  /**
   * Client reconnect
   */
  public reconnect(): void {
    if (Platform.OS === 'android') {
      AwesomeMqttModule.reconnect(this.clientRef);
    }
  }

  /**
   * Remove a client
   */
  public static removeClient(clientRef: AwesomeMqtt.ClientRef): void {
    const index: number = this.clients.findIndex(
      (client) => client.clientRef === clientRef
    );
    if (index >= 0) {
      this.clients.splice(index, 1);
    }
    if (this.clients.length === 0) {
      this.emitterSubscription.remove();
      this.emitterSubscription = null;
    }
    AwesomeMqttModule.removeClient(clientRef);
  }
}
