export interface StandardPoint {
  ageYears: number;
  meanHeightBoys: number;
  sdHeightBoys: number;
  meanHeightGirls: number;
  sdHeightGirls: number;
}

// 2017 소아청소년 성장도표 연령별(0~18세) 평균(M) 및 표준편차(S) 단순화 데이터
// 백분위와 Z-score 계산, 보간법(Interpolation)을 위해 사용됩니다.
export const koreanGrowthStandards: StandardPoint[] = [
  { ageYears: 0, meanHeightBoys: 49.9, sdHeightBoys: 1.9, meanHeightGirls: 49.1, sdHeightGirls: 1.8 },
  { ageYears: 1, meanHeightBoys: 75.7, sdHeightBoys: 2.6, meanHeightGirls: 74.3, sdHeightGirls: 2.5 },
  { ageYears: 2, meanHeightBoys: 87.1, sdHeightBoys: 3.1, meanHeightGirls: 85.7, sdHeightGirls: 3.1 },
  { ageYears: 3, meanHeightBoys: 96.1, sdHeightBoys: 3.6, meanHeightGirls: 95.0, sdHeightGirls: 3.6 },
  { ageYears: 4, meanHeightBoys: 103.1, sdHeightBoys: 4.0, meanHeightGirls: 101.9, sdHeightGirls: 4.0 },
  { ageYears: 5, meanHeightBoys: 109.3, sdHeightBoys: 4.3, meanHeightGirls: 108.1, sdHeightGirls: 4.3 },
  { ageYears: 6, meanHeightBoys: 115.3, sdHeightBoys: 4.6, meanHeightGirls: 114.1, sdHeightGirls: 4.6 },
  { ageYears: 7, meanHeightBoys: 121.2, sdHeightBoys: 5.0, meanHeightGirls: 119.9, sdHeightGirls: 5.0 },
  { ageYears: 8, meanHeightBoys: 126.9, sdHeightBoys: 5.3, meanHeightGirls: 125.6, sdHeightGirls: 5.3 },
  { ageYears: 9, meanHeightBoys: 132.3, sdHeightBoys: 5.6, meanHeightGirls: 131.6, sdHeightGirls: 5.7 },
  { ageYears: 10, meanHeightBoys: 137.8, sdHeightBoys: 5.9, meanHeightGirls: 138.3, sdHeightGirls: 6.1 },
  { ageYears: 11, meanHeightBoys: 144.1, sdHeightBoys: 6.5, meanHeightGirls: 145.4, sdHeightGirls: 6.2 },
  { ageYears: 12, meanHeightBoys: 151.8, sdHeightBoys: 7.3, meanHeightGirls: 151.8, sdHeightGirls: 5.8 },
  { ageYears: 13, meanHeightBoys: 159.9, sdHeightBoys: 7.5, meanHeightGirls: 156.4, sdHeightGirls: 5.3 },
  { ageYears: 14, meanHeightBoys: 166.4, sdHeightBoys: 6.6, meanHeightGirls: 159.2, sdHeightGirls: 5.1 },
  { ageYears: 15, meanHeightBoys: 170.4, sdHeightBoys: 5.9, meanHeightGirls: 160.6, sdHeightGirls: 5.2 },
  { ageYears: 16, meanHeightBoys: 172.4, sdHeightBoys: 5.7, meanHeightGirls: 161.1, sdHeightGirls: 5.2 },
  { ageYears: 17, meanHeightBoys: 173.4, sdHeightBoys: 5.7, meanHeightGirls: 161.3, sdHeightGirls: 5.3 },
  { ageYears: 18, meanHeightBoys: 173.8, sdHeightBoys: 5.8, meanHeightGirls: 161.4, sdHeightGirls: 5.3 }
];

// 특정 개월수(소수점 포함 연령)에 대한 평균 및 표준편차를 보간법으로 계산
export function getStandardForAge(ageYears: number, gender: "male" | "female") {
  const maxAge = 18;
  if (ageYears >= maxAge) {
    const std = koreanGrowthStandards[maxAge];
    return {
      mean: gender === "male" ? std.meanHeightBoys : std.meanHeightGirls,
      sd: gender === "male" ? std.sdHeightBoys : std.sdHeightGirls,
    };
  }

  const lowerAge = Math.floor(ageYears);
  const upperAge = Math.ceil(ageYears);
  
  if (lowerAge === upperAge) {
    const std = koreanGrowthStandards[lowerAge];
    return {
      mean: gender === "male" ? std.meanHeightBoys : std.meanHeightGirls,
      sd: gender === "male" ? std.sdHeightBoys : std.sdHeightGirls,
    };
  }

  const fraction = ageYears - lowerAge;
  const lowerStd = koreanGrowthStandards[lowerAge];
  const upperStd = koreanGrowthStandards[upperAge];

  const lowerMean = gender === "male" ? lowerStd.meanHeightBoys : lowerStd.meanHeightGirls;
  const upperMean = gender === "male" ? upperStd.meanHeightBoys : upperStd.meanHeightGirls;
  const lowerSd = gender === "male" ? lowerStd.sdHeightBoys : lowerStd.sdHeightGirls;
  const upperSd = gender === "male" ? upperStd.sdHeightBoys : upperStd.sdHeightGirls;

  return {
    mean: lowerMean + (upperMean - lowerMean) * fraction,
    sd: lowerSd + (upperSd - lowerSd) * fraction,
  };
}
