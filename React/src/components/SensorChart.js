/* Ref.: https://dev.to/femi_dev/how-to-create-a-chart-in-react-with-recharts-2b58 
*/ 

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SensorChart = ({ data, title }) => {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3>{title}</h3>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="modifiedDate" />
          <YAxis />
          <Tooltip />
          <Legend  />
          <Line 
            type="monotone" 
            dataKey={title} 
            stroke="8884d8" 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensorChart;