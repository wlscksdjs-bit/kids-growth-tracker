import { Child, GrowthRecord } from "./types";
import { getStandardForAge } from "./growthStandards";
import { differenceInDays, parseISO } from "date-fns";

export interface PredictionResult {
  currentZScore: number;
  currentPercentile: number;
  targetHeight: number | null; // Mid-parental height
  predictedHeightByTrend: number; // Percentile tracking to age 18
  predictedHeightFinal: number; // Combined or selected
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
  const birthDate = new Date(child.birth_year, 0, 1); // 정확한 생일이 없으므로 해당 년도의 1월 1일로 근사
  const recordDate = parseISO(latestRecord.record_date);
  const ageInYears = differenceInDays(recordDate, birthDate) / 365.25;

  const standardNow = getStandardForAge(ageInYears, child.gender as "male" | "female");
  const standard18 = getStandardForAge(18, child.gender as "male" | "female");

  // 1. Z-Score 및 백분위 계산
  const currentZScore = (latestRecord.height! - standardNow.mean) / standardNow.sd;
  const currentPercentile = cdf(currentZScore) * 100;

  // 2. 현재 백분위(Z-score)를 유지했을 때의 만 18세 예상 키
  const predictedHeightByTrend = standard18.mean + (currentZScore * standard18.sd);

  // 3. 유전적 예상 키 (Target Height)
  let targetHeight: number | null = null;
  if (child.father_height && child.mother_height) {
    if (child.gender === "male") {
      targetHeight = (child.father_height + child.mother_height + 13) / 2;
    } else {
      targetHeight = (child.father_height + child.mother_height - 13) / 2;
    }
  }

  // 4. 최종 예측 키 결정 로직 (간단화: 추세 기반 예측 키 사용, 유전키가 있으면 가중치 적용 등 가능)
  let predictedHeightFinal = predictedHeightByTrend;
  
  // 만약 Khamis-Roche 등 복잡한 수식이 들어간다면 이 부분에 추가
  if (targetHeight) {
    // 임의의 가중치 알고리즘 (추세 70%, 유전 30% 등) 적용 가능
    // 현재는 아이의 현재 추세를 100% 반영하여 보여주거나, 유전키를 함께 제시
    predictedHeightFinal = predictedHeightByTrend; 
  }

  return {
    currentZScore,
    currentPercentile,
    targetHeight,
    predictedHeightByTrend,
    predictedHeightFinal
  };
}
