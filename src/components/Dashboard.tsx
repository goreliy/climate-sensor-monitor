import React from "react";
import { SensorPanel } from "./SensorPanel";
import { SensorChart } from "./SensorChart";

interface DashboardProps {
  useMockData?: boolean;
}

export function Dashboard({ useMockData = true }: DashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <SensorPanel useMockData={useMockData} />
      <SensorChart useMockData={useMockData} />
    </div>
  );
}
