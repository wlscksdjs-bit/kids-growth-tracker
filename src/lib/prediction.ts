import { Child, GrowthRecord } from "./types";
import { getStandardForAge } from "./growthStandards";
import { differenceInDays, parseISO } from "date-fns";

export interface PredictionResult {
  currentZScore: number;
  currentPercentile: number;
  targetHeight: number | null; 
  predictedHeightFinal: number; 
  predictedHeightMin: number;
  predictedHeightMax: number;
  isBasedOnBoneAge: boolean;
  activeModelsCount: number;
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
  
  const chronoAge = differenceInDays(recordDate, birthDate) / 365.25;
  const isBasedOnBoneAge = latestRecord.bone_age != null;

  const standardNowChrono = getStandardForAge(chronoAge, child.gender as "male" | "female");
  const standard20 = getStandardForAge(20, child.gender as "male" | "female");

  // [P1 모델] 통계 추세 (Pure Trend - 달력 나이 기준)
  const zScoreChrono = (latestRecord.height! - standardNowChrono.mean) / standardNowChrono.sd;
  const p1 = standard20.mean + (zScoreChrono * standard20.sd);
  const currentPercentile = cdf(zScoreChrono) * 100;

  // [P2 모델] 유전적 목표 키 (Genetic Target)
  let targetHeight: number | null = null;
  let p2: number | null = null;
  if (child.father_height && child.mother_height) {
    if (child.gender === "male") {
      targetHeight = (child.father_height + child.mother_height + 13) / 2;
    } else {
      targetHeight = (child.father_height + child.mother_height - 13) / 2;
    }
    p2 = targetHeight;
  }

  // [P3 모델] 시간 체감 가중치 추세 (Decay Weighted Trend)
  // 20세가 될수록 가중치가 0에 수렴하도록 설계
  const baseWeight = child.gender === "male" ? 15.0 : 7.5;
  const decayFactor = Math.max(0, (20 - chronoAge) / 20);
  const p3 = p1 + (baseWeight * decayFactor);

  // [P4 모델] 골연령 기반 통계 추세 (Bone Age Trend)
  let p4: number | null = null;
  if (isBasedOnBoneAge) {
    const standardNowBone = getStandardForAge(latestRecord.bone_age!, child.gender as "male" | "female");
    const zScoreBone = (latestRecord.height! - standardNowBone.mean) / standardNowBone.sd;
    p4 = standard20.mean + (zScoreBone * standard20.sd);
  }

  // 하이브리드(Ensemble) 연산: 활성화된 모든 모델을 취합
  const activeModels: number[] = [p1, p3]; // P1과 P3는 항상 기본 활성화
  if (p2 !== null) activeModels.push(p2);
  if (p4 !== null) activeModels.push(p4);

  // 최종 하이브리드 예측 키 (모든 모델의 평균)
  const predictedHeightFinal = activeModels.reduce((acc, val) => acc + val, 0) / activeModels.length;

  // 모델 간 격차를 확률적 오차 범위(Min/Max)로 산출
  let predictedHeightMin = Math.min(...activeModels);
  let predictedHeightMax = Math.max(...activeModels);
  
  // 만약 데이터 부족으로 최소/최대 격차가 너무 작다면 기본 오차(±3cm) 보장
  if (predictedHeightMax - predictedHeightMin < 3.0) {
    predictedHeightMin = predictedHeightFinal - 3.0;
    predictedHeightMax = predictedHeightFinal + 3.0;
  }

  return {
    currentZScore: zScoreChrono,
    currentPercentile,
    targetHeight,
    predictedHeightFinal,
    predictedHeightMin,
    predictedHeightMax,
    isBasedOnBoneAge,
    activeModelsCount: activeModels.length
  };
}
