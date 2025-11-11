# ⚡ 빠른 시작 가이드 (5분 배포)

Firebase에 배포하는 가장 빠른 방법입니다.

## 🎯 목표
- ✅ Firebase에 웹사이트 배포
- ✅ 로그인 가능하도록 설정
- ✅ 대시보드 작동 확인

## 📋 필요한 것
- Node.js 설치 (v14 이상)
- Firebase 프로젝트 생성 완료
- GitHub 저장소 URL

---

## 🚀 터미널 명령어 (복사해서 실행)

### 1️⃣ 프로젝트 클론 및 이동
```bash
cd ~/Documents
git clone https://github.com/your-username/elcanto-scm.git
cd elcanto-scm
```

### 2️⃣ 의존성 설치
```bash
npm install
```

### 3️⃣ Firebase 로그인
```bash
npx firebase login
```
→ 브라우저가 열리면 Google 계정으로 로그인

### 4️⃣ 전체 배포 (한 번에!)
```bash
npm run deploy:all
```
또는
```bash
./deploy.sh all
```

**완료!** 🎉

배포가 완료되면 URL이 표시됩니다:
- https://elcanto-scm.web.app
- https://elcanto-scm.firebaseapp.com

---

## 🗄️ 초기 데이터 설정 (Firebase Console)

배포 후 브라우저에서 진행:

### 1. Firebase Console 접속
https://console.firebase.google.com/project/elcanto-scm/firestore

### 2. users 컬렉션 생성

**"컬렉션 시작" 클릭 → 컬렉션 ID: `users`**

#### 관리자 계정
```
문서 ID: admin@elcanto.com

필드 추가:
- email: "admin@elcanto.com"
- password: "admin123"
- role: "admin"
- name: "엘칸토 관리자"
- createdAt: [타임스탬프]
```

#### 공급업체 계정
```
문서 ID: supplier@aau.com

필드 추가:
- email: "supplier@aau.com"
- password: "supplier123"
- role: "supplier"
- name: "AAU Vietnam"
- supplierId: "aau"
- createdAt: [타임스탬프]
```

### 3. suppliers 문서에 leadTimes 추가

**Firestore → suppliers → aau 문서 열기**

"필드 추가" 클릭:
```
필드 이름: leadTimes
유형: map

맵 내부에 다음 필드들 추가 (모두 number 타입):
- material_upper: 7
- material_sole: 7
- hando_cfm: 2
- cutting: 3
- upper_making: 10
- assembly: 7
- self_inspection: 2
- final_inspection: 2
- factory_shipment: 3
- shipping: 2
- arrival: 0
- logistics_arrival: 2
```

---

## 🧪 로그인 테스트

1. **웹사이트 접속**: https://elcanto-scm.web.app
2. **관리자 로그인**:
   - 이메일: `admin@elcanto.com`
   - 비밀번호: `admin123`
3. **대시보드 확인**: KPI 카드, 차트 등 표시되는지 확인

---

## 🎯 완료 체크리스트

- [ ] `npm install` 완료
- [ ] `npx firebase login` 완료
- [ ] `npm run deploy:all` 완료
- [ ] 웹사이트 URL 접속 가능
- [ ] users 컬렉션 생성
- [ ] 관리자 계정 생성
- [ ] 공급업체 계정 생성
- [ ] leadTimes 필드 추가
- [ ] 로그인 테스트 성공

---

## 🔧 문제 해결

### 배포 실패?
```bash
# Firebase 재로그인
npx firebase login --reauth

# 프로젝트 재설정
npx firebase use elcanto-scm

# 다시 배포
npm run deploy:all
```

### 로그인 안됨?
- F12 → Console 탭에서 에러 확인
- users 컬렉션이 제대로 생성되었는지 확인
- Firestore 규칙이 배포되었는지 확인

### 대시보드 빈 화면?
- suppliers 컬렉션에 데이터가 있는지 확인
- leadTimes 필드가 추가되었는지 확인

---

## 📝 다음 단계

배포 완료 후:
1. 실제 주문 데이터 입력
2. 공급업체 계정으로 생산 현황 업데이트
3. 증빙 사진 업로드 테스트
4. Excel 내보내기 테스트

---

## 📚 자세한 가이드

더 자세한 내용은 다음 문서 참조:
- **DEPLOY_GUIDE.md**: 상세한 배포 가이드
- **FIREBASE_SETUP.md**: Firebase 설정 가이드
- **README.md**: 프로젝트 전체 문서

---

## 🎉 성공!

축하합니다! 엘칸토 SCM 포털이 Firebase에 배포되었습니다.

**웹사이트**: https://elcanto-scm.web.app
**관리자 콘솔**: https://console.firebase.google.com/project/elcanto-scm
