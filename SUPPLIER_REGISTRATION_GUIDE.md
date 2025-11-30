# 생산업체 등록 가이드

## 📋 등록 순서 (중요!)

### ✅ 올바른 순서
```
1단계: 사용자 관리 → 사용자 등록 (username 생성)
   ↓
2단계: 생산업체 관리 → 업체 추가 (username으로 업체 정보 등록)
```

### ❌ 잘못된 순서
```
생산업체 관리 먼저 등록 → 실패! (username이 없음)
```

---

## 🗄️ Firebase Database 구조

### 1. Users 컬렉션 (`users`)

```javascript
users/
├─ yu_soojeong/                    // 문서 ID = username
│  ├─ username: "yu_soojeong"      // username 필드
│  ├─ email: "yu_soojeong@elcanto.co.kr"
│  ├─ name: "유수정"               // 실제 이름
│  ├─ role: "supplier"             // 역할: admin or supplier
│  ├─ uid: "04qa6o5r..."           // Firebase Auth UID (별도)
│  ├─ createdAt: timestamp
│  └─ lastLogin: timestamp
│
├─ semongnice/                     // 다른 사용자
│  ├─ username: "semongnice"
│  └─ ...
```

**핵심 포인트**:
- ✅ **문서 ID = username** (예: `yu_soojeong`)
- ✅ `username` 필드도 동일한 값
- ✅ Firebase Auth의 `uid`는 별도 필드에 저장
- ✅ `name`은 실제 사람 이름 (예: "유수정")

---

### 2. Suppliers 컬렉션 (`suppliers`)

```javascript
suppliers/
├─ yu_soojeong/                    // 문서 ID = username (users와 동일)
│  ├─ username: "yu_soojeong"      // users 컬렉션과 매칭
│  ├─ name: "모프제화"             // 업체명 (회사명)
│  ├─ country: "한국"
│  ├─ contactPerson: "담당자명"
│  ├─ email: "contact@company.com"
│  ├─ phone: "010-1234-5678"
│  ├─ leadTimes: {
│  │   material: 7,
│  │   hando_cfm: 2,
│  │   cutting_upper: 13,
│  │   ...
│  │ }
│  ├─ createdAt: timestamp
│  └─ updatedAt: timestamp
```

**핵심 포인트**:
- ✅ **문서 ID = username** (users 컬렉션과 동일)
- ✅ `username` 필드로 users와 매칭
- ✅ `name`은 업체명/회사명 (예: "모프제화")
- ✅ **1:1 관계**: 한 사용자 = 한 업체

---

## 🔗 데이터 매칭 구조

```
┌─────────────────────────────┐       ┌──────────────────────────────┐
│     users 컬렉션            │       │    suppliers 컬렉션          │
├─────────────────────────────┤       ├──────────────────────────────┤
│ 문서 ID: yu_soojeong        │◄─────►│ 문서 ID: yu_soojeong         │
├─────────────────────────────┤  1:1  ├──────────────────────────────┤
│ username: "yu_soojeong"     │◄─────►│ username: "yu_soojeong"      │
│ name: "유수정" (실제 이름)  │       │ name: "모프제화" (업체명)    │
│ role: "supplier"            │       │ country: "한국"              │
│ email: "yu_soo...@.."       │       │ contactPerson: "담당자"      │
│ uid: "04qa6o5r..."          │       │ leadTimes: {...}             │
└─────────────────────────────┘       └──────────────────────────────┘
```

**매칭 방식**:
- `users/{username}` ↔ `suppliers/{username}`
- 동일한 `username`으로 1:1 매칭
- 한 사용자 계정은 하나의 업체만 등록 가능

---

## 📝 상세 등록 절차

### 1단계: 사용자 등록 (User Management)

#### 위치
**사용자 관리** 메뉴 → **사용자 추가** 버튼

#### 입력 항목
```javascript
{
  username: "company_user1",     // 필수! (영문+숫자+_)
  name: "홍길동",                 // 실제 이름
  email: "user@company.com",     // 이메일
  password: "********",          // 비밀번호
  role: "supplier"               // 역할 선택
}
```

#### 코드 동작 (user-management.js)
```javascript
// 사용자 생성
const authResult = await firebase.auth().createUserWithEmailAndPassword(email, password);

// Firestore에 저장: users/{username}
await window.db.collection('users').doc(userData.username).set({
  username: userData.username,
  email: userData.email,
  name: userData.name,
  role: userData.role,
  uid: authResult.user.uid,      // Firebase Auth UID
  createdAt: serverTimestamp()
});
```

**결과**:
- ✅ Firebase Authentication에 사용자 생성
- ✅ Firestore `users/{username}` 문서 생성
- ✅ `username`이 문서 ID로 사용됨

---

### 2단계: 생산업체 등록 (Supplier Management)

#### 위치
**생산업체 관리** 메뉴 → **업체 추가** 버튼

#### 입력 항목
```javascript
{
  // username은 자동으로 현재 로그인 사용자의 username 사용
  name: "모프제화",               // 업체명 (필수)
  country: "한국",                // 국가 (필수)
  contactPerson: "담당자명",      // 담당자 (필수)
  email: "contact@company.com",
  phone: "010-1234-5678",
  leadTimes: {
    material: 7,
    hando_cfm: 2,
    cutting_upper: 13,
    assembly: 7,
    factory_shipment: 3,
    shipping: 2,
    arrival: 5
  }
}
```

#### 코드 동작 (firestore-service.js)
```javascript
export async function addSupplier(supplierData) {
  // 1. 현재 로그인한 사용자의 username 가져오기
  const currentUser = getCurrentUser();
  const supplierId = currentUser.username;  // 예: "yu_soojeong"
  
  // 2. 중복 체크 (한 사용자당 하나의 업체만)
  const existingDoc = await db.collection('suppliers').doc(supplierId).get();
  if (existingDoc.exists) {
    throw new Error('이미 등록된 업체가 있습니다.');
  }
  
  // 3. Firestore에 저장: suppliers/{username}
  await db.collection('suppliers').doc(supplierId).set({
    ...supplierData,
    username: currentUser.username,  // username 명시적 저장
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
```

**결과**:
- ✅ Firestore `suppliers/{username}` 문서 생성
- ✅ `users` 컬렉션의 `username`과 매칭
- ✅ 중복 방지 (한 계정당 하나의 업체)

---

## 🔍 확인 방법

### Firebase Console에서 확인

1. **Firebase Console** 접속: https://console.firebase.google.com/
2. **elcanto-scm** 프로젝트 선택
3. **Firestore Database** 클릭

#### Users 컬렉션 확인
```
users/
  └─ yu_soojeong
     ├─ username: "yu_soojeong"  ✓
     ├─ name: "유수정"
     └─ role: "supplier"
```

#### Suppliers 컬렉션 확인
```
suppliers/
  └─ yu_soojeong                 ✓ (동일한 ID)
     ├─ username: "yu_soojeong"  ✓ (매칭)
     ├─ name: "모프제화"
     └─ country: "한국"
```

**확인 포인트**:
- ✅ 두 컬렉션의 문서 ID가 동일한가?
- ✅ 두 컬렉션의 `username` 필드가 동일한가?
- ✅ `users`의 `name`과 `suppliers`의 `name`이 다른가? (사람 이름 vs 회사명)

---

## ⚠️ 주의사항

### 1. 등록 순서를 반드시 지켜야 합니다
```
❌ 잘못: 생산업체 관리 먼저 → 에러 발생!
✅ 올바름: 사용자 관리 → 생산업체 관리
```

### 2. Username 중복 불가
- 각 username은 고유해야 합니다
- 이미 존재하는 username으로는 등록할 수 없습니다

### 3. 1:1 관계 엄수
- 한 사용자는 하나의 업체만 등록 가능
- 이미 업체를 등록한 사용자는 추가 등록 불가
- 업체 정보를 변경하려면 **수정** 기능 사용

### 4. Name 필드의 구분
- **users.name**: 실제 사람 이름 (예: "유수정")
- **suppliers.name**: 회사/업체명 (예: "모프제화")

### 5. 문서 ID는 자동 설정
- 수동으로 변경 불가
- `username`이 자동으로 문서 ID가 됩니다

---

## 🔧 관리자 Excel 업로드 (특별 기능)

관리자는 Excel을 통해 여러 업체를 한번에 등록할 수 있습니다.

### Excel 파일 형식
```
| username | 업체명 | 국가 | 담당자 | 이메일 | ... |
|----------|--------|------|--------|--------|-----|
| user1    | 업체A  | 중국 | 홍길동 | ...    | ... |
| user2    | 업체B  | 한국 | 김철수 | ...    | ... |
```

### 처리 방식
```javascript
// addSupplierWithUsername 함수 사용
for (const row of excelData) {
  const username = row['username'];  // Excel에서 username 읽기
  
  // suppliers/{username} 문서 생성
  await addSupplierWithUsername(supplierData, username);
}
```

**주의**: 
- Excel의 `username`이 `users` 컬렉션에 이미 존재해야 합니다
- 존재하지 않는 `username`으로는 등록할 수 없습니다

---

## 📞 문제 해결

### 문제 1: "이미 등록된 업체가 있습니다" 에러
**원인**: 해당 username으로 이미 suppliers 문서가 존재  
**해결**:
1. Firebase Console에서 `suppliers/{username}` 확인
2. 기존 업체 정보를 삭제하거나
3. **수정** 기능으로 업체 정보 변경

### 문제 2: "로그인 정보를 찾을 수 없습니다" 에러
**원인**: 현재 로그인한 사용자의 정보가 없음  
**해결**:
1. 로그아웃 후 다시 로그인
2. 브라우저 캐시 삭제
3. `sessionStorage`에 `currentUser` 확인

### 문제 3: Username 매칭 안됨
**원인**: users 컬렉션과 suppliers 컬렉션의 username 불일치  
**해결**:
1. Firebase Console에서 두 컬렉션의 문서 ID 확인
2. `username` 필드가 정확히 일치하는지 확인
3. 불일치 시 suppliers 문서 삭제 후 재등록

---

## 📚 코드 참조

### 관련 파일
- `public/js/user-management.js`: 사용자 등록
- `public/js/manufacturer-management.js`: 생산업체 관리 UI
- `public/js/firestore-service.js`: 
  - `addSupplier()`: 일반 업체 등록
  - `addSupplierWithUsername()`: 관리자 Excel 업로드
- `public/js/auth.js`: `getCurrentUser()` 함수

### 핵심 함수
```javascript
// 1. 사용자 생성 (user-management.js)
async function createUser(userData) {
  const authResult = await firebase.auth()
    .createUserWithEmailAndPassword(email, password);
  
  await db.collection('users').doc(userData.username).set({
    username: userData.username,
    ...
  });
}

// 2. 업체 등록 (firestore-service.js)
export async function addSupplier(supplierData) {
  const currentUser = getCurrentUser();
  const supplierId = currentUser.username;
  
  await db.collection('suppliers').doc(supplierId).set({
    ...supplierData,
    username: currentUser.username
  });
}
```

---

## ✅ 체크리스트

등록 전 확인사항:

- [ ] 사용자 관리에서 사용자 등록 완료
- [ ] 로그인 성공 확인
- [ ] Firebase Console에서 `users/{username}` 문서 확인
- [ ] `username` 필드가 문서 ID와 동일한지 확인
- [ ] 생산업체 관리에서 업체 정보 입력
- [ ] 등록 후 `suppliers/{username}` 문서 생성 확인
- [ ] 두 컬렉션의 `username`이 일치하는지 확인

---

이 가이드를 참고하여 올바른 순서로 등록하시면 됩니다! 🎉
