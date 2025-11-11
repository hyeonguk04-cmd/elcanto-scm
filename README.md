# ELCANTO SCM Portal

엘칸토 패션 제화 업체의 SCM(Supply Chain Management) 포털 사이트입니다.

## 프로젝트 개요

생산업체와의 납기 지연 문제를 해결하기 위한 통합 생산 관리 시스템으로, 발주부터 생산공정, 수입입고 완료까지의 전체 납기 일정을 공유하고 관리합니다.

## 주요 기능

### 1단계: 발주 데이터 관리
- 관리자가 발주 데이터를 업로드
- 국가별/생산업체별 표준 리드타임 자동 적용
- 최종 물류입고 예정일 자동 계산

### 2단계: 공정 진척 관리
- 생산업체의 실시간 공정 완료일 기록
- 증빙 자료 및 사진 업로드
- 공정별 진행 상황 추적

### 3단계: 지연 리스크 모니터링
- 목표일정 vs 실제 완료일 비교
- 지연일 자동 계산
- 공정 입고진척 현황 파악

### 4단계: 주간 KPI 리포트
- 주간 발주량, 입고량, 지연물량 집계
- 주간 생산발주 및 입고실적 현황
- 입고지연 여부 주단위 점검

### 5단계: 종합 현황판
- 납기준수율, 입고진행률, 지연물량 KPI
- 채널별/기간별 발주/입고 현황 그래프
- 미입고 상세 현황 모니터링

## 공정 프로세스

1. **자재(어퍼)** - 어퍼 자재 입고
2. **자재(저부)** - 저부 자재 입고
3. **한도CFM** - 한도 확인
4. **재단** - 자재 재단
5. **제갑** - 갑피 제작
6. **조립** - 신발 조립 (Lasting)
7. **자체검사** - 내부 품질 검사
8. **완성검사** - 최종 품질 검사
9. **공장출고** - 공장 출고
10. **선적** - 선박 선적
11. **입항** - 항구 도착
12. **물류입고** - 물류센터 최종 입고

## 기술 스택

- **Frontend**: HTML5, TailwindCSS, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Deployment**: Firebase Hosting
- **Libraries**: 
  - Chart.js (데이터 시각화)
  - SheetJS (엑셀 파일 처리)
  - Font Awesome (아이콘)

## 사용자 권한

### 관리자 (Admin)
- 발주 데이터 업로드 및 수정
- 전체 생산 현황 모니터링
- 생산업체 정보 관리
- 표준 리드타임 설정

### 생산업체 (Supplier)
- 자신의 발주건 조회
- 공정 완료일 입력
- 증빙 자료 업로드

## Firebase 설정

### Firebase 프로젝트 정보
- Project ID: `elcanto-scm`
- Hosting URLs:
  - https://elcanto-scm.web.app
  - https://elcanto-scm.firebaseapp.com

### Firestore 컬렉션 구조

#### users
```javascript
{
  uid: string,
  email: string,
  name: string,
  role: 'admin' | 'supplier',
  supplierId: string (생산업체인 경우),
  createdAt: timestamp
}
```

#### suppliers
```javascript
{
  id: string,
  name: string,
  country: string,
  contact: string,
  email: string,
  phone: string,
  location: string,
  paymentTerms: string,
  deliveryTerms: string,
  forwarder: string,
  mainChannel: string,
  mainItem: string,
  leadTimes: {
    material_upper: number,
    material_sole: number,
    hando_cfm: number,
    cutting: number,
    upper_making: number,
    assembly: number,
    self_inspection: number,
    final_inspection: number,
    factory_shipment: number,
    shipping: number,
    arrival: number,
    logistics_arrival: number
  },
  status: 'active' | 'inactive',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### orders
```javascript
{
  id: string,
  channel: string,
  style: string,
  color: string,
  qty: number,
  orderingCountry: string,
  country: string,
  supplier: string,
  supplierId: string,
  orderDate: string,
  requiredDelivery: string,
  status: 'pending' | 'in_progress' | 'completed' | 'delayed',
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string
}
```

#### processes
```javascript
{
  id: string,
  orderId: string,
  processName: string,
  processNameEn: string,
  category: 'production' | 'shipping',
  targetDate: string,
  actualDate: string | null,
  delayDays: number,
  delayReason: string | null,
  evidenceUrl: string | null,
  evidenceId: string | null,
  route: string | null (선적인 경우),
  updatedBy: string,
  updatedAt: timestamp
}
```

#### evidences
```javascript
{
  id: string,
  orderId: string,
  processId: string,
  fileName: string,
  fileUrl: string,
  fileSize: number,
  contentType: string,
  uploadedBy: string,
  uploadedAt: timestamp
}
```

## 로컬 개발 환경 설정

1. 저장소 클론
```bash
git clone https://github.com/hyeonguk04-cmd/elcanto-scm.git
cd elcanto-scm
```

2. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

3. Firebase 로그인
```bash
firebase login
```

4. Firebase 초기화 (이미 설정되어 있음)
```bash
firebase init
```

5. 로컬 서버 실행
```bash
firebase serve
```

6. 브라우저에서 `http://localhost:5000` 접속

## 배포

### 🚀 빠른 배포 (권장)

```bash
# 1. 저장소 클론
git clone https://github.com/hyeonguk04-cmd/elcanto-scm.git
cd elcanto-scm

# 2. 의존성 설치
npm install

# 3. Firebase 로그인
npx firebase login

# 4. 전체 배포 (한 번에!)
npm run deploy:all
```

또는 자동화 스크립트 사용:
```bash
./deploy.sh all
```

**배포 완료!** 🎉
- 웹사이트: https://elcanto-scm.web.app
- Firebase Console: https://console.firebase.google.com/project/elcanto-scm

### 📚 배포 가이드

- **[QUICKSTART.md](QUICKSTART.md)**: 5분 빠른 배포 가이드
- **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)**: 상세한 터미널 배포 가이드
- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)**: Firebase 초기 설정 가이드

### NPM 배포 스크립트

```bash
# 전체 배포 (Firestore 규칙 + Storage 규칙 + Hosting)
npm run deploy:all

# Hosting만 배포
npm run deploy:hosting

# Firestore 규칙만 배포
npm run deploy:firestore

# Storage 규칙만 배포
npm run deploy:storage
```

### 자동화 배포 스크립트

```bash
# 전체 배포
./deploy.sh all

# Hosting만 배포
./deploy.sh hosting

# Firestore 규칙만 배포
./deploy.sh firestore

# Storage 규칙만 배포
./deploy.sh storage
```

### 기존 Firebase CLI 명령어

```bash
# 전체 배포
firebase deploy

# 특정 서비스만 배포
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 🗄️ 배포 후 초기 설정

배포가 완료되면 Firebase Console에서 초기 데이터를 설정해야 합니다.

### 1. users 컬렉션 생성

[Firebase Console > Firestore Database](https://console.firebase.google.com/project/elcanto-scm/firestore)

#### 관리자 계정
```javascript
// 문서 ID: admin@elcanto.com
{
  email: "admin@elcanto.com",
  password: "admin123",  // ⚠️ 배포 후 변경 필요
  role: "admin",
  name: "엘칸토 관리자",
  createdAt: [Timestamp]
}
```

#### 공급업체 계정
```javascript
// 문서 ID: supplier@aau.com
{
  email: "supplier@aau.com",
  password: "supplier123",  // ⚠️ 배포 후 변경 필요
  role: "supplier",
  name: "AAU Vietnam",
  supplierId: "aau",
  createdAt: [Timestamp]
}
```

### 2. suppliers 문서에 leadTimes 추가

기존 `suppliers/aau` 문서에 `leadTimes` 맵 필드 추가:

```javascript
leadTimes: {
  material_upper: 7,
  material_sole: 7,
  hando_cfm: 2,
  cutting: 3,
  upper_making: 10,
  assembly: 7,
  self_inspection: 2,
  final_inspection: 2,
  factory_shipment: 3,
  shipping: 2,
  arrival: 0,
  logistics_arrival: 2
}
```

### 3. 로그인 테스트

1. 웹사이트 접속: https://elcanto-scm.web.app
2. 관리자로 로그인 (admin@elcanto.com / admin123)
3. 대시보드 확인
4. 로그아웃 후 공급업체 계정 테스트

## 프로젝트 구조

```
elcanto-scm/
├── public/                 # 웹 호스팅 파일
│   ├── index.html         # 메인 HTML
│   ├── js/                # JavaScript 파일
│   └── css/               # CSS 파일
├── src/                   # 소스 파일
│   ├── js/                # JavaScript 모듈
│   └── css/               # CSS 파일
├── assets/                # 정적 자산
│   └── images/            # 이미지 파일
├── firebase.json          # Firebase 설정
├── .firebaserc            # Firebase 프로젝트 설정
├── firestore.rules        # Firestore 보안 규칙
├── firestore.indexes.json # Firestore 인덱스
├── storage.rules          # Storage 보안 규칙
└── README.md              # 프로젝트 문서
```

## 환경 변수 설정

Firebase 설정은 `public/index.html` 내에 직접 포함되어 있습니다. 
프로덕션 환경에서는 Firebase Console에서 프로젝트 설정을 확인하여 업데이트하세요.

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "elcanto-scm.firebaseapp.com",
  projectId: "elcanto-scm",
  storageBucket: "elcanto-scm.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 브랜치 전략

- `main`: 프로덕션 배포 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

## 기여 가이드

1. 새로운 브랜치 생성
2. 기능 개발 및 테스트
3. Pull Request 생성
4. 코드 리뷰 후 병합

## 라이선스

Copyright © 2025 ELCANTO. All rights reserved.

## 연락처

- 프로젝트 관리자: ELCANTO IT팀
- 이메일: it@elcanto.com
