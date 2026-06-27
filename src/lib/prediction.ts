import { Child, GrowthRecord } from "./types";
import { getStandardForAge } from "./growthStandards";
import { differenceInDays, parseISO } from "date-fns";

export interface PredictionResult {
  currentZScore: number;
  currentPercentile: number;
  targetHeight: number | null; // Mid-parental height
  predictedHeightFinal: number; // Combined or selected (age 20)
  predictedHeightMin: number;
  predictedHeightMax: number;
  isBasedOnBoneAge: boolean;
}

// 표준 정규분포 누적 분포 함수 (Z-score to Percentile)
function cdf(x: number) {
  const mean = 0.0;
  const dev = 1.0;
  return 0.5 * (1 + erf((x - mean) / (dev * Math.sqrt(2))));
}

function erf(x: number) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

export function calculatePrediction(child: Child, records: GrowthRecord[]): PredictionResult | null {
  const heightRecords = records.filter(r => r.height !== null).sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());
  
  if (heightRecords.length === 0) return null;

  const latestRecord = heightRecords[heightRecords.length - 1];
  const birthDate = new Date(child.birth_year, 0, 1);
  const recordDate = parseISO(latestRecord.record_date);
  
  // 골연령이 있으면 골연령 기준, 없으면 달력 나이 기준
  const chronoAge = differenceInDays(recordDate, birthDate) / 365.25;
  const isBasedOnBoneAge = latestRecord.bone_age != null;
  const effectiveAge = isBasedOnBoneAge ? latestRecord.bone_age! : chronoAge;

  const standardNow = getStandardForAge(effectiveAge, child.gender as "male" | "female");
  const standard20 = getStandardForAge(20, child.gender as "male" | "female");

  // 1. Z-Score 및 백분위 계산
  const currentZScore = (latestRecord.height! - standardNow.mean) / standardNow.sd;
  const currentPercentile = cdf(currentZScore) * 100;

  // 2. 현재 백분위(Z-score)를 유지했을 때의 만 20세 예상 키
  const predictedHeightByTrend = standard20.mean + (currentZScore * standard20.sd);

  // 3. 유전적 예상 키 (Target Height)
  let targetHeight: number | null = null;
  if (child.father_height && child.mother_height) {
    if (child.gender === "male") {
      targetHeight = (child.father_height + child.mother_height + 13) / 2;
    } else {
      targetHeight = (child.father_height + child.mother_height - 13) / 2;
    }
  }

  // 4. 최종 예측 키
  const predictedHeightFinal = predictedHeightByTrend; 
  
  // 5. 확률적 오차 범위 (대략적인 표준 오차: ±4.0cm)
  // 골연령이 있으면 오차 범위를 약간 줄일 수 있으나 기본 ±4cm 적용
  const errorMargin = isBasedOnBoneAge ? 3.0 : 4.5;
  const predictedHeightMin = predictedHeightFinal - errorMargin;
  const predictedHeightMax = predictedHeightFinal + errorMargin;

  return {
    currentZScore,
    currentPercentile,
    targetHeight,
    predictedHeightFinal,
    predictedHeightMin,
    predictedHeightMax,
    isBasedOnBoneAge
  };
}
