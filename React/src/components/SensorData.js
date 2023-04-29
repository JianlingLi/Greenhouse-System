import { useState, React, useEffect } from "react";
import axios from 'axios';

import Temperature from './Temperature';
import Humidity from './Humidity';
import VisibleIR from './VisibleIR';
import Infrared from './Infrared';
import SensorChart from "./SensorChart";

const SensorData = () => {
  const [sensorData, setSensorData] = useState([]);
  const [last24HoursData, setLast24HoursData] = useState([]);

  useEffect(() => {
 
    fetchData();
    fetchLast24HoursData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3001/Monitor/latest/1');
      setSensorData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };  

  const fetchLast24HoursData = async () => {
    try {
      const response = await axios.get("http://localhost:3001/Monitor/last24Hours");
      setLast24HoursData(response.data);
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error("Error fetching last 24 hours data:", error);
    }
  };
  //check if the data exist
  if (!sensorData) {
   return  <div>LOADING DATA...</div>
  }
  console.log('====================================');
  console.log(last24HoursData);
  console.log('====================================');
  return (
    <div>
      <Temperature data={sensorData[0]?.Temperature} />
      <Humidity data={sensorData[0]?.Humidity} />
      <VisibleIR data={sensorData[0]?.Visible_IR} />
      <Infrared data={sensorData[0]?.Infrared} />
    </div>
  );
};

export default SensorData;

/*<h2>Temperature (Last 24 Hours)</h2>
          <SensorChart data={last24HoursData} dataKey="Temperature" />
          <h2>Humidity (Last 24 Hours)</h2>
          <SensorChart data={last24HoursData} dataKey="Humidity" />
          <h2>Visible + IR (Last 24 Hours)</h2>
          <SensorChart data={last24HoursData} dataKey="Visible_IR" />
          <h2>Infrared (Last 24 Hours)</h2>
          <SensorChart data={last24HoursData} dataKey="Infrared" />*/

/*
const Product = (props) => {
  const [added, setAdded] = useState(false);
  let handleClick = () => {
    setAdded(!added);
    props.addToListHandler(!added, props.name);
  };

  useEffect(() => {
    setAdded(props.isSelected);
  }, [props.isSelected]);

  return (
    <div>
      <button onClick={handleClick} className={added ? "outline" : ""}>
        {props.name}
      </button>
    </div>
  );
};

export default Product;*/
