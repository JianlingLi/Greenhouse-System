import mqtt from 'mqtt';

const mqttClient = mqtt.connect("wss://mqtt.toytronics.com:1883", {
    username:"jili006",
    password: "77=C7l8f3o6L8ZyJ",
});

export default mqttClient;