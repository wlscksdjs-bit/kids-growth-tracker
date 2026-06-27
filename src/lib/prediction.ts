import { Child, GrowthRecord } from "./types";
import { getLmsForAge, calculateZScore, calculateHeightFromZ, zToPercentile } from "./lms";
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

export function calculatePrediction(child: Child, records: GrowthRecord[]): PredictionResult | null {
  const heightRecords = records.filter(r => r.height !== null).sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());
  
  if (heightRecords.length === 0) return null;

  const latestRecord = heightRecords[heightRecords.length - 1];
  const birthDate = new Date(child.birth_year, 0, 1);
  const recordDate = parseISO(latestRecord.record_date);
  
  const chronoAgeYears = differenceInDays(recordDate, birthDate) / 365.25;
  const chronoAgeMonths = chronoAgeYears * 12;
  const isBasedOnBoneAge = latestRecord.bone_age != null;

  const normalizedGender = (child.gender === "M" || child.gender === "male") ? "male" : "female";

  const lmsNowChrono = getLmsForAge(chronoAgeMonths, normalizedGender);
  const lms20 = getLmsForAge(240, normalizedGender); // 20 years = 240 months

  // [P1 모델] 통계 추세 (Pure Trend - LMS 달력 나이 기준)
  const zScoreChrono = calculateZScore(latestRecord.height!, lmsNowChrono);
  const p1 = calculateHeightFromZ(zScoreChrono, lms20);
  const currentPercentile = zToPercentile(zScoreChrono);

  // [P2 모델] 유전적 목표 키 (Genetic Target)
  let targetHeight: number | null = null;
  let p2: number | null = null;
  if (child.father_height && child.mother_height) {
    if (normalizedGender === "male") {
      targetHeight = (child.father_height + child.mother_height + 13) / 2;
    } else {
      targetHeight = (child.father_height + child.mother_height - 13) / 2;
    }
    p2 = targetHeight;
  }

  // [P3 모델] 시간 체감 가중치 추세 (Decay Weighted Trend)
  // 20세가 될수록 가중치가 0에 수렴하도록 설계 (LMS 기반에서는 가중치를 약간 줄이는 것이 안전함)
  const baseWeight = normalizedGender === "male" ? 10.0 : 5.0; 
  const decayFactor = Math.max(0, (20 - chronoAgeYears) / 20);
  const p3 = p1 + (baseWeight * decayFactor);

  // [P4 모델] 골연령 기반 통계 추세 (Bone Age Trend)
  let p4: number | null = null;
  if (isBasedOnBoneAge) {
    const boneAgeMonths = latestRecord.bone_age! * 12;
    const lmsNowBone = getLmsForAge(boneAgeMonths, normalizedGender);
    const zScoreBone = calculateZScore(latestRecord.height!, lmsNowBone);
    p4 = calculateHeightFromZ(zScoreBone, lms20);
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
