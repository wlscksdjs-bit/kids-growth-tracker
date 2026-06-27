"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { format, parseISO, addMonths } from "date-fns";
import { GrowthRecord } from "@/lib/types";

interface GrowthChartProps {
  records: GrowthRecord[];
  metric: "height" | "weight";
}

interface ChartDataPoint {
  dateLabel: string;
  actual?: number | null;
  predicted?: number | null;
  timestamp: number;
}

export default function GrowthChart({ records, metric }: GrowthChartProps) {
  const data = useMemo(() => {
    // Sort records by date
    const sorted = [...records]
      .filter((r) => r[metric] !== null)
      .sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());
    
    if (sorted.length < 2) {
      const shortData: ChartDataPoint[] = sorted.map((r) => ({
        dateLabel: format(parseISO(r.record_date), "yy.MM"),
        actual: r[metric] as number | null,
        timestamp: new Date(r.record_date).getTime()
      }));
      return shortData;
    }

    // Calculate linear regression for prediction
    const xValues = sorted.map((r) => new Date(r.record_date).getTime());
    const yValues = sorted.map((r) => r[metric] as number);
    
    const xMean = xValues.reduce((a, b) => a + b, 0) / xValues.length;
    const yMean = yValues.reduce((a, b) => a + b, 0) / yValues.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < xValues.length; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Map actual data
    const chartData: ChartDataPoint[] = sorted.map((r) => ({
      dateLabel: format(parseISO(r.record_date), "yy.MM"),
      actual: r[metric],
      timestamp: new Date(r.record_date).getTime()
    }));

    // Add prediction for 6 months ahead
    const lastDate = new Date(sorted[sorted.length - 1].record_date);
    const predictedDate = addMonths(lastDate, 6);
    const predictedTimestamp = predictedDate.getTime();
    const predictedValue = Number((slope * predictedTimestamp + intercept).toFixed(1));

    chartData.push({
      dateLabel: format(predictedDate, "yy.MM (예상)"),
      predicted: predictedValue,
      timestamp: predictedTimestamp
    });

    return chartData;
  }, [records, metric]);

  const yDomain = useMemo(() => {
    if (data.length === 0) return [0, 200];
    const values = data.map(d => d.actual || d.predicted).filter(Boolean);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return [Math.floor(min - 5), Math.ceil(max + 5)];
  }, [data]);

  if (records.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">데이터가 없습니다.</div>;
  }

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="dateLabel" 
            tick={{ fontSize: 12, fill: "currentColor" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            domain={yDomain} 
            tick={{ fontSize: 12, fill: "currentColor" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "rgba(255, 255, 255, 0.8)", 
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(8px)",
              color: "#0f172a"
            }} 
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line 
            type="monotone" 
            name={metric === "height" ? "실제 키 (cm)" : "실제 몸무게 (kg)"}
            dataKey="actual" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            name="6개월 예상"
            dataKey="predicted" 
            stroke="#94a3b8" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={{ r: 4, fill: "#94a3b8" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
