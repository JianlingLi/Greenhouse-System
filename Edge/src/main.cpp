#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include <Adafruit_DotStar.h>
#include <PubSubClient.h>

#include <WiFi.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_BusIO_Register.h>
#include "Adafruit_SHT31.h"
#include "Adafruit_LTR329_LTR303.h"
#include <Adafruit_LIS3DH.h>

#define HALL_SENSOR_PIN 1
#define NUMPIXELS 1
#define USE_SERIAL Serial
#define DATAPIN 33
#define CLOCKPIN 21

Adafruit_DotStar strip(NUMPIXELS, DATAPIN, CLOCKPIN, DOTSTAR_BGR);
//uint8_t loopCnt = 0;
unsigned long lastMillis = 0;
bool MagnetNearTheSensor = false;
bool testing = false; //Change to true when testing the system

// WiFi network name and password:
//const char* networkName = "Omni_lite42B178"; 
//const char* networkPswd = "face8865"; 
const char mqtt_username[] = "jili006";
const char mqtt_password[] = "77=C7l8f3o6L8ZyJ";
const char mqtt_server[] = "mqtt.toytronics.com";
const char *networkName = "LingiPhone";
const char *networkPswd = "home69791215";

const String endpoint = "https://api.openweathermap.org/data/2.5/weather?q=Oslo,no&APPID=";
const String key = "ea601f2417a1406f1e574259ccb96f9e";

// IP address to send POST data to
//const char * hostDomain = "192.168.39.114";
const char * hostDomain = "172.20.10.3";
const int hostPort = 3001;

const int LED_PIN = LED_BUILTIN;

Adafruit_SHT31 sht31 = Adafruit_SHT31();
Adafruit_LTR329 ltr = Adafruit_LTR329();
Adafruit_LIS3DH lis3dh = Adafruit_LIS3DH();

WiFiClient espClient;
PubSubClient client(espClient);

String weatherMain;
String weatherDetail;
String weatherVisibility;
String weatherWind;
float mainTemp;
float outTemp;
float mainHumi;
int visibility;
float windSpeed;
int lux;

const float conversionFactor = 0.0185;

void connectToWiFi(const char *ssid, const char *pwd)
{
  Serial.println("Connecting to WiFi network: " + String(ssid));
  WiFi.begin(ssid, pwd); // start connecting to the wifi network

  if (WiFi.status() != WL_CONNECTED)
  {
    // Blink LED while we're connecting:
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    //Serial.print("Failed to connect WiFi!");
    strip.setPixelColor(0, 255, 0, 0); // red LED to show connection problem
  }
    // If connection is lost, wait 3 econds and try connection again
    while (WiFi.status() != WL_CONNECTED) {
      delay(3000);
      Serial.print(".");
      WiFi.reconnect();
    }
  Serial.println();
  Serial.println("WiFi is connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  }

void connectMqtt(char *topic, byte *payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (unsigned int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP32Client", mqtt_username, mqtt_password)) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish("GreenHouseMonitor", "Data is successfully subscripted!");
      // ... and resubscribe
      //client.subscribe("GreenHouseMonitor/Oslo");
      break; // Connected successfully, break the loop
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 2 seconds");
      // Wait 5 seconds before retrying
      delay(2000);
    }
  }
} 

// assign the data type and value which are about to post on the server
void requestURL(const char *host, int port, float t, float h, float visible_plus_ir, float infrared, int lux, String weatherDetail, float outTemp, float mainHumi, int visibility, float windSpeed) // String weatherDetail, float mainTemp, float mainHumi, int visibility, float windSpeed
{
  Serial.println("Connecting to domain: " + String(host));

  // Use WiFiClient class to create TCP connections
  WiFiClient client;
  if (!client.connect(host, port))
  {
    Serial.println("connection failed");
    return;
  }
  Serial.println("Connected!\n");

  // Assign the value and type, which to send the POST request to the server
  String dummy = "dummy=dummy";
  String tdata = dummy + "&Temperature=" + t + "°C";
  String hdata = tdata + "&Humidity=" + h + "%";
  String vdata = hdata + "&Visible_IR=" + visible_plus_ir + " nm ";
  String idata = vdata + "&Infrared=" + infrared + " nm ";
  String ldata = idata + "&Illuminance=" + lux + " lux ";
  //String dataToSend = vdata + "&Infrared=" + infrared + " nm ";
  String edata = ldata + "&Weather=" + weatherDetail;
  String fdata = edata + "&Out_Temp=" + outTemp + " °C ";
  String gdata = fdata + "&Out_Humi=" + mainHumi + " % ";
  String bdata = gdata + "&Out_Visible=" + visibility + " km ";
  String dataToSend = bdata + "&Out_WindSpeed=" + windSpeed + " m/s ";

  int dataStringLength = dataToSend.length();
  client.print((String) "POST /Monitor HTTP/1.1\r\n" +
               "Host: " + String(host) + "\r\n" +
               "Content-Type: application/x-www-form-urlencoded\r\n" +
               "Content-Length: " + dataStringLength + "\r\n" +
               "Connection: close\r\n\r\n" +
               dataToSend);

  // If something goes wrong, we need a timeout
  unsigned long timeout = millis();
  while (client.available() == 0)
  {
    if (millis() - timeout > 5000)
    {
      Serial.println(">>> Client Timeout !");
      client.stop();
      return;
    }
  }

  // Read all the lines of the reply from server and print them to Serial
  /*while (client.available())
  {
    String line = client.readStringUntil('\r');
    Serial.print(line);
  }*/

  // When we are finished, we close the connection
  Serial.println("closing connection");
  client.stop();
}

void setup()
{
  Serial.begin(115200);
  delay(5000);
  //Connect to WiFi
  connectToWiFi(networkName, networkPswd);
  //Connect to MQTT
  client.setServer(mqtt_server, 1883);
  client.setCallback(connectMqtt);
  delay(1000);
  /*
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }*/

  while (!Serial)
    delay(10);

  // Connect to the temperature sensor
  Serial.println("Found SHT31 sensor!");
  if (!sht31.begin(0x44))
  { // Set to 0x45 for alternate i2c addr
    Serial.println("Couldn't find SHT31 sensor!");
    while (1)
      delay(1);
  }

  // Set up the light sensor
  if (!ltr.begin())
  {
    Serial.println("Couldn't find LTR sensor!");
    while (1)
      delay(10);
    //set measurement rate and integration time below
		byte integrationTime = 0x01;
		byte measurementRate = 0x03;
		byte measurement = 0x00;
    // Perform sanity checks
		if (integrationTime >= 0x07)
		{
			integrationTime = 0x00;
		}
		if (measurementRate >= 0x07)
		{
			measurementRate = 0x00;
		}
		measurement |= integrationTime << 3;
		measurement |= measurementRate;
  }
  Serial.println("Found LTR sensor!");
  ltr.setGain(LTR3XX_GAIN_4);
  ltr.setIntegrationTime(LTR3XX_INTEGTIME_50);
  ltr.setMeasurementRate(LTR3XX_MEASRATE_50);

  //Set up hall sensor
  pinMode( LED_BUILTIN, OUTPUT );
  pinMode( HALL_SENSOR_PIN, INPUT );

  /*Connect to the acceleration sensor
   if (! lis3dh.begin(0x18)) {   // change this to 0x19 for alternative i2c address
    Serial.println("Couldnt start");
    while (1) yield();
  }
  Serial.println("LIS3DH found!");

  // Adjust the sensitivity with this command
  lis3dh.setRange(LIS3DH_RANGE_4_G);   // 2, 4, 8 or 16 G!

  // Adjust how often the board should read the sensor with this command
  lis3dh.setDataRate(LIS3DH_DATARATE_50_HZ);

  Serial.print("Range = "); Serial.print(2 << lis3dh.getRange());
  Serial.println("G");*/

  // To use the LED, we need to "start it" using these methodss
  strip.begin();           // Initialize LED pins for output
  strip.setBrightness(20); // Avoid blinding yourself
  strip.show();            // Turn all LEDs off ASAP
  //Connect to MQTT broker
  reconnect();
}

void loop()
{ //Ensure again MQTT is consistent connected
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("Lost wifi connection!");
    strip.setPixelColor(0, 255, 0, 0);      // red color only 
    strip.show();                           // Update LED with new contents
    delay(1000);
  }
  else
  { 
    strip.setPixelColor(0, 0, 255, 0);      // Blink green light when WiFi is normal connected
    strip.show();                           // Update LED with new contents
    delay(1000);
    // Assign the data type to temperature reading
    float t = sht31.readTemperature();
    // Testing the temperature sensor 
    if (testing)
    {
      t = 26;
    }
    if (!isnan(t))
    {
      Serial.print("Indoor Temp. °C = ");
      Serial.print(t);
      Serial.print("\t\t");
    }
    else
    {
      Serial.println("Failed to read temperature");
    }

    // Assign the data type for humidity reading
    float h = sht31.readHumidity();
    // Testing the humidity
    if (testing)
    {
      h = 44;
    }
    if (!isnan(h))
    {
      Serial.print("Indoor Hum. % = ");
      Serial.println(h);
    }
    else
    {
      Serial.println("Failed to read humidity");
      Serial.print("\n\n");
    }

    // Assign data type for light reading
    uint16_t visible_plus_ir, infrared;
		double ratio, d0, d1;
    d0 = visible_plus_ir;
    d1 = infrared;

    byte integrationTime = 0x01;
		byte gain = 0x00;
    uint ALS_GAIN[8] = {1, 2, 4, 8, 1, 1, 48, 96};
		float ALS_INT[8] = {1.0, 0.5, 2.0, 4.0, 1.5, 2.5, 3.0, 3.5};
   
    if (ltr.newDataAvailable())
    {
      bool valid = ltr.readBothChannels(visible_plus_ir, infrared);
      if (valid)
      {
        Serial.print("Visible + IR nm: ");
        Serial.print(visible_plus_ir);
        Serial.print("\t\tInfrared nm: ");
        Serial.println(infrared);
      }
      
      // Testing the light sensor data
      if (testing)
      {
        visible_plus_ir = 1000;
        infrared = 1000;
      }
    // Calculate the lux
    ratio = d1 / (d0 + d1);
    if (ratio < 0.45)
		{
			lux = ((1.7743 * d0) + (1.1059 * d1)) / ALS_GAIN[gain] / ALS_INT[integrationTime];
		}
		else if (ratio < 0.64)
		{
			lux = ((4.2785 * d0) - (1.9548 * d1)) / ALS_GAIN[gain] / ALS_INT[integrationTime];
		}
		else if (ratio < 0.85)
		{
			lux = ((0.5926 * d0) + (0.1185 * d1)) / ALS_GAIN[gain] / ALS_INT[integrationTime];
		}
		else
    {
      lux = 0;
    };

    float par = lux * conversionFactor;
    Serial.print("Illuminance lux = ");
    Serial.println(lux);
    Serial.print("PAR µmol/m²/s = ");
    Serial.println(par);
    };

  // Ensure ESP32 consistent connection to MQTT broker
  reconnect();
  // Publish a message to a topic every 5 second.
  if (millis() - lastMillis > 250)
    lastMillis = millis();

  /*Synchronize ESP32 sensor data on MQTT
  client.publish("GreenHouseMonitor/Oslo/Temperature", (String(t)+" °C").c_str());
  client.publish("GreenHouseMonitor/Oslo/Humidity", (String(h)+" %").c_str());
  client.publish("GreenHouseMonitor/Oslo/Visible_IR", (String(visible_plus_ir)+" nm").c_str());
  client.publish("GreenHouseMonitor/Oslo/Infrared", (String(infrared)+" nm").c_str());
  client.publish("GreenHouseMonitor/Oslo/Illuminance", (String(lux)+" lux").c_str());*/
  // Publish sensor data to MQTT
  String payload = "{";
  payload += "\"Temperature\": " + String(t) + ",";
  payload += "\"Humidity\": " + String(h) + ",";
  payload += "\"Visible_IR\": " + String(visible_plus_ir) + ",";
  payload += "\"Infrared\": " + String(infrared) + ",";
  payload += "\"Illuminance\": " + String(lux);
  payload += "}";

client.publish("GreenHouseMonitor/Oslo", payload.c_str());
//client.publish("GreenHouseMonitor/Asker", payload.c_str());
//client.publish("GreenHouseMonitor/Bergen", payload.c_str());

  //Bound the time frequency to send the data to MongoDB database
  int nextTimeToCheck;
  if ( millis() > nextTimeToCheck) {
    nextTimeToCheck = millis() + (10*60*1000);

    if ((WiFi.status() == WL_CONNECTED))
    { 
      HTTPClient http;
      // Serial.print("[HTTP] begin...\n");
      //  configure traged server and url
      // http.begin("https://www.howsmyssl.com/a/check", ca); //HTTPS
      http.begin("https://api.openweathermap.org/data/2.5/weather?q=Oslo,no&APPID=ea601f2417a1406f1e574259ccb96f9e"); // HTTP
      // start connection and send HTTP header
      int httpCode = http.GET();

      // httpCode will be negative on error
      if (httpCode > 0)
      {
        if (httpCode == HTTP_CODE_OK)
        { // file found at server
          String payload = http.getString();
          // USE_SERIAL.println(payload);

          // Parse JSON object
          const size_t capacity = payload.length() * 2;
          DynamicJsonDocument doc(capacity);
          DeserializationError error = deserializeJson(doc, payload);
          if (error)
          {
            Serial.print(F("deserializeJson() failed with code "));
            Serial.println(error.f_str());
          }
          else
          {
            weatherMain = doc["weather"][0]["main"].as<String>();
            weatherDetail = doc["weather"][0]["description"].as<String>();
            weatherVisibility = doc["weather"][0]["visibility"].as<String>();
            weatherWind = doc["weather"][0]["wind"].as<String>();
            mainTemp = doc["main"]["temp"];
            mainHumi = doc["main"]["humidity"];
            visibility = doc["visibility"];
            windSpeed = doc["wind"]["speed"];
            outTemp = mainTemp - 273.15;

            USE_SERIAL.print("The Weather is: ");
            USE_SERIAL.print(weatherMain);
            USE_SERIAL.print(", ");
            USE_SERIAL.println(weatherDetail);
            USE_SERIAL.print("Outdoor temperature °C =  ");
            USE_SERIAL.println(outTemp);
            USE_SERIAL.print("Outdoor humidity % =  ");
            USE_SERIAL.println(mainHumi);
            USE_SERIAL.print("Outdoor visibility km =  ");
            USE_SERIAL.println(visibility);
            USE_SERIAL.print("Outdoor wind speed m/s =  ");
            USE_SERIAL.println(windSpeed);
          }
          USE_SERIAL.println();
        }

        // HTTP header has been send and Server response header has been handled
        // USE_SERIAL.printf("[HTTP] GET... code: %d\n", httpCode);
        String payload = http.getString();
        Serial.println(httpCode);
        Serial.println(payload);
      }
      else
      {
        USE_SERIAL.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
        // Serial.println("Error on HTTP request");
      }

      // wait for WiFi connection
      
      requestURL(hostDomain, hostPort, t, h, visible_plus_ir, infrared, lux, weatherDetail, outTemp, mainHumi, visibility, windSpeed);
      http.end();
  }

    // Set up the alarm light for Temperature t, Tumidity h, Visible + IR and Infrared
    // Meanwhile,  trigger the alert system
    if (visible_plus_ir < 380 || infrared < 700)
    {
      Serial.println("ALERT: Insufficient light source in the Green House!\n");
      strip.setPixelColor(0, 255, 255, 255); // white color only
      strip.show(); // Update LED with new contents
      delay(1000);  // wait a second
      // digitalWrite(13, LOW);
    }

    if (t > 27)
    {
      Serial.println("ALERT: Hight temperature in the Green House!\n");
      // requestURL(hostDomain, hostPort, t, h, visible_plus_ir, infrared);
      // pinMode(13, OUTPUT);
      strip.setPixelColor(0, 255, 0, 0); // red only
      strip.show();                           // Update LED with new contents
      delay(1000);                            // wait a second
      // Turn on the sensor LED to indicate the alert
      digitalWrite(13, HIGH);
    }

    if (h < 40)
    {
      Serial.println("ALERT: Low humidity in the Green House!\n");
      strip.setPixelColor(0, 0, 0, 255);    // blue only
      strip.show(); // Update LED with new contents
      delay(1000);  // wait a second
    }
    
    else 
    {
      Serial.println("Pefect temperature, humidity and light source in the Green House!\n");
      strip.setPixelColor(0, 0, 255, 0);        // green only
      strip.show();                             // Update LED with new contents
      delay(1000);                              // wait a second
    };

  MagnetNearTheSensor = digitalRead( HALL_SENSOR_PIN );
  digitalWrite( LED_BUILTIN, !MagnetNearTheSensor );
  
  // Publish sensor data to MQTT
  //String payload = "{\"Temperature":" + String(t) + ",\"Humidity\":" + String(h) + ",\"Visible_IR\":" + String(visible_plus_ir) + ",\"Infrared\":" + String(infrared) + ",\"Illuminance\":" + String(lux) + ",\"Weather\":\"" + weatherDetail + "\",\"Out_Temp\":" + String(outTemp) + ",\"Out_Humi\":" + String(mainHumi) + ",\"Out_Visible\":" + String(visibility) + ",\"Out_WindSpeed\":" + String(windSpeed) + "}";
  /*client.publish("GreenHouseMonitor/Oslo/Weather", weatherDetail.c_str());
  client.publish("GreenHouseMonitor/Oslo/Out_Temp", (String(outTemp) + " °C").c_str());
  client.publish("GreenHouseMonitor/Oslo/Out_Humi", (String(mainHumi) + " %").c_str());
  client.publish("GreenHouseMonitor/Oslo/Out_Visible", (String(visibility) + " km").c_str());
  client.publish("GreenHouseMonitor/Oslo/Out_WindSpeed", (String(windSpeed) + " m/s").c_str());*/
  /*char attributes[1000];
  payload.toCharArray(attributes, 1000);
  client.publish("GreenHouseMonitor/Oslo", attributes);*/

  delay(3000);
  }
}}