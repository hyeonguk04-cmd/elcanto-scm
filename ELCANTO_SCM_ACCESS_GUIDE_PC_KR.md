# ELCANTO SCM 시스템 접속 가이드 - Windows PC용
## 한국 사용자 / 관리자용

---

## 📱 웹사이트 정보

**주소**: https://elcanto-scm.web.app

**중요 안내**: 
- 본 시스템은 Google Firebase 서비스를 사용합니다
- 국내에서는 VPN 없이 정상 접속 가능합니다
- 중국/베트남 생산업체는 VPN 필요
- 본 가이드는 **Windows PC 사용자** 대상입니다

---

## 🌟 방법 1: 국내에서 직접 접속 ⭐⭐⭐⭐⭐

### 접속 방법

국내에서는 VPN 없이 바로 접속 가능합니다.

**1단계: 브라우저 열기**
```
권장 브라우저:
1. Google Chrome (가장 권장)
2. Microsoft Edge
3. Firefox
4. 기타 최신 브라우저
```

**2단계: 웹사이트 접속**
```
1. 브라우저 주소창에 입력: https://elcanto-scm.web.app
2. Enter 키 입력
3. 페이지 로딩 대기 (최초 10-20초)
```

**3단계: 시스템 로그인**
```
로그인 화면에서:
1. 사용자명 입력: [관리자가 제공한 ID]
2. 비밀번호 입력: [관리자가 제공한 비밀번호]
3. "로그인" 버튼 클릭
4. 시스템 메인 화면 진입 ✅
```

---

## 🌟 방법 2: 해외 생산업체 접속 지원 (VPN 방식)

중국/베트남 생산업체의 접속을 지원하는 경우에 사용합니다.

### 준비 사항

**필요한 파일:**
- Proton VPN 설치 파일 (Windows용 .exe)
- 접속 가이드 문서 (중국어/베트남어)

**다운로드 링크:**
- Proton VPN Windows: https://protonvpn.com/download-windows
- 파일명: `ProtonVPN_win_v3.x.x.exe`
- 파일 크기: 약 100-150MB

### 파일 전달 방법

**방법 A: USB 드라이브 (가장 확실)**
```
1. Proton VPN 설치 파일(.exe) 다운로드
2. USB 드라이브에 복사
3. 접속 가이드 문서도 함께 복사:
   - 중국어: ELCANTO_SCM_ACCESS_GUIDE_PC_CN.md
   - 베트남어: ELCANTO_SCM_ACCESS_GUIDE_PC_VN.md
4. 생산업체 방문 시 직접 전달
5. 현장에서 설치 지원
```

**방법 B: 클라우드 공유 (원격 전달)**
```
1. Google Drive 또는 Dropbox에 파일 업로드
2. 공유 링크 생성
3. 이메일로 링크 전송
   - 중국: 이메일 또는 WeChat
   - 베트남: 이메일 또는 Zalo
4. 전화/화상으로 설치 안내
```

**방법 C: 웹 링크 공유 (가장 간편)**
```
Firebase에 배포된 가이드 링크 전송:

중국어 가이드:
https://elcanto-scm.web.app/guide-cn.html

베트남어 가이드:
https://elcanto-scm.web.app/guide-vn.txt
```

### 생산업체에게 전달할 메시지

**중국 생산업체용 (WeChat/QQ)**
```
您好！

请访问以下链接查看 ELCANTO SCM 系统访问指南：

🔗 中文指南: https://elcanto-scm.web.app/guide-cn.html

VPN下载: https://protonvpn.com/download-windows

如需帮助，请联系：yang_hyeonguk@elcanto.co.kr

ELCANTO 技术支持
```

**베트남 생산업체용 (Zalo/Email)**
```
Xin chào!

Vui lòng truy cập link sau để xem hướng dẫn:

🔗 Hướng dẫn: https://elcanto-scm.web.app/guide-vn.txt

VPN Download: https://protonvpn.com/download-windows

Liên hệ: yang_hyeonguk@elcanto.co.kr

ELCANTO Support Team
```

---

## 🔧 VPN 설치 지원 가이드

생산업체의 VPN 설치를 원격으로 지원하는 경우:

### 사전 확인 사항

```
체크리스트:
□ 생산업체 PC가 Windows인지 확인
□ 관리자 권한이 있는지 확인
□ 인터넷 연결 상태 확인
□ 이메일 주소 확인 (VPN 계정 생성용)
□ 통화 또는 화상회의 가능 여부
```

### 설치 단계별 지원

**1단계: 파일 다운로드 확인**
```
질문 사항:
- 파일을 다운로드 받으셨나요?
- 파일 위치를 찾으셨나요? (Downloads 폴더)
- 파일 크기가 맞나요? (100-150MB)
```

**2단계: 설치 진행**
```
안내 사항:
1. 파일을 더블클릭하세요
2. Windows 보안 경고가 나오면:
   - "추가 정보" 클릭
   - "실행" 클릭
3. "예" 버튼 클릭 (관리자 권한)
4. Next → I agree → Next → Install
5. 2-3분 기다리세요
6. Finish 클릭
```

**3단계: 계정 생성**
```
안내 사항:
1. Proton VPN 아이콘 더블클릭
2. "Create Free Account" 클릭
3. 이메일 주소 입력
4. 비밀번호 생성 (8자 이상, 영문+숫자)
5. 비밀번호 확인 입력
6. "Create Account" 클릭
7. 이메일 확인 → 인증 링크 클릭
```

**4단계: VPN 연결**
```
안내 사항:
1. 이메일과 비밀번호로 로그인
2. 서버 목록에서 "Japan" 선택 (추천)
   또는 "Singapore" 또는 "Korea"
3. "Connect" 버튼 클릭
4. 초록색 "Connected" 표시 확인 ✅
5. 작업 표시줄에 초록색 방패 아이콘 확인
```

**5단계: 시스템 접속 테스트**
```
확인 사항:
1. 브라우저 열기 (Chrome 권장)
2. 주소 입력: https://elcanto-scm.web.app
3. 페이지가 정상적으로 열리는지 확인
4. 로그인 화면이 보이는지 확인
5. 테스트 로그인 진행
```

---

## 🔍 문제 해결 가이드

### 문제 1: 국내에서 접속 안됨

**증상:**
- "사이트에 연결할 수 없음" 오류
- 페이지가 로딩되지 않음
- "Failed to get document" 오류

**해결 방법:**
```
1. 인터넷 연결 확인
   - 다른 웹사이트 접속 테스트
   - WiFi/유선 연결 상태 확인

2. 브라우저 캐시 삭제
   - Chrome: Ctrl+Shift+Delete
   - "전체 기간" 선택
   - "캐시된 이미지 및 파일" 체크
   - "데이터 삭제" 클릭

3. 다른 브라우저로 시도
   - Edge, Firefox 등

4. 방화벽/백신 확인
   - Firebase 도메인 허용 필요:
     * elcanto-scm.web.app
     * elcanto-scm.firebaseapp.com
     * firebaseio.com
     * googleapis.com

5. DNS 변경 시도
   - Cloudflare DNS: 1.1.1.1
   - Google DNS: 8.8.8.8
```

### 문제 2: 생산업체 VPN 연결 실패

**증상:**
- "Connection failed" 오류
- 계속 "Connecting..." 상태
- VPN은 연결되지만 웹사이트 접속 안됨

**해결 방법:**
```
1. 다른 서버로 변경
   순서: Japan → Singapore → Korea → Netherlands

2. VPN 재시작
   - Disconnect 클릭
   - 10초 대기
   - 다시 Connect

3. PC 재부팅
   - VPN 종료
   - Windows 재시작
   - VPN 다시 실행

4. 방화벽 확인
   - Windows 방화벽에서 Proton VPN 허용
   - 백신 프로그램 일시 중지 후 테스트

5. 대안: TeamViewer 사용
   - VPN 대신 원격 접속 방식
   - 한국 사무실 PC에 TeamViewer 설치
   - 생산업체에서 원격으로 접속
```

### 문제 3: 로그인 실패

**증상:**
- "Invalid username or password" 오류
- 로그인 버튼 클릭 후 반응 없음
- 페이지가 새로고침됨

**해결 방법:**
```
1. 계정 정보 재확인
   - 대소문자 정확히 입력
   - 공백 없이 입력
   - Caps Lock 상태 확인

2. 비밀번호 재설정
   - 관리자에게 비밀번호 재설정 요청
   - 임시 비밀번호로 로그인 후 변경

3. 브라우저 쿠키 허용 확인
   - 쿠키 차단 설정 해제
   - 시크릿 모드에서 테스트

4. 계정 상태 확인
   - Firestore에서 사용자 계정 활성화 여부
   - 권한 설정 확인
```

### 문제 4: 데이터가 보이지 않음

**증상:**
- 로그인은 되지만 주문 데이터가 없음
- 빈 화면만 표시됨
- "No data available" 메시지

**해결 방법:**
```
1. 권한 확인
   - 해당 계정의 supplier ID 확인
   - Firestore 보안 규칙 확인
   - 관리자 권한 부여 여부 확인

2. 필터 설정 확인
   - 날짜 범위 확인
   - 채널/공급업체 필터 초기화
   - "전체" 옵션 선택

3. 브라우저 콘솔 확인
   - F12 키로 개발자 도구 열기
   - Console 탭에서 오류 메시지 확인
   - 오류 메시지를 IT 팀에 전달

4. 데이터 동기화 대기
   - 새로 입력한 데이터는 1-2분 후 표시
   - 페이지 새로고침 (F5)
```

---

## 📊 시스템 관리

### Firebase 콘솔 접근

**Firebase Console:**
- URL: https://console.firebase.google.com
- 프로젝트: elcanto-scm

**주요 관리 항목:**

1. **Authentication (사용자 관리)**
```
- 새 사용자 계정 생성
- 비밀번호 재설정
- 계정 활성화/비활성화
- 이메일 인증 상태 확인
```

2. **Firestore (데이터베이스)**
```
- 주문 데이터 확인
- 공정 진행 상태 조회
- 공급업체 정보 관리
- 증빙자료 확인
```

3. **Storage (파일 저장소)**
```
- 업로드된 증빙 이미지 관리
- 파일 용량 모니터링
- 불필요한 파일 삭제
```

4. **Hosting (배포 관리)**
```
- 배포 히스토리 확인
- 롤백 (이전 버전 복구)
- 배포 상태 모니터링
```

### 보안 규칙 관리

**Firestore Security Rules:**
```javascript
// 위치: firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 기본 인증 확인
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // 관리자 확인
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 공급업체 확인
    function isSupplier(supplierId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.supplierId == supplierId;
    }
    
    // 주문 컬렉션
    match /orders/{orderId} {
      allow read: if isAuthenticated();
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || isSupplier(resource.data.supplierId);
    }
    
    // 공정 컬렉션
    match /processes/{processId} {
      allow read, update: if isAuthenticated();
      allow create, delete: if isAdmin();
    }
  }
}
```

### 사용자 계정 생성 절차

**Firebase Authentication에서:**

1. **관리자 계정 생성**
```
1. Firebase Console → Authentication
2. "사용자 추가" 클릭
3. 이메일: admin@elcanto.co.kr
4. 비밀번호: [강력한 비밀번호 생성]
5. "사용자 추가" 클릭
```

2. **Firestore에 사용자 정보 추가**
```
1. Firestore Database 이동
2. "users" 컬렉션 선택
3. "문서 추가" 클릭
4. 문서 ID: [Authentication의 UID 사용]
5. 필드 추가:
   - email: admin@elcanto.co.kr
   - role: "admin"
   - name: "관리자"
   - createdAt: [현재 타임스탬프]
6. "저장" 클릭
```

3. **공급업체 계정 생성**
```
1. Authentication에서 이메일/비밀번호로 생성
2. Firestore users 컬렉션에 추가:
   - email: supplier@company.com
   - role: "supplier"
   - supplierId: "SUP001" (suppliers 컬렉션의 ID)
   - name: "공급업체명"
   - createdAt: [타임스탬프]
```

---

## 🚀 배포 관리

### Firebase 배포 방법

**로컬에서 배포:**

```bash
# 1. Firebase CLI 로그인
firebase login

# 2. 프로젝트 선택 확인
firebase use elcanto-scm

# 3. 배포 실행
firebase deploy

# 4. Hosting만 배포 (빠름)
firebase deploy --only hosting

# 5. Firestore 규칙만 배포
firebase deploy --only firestore:rules

# 6. Storage 규칙만 배포
firebase deploy --only storage
```

**GitHub Actions 자동 배포:**

```
main 브랜치에 push하면 자동으로 Firebase에 배포됩니다.

확인 방법:
1. GitHub 저장소 → Actions 탭
2. 최근 워크플로우 실행 상태 확인
3. 성공 시 자동으로 https://elcanto-scm.web.app 업데이트
```

### 긴급 롤백 (이전 버전 복구)

**문제 발생 시:**

```
1. Firebase Console → Hosting
2. "배포 기록" 확인
3. 이전 정상 버전 선택
4. "롤백" 버튼 클릭
5. 확인 후 즉시 이전 버전으로 복구됨
```

---

## 💡 운영 팁

### 일상적인 모니터링

**매일 확인 사항:**
```
□ 시스템 접속 상태 (https://elcanto-scm.web.app)
□ Firebase Console에서 에러 로그 확인
□ Storage 용량 사용률 확인 (무료: 5GB)
□ 사용자 계정 상태 확인
□ 최근 주문 데이터 동기화 상태
```

**주간 확인 사항:**
```
□ 전체 데이터 백업
□ 불필요한 파일 정리
□ 사용자 계정 활동 검토
□ 보안 규칙 업데이트 필요 여부
□ 시스템 성능 모니터링
```

### 백업 및 복구

**Firestore 데이터 백업:**
```bash
# Firebase CLI로 백업
gcloud firestore export gs://elcanto-scm.appspot.com/backups/$(date +%Y%m%d)

# 복구
gcloud firestore import gs://elcanto-scm.appspot.com/backups/20251215
```

**수동 백업 (권장):**
```
1. Firestore Console에서 중요 컬렉션 확인
2. "내보내기" 기능 사용
3. Google Cloud Storage에 저장
4. 주기적으로 로컬에 다운로드
```

### 성능 최적화

**속도 개선 방법:**
```
1. 이미지 최적화
   - 업로드 전 압축 (권장: 500KB 이하)
   - WebP 포맷 사용 고려

2. 인덱스 생성
   - Firestore 복합 쿼리용 인덱스 추가
   - 자주 조회하는 필드 인덱싱

3. 캐싱 활용
   - Firebase Hosting 자동 CDN 활용
   - 브라우저 캐시 설정 최적화

4. 쿼리 최적화
   - 필요한 필드만 조회
   - 페이지네이션 구현
   - limit() 사용으로 데이터 제한
```

---

## 🔐 보안 관리

### 권장 보안 조치

**계정 보안:**
```
1. 강력한 비밀번호 정책
   - 최소 12자 이상
   - 영문 대소문자 + 숫자 + 특수문자
   - 정기적 변경 (3개월마다)

2. 이중 인증 (2FA) 활성화
   - Firebase 관리자 계정
   - GitHub 계정
   - Google Cloud Console

3. 접근 권한 최소화
   - 필요한 권한만 부여
   - 역할 기반 접근 제어 (RBAC)
   - 정기적 권한 검토
```

**시스템 보안:**
```
1. HTTPS 강제 (이미 적용됨)
2. CORS 설정 확인
3. API 키 보호 (환경 변수 사용)
4. 정기적 보안 업데이트
5. 의심스러운 활동 모니터링
```

### 비상 연락처

**기술 지원:**
```
담당자: 양형욱
이메일: yang_hyeonguk@elcanto.co.kr
전화: [전화번호 추가]
```

**Firebase 지원:**
```
Firebase 지원 센터: https://firebase.google.com/support
스택 오버플로우: https://stackoverflow.com/questions/tagged/firebase
```

---

## 📞 기술 지원

### 문제 보고 시 포함 정보

**기본 정보:**
```
1. 문제 발생 시간 (정확한 일시)
2. 사용자 계정 (이메일 또는 UID)
3. 사용 환경
   - 운영체제: Windows 10/11
   - 브라우저: Chrome/Edge/Firefox
   - 브라우저 버전
4. 문제 재현 단계
5. 오류 메시지 (스크린샷 포함)
6. 브라우저 콘솔 로그 (F12 → Console)
```

**이메일 양식:**
```
제목: [ELCANTO SCM] 문제 보고 - [간단한 설명]

내용:
1. 문제 요약:
   [간략히 설명]

2. 발생 시간:
   2025-12-15 14:30

3. 사용자 정보:
   - 계정: user@example.com
   - 역할: admin/supplier

4. 환경:
   - OS: Windows 10
   - 브라우저: Chrome 120
   
5. 재현 단계:
   1) [첫 번째 단계]
   2) [두 번째 단계]
   3) [문제 발생]

6. 오류 메시지:
   [스크린샷 첨부]

7. 기타:
   [추가 정보]
```

---

## ✅ 체크리스트

### 초기 설정 체크리스트

**시스템 관리자:**
```
□ Firebase 프로젝트 생성 완료
□ Authentication 활성화
□ Firestore 데이터베이스 생성
□ Storage 버킷 생성
□ 보안 규칙 배포
□ 관리자 계정 생성
□ GitHub 저장소 연동
□ 자동 배포 설정
□ 도메인 설정 (선택)
□ 백업 정책 수립
```

**생산업체 지원:**
```
□ VPN 설치 파일 다운로드
□ 접속 가이드 문서 준비 (중/베트남어)
□ 계정 정보 생성
□ 테스트 로그인 확인
□ 연락처 공유
□ 원격 지원 도구 준비 (TeamViewer 등)
```

### 일일 운영 체크리스트

```
□ 시스템 정상 작동 확인
□ 새 주문 데이터 동기화 확인
□ 사용자 로그인 이슈 없음
□ 증빙 자료 업로드 정상
□ 에러 로그 확인
□ Storage 용량 확인
```

---

## 📚 참고 자료

**Firebase 문서:**
- Firebase 시작하기: https://firebase.google.com/docs
- Authentication: https://firebase.google.com/docs/auth
- Firestore: https://firebase.google.com/docs/firestore
- Storage: https://firebase.google.com/docs/storage
- Hosting: https://firebase.google.com/docs/hosting

**Proton VPN:**
- 공식 사이트: https://protonvpn.com
- Windows 다운로드: https://protonvpn.com/download-windows
- 지원 센터: https://protonvpn.com/support

**개발 도구:**
- GitHub 저장소: https://github.com/hyeonguk04-cmd/elcanto-scm
- Firebase Console: https://console.firebase.google.com
- Google Cloud Console: https://console.cloud.google.com

---

## 📋 버전 정보

**문서 버전**: 1.0  
**최종 업데이트**: 2025년 12월 15일  
**언어**: 한국어  
**대상**: Windows PC 사용자, 시스템 관리자

---

**ELCANTO SCM 시스템을 이용해 주셔서 감사합니다!**

기술 지원이 필요하시면 언제든 연락 주시기 바랍니다.

📧 **이메일**: yang_hyeonguk@elcanto.co.kr
