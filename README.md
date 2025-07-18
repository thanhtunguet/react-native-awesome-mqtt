# React Native Awesome MQTT

A powerful and easy-to-use MQTT client for React Native. This library provides a simple and consistent API for both Android and iOS, based on the popular Paho (Android) and MQTT-Client-Framework (iOS) libraries.

[![codecov](https://codecov.io/gh/thanhtunguet/react-native-awesome-mqtt/graph/badge.svg?token=KSERW01ALZ)](https://codecov.io/gh/thanhtunguet/react-native-awesome-mqtt)

## Features

-   ✅ Supports both Android and iOS
-   ✅ Simple and consistent API
-   ✅ TLS support
-   ✅ Automatic reconnect (Android only)
-   ✅ Event-based architecture
-   ✅ RxJS support for message handling

## Installation

```sh
npm install react-native-awesome-mqtt
```

or

```sh
yarn add react-native-awesome-mqtt
```

## Usage

### Creating a client

First, you need to create an MQTT client. The `createClient` method returns a promise that resolves with a client instance.

```javascript
import AwesomeMqtt from 'react-native-awesome-mqtt';

const client = await AwesomeMqtt.createClient({
  uri: 'mqtt://test.mosquitto.org:1883',
  clientId: 'your-client-id',
});
```

### Connecting to a broker

Once you have a client instance, you can connect to the broker.

```javascript
client.connect();
```

### Publishing messages

You can publish messages to a topic with a specific QoS and retain flag.

```javascript
client.publish('your/topic', 'your-message', 2, false);
```

### Subscribing to topics

You can subscribe to a topic with a specific QoS.

```javascript
client.subscribe('your/topic', 2);
```

### Handling events

The library uses an event-based architecture to handle connection events and incoming messages.

#### Connection events

You can listen for `connect`, `error`, and `closed` events.

```javascript
client.on('connect', () => {
  console.log('connected');
});

client.on('error', (error) => {
  console.log('error', error);
});

client.on('closed', () => {
  console.log('closed');
});
```

#### Incoming messages

Incoming messages are handled using an RxJS `Subject`. You can subscribe to the `message` property to receive messages.

```javascript
client.message.subscribe(({ data }) => {
  console.log('message', data);
});
```

## API Reference

### `AwesomeMqtt` class

#### `createClient(options)`

Creates a new MQTT client.

-   `options` (object):
    -   `uri` (string): The URI of the MQTT broker (e.g., `mqtt://test.mosquitto.org:1883`).
    -   `clientId` (string): The client ID to use.
    -   `username` (string, optional): The username for authentication.
    -   `password` (string, optional): The password for authentication.
    -   `tls` (boolean, optional): Whether to use TLS.
    -   `debug` (boolean, optional): Whether to enable debug logging.

Returns a `Promise` that resolves with a `client` instance.

#### `removeClient(clientRef)`

Removes a specific client.

-   `clientRef` (string): The reference of the client to remove.

#### `disconnectAll()`

Disconnects all clients.

### `client` instance

#### `connect()`

Connects the client to the broker.

#### `disconnect()`

Disconnects the client from the broker.

#### `reconnect()` (Android only)

Reconnects the client to the broker.

#### `isConnected()`

Returns a `Promise` that resolves with a boolean indicating whether the client is connected.

#### `subscribe(topic, qos)`

Subscribes to a topic.

-   `topic` (string): The topic to subscribe to.
-   `qos` (0 | 1 | 2): The Quality of Service level.

#### `unsubscribe(topic)`

Unsubscribes from a topic.

-   `topic` (string): The topic to unsubscribe from.

#### `publish(topic, message, qos, retain)`

Publishes a message to a topic.

-   `topic` (string): The topic to publish to.
-   `message` (string | object): The message to publish.
-   `qos` (0 | 1 | 2): The Quality of Service level.
-   `retain` (boolean): Whether to set the retain flag.

#### `isSubscribed(topic)`

Returns a `Promise` that resolves with a boolean indicating whether the client is subscribed to the topic.

#### `on(event, callback)`

Registers an event handler.

-   `event` ('connect' | 'error' | 'closed'): The event to listen for.
-   `callback` (function): The event handler.

#### `message`

An RxJS `Subject` that emits incoming messages. Each message is an object with the following properties:

-   `topic` (string): The topic the message was received on.
-   `data` (string): The message payload.
-   `qos` (0 | 1 | 2): The Quality of Service level.
-   `retain` (boolean): Whether the message was retained.

## Example

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import AwesomeMqtt from 'react-native-awesome-mqtt';

const App = () => {
  const [client, setClient] = useState(null);
  const [topic, setTopic] = useState('your/topic');
  const [message, setMessage] = useState('your-message');
  const [log, setLog] = useState('');

  useEffect(() => {
    const init = async () => {
      const mqttClient = await AwesomeMqtt.createClient({
        uri: 'mqtt://test.mosquitto.org:1883',
        clientId: 'your-client-id',
      });

      mqttClient.on('connect', () => {
        setLog('connected');
        mqttClient.subscribe(topic, 2);
      });

      mqttClient.on('error', (error) => {
        setLog(`error: ${error}`);
      });

      mqttClient.on('closed', () => {
        setLog('closed');
      });

      mqttClient.message.subscribe(({ data }) => {
        setLog(`message: ${data}`);
      });

      setClient(mqttClient);
      mqttClient.connect();
    };

    init();

    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, []);

  const publish = () => {
    if (client) {
      client.publish(topic, message, 2, false);
    }
  };

  return (
    <View>
      <Text>{log}</Text>
      <TextInput value={topic} onChangeText={setTopic} />
      <TextInput value={message} onChangeText={setMessage} />
      <Button title="Publish" onPress={publish} />
    </View>
  );
};

export default App;
```