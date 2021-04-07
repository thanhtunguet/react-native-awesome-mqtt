import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AwesomeMqtt from 'react-native-awesome-mqtt';

const {
  MQTT_HOST = '192.168.28.91',
  MQTT_USER = 'RD',
  MQTT_PASS = '1',
  MQTT_TOPIC = 'HC.CONTROL',
} = process.env;

export default function App() {
  const [result] = React.useState<number>(0);

  React.useEffect(() => {
    AwesomeMqtt.createClient({
      uri: `tcp://${MQTT_HOST}:1883`,
      username: MQTT_USER,
      password: MQTT_PASS,
      clientId: 'react-native-awesome-mqtt',
      debug: true,
    }).then((client: AwesomeMqtt) => {
      console.log(client);
      client.on('connect', (data) => {
        console.log(data);
        client.message.subscribe((message) => {
          console.log(message);
        });
        client.subscribe(MQTT_TOPIC, 2);
      });
      client.on('closed', (data) => {
        console.log(data);
      });
      client.on('error', (error) => {
        console.log(error);
      });
      client.connect();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
