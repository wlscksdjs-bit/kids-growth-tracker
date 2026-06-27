# 📈 우리 아이 성장 과정 (Kids Growth Tracker)

우리 아이 성장 과정(Kids Growth Tracker)은 단순한 키/몸무게 기록장을 넘어, **소아청소년과 전문 병원급의 정밀한 수학 모델(LMS Box-Cox)**과 다중 하이브리드 예측 알고리즘을 탑재한 프리미엄 자녀 성장 관리 및 예측 애플리케이션입니다.

![App Screenshot](public/icon-192x192.png) <!-- 아이콘이나 스크린샷이 있다면 추후 변경 -->

## ✨ 주요 기능 (Key Features)

*   **📱 앱스토어급 갤러리 UX/UI**
    *   앱 실행 시 4명의 아이 프로필이 깔끔한 2x2 갤러리 그리드로 나열됩니다.
    *   아이 선택 시 선택되지 않은 아이들은 최상단 가로형 미니 아바타로 부드럽게 이동(Framer Motion 애니메이션)하며, 선택된 아이의 상세 리포트가 전체 화면으로 확장됩니다.
*   **🧬 4중 하이브리드 성장 예측 엔진 (Ensemble Model)**
    *   `P1 (통계 추세)`: 현재 아이의 달력 나이(월령) 기준 백분위 추세선을 20세까지 연장한 기본 예측.
    *   `P2 (유전적 목표 키)`: 부모님의 키(MPH)를 기반으로 한 유전적 예측 (남/여 공식 정밀 분리 적용).
    *   `P3 (시간 체감 가중치)`: 성인이 가까워질수록 예측 오차가 줄어드는 현실을 반영한 가중치 감소(Decay) 예측 모델.
    *   `P4 (골연령 보정치)`: 뼈 나이(Bone Age) 데이터 입력 시, 달력 나이가 아닌 뼈 나이 기준의 백분위 곡선으로 예측을 정밀 보정.
    *   **최종 앙상블**: 위 4가지 활성화 모델의 평균을 내고, 모델 간의 격차를 통해 최대/최소(Min/Max) 오차 범위를 확률적으로 제시합니다.
*   **📊 병원급 정밀 LMS 성장 곡선 (Box-Cox Transformation)**
    *   미국 질병통제예방센터(US CDC)의 0~20세 공식 LMS 원천 데이터를 백엔드에 내재화하였습니다.
    *   단순 평균(Mean)과 표준편차(SD)가 아닌 **L(곡선도), M(중앙값), S(변동계수)** 공식을 통해 백분위를 오차 없이 계산합니다.
    *   차트상에 P3(하위 3%), P10, P50, P90, P97(상위 3%) 등 5가닥의 부드러운 물결 밴드를 렌더링하여 대학병원 결과지와 동일한 시각적 경험을 제공합니다.
*   **☁️ Supabase 클라우드 동기화**
    *   Supabase의 PostgreSQL 데이터베이스와 연동하여 성장 기록, 아이 프로필 사진(Storage)을 안전하게 실시간으로 동기화합니다.

---

## 🛠️ 기술 스택 (Tech Stack)
*   **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, Framer Motion
*   **Charts**: Recharts
*   **Backend & DB**: Supabase (PostgreSQL, Storage)
*   **Math & Data**: date-fns, CDC LMS Growth Standards

---

## 🚀 개발 히스토리 (Development Phases)

본 프로젝트는 총 6차례의 기민한 고도화(Agile Iteration) 과정을 거쳐 완성되었습니다.

*   **Phase 1: 기반 시스템 및 데이터베이스 구축**
    *   Next.js 프로젝트 세팅 및 Supabase 연동.
    *   `children`, `growth_records` 테이블 설계 및 SQL 스크립트 작성.
    *   원시 형태의 키/몸무게 입력 및 데이터 로드 기능 구현.
*   **Phase 2: UI 디자인 및 시각화 고도화**
    *   Glassmorphism 테마 적용 및 Recharts를 활용한 키/몸무게 시각화 차트 구축.
    *   미래 6개월(몸무게) 및 20세까지의 선형 회귀 궤적 그리기 시도.
*   **Phase 3: Supabase Storage 연동 및 사진 업로드**
    *   `avatars` 스토리지 버킷을 생성하여 아이들의 프로필 사진 업로드 기능 구현.
    *   Image 압축 및 UX 개선(로딩 스피너, 에러 헨들링).
*   **Phase 4: 하이브리드 예측 모델(Ensemble) 최초 도입**
    *   단순 선형 예측의 한계를 깨고, 유전적 키(MPH) / 달력 나이 추세 / 시간 체감 가중치 / 뼈 나이 보정치 등 4가지 모델을 복합 계산하는 앙상블 모델 적용.
    *   예측값의 범위를 Min/Max로 도출하여 확률적 신뢰도 제공.
*   **Phase 5: 네이티브 앱 UX로의 전면 개편 및 산출식 버그 픽스**
    *   성별 파싱 오류(남아 데이터가 여아 공식을 타는 버그) 수정.
    *   기존 세로 스크롤 방식에서 2x2 갤러리 뷰 ↔ 상단 스크롤 상세 뷰 형태의 앱스토어급 화면 전환 아키텍처 도입.
*   **Phase 6: LMS 정밀 백분위 및 병원급 성장 밴드 탑재**
    *   글로벌 표준인 Box-Cox Transformation(LMS) 원천 데이터를 시스템에 내재화하여 백분위 정확도를 극대화.
    *   차트에 P3~P97 5가닥의 실제 곡선 밴드를 구현하여 리얼리티 확보.

---

## 💻 실행 방법 (How to Run Locally)

1. 저장소를 클론하고 패키지를 설치합니다.
   ```bash
   git clone https://github.com/사용자계정/저장소명.git
   cd kids-growth-tracker
   npm install
   ```

2. 루트 디렉토리에 `.env.local` 파일을 생성하고 Supabase 키를 입력합니다.
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. 개발 서버를 실행합니다.
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:3000`으로 접속하여 확인합니다.

---
*Developed with Antigravity AI Assistant.*
