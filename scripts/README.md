# 🔐 Firebase Authentication 마이그레이션 가이드

## 📋 개요

이 스크립트들은 Firestore users 컬렉션의 28명 사용자를 Firebase Authentication으로 안전하게 마이그레이션합니다.

**핵심 특징:**
- ✅ Custom UID 사용 (문서 ID = Auth UID)
- ✅ 기존 Firestore 데이터 변경 불필요
- ✅ Dry-run 모드로 안전 검증
- ✅ 단계별 테스트 가능

---

## 🚀 빠른 시작

### 1단계: Firebase Admin SDK 서비스 계정 키 다운로드

1. **Firebase Console 접속**: https://console.firebase.google.com
2. **프로젝트 선택**: `elcanto-scm-portal`
3. **Project Settings** (톱니바퀴 아이콘) 클릭
4. **Service Accounts** 탭 선택
5. **"Generate new private key"** 클릭
6. JSON 파일 다운로드
7. 파일명을 **`service-account-key.json`**으로 변경
8. 프로젝트 **루트 디렉토리**에 저장 (`/home/user/webapp/service-account-key.json`)

**⚠️ 보안 주의:**
- 이 파일은 절대 Git에 커밋하지 마세요! (이미 .gitignore에 추가됨)
- 관리자 권한을 가진 민감한 파일입니다

---

### 2단계: 데이터 분석 (읽기 전용, 100% 안전)

```bash
cd Documents/elcanto-scm
node scripts/analyze-users.js
```

**결과 예시:**
```
✅ 마이그레이션 가능: 28명
⚠️ 경고 있음: 0명
❌ 오류 있음: 0명

다음 명령어:
  node scripts/migrate-auth.js --dry-run  # 시뮬레이션
```

**이 단계에서 확인되는 것:**
- UID로 사용 가능한 문서 ID인지
- 필수 필드 (email, password) 존재 여부
- 비밀번호 길이 (최소 6자)
- 이메일 형식 유효성

---

### 3단계: Dry-run 시뮬레이션 (실제 생성 없음, 안전)

```bash
node scripts/migrate-auth.js --dry-run
```

**결과 예시:**
```
🧪 DRY-RUN 모드: 실제 생성 없이 시뮬레이션만 수행

[1/28] 처리 중: yang_hyeonguk
   이메일: yang_hyeonguk@elcanto.co.kr
   ✅ [시뮬레이션] 생성 가능: yang_hyeonguk

...

✅ 성공: 28명
⚠️ 건너뜀: 0명
❌ 실패: 0명
```

**이 단계는:**
- 실제 Firebase Auth에 아무것도 생성하지 않습니다
- 어떤 사용자가 생성될지 미리 확인만 합니다
- 문제가 없는지 검증합니다

---

### 4단계: 테스트 실행 (1명만)

```bash
node scripts/migrate-auth.js --test
```

**결과 예시:**
```
🧪 TEST 모드: 1명만 테스트 생성

[1/28] 처리 중: yang_hyeonguk
   이메일: yang_hyeonguk@elcanto.co.kr
   🔄 Firebase Auth 사용자 생성 중...
   ✅ 생성 완료! UID: yang_hyeonguk

✅ 성공: 1명
```

**이 단계는:**
- 첫 번째 사용자(yang_hyeonguk)만 실제로 생성합니다
- Firebase Console → Authentication에서 확인 가능
- 이 계정으로 로그인 테스트를 먼저 해보세요

**확인 방법:**
1. Firebase Console → Authentication → Users
2. `yang_hyeonguk` UID를 가진 사용자 확인
3. 이메일: `yang_hyeonguk@elcanto.co.kr`

---

### 5단계: 전체 마이그레이션 실행

**⚠️ 주의: 4단계 테스트가 성공한 후에만 실행하세요!**

```bash
node scripts/migrate-auth.js
```

**결과 예시:**
```
🚀 전체 마이그레이션 실행

[1/28] 처리 중: yang_hyeonguk
   ⚠️ 이미 존재하는 사용자 - 건너뜀

[2/28] 처리 중: supplier1
   ✅ 생성 완료! UID: supplier1

...

✅ 성공: 27명
⚠️ 건너뜀: 1명 (이미 존재)
❌ 실패: 0명
```

**이 단계는:**
- 모든 28명의 사용자를 Firebase Auth에 생성합니다
- 이미 존재하는 사용자는 자동으로 건너뜁니다
- 성공/실패 로그를 상세히 기록합니다

---

## 📊 스크립트 상세 설명

### `analyze-users.js` - 데이터 분석

**목적:** 마이그레이션 전 데이터 구조 검증

**안전성:** ✅ 읽기 전용, 데이터 변경 없음

**검증 항목:**
- UID 유효성 (길이, 허용 문자)
- 필수 필드 존재 (email, password, username, role)
- 이메일 형식
- 비밀번호 길이 (최소 6자)

**사용법:**
```bash
node scripts/analyze-users.js
```

---

### `migrate-auth.js` - 마이그레이션 실행

**목적:** Firebase Authentication 사용자 생성

**모드:**
1. **Dry-run** (`--dry-run`): 시뮬레이션만
2. **Test** (`--test`): 1명만 실제 생성
3. **Full** (인자 없음): 전체 실행

**안전 기능:**
- 중복 사용자 자동 건너뛰기
- 필드 누락 자동 건너뛰기
- 상세 로그 기록
- 성공/실패 통계

**사용법:**
```bash
# 시뮬레이션
node scripts/migrate-auth.js --dry-run

# 1명 테스트
node scripts/migrate-auth.js --test

# 전체 실행
node scripts/migrate-auth.js
```

---

## 🔍 트러블슈팅

### 1. "service-account-key.json 파일이 없습니다"

**원인:** 서비스 계정 키 파일이 없거나 경로가 잘못됨

**해결:**
- Firebase Console에서 키 다운로드
- 파일명을 정확히 `service-account-key.json`로 변경
- 프로젝트 루트에 저장 (`Documents/elcanto-scm/`)

---

### 2. "permission-denied" 오류

**원인:** 서비스 계정에 권한이 부족

**해결:**
- Firebase Console → IAM & Admin
- 서비스 계정에 "Firebase Admin" 역할 부여

---

### 3. "auth/uid-already-exists"

**원인:** 이미 존재하는 UID로 생성 시도

**해결:**
- 정상적인 동작입니다 (스크립트가 자동으로 건너뜀)
- Firebase Console에서 기존 사용자 확인

---

### 4. "auth/invalid-uid"

**원인:** UID 형식이 Firebase 규칙에 맞지 않음

**해결:**
- `analyze-users.js`로 문제 있는 UID 확인
- Firestore 문서 ID를 Firebase 허용 형식으로 수정
- 허용 문자: `a-zA-Z0-9_-@.` (최대 128자)

---

### 5. "auth/weak-password"

**원인:** 비밀번호가 6자 미만

**해결:**
- Firestore users 문서의 password 필드 확인
- 최소 6자 이상으로 수정

---

## ✅ 마이그레이션 체크리스트

### 준비 단계
- [ ] Firebase Admin SDK 설치 완료 (`npm install firebase-admin`)
- [ ] 서비스 계정 키 다운로드 및 저장
- [ ] `.gitignore`에 키 파일 추가 확인

### 검증 단계
- [ ] `analyze-users.js` 실행 - 모든 사용자 검증 완료
- [ ] 오류 있는 사용자 수정 (있다면)
- [ ] `migrate-auth.js --dry-run` 실행 - 시뮬레이션 성공

### 실행 단계
- [ ] `migrate-auth.js --test` 실행 - 1명 테스트 성공
- [ ] Firebase Console에서 테스트 사용자 확인
- [ ] 테스트 계정으로 로그인 시도 (auth.js 수정 후)
- [ ] `migrate-auth.js` 전체 실행 - 28명 생성 완료

### 완료 단계
- [ ] Firebase Console에서 모든 사용자 확인
- [ ] auth.js 파일 수정 완료
- [ ] Firestore security rules 업데이트
- [ ] 배포 및 테스트

---

## 📞 도움이 필요하신가요?

문제가 발생하면:
1. 에러 메시지 전체를 복사
2. 실행한 명령어 확인
3. Firebase Console에서 현재 상태 확인
4. 위의 트러블슈팅 섹션 참조

---

## 🎯 다음 단계

마이그레이션 완료 후:

1. **auth.js 수정** - `signInWithEmailAndPassword()` 사용
2. **Firestore rules 업데이트** - UID 매칭 단순화
3. **배포** - `npm run deploy`
4. **테스트** - 모든 사용자 로그인 확인

자세한 내용은 메인 프로젝트 문서를 참조하세요.
