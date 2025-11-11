# Firebase 설정 가이드

ELCANTO SCM Portal의 Firebase 설정 방법입니다.

## 1. Firebase 프로젝트 설정

### 1.1 Firebase Console에서 프로젝트 설정 확인

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. `elcanto-scm` 프로젝트 선택
3. 프로젝트 설정 (⚙️ 아이콘) > 프로젝트 설정 클릭
4. "내 앱" 섹션에서 웹 앱 선택
5. Firebase SDK 구성 정보 복사

### 1.2 Firebase 설정 값 업데이트

`public/js/config.js` 파일을 열고 다음 값들을 실제 값으로 교체:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCFqJnQsfSug8B5--Ilq8wuDnTNOvy8gqE",
  authDomain: "elcanto-scm.firebaseapp.com",
  projectId: "elcanto-scm",
  storageBucket: "elcanto-scm.firebasestorage.app",
  messagingSenderId: "408396102729",
  appId: "1:408396102729:web:c80b150f1ff9046dac9398",
  measurementId: "G-LLCK1MV0DK"
};
```

## 2. Firestore 데이터베이스 설정

### 2.1 Firestore 활성화

1. Firebase Console > Firestore Database 메뉴
2. "데이터베이스 만들기" 클릭
3. 시작 모드: **프로덕션 모드** 선택
4. 위치: **asia-northeast3 (서울)** 선택
5. 완료

### 2.2 Firestore 보안 규칙 배포

터미널에서 다음 명령어 실행:

```bash
firebase deploy --only firestore:rules
```

### 2.3 Firestore 인덱스 배포

```bash
firebase deploy --only firestore:indexes
```

### 2.4 초기 데이터 설정

#### Suppliers 컬렉션 생성

Firestore Console에서 `suppliers` 컬렉션을 생성하고 다음 샘플 데이터를 추가:

```json
{
  "name": "성안",
  "country": "중국",
  "contact": "김담당",
  "email": "shengan@example.com",
  "phone": "+86-123-4567",
  "location": "웨이하이",
  "paymentTerms": "T/T",
  "deliveryTerms": "FOB",
  "forwarder": "업체별 상이",
  "mainChannel": "IM, ELCANTO",
  "mainItem": "신발",
  "leadTimes": {
    "material_upper": 7,
    "material_sole": 7,
    "hando_cfm": 2,
    "cutting": 3,
    "upper_making": 10,
    "assembly": 7,
    "self_inspection": 2,
    "final_inspection": 2,
    "factory_shipment": 3,
    "shipping": 2,
    "arrival": 0,
    "logistics_arrival": 2
  },
  "status": "active",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### Users 컬렉션 생성

`users` 컬렉션을 생성하고 관리자 계정 추가:

```json
{
  "username": "admin",
  "password": "admin123",
  "name": "관리자",
  "email": "admin@elcanto.com",
  "role": "admin",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

생산업체 계정 추가:

```json
{
  "username": "shengan",
  "password": "user123",
  "name": "성안",
  "email": "shengan@example.com",
  "role": "supplier",
  "supplierName": "성안",
  "country": "중국",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**⚠️ 보안 주의사항**: 실제 운영 환경에서는 평문 비밀번호 저장 금지! Firebase Authentication 또는 암호화 사용 필수.

## 3. Firebase Storage 설정

### 3.1 Storage 활성화

1. Firebase Console > Storage 메뉴
2. "시작하기" 클릭
3. 보안 규칙: **프로덕션 모드** 선택
4. 위치: **asia-northeast3 (서울)** 선택

### 3.2 Storage 보안 규칙 배포

```bash
firebase deploy --only storage
```

### 3.3 폴더 구조

Storage에 다음 폴더가 자동으로 생성됩니다:
- `/evidences/{orderId}/` - 공정 증빙 사진 저장

## 4. Firebase Authentication 설정 (선택사항)

현재는 Firestore 기반 로그인을 사용하지만, 향후 Firebase Authentication 사용 권장:

### 4.1 Authentication 활성화

1. Firebase Console > Authentication 메뉴
2. "시작하기" 클릭
3. 로그인 방법 설정:
   - 이메일/비밀번호 활성화
   - Custom Authentication (선택사항)

### 4.2 사용자 계정 생성

Authentication > Users 탭에서 관리자 및 생산업체 계정 추가

## 5. Firebase Hosting 설정

### 5.1 Hosting 초기화 (이미 완료됨)

```bash
firebase init hosting
```

### 5.2 배포

```bash
firebase deploy --only hosting
```

배포 완료 후 다음 URL에서 접속 가능:
- https://elcanto-scm.web.app
- https://elcanto-scm.firebaseapp.com

## 6. 로컬 개발 환경

### 6.1 Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 6.2 Firebase 로그인

```bash
firebase login
```

### 6.3 로컬 서버 실행

```bash
firebase serve
```

로컬에서 `http://localhost:5000` 접속

### 6.4 Firebase 에뮬레이터 사용 (선택사항)

개발 시 로컬 에뮬레이터 사용 권장:

```bash
firebase emulators:start
```

`public/js/config.js`에서 에뮬레이터 활성화:

```javascript
if (isDevelopment && true) { // false를 true로 변경
  db.useEmulator('localhost', 8080);
  auth.useEmulator('http://localhost:9099');
  storage.useEmulator('localhost', 9199);
}
```

## 7. 데이터 마이그레이션

기존 하드코딩된 데이터를 Firestore로 마이그레이션:

### 7.1 Suppliers 데이터 마이그레이션

```javascript
// 브라우저 콘솔에서 실행
const suppliersData = [
  { name: '성안', country: '중국', ... },
  { name: 'AAU', country: '베트남', ... },
  // ... 모든 생산업체
];

suppliersData.forEach(async (supplier) => {
  await db.collection('suppliers').add({
    ...supplier,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
});
```

### 7.2 Users 데이터 마이그레이션

```javascript
const usersData = [
  { username: 'admin', password: 'admin123', role: 'admin', ... },
  { username: 'shengan', password: 'user123', role: 'supplier', ... },
  // ... 모든 사용자
];

usersData.forEach(async (user) => {
  await db.collection('users').add({
    ...user,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
});
```

## 8. 트러블슈팅

### 문제: Firebase 초기화 오류

**원인**: `config.js`에 실제 설정값이 입력되지 않음

**해결**: Firebase Console에서 프로젝트 설정 확인 후 `config.js` 업데이트

### 문제: Firestore 권한 오류

**원인**: 보안 규칙이 배포되지 않았거나 잘못됨

**해결**: 
```bash
firebase deploy --only firestore:rules
```

### 문제: Storage 업로드 실패

**원인**: Storage 보안 규칙 미배포

**해결**:
```bash
firebase deploy --only storage
```

### 문제: 로그인 실패

**원인**: users 컬렉션에 사용자 데이터 없음

**해결**: Firestore Console에서 users 컬렉션 확인 및 데이터 추가

## 9. 보안 체크리스트

- [ ] Firebase 설정값이 코드에 하드코딩되어 있지만 public (괜찮음, API 키는 제한된 권한)
- [ ] Firestore 보안 규칙이 적절히 설정됨
- [ ] Storage 보안 규칙이 적절히 설정됨
- [ ] 비밀번호가 평문으로 저장되지 않음 (향후 개선 필요)
- [ ] 프로덕션 환경에서 에뮬레이터 비활성화
- [ ] CORS 설정 확인

## 10. 다음 단계

1. ✅ Firebase 프로젝트 설정 완료
2. ✅ Firestore, Storage 활성화
3. ✅ 보안 규칙 배포
4. ✅ 초기 데이터 입력
5. ✅ 로컬 테스트
6. ✅ Firebase Hosting 배포
7. 🔄 사용자 피드백 수집 및 개선

## 지원

문제가 발생하면 다음을 확인하세요:
- Firebase Console의 로그
- 브라우저 개발자 도구의 콘솔
- Firebase CLI 로그

추가 도움이 필요하면 Firebase 공식 문서 참조:
- https://firebase.google.com/docs
