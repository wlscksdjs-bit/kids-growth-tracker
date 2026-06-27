"use client";

import { useMemo } from "react";
import {
  XAxis,
  YAxis,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart
} from "recharts";
import { format, parseISO, addMonths, differenceInDays } from "date-fns";
import { Child, GrowthRecord } from "@/lib/types";
import { calculatePrediction } from "@/lib/prediction";
import { getStandardForAge } from "@/lib/growthStandards";

interface GrowthChartProps {
  records: GrowthRecord[];
  child: Child;
  metric: "height" | "weight";
}

interface ChartDataPoint {
  dateLabel: string;
  actual?: number | null;
  predicted?: number | null;
  timestamp: number;
  ageYears?: number;
  // 표준 성장 백분위 영역 (키 전용)
  stdUpper?: number; // 97th
  stdMiddle?: number; // 50th
  stdLower?: number; // 3rd
}

export default function GrowthChart({ records, child, metric }: GrowthChartProps) {
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

    const birthDate = new Date(child.birth_year, 0, 1);
    
    // Map actual data
    const chartData: ChartDataPoint[] = sorted.map((r) => {
      const recDate = parseISO(r.record_date);
      const ageYears = differenceInDays(recDate, birthDate) / 365.25;
      const point: ChartDataPoint = {
        dateLabel: format(recDate, "yy.MM"),
        actual: r[metric],
        timestamp: recDate.getTime(),
        ageYears
      };
      return point;
    });

    if (metric === "weight") {
      // 몸무게는 단순히 6개월 선형 회귀 예측 유지
      if (sorted.length >= 2) {
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

        const lastDate = new Date(sorted[sorted.length - 1].record_date);
        const predictedDate = addMonths(lastDate, 6);
        const predictedTimestamp = predictedDate.getTime();
        const predictedValue = Number((slope * predictedTimestamp + intercept).toFixed(1));

        chartData.push({
          dateLabel: format(predictedDate, "yy.MM (예상)"),
          predicted: predictedValue,
          timestamp: predictedTimestamp
        });
      }
    } else {
      // 키인 경우: 최종 성인 키 예측 및 성장 곡선 배경 적용
      const prediction = calculatePrediction(child, records);
      if (prediction && sorted.length > 0) {
        // 성인 시점(18세) 데이터 포인트 추가
        const age18Date = new Date(child.birth_year + 18, 0, 1);
        chartData.push({
          dateLabel: "18세 (예상)",
          predicted: Number(prediction.predictedHeightFinal.toFixed(1)),
          timestamp: age18Date.getTime(),
          ageYears: 18
        });

        // 각 포인트에 대해 배경 밴드(표준편차) 계산
        chartData.forEach(d => {
          if (d.ageYears !== undefined && d.ageYears <= 18) {
            const std = getStandardForAge(d.ageYears, child.gender as "male" | "female");
            // 97th percentile = mean + 1.88 * sd
            // 3rd percentile = mean - 1.88 * sd
            d.stdUpper = Number((std.mean + 1.88 * std.sd).toFixed(1));
            d.stdMiddle = Number(std.mean.toFixed(1));
            d.stdLower = Number((std.mean - 1.88 * std.sd).toFixed(1));
          }
        });
      }
    }

    return chartData;
  }, [records, metric, child]);

  const yDomain = useMemo(() => {
    if (data.length === 0) return [0, 200];
    const values = data.map(d => d.actual || d.predicted).filter(v => v != null) as number[];
    if (values.length === 0) return [0, 200];
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
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          
          {metric === "height" && (
            <>
              <Area 
                type="monotone" 
                dataKey="stdUpper" 
                name="상위 3%" 
                stroke="none" 
                fill="#f1f5f9" 
                fillOpacity={0.1} 
              />
              <Area 
                type="monotone" 
                dataKey="stdLower" 
                name="하위 3%" 
                stroke="none" 
                fill="#0f172a" 
                fillOpacity={0.1} 
              />
              <Line 
                type="monotone" 
                dataKey="stdMiddle" 
                name="표준 평균" 
                stroke="#cbd5e1" 
                strokeWidth={1} 
                strokeDasharray="3 3" 
                dot={false}
              />
            </>
          )}

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
            name={metric === "height" ? "최종 예상 키" : "6개월 예상"}
            dataKey="predicted" 
            stroke="#10b981" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
