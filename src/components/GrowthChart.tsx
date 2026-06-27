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
import { getHeightByPercentile, getLmsForAge, calculateZScore, calculateHeightFromZ } from "@/lib/lms";

interface GrowthChartProps {
  records: GrowthRecord[];
  child: Child;
  metric: "height" | "weight";
}

interface ChartDataPoint {
  dateLabel: string;
  actual?: number | null;
  predicted?: number | null;
  predictedMin?: number;
  predictedMax?: number;
  targetHeight?: number | null;
  timestamp: number;
  ageYears?: number;
  p97?: number;
  p90?: number;
  p50?: number;
  p10?: number;
  p3?: number;
}

export default function GrowthChart({ records, child, metric }: GrowthChartProps) {
  const data = useMemo(() => {
    // Sort records by date
    const sorted = [...records]
      .filter((r) => r[metric] !== null)
      .sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());
    
    if (sorted.length === 0) return [];

    const birthDate = new Date(child.birth_year, 0, 1);
    const normalizedGender = (child.gender === "M" || child.gender === "male") ? "male" : "female";
    
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
      // 몸무게 6개월 회귀 예측
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
      // 키: 20세까지의 곡선 예측
      const prediction = calculatePrediction(child, records);
      if (prediction && sorted.length > 0) {
        const lastRecord = sorted[sorted.length - 1];
        const lastRecDate = parseISO(lastRecord.record_date);
        const lastAge = differenceInDays(lastRecDate, birthDate) / 365.25;
        
        // 현재 Z-Score를 기반으로 20세까지 1년 단위 예측 포인트 추가
        let currentAge = Math.ceil(lastAge);
        while (currentAge <= 20) {
          if (currentAge > lastAge + 0.1) {
            const lmsNow = getLmsForAge(currentAge * 12, normalizedGender);
            const predictedVal = calculateHeightFromZ(prediction.currentZScore, lmsNow);
            
            // 시간이 지날수록 불확실성(오차범위) 증가. 최종적으로 prediction.predictedHeightMax 오차에 도달
            const maxErrorMargin = prediction.predictedHeightMax - prediction.predictedHeightFinal;
            const progressRatio = (currentAge - lastAge) / (20 - lastAge);
            const currentErrorMargin = maxErrorMargin * progressRatio;

            const ageDate = new Date(child.birth_year + currentAge, 0, 1);
            
            chartData.push({
              dateLabel: `${currentAge}세`,
              predicted: Number(predictedVal.toFixed(1)),
              predictedMin: Number((predictedVal - currentErrorMargin).toFixed(1)),
              predictedMax: Number((predictedVal + currentErrorMargin).toFixed(1)),
              timestamp: ageDate.getTime(),
              ageYears: currentAge,
              ...(currentAge === 20 && prediction.targetHeight ? { targetHeight: Number(prediction.targetHeight.toFixed(1)) } : {})
            });
          }
          currentAge++;
        }

        // 모든 차트 데이터(과거+미래)에 대해 실제 백분위(LMS) 곡선 밴드 계산
        chartData.forEach(d => {
          if (d.ageYears !== undefined && d.ageYears <= 20) {
            const ageMonths = d.ageYears * 12;
            d.p97 = Number(getHeightByPercentile(97, ageMonths, normalizedGender).toFixed(1));
            d.p90 = Number(getHeightByPercentile(90, ageMonths, normalizedGender).toFixed(1));
            d.p50 = Number(getHeightByPercentile(50, ageMonths, normalizedGender).toFixed(1));
            d.p10 = Number(getHeightByPercentile(10, ageMonths, normalizedGender).toFixed(1));
            d.p3 = Number(getHeightByPercentile(3, ageMonths, normalizedGender).toFixed(1));
          }
        });
      }
    }

    return chartData;
  }, [records, metric, child]);

  const yDomain = useMemo(() => {
    if (data.length === 0) return [0, 200];
    
    const values: number[] = [];
    data.forEach(d => {
      if (d.actual != null) values.push(d.actual);
      if (d.predicted != null) values.push(d.predicted);
      if (d.predictedMax != null) values.push(d.predictedMax);
      if (d.targetHeight != null) values.push(d.targetHeight);
    });

    if (values.length === 0) return [0, 200];
    const min = Math.min(...values);
    const max = Math.max(...values);
    return [Math.floor(min - 5), Math.ceil(max + 5)];
  }, [data]);

  if (records.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">데이터가 없습니다.</div>;
  }

  // 예측 영역(Min/Max)을 표시하기 위한 데이터 배열 구성 (recharts Area는 [min, max] 형태 지원 안하므로 2개의 Area로 구현하거나 상위 Area를 채우기)
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
            formatter={(value, name) => {
              if (name === "predictedMax") return [value, "예상 최대치"];
              if (name === "predictedMin") return [value, "예상 최소치"];
              if (name === "targetHeight") return [value, "유전적 예상 키"];
              if (name === "p97") return [value, "상위 3% (97th)"];
              if (name === "p90") return [value, "상위 10% (90th)"];
              if (name === "p50") return [value, "평균 (50th)"];
              if (name === "p10") return [value, "하위 10% (10th)"];
              if (name === "p3") return [value, "하위 3% (3th)"];
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          
          {metric === "height" && (
            <>
              {/* LMS 곡선 밴드 */}
              <Line type="monotone" dataKey="p97" name="P97 (상위3%)" stroke="#cbd5e1" strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="p90" name="P90" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="p50" name="P50 (평균)" stroke="#94a3b8" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="p10" name="P10" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="p3" name="P3 (하위3%)" stroke="#cbd5e1" strokeWidth={1} dot={false} isAnimationActive={false} />
              
              {/* 예측 확률 영역 (Min~Max) */}
              <Area 
                type="monotone" 
                dataKey="predictedMax" 
                stroke="none" 
                fill="#10b981" 
                fillOpacity={0.15} 
                legendType="none"
              />
              <Area 
                type="monotone" 
                dataKey="predictedMin" 
                stroke="none" 
                fill="#fff" // 배경색으로 하위 영역을 덮어버림
                fillOpacity={0.2} 
                legendType="none"
              />
            </>
          )}

          <Line 
            type="monotone" 
            name={metric === "height" ? "실제 측정치" : "실제 몸무게"}
            dataKey="actual" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6 }} 
          />
          <Line 
            type="monotone" 
            name={metric === "height" ? "추세 예상 곡선" : "6개월 예상"}
            dataKey="predicted" 
            stroke="#10b981" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
          />

          {metric === "height" && data.some(d => d.targetHeight) && (
            <Line 
              type="monotone"
              name="유전적 예상 키"
              dataKey="targetHeight"
              stroke="none"
              dot={{ r: 6, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 8 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
