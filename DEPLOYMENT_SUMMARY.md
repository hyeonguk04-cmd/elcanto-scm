# 📋 배포 요약 및 체크리스트

## ✅ 완료된 작업

### 1. Firebase 프로젝트 설정
- ✅ Firebase 프로젝트 생성 (elcanto-scm)
- ✅ Firestore Database 활성화
- ✅ Firebase Storage 활성화
- ✅ Firebase Hosting 활성화
- ✅ Firebase Authentication 설정
- ✅ config.js에 실제 Firebase 자격증명 업데이트 완료

### 2. 코드 개발
- ✅ 12단계 생산 프로세스 구조 구현
- ✅ 관리자 대시보드 개발
- ✅ 공급업체 생산 현황 관리 페이지
- ✅ 로그인/로그아웃 시스템
- ✅ Excel 업로드/다운로드 기능
- ✅ 증빙 사진 업로드 기능
- ✅ KPI 카드 및 Chart.js 시각화
- ✅ Firestore 보안 규칙 작성
- ✅ Storage 보안 규칙 작성

### 3. 배포 도구 및 문서
- ✅ package.json: NPM 배포 스크립트 추가
- ✅ deploy.sh: 자동화 배포 스크립트 생성
- ✅ DEPLOY_GUIDE.md: 상세 배포 가이드 작성
- ✅ QUICKSTART.md: 5분 빠른 시작 가이드 작성
- ✅ FIREBASE_SETUP.md: Firebase 설정 가이드 작성
- ✅ README.md: 배포 섹션 업데이트

### 4. GitHub 저장소
- ✅ 저장소 생성: https://github.com/hyeonguk04-cmd/elcanto-scm
- ✅ 모든 코드 커밋 및 푸시 완료
- ✅ 최신 코드 동기화 완료

---

## 🚀 다음 단계: 터미널 배포

### 단계 1: 로컬에 프로젝트 가져오기

**본인의 컴퓨터 터미널에서 실행:**

```bash
# 원하는 디렉토리로 이동 (예: Documents)
cd ~/Documents

# GitHub에서 프로젝트 클론
git clone https://github.com/hyeonguk04-cmd/elcanto-scm.git

# 프로젝트 폴더로 이동
cd elcanto-scm

# 프로젝트 구조 확인
ls -la
```

### 단계 2: Firebase CLI 설치 및 로그인

```bash
# NPM 의존성 설치 (Firebase CLI 포함)
npm install

# Firebase 로그인 (브라우저가 열림)
npx firebase login
```

→ 브라우저에서 Google 계정으로 로그인
→ "Firebase CLI Login Successful" 확인

### 단계 3: Firebase 배포

```bash
# 방법 1: NPM 스크립트 사용 (권장)
npm run deploy:all

# 방법 2: 자동화 스크립트 사용
./deploy.sh all

# 방법 3: 기존 Firebase CLI 사용
npx firebase deploy --only firestore:rules,storage,hosting
```

**배포 시간**: 약 2-3분

**배포 완료 메시지 예시:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/elcanto-scm/overview
Hosting URL: https://elcanto-scm.web.app
```

---

## 🗄️ 배포 후 필수 작업: Firestore 초기 데이터 설정

배포가 완료되면 **Firebase Console에서 직접** 초기 데이터를 생성해야 합니다.

### 작업 1: users 컬렉션 생성

**Firebase Console 접속:**
https://console.firebase.google.com/project/elcanto-scm/firestore

**"컬렉션 시작" 버튼 클릭**

#### 관리자 계정 생성

1. 컬렉션 ID: `users`
2. 문서 ID: `admin@elcanto.com`
3. 필드 추가:
   - `email` (string): `admin@elcanto.com`
   - `password` (string): `admin123`
   - `role` (string): `admin`
   - `name` (string): `엘칸토 관리자`
   - `createdAt` (timestamp): [현재 시간]

4. "저장" 클릭

#### 공급업체 계정 생성

1. users 컬렉션 내에서 "문서 추가" 클릭
2. 문서 ID: `supplier@aau.com`
3. 필드 추가:
   - `email` (string): `supplier@aau.com`
   - `password` (string): `supplier123`
   - `role` (string): `supplier`
   - `name` (string): `AAU Vietnam`
   - `supplierId` (string): `aau`
   - `createdAt` (timestamp): [현재 시간]

4. "저장" 클릭

### 작업 2: suppliers 문서에 leadTimes 추가

**Firestore Console에서:**

1. `suppliers` 컬렉션 열기
2. `aau` 문서 클릭
3. "필드 추가" 버튼 클릭
4. 필드 이름: `leadTimes`
5. 유형: **map** 선택
6. 맵 내부에 다음 필드들 추가 (모두 **number** 타입):

```
leadTimes (map)
├── material_upper: 7
├── material_sole: 7
├── hando_cfm: 2
├── cutting: 3
├── upper_making: 10
├── assembly: 7
├── self_inspection: 2
├── final_inspection: 2
├── factory_shipment: 3
├── shipping: 2
├── arrival: 0
└── logistics_arrival: 2
```

7. "업데이트" 클릭

---

## 🧪 배포 후 테스트

### 테스트 1: 웹사이트 접속

브라우저에서 열기:
- https://elcanto-scm.web.app
- https://elcanto-scm.firebaseapp.com

**확인 사항:**
- ✅ 로그인 화면이 표시되는가?
- ✅ 엘칸토 로고와 디자인이 정상인가?

### 테스트 2: 관리자 로그인

1. 이메일: `admin@elcanto.com`
2. 비밀번호: `admin123`
3. "로그인" 버튼 클릭

**확인 사항:**
- ✅ 대시보드로 이동되는가?
- ✅ KPI 카드가 표시되는가? (납기준수율, 입고진행률, 지연물량)
- ✅ 차트가 표시되는가?
- ✅ 네비게이션 메뉴가 작동하는가?

### 테스트 3: 공급업체 로그인

1. 로그아웃
2. 이메일: `supplier@aau.com`
3. 비밀번호: `supplier123`
4. "로그인" 버튼 클릭

**확인 사항:**
- ✅ 생산 현황 페이지로 이동되는가?
- ✅ 공급업체 이름이 표시되는가? (AAU Vietnam)
- ✅ 발주 목록이 표시되는가? (데이터가 없으면 빈 상태)

### 테스트 4: 브라우저 개발자 도구 확인

F12 키를 눌러 개발자 도구 열기:

**Console 탭:**
- ✅ 에러 메시지가 없는가?
- ✅ Firebase 연결 메시지가 정상인가?

**Network 탭:**
- ✅ Firebase API 호출이 성공하는가? (200 OK)
- ✅ 리소스 로딩이 정상인가?

---

## 🔍 문제 해결

### 문제 1: 로그인 실패

**증상:**
- "사용자를 찾을 수 없습니다" 오류
- 로그인 버튼 클릭 후 반응 없음

**해결 방법:**
1. Firebase Console에서 users 컬렉션이 생성되었는지 확인
2. 문서 ID가 이메일 주소와 정확히 일치하는지 확인
3. 브라우저 캐시 삭제 후 재시도
4. F12 → Console에서 에러 메시지 확인

### 문제 2: 대시보드 데이터 없음

**증상:**
- KPI 카드에 0 또는 N/A 표시
- 차트가 비어있음

**해결 방법:**
- 정상입니다! 초기 배포 시에는 발주 데이터가 없으므로 대시보드가 비어있습니다.
- "발주 관리" → "엑셀 업로드"로 샘플 데이터를 업로드하세요.

### 문제 3: Firestore 규칙 오류

**증상:**
- "Missing or insufficient permissions" 오류
- 데이터 읽기/쓰기 실패

**해결 방법:**
```bash
# Firestore 규칙 재배포
cd elcanto-scm
npm run deploy:firestore
```

### 문제 4: Storage 업로드 실패

**증상:**
- 증빙 사진 업로드 시 오류
- "Permission denied" 메시지

**해결 방법:**
```bash
# Storage 규칙 재배포
cd elcanto-scm
npm run deploy:storage
```

### 문제 5: 배포 실패

**증상:**
- "Deployment failed" 메시지
- 권한 오류

**해결 방법:**
```bash
# Firebase 재로그인
npx firebase login --reauth

# 프로젝트 재설정
npx firebase use elcanto-scm

# 다시 배포
npm run deploy:all
```

---

## 📊 배포 상태 확인

### Firebase Console 체크리스트

각 항목을 클릭하여 확인:

1. **Hosting**
   - URL: https://console.firebase.google.com/project/elcanto-scm/hosting
   - ✅ 배포 기록 있음
   - ✅ 도메인 활성화됨

2. **Firestore Database**
   - URL: https://console.firebase.google.com/project/elcanto-scm/firestore
   - ✅ `users` 컬렉션 존재
   - ✅ `suppliers` 컬렉션 존재
   - ✅ 규칙이 배포됨

3. **Storage**
   - URL: https://console.firebase.google.com/project/elcanto-scm/storage
   - ✅ 버킷 생성됨
   - ✅ 규칙이 배포됨

4. **Authentication**
   - URL: https://console.firebase.google.com/project/elcanto-scm/authentication
   - ✅ 로그인 방법 구성됨 (이메일/비밀번호)

---

## 🎯 최종 체크리스트

### 배포 전
- [ ] Node.js 설치 확인
- [ ] Firebase 계정 생성
- [ ] Firebase 프로젝트 생성 (elcanto-scm)
- [ ] config.js 업데이트 완료
- [ ] GitHub 저장소 접근 가능

### 배포 중
- [ ] `git clone` 완료
- [ ] `npm install` 완료
- [ ] `npx firebase login` 완료
- [ ] `npm run deploy:all` 완료
- [ ] 배포 성공 메시지 확인
- [ ] 웹사이트 URL 확인

### 배포 후
- [ ] users 컬렉션 생성
- [ ] admin@elcanto.com 계정 생성
- [ ] supplier@aau.com 계정 생성
- [ ] leadTimes 필드 추가 (suppliers/aau)
- [ ] 관리자 로그인 테스트 성공
- [ ] 공급업체 로그인 테스트 성공
- [ ] 대시보드 정상 표시
- [ ] 네비게이션 작동 확인

### 선택 사항
- [ ] 샘플 발주 데이터 업로드
- [ ] 증빙 사진 업로드 테스트
- [ ] Excel 내보내기 테스트
- [ ] 다양한 브라우저에서 테스트
- [ ] 모바일 반응형 확인

---

## 🎉 성공!

축하합니다! 엘칸토 SCM 포털이 성공적으로 배포되었습니다.

**다음 단계:**
1. 실제 생산업체 정보 추가
2. 발주 데이터 엑셀 업로드
3. 공급업체 계정 추가 생성
4. 비밀번호 변경 (보안 강화)

**주요 URL:**
- 🌐 웹사이트: https://elcanto-scm.web.app
- 🎛️ Firebase Console: https://console.firebase.google.com/project/elcanto-scm
- 💻 GitHub: https://github.com/hyeonguk04-cmd/elcanto-scm

---

## 📞 추가 지원

문제가 발생하거나 질문이 있으면:
1. **DEPLOY_GUIDE.md** 참조
2. **QUICKSTART.md** 참조
3. **FIREBASE_SETUP.md** 참조
4. 브라우저 개발자 도구 (F12) 확인
5. Firebase Console 로그 확인

**Firebase 공식 문서:**
- Hosting: https://firebase.google.com/docs/hosting
- Firestore: https://firebase.google.com/docs/firestore
- Storage: https://firebase.google.com/docs/storage
