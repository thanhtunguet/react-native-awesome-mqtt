import { NativeModules } from 'react-native';

type AwesomeMqttType = {
  multiply(a: number, b: number): Promise<number>;
};

const { AwesomeMqtt } = NativeModules;

export default AwesomeMqtt as AwesomeMqttType;
