# 🚀 Firebase 터미널 배포 가이드

## ✅ 사전 준비사항

1. **Node.js 설치 확인**
   ```bash
   node --version  # v14 이상 필요
   npm --version
   ```

2. **GitHub 저장소 URL**
   - 예시: `https://github.com/your-username/elcanto-scm.git`

3. **Firebase 프로젝트 ID**
   - 프로젝트 ID: `elcanto-scm`
   - Firebase Console에서 확인 가능

---

## 📦 1단계: 프로젝트 클론 및 설정

### 1-1. 저장소 클론
```bash
# 원하는 디렉토리로 이동
cd ~/Documents  # 또는 원하는 경로

# GitHub에서 프로젝트 클론
git clone https://github.com/your-username/elcanto-scm.git
cd elcanto-scm

# 프로젝트 구조 확인
ls -la
```

### 1-2. 의존성 설치
```bash
# Firebase CLI 및 의존성 설치
npm install

# 설치 확인
npx firebase --version
```

---

## 🔐 2단계: Firebase 로그인

### 2-1. Firebase 로그인
```bash
npx firebase login
```

**실행 결과:**
- 브라우저가 자동으로 열림
- Google 계정으로 로그인
- "Firebase CLI Login Successful" 메시지 확인
- 터미널에 "✔ Success! Logged in as your-email@gmail.com" 표시

### 2-2. 프로젝트 연결 확인
```bash
# 현재 프로젝트 확인
npx firebase projects:list

# elcanto-scm 프로젝트가 목록에 있는지 확인
```

### 2-3. 프로젝트 활성화 (이미 firebase.json에 설정되어 있음)
```bash
# .firebaserc 파일 확인
cat .firebaserc
```

**예상 출력:**
```json
{
  "projects": {
    "default": "elcanto-scm"
  }
}
```

---

## 🔥 3단계: Firebase 배포

### 3-1. 전체 배포 (권장 - 처음 배포시)
```bash
npm run deploy:all
```

**또는 개별 명령어:**
```bash
npx firebase deploy --only firestore:rules,storage,hosting
```

**배포되는 항목:**
- ✅ Firestore 보안 규칙 (`firestore.rules`)
- ✅ Storage 보안 규칙 (`storage.rules`)
- ✅ 웹 애플리케이션 (`public/` 폴더)

### 3-2. 개별 배포 (필요시)

#### Firestore 규칙만 배포
```bash
npm run deploy:firestore
# 또는
npx firebase deploy --only firestore:rules
```

#### Storage 규칙만 배포
```bash
npm run deploy:storage
# 또는
npx firebase deploy --only storage
```

#### 웹사이트만 배포
```bash
npm run deploy:hosting
# 또는
npx firebase deploy --only hosting
```

---

## 📊 4단계: 배포 결과 확인

### 4-1. 배포 성공 메시지
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/elcanto-scm/overview
Hosting URL: https://elcanto-scm.web.app
```

### 4-2. 웹사이트 접속
```bash
# 브라우저에서 열기
open https://elcanto-scm.web.app
# 또는
open https://elcanto-scm.firebaseapp.com
```

### 4-3. Firebase Console에서 확인
1. **Hosting 확인**: https://console.firebase.google.com/project/elcanto-scm/hosting
   - 배포 기록 확인
   - 도메인 확인

2. **Firestore 규칙 확인**: https://console.firebase.google.com/project/elcanto-scm/firestore/rules
   - 규칙이 배포되었는지 확인

3. **Storage 규칙 확인**: https://console.firebase.google.com/project/elcanto-scm/storage/rules
   - 규칙이 배포되었는지 확인

---

## 🗄️ 5단계: 초기 데이터 설정

배포 후 Firestore에서 초기 데이터를 설정해야 합니다.

### 5-1. users 컬렉션 생성
Firebase Console > Firestore Database > 데이터 시작

#### 관리자 계정 생성
```
컬렉션 ID: users
문서 ID: admin@elcanto.com

필드:
- email: "admin@elcanto.com" (string)
- password: "admin123" (string)  ⚠️ 나중에 변경 필요
- role: "admin" (string)
- name: "엘칸토 관리자" (string)
- createdAt: [현재 타임스탬프]
```

#### 공급업체 계정 생성
```
컬렉션 ID: users
문서 ID: supplier@aau.com

필드:
- email: "supplier@aau.com" (string)
- password: "supplier123" (string)  ⚠️ 나중에 변경 필요
- role: "supplier" (string)
- name: "AAU Vietnam" (string)
- supplierId: "aau" (string)
- createdAt: [현재 타임스탬프]
```

### 5-2. suppliers 문서에 leadTimes 추가

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

---

## 🧪 6단계: 로그인 테스트

### 6-1. 관리자 로그인
1. https://elcanto-scm.web.app 접속
2. 이메일: `admin@elcanto.com`
3. 비밀번호: `admin123`
4. 로그인 → 대시보드 확인

### 6-2. 공급업체 로그인
1. 로그아웃 후
2. 이메일: `supplier@aau.com`
3. 비밀번호: `supplier123`
4. 로그인 → 생산 현황 확인

---

## 🔧 문제 해결

### 로그인 실패 시
```bash
# 브라우저 개발자 도구 확인
F12 → Console 탭 확인
```

**흔한 오류:**
- `Missing or insufficient permissions`: Firestore 규칙 재배포 필요
- `Network error`: config.js의 Firebase 설정 확인
- `User not found`: users 컬렉션 생성 확인

### 배포 실패 시
```bash
# Firebase 로그인 상태 확인
npx firebase login --reauth

# 프로젝트 재설정
npx firebase use elcanto-scm

# 캐시 클리어 후 재배포
rm -rf .firebase
npm run deploy:all
```

### 규칙 배포 오류 시
```bash
# 규칙 파일 검증
npx firebase firestore:rules:validate

# Storage 규칙 검증
npx firebase storage:rules:validate
```

---

## 📝 유용한 명령어 모음

```bash
# Firebase 프로젝트 목록
npx firebase projects:list

# 현재 프로젝트 확인
npx firebase use

# 배포 상태 확인
npx firebase hosting:channel:list

# 로그 확인
npx firebase deploy --debug

# 로컬 에뮬레이터 실행 (개발용)
npx firebase emulators:start

# 특정 버전으로 롤백
npx firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID TARGET_SITE_ID
```

---

## 🎯 다음 단계

1. ✅ 배포 완료
2. ✅ 초기 데이터 설정
3. ✅ 로그인 테스트
4. 📸 실제 발주 데이터 입력
5. 📊 대시보드 데이터 확인
6. 🔐 비밀번호 변경 기능 추가 (향후 개선)
7. 📧 이메일 인증 기능 추가 (향후 개선)

---

## 🚀 빠른 배포 체크리스트

- [ ] `git clone` 프로젝트
- [ ] `npm install` 실행
- [ ] `npx firebase login` 로그인
- [ ] `npm run deploy:all` 전체 배포
- [ ] Firebase Console에서 users 컬렉션 생성
- [ ] 관리자 계정 생성 (admin@elcanto.com)
- [ ] 공급업체 계정 생성 (supplier@aau.com)
- [ ] suppliers 문서에 leadTimes 추가
- [ ] 웹사이트 접속 테스트
- [ ] 로그인 테스트

---

## 📞 지원

문제가 발생하면:
1. 브라우저 개발자 도구 (F12) 확인
2. Firebase Console 로그 확인
3. GitHub Issues에 문제 보고

**Firebase Console**: https://console.firebase.google.com/project/elcanto-scm
**Hosting URL**: https://elcanto-scm.web.app
