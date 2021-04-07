# react-native-awesome-mqtt

MQTT Client for React Native

## The story
This is a port of repo [sp-react-native-mqtt](https://github.com/SudoPlz/sp-react-native-mqtt) for Typescript.

I rewrite the original repo into Typescript, with some adjustments to be compatible with my project.

Thank to the author and his work.

## Installation

```sh
yarn add react-native-awesome-mqtt rxjs
```

## Usage

```js
import AwesomeMqtt from "react-native-awesome-mqtt";
import type {Subscription} from 'rxjs';

AwesomeMqtt.createClient({
  uri: 'tcp://localhost:1883',
  username: 'user',
  password: 'pass',
  tls: false,
  clientId: 'react-native-awesome-mqtt',
})
  .then((client: AwesomeMqtt) => {
    client.on('connect', (event: AwesomeMqtt.NativeEvent) => {
      const subscription: Subscription = client.message.subscribe((message: AwesomeMqtt.NativeEvent) => {

      });
    });
    client.on('error', (event: AwesomeMqtt.NativeEvent) => {

    });
    client.on('closed', (event: AwesomeMqtt.NativeEvent) => {

    });
  });
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
