import "./App.css";
import { useEffect,useState, React } from "react";
import Chart from "react-apexcharts";
import axios from "axios";
import mqtt from "mqtt/dist/mqtt";

const mqtt_server = "ws://mqtt.toytronics.com:8883/mqtt"; 
const mqtt_username = "jili006";
const mqtt_password = "77=C7l8f3o6L8ZyJ";

let subscribed = false;
const mqtt_options = {
  username: mqtt_username,
  password: mqtt_password,
};

function App() {
  let TemperatureSeriesArray = [];
  let HumiditySeriesArray = [];
  let Visible_IRSeriesArray = [];
  let InfraredSeriesArray = [];
  let LuxSeriesArray = [];

  const [temperatureSeries, setTemperatureSeries] = useState([]);
  const [humiditySeries, setHumiditySeries] = useState([]);
  const [visibleIRSeries, setVisibleIRSeries] = useState([]);
  const [infraredSeries, setInfraredSeries] = useState([]);
  const [luxSeries, setLuxSeries] = useState([]);
  const [hours, setHours] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const currentTime = new Date();
  const [dataSeries, setDataSeries] = useState([]);
  const [maxMeasurements, setMaxMeasurements] = useState(50);

  // Updates the data series
  const updateData = () => {
    setDataSeries([
      {
        name: "Temperature",
        data: temperatureSeries,
      },
      {
        name: "Humidity",
        data: humiditySeries,
      },
      {
        name: "Visible_IR",
        data: visibleIRSeries,
      },
      {
        name: "Infrared",
        data: infraredSeries,
      },
      {
        name: "Illuminance",
        data: luxSeries,
      },
    ]);
  };

  const [location, setLocation] = useState("Oslo");

  const handleLocationChange = (event) => {
    setLocation(event.target.value);
  };

  const formattedDate = currentTime.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString();

  const calculateHourlyAverages = (data, hours) => {
    const hourlySums = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);
    const hourlyAverages = new Array(24).fill(0);

    data.forEach((value, index) => {
      const hour = hours[index];
      hourlySums[hour] += value;
      hourlyCounts[hour]+=1;
    });

    for (let i = 0; i < 24; i++) {
      if (hourlyCounts[i] > 0) {
        hourlyAverages[i] = hourlySums[i] / hourlyCounts[i];
      }
    }
    return hourlyAverages;
  };

/*
  //Create a function to fetch the latest data from MongoDB
  useEffect(() => {
    const fetchLatesData = () => {
      fetch("http://localhost:3001/Monitor/latest/1?location=${location}")
        .then((response) => response.json())
        .then((latest) => {
          setLatestData(latest[0]);
          console.log(latestData);
      });
    }
    // Fetch the data when the component mounts
    fetchLatesData();

    // Set up an interval to fetch the data periodically (e.g., every 1 minutes)
    const intervalId = setInterval(fetchLatesData, 10 * 1000);

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [location]);*/

  // Upon loading the page, load in data from endpoint that store last 24 hours data in the server
  useEffect(() => {
    fetch("http://localhost:3001/Monitor/last24Hours/:location")
      .then((response) => response.json())
      .then((hourly) => {
        console.log("Hourly data:", hourly);
        //setLatestData(hourly);
      
        const Temperature = hourly.map((item) => parseFloat(item.Temperature));
        const Humidity = hourly.map((item) => parseFloat(item.Humidity));
        const Visible_IR = hourly.map((item) => parseFloat(item.Visible_IR));
        const Infrared = hourly.map((item) => parseFloat(item.Infrared));
        const Lux = hourly.map((item) => parseFloat(item.Illuminance));
        const Hours = hourly.map((item) => new Date(item.modifiedDate).getHours());

        const avgTemperature = calculateHourlyAverages(Temperature, hours);
        const avgHumidity = calculateHourlyAverages(Humidity, hours);
        const avgVisible_IR = calculateHourlyAverages(Visible_IR, hours);
        const avgInfrared = calculateHourlyAverages(Infrared, hours);
        const avgLux = calculateHourlyAverages(Lux, hours);

        setTemperatureSeries([{ name: "Temperature", data: Temperature }]);
        setHumiditySeries([{ name: "Humidity", data: Humidity }]);
        setVisibleIRSeries([{ name: "Visible_IR", data: Visible_IR }]);
        setInfraredSeries([{ name: "Infrared", data: Infrared }]);
        setLuxSeries([{ name: "Lux", data: Lux }]);
      });
      TemperatureSeriesArray = [];
      HumiditySeriesArray = [];
      Visible_IRSeriesArray = [];
      InfraredSeriesArray = [];
      LuxSeriesArray = [];
  }, [location]);

  useEffect(() => {
    console.log("Connect!");
    const client = mqtt.connect(mqtt_server, mqtt_options);
    client.on("connect", () => {
      // This will be executed twice in debug mode unless we do this trick
      if (!subscribed) {
        subscribed = true;
        console.log("Connected");
        client.subscribe("GreenHouseMonitor/Oslo");
        //client.subscribe("GreenHouseMonitor/Asker");
        //client.subscribe("GreenHouseMonitor/Bergen");
        client.on("message", (topic, payload, packet) => {
          handleMessage(topic, payload);
        });
      }
    });
  }, []);

  // if "temperatureSeries" is updated, we should also update the graph data, and the same for other data
  useEffect(() => {
    updateData();
  }, [temperatureSeries]);

  useEffect(() => {
    updateData();
  }, [humiditySeries]);

  useEffect(() => {
    updateData();
  }, [visibleIRSeries]);

  useEffect(() => {
    updateData();
  }, [infraredSeries]);

  useEffect(() => {
    updateData();
  }, [luxSeries]);

  const baseOptions = {
    chart: {
      height: 350,
      type: "area",
    },
    dataLabels: {
      enabled: true,
    },
    stroke: {
      curve: "smooth",
    },
    noData: {
      text: "Loading...",
    },
    xaxis: {
      //categories: Array.from({ length: 24 }, (_, i) => i.toString().padStart(0, "3")),
      categories: ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23'],
      tickPlacement: 'on',
      title: {
        text: "Latest 24 Hours",
      },
      min: 0,
      max: 24,
    },
    yaxis: {
      title: {
        text: "",
      },
    },
  };

  const handleMessage = (GreenHouseMonitor, message) => {
    console.log("Received MQTT message: ", message.toString());
    let jsonData = JSON.parse(message);
    //Store the latest data in local storage to retrieve the latest data when the webpage is refreshed
    localStorage.setItem("latestData", JSON.stringify(jsonData));
    setLatestData(jsonData);

    TemperatureSeriesArray.push(jsonData.Temperature);
    if (TemperatureSeriesArray.length > maxMeasurements) {
      TemperatureSeriesArray.splice(0, 1);
    }
    HumiditySeriesArray.push(jsonData.Humidity);
    if (HumiditySeriesArray.length > maxMeasurements) {
      HumiditySeriesArray.splice(0, 1);
    }
    Visible_IRSeriesArray.push(jsonData.Visible_IR);
    if (Visible_IRSeriesArray.length > maxMeasurements) {
      Visible_IRSeriesArray.splice(0, 1);
    }
    InfraredSeriesArray.push(jsonData.Infrared);
    if (InfraredSeriesArray.length > maxMeasurements) {
      InfraredSeriesArray.splice(0, 1);
    }
    LuxSeriesArray.push(jsonData.Illuminance);
    if (LuxSeriesArray.length > maxMeasurements) {
      LuxSeriesArray.splice(0, 1);
    }

    setTemperatureSeries((prevSeries) => {
      return [{ name: "Temperature", data: [...prevSeries[0].data, ...TemperatureSeriesArray] }];
    });
    setHumiditySeries((prevSeries) => {
      return [{ name: "Humidity", data: [...prevSeries[0].data, ...HumiditySeriesArray] }];
    });
    setVisibleIRSeries((prevSeries) => {
      return [{ name: "Visible_IR", data: [...prevSeries[0].data, ...Visible_IRSeriesArray] }];
    });
    setInfraredSeries((prevSeries) => {
      return [{ name: "Infrared", data: [...prevSeries[0].data, ...InfraredSeriesArray] }];
    });
    setLuxSeries((prevSeries) => {
      return [{ name: "Lux", data: [...prevSeries[0].data, ...LuxSeriesArray] }];
    });
  };
  // Retrieve the latest data from local storage when the component is mounted
  useEffect(() => {
    const storedLatestData = localStorage.getItem("latestData");
    if (storedLatestData) {
      setLatestData(JSON.parse(storedLatestData));
    }
    // Rest of the useEffect function...
  }, []);  

    const temperatureOptions = { 
      ...baseOptions,
      title: {
        text: `Temperature - ${latestData ? latestData.Temperature + " °C": "N/A"}`,
        align: "center",
        margin: 20,
        style: {
          fontSize: "24px",
        },
      },
      xaxis: {
        ...baseOptions.xaxis,
        title: {
          text: "Latest 24 Hours",
        },
      },
      yaxis: {
        title: {
          text: "Temperature (°C)",
        },
      },
    };

    const humidityOptions = { 
      ...baseOptions,
      title: {
        text: `Humidity -  ${latestData ? latestData.Humidity + " %": "N/A"}`,
        align: "center",
        margin: 20,
        style: {
          fontSize: "24px",
        },
      },
      xaxis: {
        ...baseOptions.xaxis,
        title: {
          text: "Latest 24 Hours",
        },
      },
      yaxis: {
        title: {
          text: "Humidity (%)",
        },
      },
    };

    const visibleIROptions = { 
      ...baseOptions,
      title: {
        text: `Visible + IR -  ${latestData ? latestData.Visible_IR + " nm": "N/A"}`,
        align: "center",
        margin: 20,
        style: {
          fontSize: "24px",
        },
      },
      xaxis: {
        ...baseOptions.xaxis,
        title: {
          text: "Latest 24 Hours",
        },
      },
      yaxis: {
        title: {
          text: "Visible + IR (nm)",
        },
      },
    };

    const infraredOptions = { 
      ...baseOptions,
      title: {
        text: `Infrared - ${latestData ? latestData.Infrared + " nm": "N/A"}`,
        align: "center",
        margin: 20,
        style: {
          fontSize: "24px",
        },
      },
      xaxis: {
        ...baseOptions.xaxis,
        title: {
          text: "Latest 24 Hours",
        },
      },
      yaxis: {
        title: {
          text: "Infrared (nm)",
        },
      },
    };

    const luxOptions = { 
      ...baseOptions,
      title: {
        text: `Illuminance - ${latestData ? latestData.Illuminance +" lux": "N/A"}`,
        align: "center",
        margin: 20,
        style: {
          fontSize: "24px",
        },
      },
      xaxis: {
        ...baseOptions.xaxis,
        title: {
          text: "Latest 24 Hours",
        },
      },
      yaxis: {
        title: {
          text: "Illuminance (lux)",
        },
      },
    };
  
  const getAlarmColor = () => {
    if (latestData) {
      const temperature = parseFloat(latestData.Temperature);
      const humidity = parseFloat(latestData.Humidity);
      const lux = parseFloat(latestData.Illuminance);

      console.log("Parsed data:", { temperature, humidity, lux });
      if (latestData.Temperature > 27) {
        console.log("Temperature alarm");
        return "red";
      } else if (latestData.Humidity < 40) {
        console.log("Humidity alarm");
        return "blue";
      } else if (latestData.lux < 1000) {
        console.log("Illuminance alarm");
        return "orange";
      } 
    }
    console.log("No alarm");
    return "green";
  };

    return (
      <div className="App">
        <h1>Green House Monitor System</h1>
        <h2>{formattedDate}</h2>
        <h3>{formattedTime}</h3>
        <h4>Select the location</h4>
        <select value={location} onChange={handleLocationChange} className="location-select">
          <option value="Oslo">Oslo</option>
          <option value="Asker">Asker</option>
          <option value="Bergen">Bergen</option>
        </select>

        <div class="graphs-bucket">
        <div class="bucket">
          <div className="alarm-light" style={{ backgroundColor: getAlarmColor() }}></div>
          <div className="chart-container">
            <Chart options={temperatureOptions} series={temperatureSeries} type="area" height={350} />
          </div>
        </div>
        
        <div class="bucket">
          <div className="alarm-light" style={{ backgroundColor: getAlarmColor() }}></div>
          <div className="chart-container">
            <Chart options={humidityOptions} series={humiditySeries} type="area" height={350} />
          </div>
        </div>
        
        <div class="bucket">
          <div className="alarm-light" style={{ backgroundColor: getAlarmColor() }}></div>
          <div className="chart-container">
            <Chart options={luxOptions} series={luxSeries} type="area" height={350} />
          </div>
        </div>

        <div className="chart-container" class="bucket">
          <Chart options={visibleIROptions} series={visibleIRSeries} type="area" height={350} />
        </div>
        <div className="chart-container" class="bucket">
          <Chart options={infraredOptions} series={infraredSeries} type="area" height={350} />
        </div>

        
        </div>
      </div>
    );
}  

export default App;