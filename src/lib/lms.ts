import { lmsBoys, lmsGirls, LMSPoint } from "./lmsData";

// 정규분포 누적밀도함수(CDF) 계산
export function cdf(z: number): number {
  return (1 + erf(z / Math.sqrt(2))) / 2;
}

// 오차함수(Error function) 근사식
function erf(x: number): number {
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

// Z-Score로부터 퍼센타일 변환 (0~100)
export function zToPercentile(z: number): number {
  return cdf(z) * 100;
}

// 퍼센타일로부터 Z-Score 역산 (근사식)
export function percentileToZ(p: number): number {
  if (p <= 0 || p >= 100) return p <= 0 ? -3 : 3;
  p = p / 100;
  
  // Rational approximation for inverse CDF
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  
  const q = p < 0.5 ? p : 1 - p;
  const t = Math.sqrt(-2 * Math.log(q));
  
  let z = t - ((c2 * t + c1) * t + c0) / (((d3 * t + d2) * t + d1) * t + 1);
  return p < 0.5 ? -z : z;
}

// 연령별 LMS 파라미터 보간 계산
export function getLmsForAge(ageMonths: number, gender: "male" | "female"): LMSPoint {
  const data = gender === "male" ? lmsBoys : lmsGirls;
  const maxAge = data[data.length - 1].ageMonths;
  
  if (ageMonths >= maxAge) return data[data.length - 1];
  if (ageMonths <= data[0].ageMonths) return data[0];

  let lower: LMSPoint = data[0];
  let upper: LMSPoint = data[1];

  for (let i = 0; i < data.length - 1; i++) {
    if (ageMonths >= data[i].ageMonths && ageMonths < data[i + 1].ageMonths) {
      lower = data[i];
      upper = data[i + 1];
      break;
    }
  }

  const fraction = (ageMonths - lower.ageMonths) / (upper.ageMonths - lower.ageMonths);
  return {
    ageMonths,
    L: lower.L + (upper.L - lower.L) * fraction,
    M: lower.M + (upper.M - lower.M) * fraction,
    S: lower.S + (upper.S - lower.S) * fraction,
  };
}

// 측정치(X)를 Z-Score로 변환
export function calculateZScore(x: number, lms: LMSPoint): number {
  const { L, M, S } = lms;
  if (Math.abs(L) < 0.001) {
    return Math.log(x / M) / S;
  }
  return (Math.pow(x / M, L) - 1) / (L * S);
}

// Z-Score를 측정치(X)로 변환
export function calculateHeightFromZ(z: number, lms: LMSPoint): number {
  const { L, M, S } = lms;
  if (Math.abs(L) < 0.001) {
    return M * Math.exp(S * z);
  }
  return M * Math.pow(1 + L * S * z, 1 / L);
}

// 퍼센타일을 받아 해당 나이의 키 계산
export function getHeightByPercentile(percentile: number, ageMonths: number, gender: "male" | "female"): number {
  const z = percentileToZ(percentile);
  const lms = getLmsForAge(ageMonths, gender);
  return calculateHeightFromZ(z, lms);
}
