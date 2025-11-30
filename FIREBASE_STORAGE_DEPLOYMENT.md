# Firebase Storage Rules 배포 가이드

## 🎯 목적
엑셀 업로드 시 스타일 이미지를 Firebase Storage에 업로드할 수 있도록 권한 설정

## ❌ 현재 문제
```
FirebaseError: Firebase Storage: User does not have permission to access 
'style-images/LCWD71U613_xxx.jpeg'. (storage/unauthorized)
```

## ✅ 해결 방법

### 방법 1: Firebase CLI 사용 (권장)

#### 1. Firebase CLI 로그인
```bash
npx firebase login
```
- 브라우저가 열리면 Google 계정으로 로그인
- elcanto-scm 프로젝트 권한이 있는 계정 사용

#### 2. Storage 규칙 배포
```bash
# Storage 규칙만 배포 (빠름)
npx firebase deploy --only storage

# 또는 모든 규칙 배포
npx firebase deploy
```

#### 3. 배포 확인
```bash
npx firebase projects:list
```
- `elcanto-scm` 프로젝트가 목록에 있는지 확인

---

### 방법 2: Firebase Console 사용

#### 1. Firebase Console 접속
1. https://console.firebase.google.com/ 접속
2. `elcanto-scm` 프로젝트 선택

#### 2. Storage Rules 페이지로 이동
1. 왼쪽 메뉴에서 **Storage** 클릭
2. 상단 탭에서 **Rules** 클릭

#### 3. 규칙 수정
현재 규칙을 다음으로 **전체 교체**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 증빙자료 업로드 규칙
    match /evidences/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     request.resource.size < 10 * 1024 * 1024 &&
                     request.resource.contentType.matches('image/.*');
    }
    
    // 스타일 이미지 업로드 규칙 (신규 추가)
    match /style-images/{allPaths=**} {
      // 읽기: 모든 사용자 (공개 이미지)
      allow read: if true;
      
      // 쓰기: 인증된 사용자, 이미지 파일만, 최대 10MB
      allow write: if request.auth != null &&
                     request.resource.size < 10 * 1024 * 1024 &&
                     request.resource.contentType.matches('image/.*');
    }
    
    // 프로필 이미지 규칙
    match /profiles/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     request.auth.uid == userId &&
                     request.resource.size < 5 * 1024 * 1024 &&
                     request.resource.contentType.matches('image/.*');
    }
  }
}
```

#### 4. 게시
- 상단의 **게시(Publish)** 버튼 클릭
- 확인 메시지에서 **게시** 클릭

---

## 📝 규칙 설명

### style-images 폴더 규칙
```javascript
match /style-images/{allPaths=**} {
  allow read: if true;  // 모든 사용자 읽기 가능
  allow write: if request.auth != null &&  // 로그인한 사용자만
                 request.resource.size < 10 * 1024 * 1024 &&  // 10MB 이하
                 request.resource.contentType.matches('image/.*');  // 이미지만
}
```

#### 보안 정책:
- ✅ **읽기**: 공개 (제품 이미지이므로 누구나 볼 수 있어야 함)
- ✅ **쓰기**: 인증된 사용자만 업로드 가능
- ✅ **파일 크기**: 최대 10MB
- ✅ **파일 타입**: 이미지 파일만 허용 (JPEG, PNG, GIF, BMP 등)

---

## 🧪 배포 후 테스트

### 1. 브라우저 캐시 삭제
- `Ctrl + Shift + Delete` (Windows/Linux)
- `Cmd + Shift + Delete` (Mac)
- 또는 시크릿/프라이빗 모드 사용

### 2. 페이지 새로고침
```
Ctrl + F5 (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 3. 엑셀 업로드 테스트
1. 생산 목표일정 수립 메뉴 접속
2. 템플릿 다운로드
3. 이미지가 포함된 엑셀 작성
4. 엑셀 업로드
5. 브라우저 콘솔(F12) 확인:
   ```
   ✅ 이미지 1 업로드 완료: https://...
   ✅ 이미지 2 업로드 완료: https://...
   ```

### 4. 성공 확인
- 업로드 후 테이블에 이미지 썸네일 표시
- 이미지 클릭 시 확대 팝업 표시
- 콘솔에 403 에러가 없어야 함

---

## 🔧 문제 해결

### 문제 1: 배포 후에도 403 에러 발생
**원인**: 브라우저 캐시  
**해결**: 
1. 완전히 로그아웃
2. 브라우저 캐시 삭제
3. 다시 로그인
4. 재시도

### 문제 2: Firebase CLI 로그인 실패
**원인**: 계정 권한 부족  
**해결**: 
1. Firebase Console에서 프로젝트 권한 확인
2. 소유자 또는 편집자 권한 필요
3. 권한이 없으면 프로젝트 소유자에게 요청

### 문제 3: "Project not found" 오류
**원인**: .firebaserc 설정 문제  
**해결**:
```bash
# 프로젝트 다시 설정
npx firebase use elcanto-scm

# 확인
npx firebase projects:list
```

---

## 📞 추가 지원
배포 중 문제가 발생하면:
1. 에러 메시지 전체 복사
2. 브라우저 콘솔(F12) 스크린샷
3. Firebase Console의 규칙 스크린샷
4. GitHub Issue 또는 PR 댓글로 공유

---

## 📚 참고 자료
- [Firebase Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Firebase Console](https://console.firebase.google.com/)
