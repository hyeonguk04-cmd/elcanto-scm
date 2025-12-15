# Proton VPN 설치 및 사용 매뉴얼 (Windows PC)
## ELCANTO SCM 접속용 - 전체 과정 가이드

---

## 📋 목차

1. [준비 사항](#1-준비-사항)
2. [Proton VPN 다운로드](#2-proton-vpn-다운로드)
3. [Proton VPN 설치](#3-proton-vpn-설치)
4. [무료 계정 생성](#4-무료-계정-생성)
5. [VPN 서버 연결](#5-vpn-서버-연결)
6. [VPN 작동 확인](#6-vpn-작동-확인)
7. [ELCANTO SCM 접속](#7-elcanto-scm-접속)
8. [문제 해결](#8-문제-해결)

---

## 1. 준비 사항

### ✅ 필요한 것

```
□ Windows PC (Windows 7 이상)
□ 인터넷 연결
□ 관리자 권한
□ 이메일 주소 (VPN 계정 생성용)
□ 예상 소요 시간: 20-30분
```

### 📌 중요 안내

- 본 가이드는 **Windows PC 전용**입니다
- **무료 Proton VPN** 사용 (비용 없음)
- 중국에서 Google Firebase 접속을 위해 **VPN 필수**

---

## 2. Proton VPN 다운로드

### Step 1: 다운로드 사이트 접속

**다운로드 링크:**
```
https://protonvpn.com/download-windows
```

브라우저 주소창에 위 링크를 입력하고 Enter

### Step 2: 설치 파일 다운로드

```
1. 페이지에서 "Download" 버튼 클릭
2. 파일 저장 위치: C:\Users\사용자명\Downloads\
3. 파일명: ProtonVPN_win_v3.x.x.exe
4. 파일 크기: 약 100-150MB
5. 다운로드 완료 대기 (1-5분)
```

### ✅ 확인 사항

```
□ 파일 크기가 100-150MB 정도
□ 파일 확장자가 .exe
□ Downloads 폴더에 저장됨
```

---

## 3. Proton VPN 설치

### Step 1: 설치 파일 실행

```
1. Downloads 폴더 열기
2. ProtonVPN_win_v3.x.x.exe 파일 찾기
3. 파일을 더블클릭
```

### Step 2: Windows 보안 경고 처리

**화면에 "Windows가 PC를 보호했습니다" 표시 시:**

```
1. "추가 정보" 클릭
2. "실행" 버튼 클릭
```

**사용자 계정 컨트롤(UAC) 창 표시 시:**

```
"이 앱이 디바이스를 변경하도록 허용하시겠습니까?"
→ "예" 버튼 클릭
```

### Step 3: 설치 옵션 선택

**"Proton VPN is ready to be installed" 화면:**

![설치 옵션 화면](https://www.genspark.ai/api/files/s/iCRxPcfG)

```
권장 설정:
□ Proton Mail - 체크 해제 ❌
□ Proton Drive - 체크 해제 ❌
□ Proton Pass - 체크 해제 ❌
☑ Create desktop shortcut(s) - 체크 유지 ✅
```

**이유:** VPN만 필요하므로 다른 서비스는 불필요

### Step 4: 설치 진행

```
1. "Install" 버튼 클릭 (오른쪽 하단 파란색 버튼)
2. 설치 진행 대기 (2-3분)
3. 진행률 표시줄 확인
4. "Finish" 버튼 클릭
```

### ✅ 설치 완료 확인

```
□ 바탕화면에 "Proton VPN" 아이콘 생성
□ 설치 완료 메시지 표시
□ 프로그램이 자동으로 실행됨
```

---

## 4. 무료 계정 생성

### Step 1: 계정 생성 시작

설치 완료 후 자동으로 로그인 화면이 열립니다:

![로그인 화면](https://www.genspark.ai/api/files/s/dYlmrNDQ)

```
1. "Create account" 버튼 클릭 (회색 버튼)
   (Sign in 버튼 아래)
```

### Step 2: 계정 정보 입력

**입력 항목:**

```
1. Email 또는 Username:
   - 본인 이메일 주소 입력
   - 예: yourname@gmail.com
   - 예: yourname@qq.com (중국)
   - 예: yourname@163.com (중국)

2. Password (비밀번호):
   - 최소 8자 이상
   - 영문 + 숫자 조합 필수
   - 예: Elcanto2024!
   
   ⚠️ 중요: 이 비밀번호를 꼭 기억하세요!

3. Confirm Password:
   - 위에서 입력한 비밀번호 동일하게 재입력
```

### Step 3: 약관 동의 및 계정 생성

```
1. 이용 약관 체크박스 선택
2. "Create account" 버튼 클릭
```

### Step 4: 이메일 인증

**이메일 확인:**

```
1. 입력한 이메일 계정 접속
2. Proton VPN 인증 메일 찾기
   (제목: "Verify your Proton Account" 또는 유사)
3. 이메일 열기
4. "Verify Email" 또는 인증 링크 클릭
5. 브라우저에서 인증 완료 메시지 확인
```

### Step 5: VPN 앱에서 로그인

```
1. Proton VPN 앱으로 돌아가기
2. 로그인 화면에서 정보 입력:
   - Email: [방금 생성한 이메일]
   - Password: [방금 설정한 비밀번호]
3. "Sign in" 버튼 클릭 (보라색 버튼)
```

### ✅ 로그인 성공 확인

```
□ 환영 화면 표시 ("Welcome to Proton VPN")
□ 서버 목록 보임
□ "Get started" 버튼 표시
```

---

## 5. VPN 서버 연결

### Step 1: 환영 화면 통과

![환영 화면](https://www.genspark.ai/api/files/s/FHLeu1XO)

```
1. "Get started" 버튼 클릭 (보라색 버튼)
2. 메인 화면으로 이동
```

### Step 2: 서버 선택

#### 🌏 추천 서버 우선순위

**1순위: 🇯🇵 Japan (일본)**
```
- 중국에서 가장 빠르고 안정적
- 거리가 가까워 속도 우수
- ELCANTO SCM 접속 최적
```

**2순위: 🇰🇷 South Korea (한국)**
```
- ELCANTO 서버와 동일 국가
- 최적의 연결 품질
- 빠른 속도 보장
```

**3순위: 🇸🇬 Singapore (싱가포르)**
```
- 백업 옵션
- 안정적인 연결
```

**4순위: 🇳🇱 Netherlands (네덜란드)**
```
- 무료 서버 기본 제공
- 유럽 경유
```

### Step 3: Japan 서버 연결 방법

#### 방법 A: 검색 사용 (가장 빠름)

```
1. 상단 "Browse from..." 검색창 클릭
2. "Japan" 입력
3. Japan 서버 선택
4. "Connect" 버튼 클릭
```

#### 방법 B: 목록에서 찾기

```
1. 왼쪽 "Countries (127)" 목록 확인
2. 스크롤하여 "Japan" 찾기
3. Japan 클릭
4. "Connect" 버튼 클릭
```

### Step 4: 연결 대기

![연결 중](https://www.genspark.ai/api/files/s/8kFRVVTp)

```
1. "Connecting..." 메시지 표시
2. 10-30초 대기
3. 연결 진행률 표시
```

### Step 5: 연결 성공 확인

![연결 완료](https://www.genspark.ai/api/files/s/T32HX8Ux)

**화면 표시 내용:**

```
✅ "Protected" 상태 (초록색 자물쇠)
✅ 서버명: Japan - JP-FREE#2 (또는 유사)
✅ 연결 시간 표시 (예: 3 min 47 sec)
✅ 지도에 Japan 위치 표시
✅ VPN IP 주소 표시 (예: 37.19.205.196)
✅ Server load: 81% (또는 비슷한 수치)
```

### ✅ 연결 완료

```
□ "Protected" 표시 확인
□ Japan 서버 연결됨
□ 작업 표시줄에 Proton VPN 아이콘 (초록색)
□ 이제 ELCANTO SCM 접속 가능!
```

---

## 6. VPN 작동 확인

### 🔍 방법 1: IP 주소 확인 (가장 확실)

#### VPN 연결 전 IP 확인

```
1. Proton VPN "Disconnect" 버튼 클릭
2. Chrome 브라우저 열기
3. 주소창에 입력: https://www.whatismyip.com
4. 표시되는 정보 확인:
   - IP Address: xxx.xxx.xxx.xxx
   - Country: China (중국)
5. 스크린샷 저장 📸
```

#### VPN 연결 후 IP 확인

```
1. Proton VPN Japan 서버 연결
2. "Protected" ✅ 상태 확인
3. Chrome에서 다시 접속: https://www.whatismyip.com
4. 표시되는 정보 확인:
   - IP Address: 다른 주소로 변경됨
   - Country: Japan (일본) ✅
5. 스크린샷 저장 📸
```

**결과 판정:**
```
✅ 정상: Country가 "Japan"으로 표시
✅ IP 주소가 완전히 다른 주소
❌ 비정상: 여전히 "China" 표시
```

### 🔍 방법 2: Google 접속 테스트

#### VPN 없이 (중국)

```
1. VPN 연결 끊기
2. Chrome에서 접속: https://www.google.com
3. 결과: 접속 불가 ❌
```

#### VPN 연결 후

```
1. VPN Japan 서버 연결
2. Chrome에서 접속: https://www.google.com
3. 결과: 정상 접속 ✅
```

### 🔍 방법 3: Proton VPN 앱 정보 확인

**앱 화면 하단 정보:**

```
✅ VPN IP: 37.19.xxx.xxx (일본 IP)
✅ Protocol: WireGuard (UDP)
✅ Server: Japan - JP-FREE#2
✅ Status: Protected
✅ Current traffic: 데이터 전송 표시
```

### 📋 빠른 확인 체크리스트

```
VPN 정상 작동 여부:
□ Proton VPN 앱에 "Protected" 표시
□ VPN IP 주소가 일본 IP (37.19.xxx.xxx 형태)
□ Google.com 접속 가능
□ whatismyip.com에서 "Japan" 표시
□ 지도에 Japan 위치 강조 표시
```

---

## 7. ELCANTO SCM 접속

### Step 1: VPN 연결 확인

```
✅ Proton VPN "Protected" 상태
✅ Japan 또는 Korea 서버 연결
✅ 초록색 자물쇠 아이콘
```

### Step 2: 브라우저 열기

```
권장 브라우저:
1. Google Chrome (가장 권장) ⭐⭐⭐⭐⭐
2. Microsoft Edge
3. Firefox
```

### Step 3: ELCANTO SCM 웹사이트 접속

**주소창에 입력:**

```
https://elcanto-scm.web.app
```

**Enter 키 입력**

### Step 4: 페이지 로딩 대기

```
- 첫 접속 시 10-20초 소요
- 페이지 로딩 중 표시
- 로그인 화면 표시 대기
```

### Step 5: 로그인

**로그인 정보 입력:**

```
사용자명: [관리자가 제공한 ID]
비밀번호: [관리자가 제공한 비밀번호]
```

**"로그인" 버튼 클릭**

### Step 6: 접속 성공

```
✅ 시스템 메인 화면 표시
✅ 주문 데이터 조회 가능
✅ 모든 기능 사용 가능
```

### ✅ 접속 완료 체크리스트

```
□ VPN "Protected" 상태 유지
□ ELCANTO SCM 로그인 성공
□ 데이터 정상 표시
□ 모든 메뉴 작동
```

---

## 8. 문제 해결

### 🔧 문제 1: VPN 설치가 안됨

#### 증상

```
- Windows Defender 차단
- "파일이 손상되었습니다" 오류
- 설치 프로그램 실행 안됨
```

#### 해결 방법

**Windows Defender 차단 해제:**

```
1. 다운로드한 파일 우클릭
2. "속성" 선택
3. 하단 "보안" 섹션에서 "차단 해제" 체크
4. "적용" → "확인"
5. 파일 다시 더블클릭
```

**관리자 권한으로 실행:**

```
1. 설치 파일 우클릭
2. "관리자 권한으로 실행" 선택
3. UAC 창에서 "예" 클릭
```

**파일 재다운로드:**

```
1. 기존 파일 삭제
2. https://protonvpn.com/download-windows 재접속
3. 다시 다운로드
4. 파일 크기 확인 (100-150MB)
```

---

### 🔧 문제 2: VPN 연결이 안됨

#### 증상

```
- "Connecting..." 상태에서 멈춤
- "Connection failed" 오류
- 서버에 연결되지 않음
```

#### 해결 방법

**다른 서버로 변경:**

```
1. "Cancel" 버튼 클릭 (연결 취소)
2. 다른 서버 선택:
   Japan → Singapore → Korea → Netherlands
3. "Connect" 버튼 다시 클릭
```

**VPN 재시작:**

```
1. "Disconnect" 클릭
2. 10초 대기
3. 다시 "Connect" 클릭
```

**PC 재부팅:**

```
1. Proton VPN 종료
2. Windows 재시작
3. Proton VPN 다시 실행
4. 서버 연결 시도
```

**방화벽 확인:**

```
1. Windows 방화벽 설정 열기
2. "앱 또는 기능 허용" 클릭
3. "Proton VPN" 찾기
4. "개인" 및 "공용" 모두 체크
5. "확인" 클릭
```

---

### 🔧 문제 3: ELCANTO SCM 접속 안됨

#### 증상

```
- "사이트에 연결할 수 없음" 오류
- 페이지가 로딩되지 않음
- "Failed to get document" 오류
- 타임아웃
```

#### 해결 방법

**VPN 연결 확인:**

```
1. Proton VPN 앱 확인
2. "Protected" 상태인지 확인
3. 아니면 다시 연결
```

**브라우저 캐시 삭제:**

```
Chrome:
1. Ctrl + Shift + Delete 키 입력
2. "전체 기간" 선택
3. "캐시된 이미지 및 파일" 체크
4. "인터넷 사용 기록" 체크
5. "데이터 삭제" 클릭
6. 브라우저 재시작
```

**다른 브라우저 시도:**

```
Chrome → Edge → Firefox 순서로 시도
```

**VPN 서버 변경:**

```
Japan → Korea → Singapore 순서로 변경 시도
```

**강제 새로고침:**

```
1. ELCANTO SCM 페이지에서
2. Ctrl + F5 키 입력
3. 페이지 완전 새로고침
```

---

### 🔧 문제 4: 로그인이 안됨

#### 증상

```
- "Invalid username or password" 오류
- 로그인 버튼 클릭 후 반응 없음
- 페이지가 새로고침됨
```

#### 해결 방법

**계정 정보 재확인:**

```
1. 대소문자 정확히 구분
2. 공백 없이 입력
3. Caps Lock 상태 확인
4. 복사-붙여넣기 시도
```

**비밀번호 재설정:**

```
1. 관리자에게 연락
2. 비밀번호 재설정 요청
3. 임시 비밀번호로 로그인
4. 로그인 후 비밀번호 변경
```

**쿠키 허용 확인:**

```
Chrome 설정:
1. 설정 → 개인정보 및 보안
2. "쿠키 및 기타 사이트 데이터"
3. "모든 쿠키 허용" 선택
4. elcanto-scm.web.app 예외 추가
```

**시크릿 모드 테스트:**

```
1. Ctrl + Shift + N (Chrome 시크릿 모드)
2. https://elcanto-scm.web.app 접속
3. 로그인 시도
4. 성공 시 캐시 문제 확인됨
```

---

### 🔧 문제 5: 데이터가 보이지 않음

#### 증상

```
- 로그인은 되지만 주문 데이터 없음
- 빈 화면만 표시
- "No data available" 메시지
```

#### 해결 방법

**필터 설정 확인:**

```
1. 날짜 범위 확인 및 조정
2. 채널 필터 "전체" 선택
3. 공급업체 필터 "전체" 선택
4. 검색 조건 초기화
```

**권한 확인:**

```
1. 관리자에게 연락
2. 계정 권한 확인 요청
3. supplier ID 매핑 확인
```

**데이터 동기화 대기:**

```
1. 페이지 새로고침 (F5)
2. 1-2분 대기
3. 다시 새로고침
```

**브라우저 콘솔 확인:**

```
1. F12 키 입력 (개발자 도구)
2. "Console" 탭 선택
3. 빨간색 오류 메시지 확인
4. 스크린샷 찍어서 관리자에게 전달
```

---

### 🔧 문제 6: VPN 속도가 느림

#### 증상

```
- 웹사이트 로딩 느림
- 데이터 조회 지연
- 타임아웃 발생
```

#### 해결 방법

**가장 빠른 서버 선택:**

```
1. "Fastest country" 옵션 사용
2. 또는 수동으로 서버 load 확인:
   - 50% 이하: 매우 빠름 ✅
   - 50-80%: 보통 ⚠️
   - 80% 이상: 느림 ❌
```

**서버 변경:**

```
거리순 추천:
1. Japan (가장 가까움)
2. Korea
3. Singapore
4. Netherlands (가장 멀지만 안정적)
```

**네트워크 최적화:**

```
1. 다른 다운로드/업로드 중단
2. WiFi → 유선 랜 케이블 사용
3. 라우터 재시작
4. 동시 접속 디바이스 줄이기
```

---

## 9. 일상적인 사용 방법

### 📅 매일 사용 루틴

```
1. Proton VPN 실행
   - 바탕화면 아이콘 더블클릭
   - 또는 작업 표시줄에서 클릭

2. Japan 서버 연결
   - "Connect" 버튼 클릭
   - "Protected" ✅ 확인

3. Chrome 브라우저 열기
   - https://elcanto-scm.web.app 접속

4. 로그인
   - ID/비밀번호 입력
   - 업무 진행

5. 작업 완료 후
   - 로그아웃
   - VPN "Disconnect" (선택사항)
```

### ⏰ VPN 연결 유지 팁

```
✅ 업무 시간 동안 VPN 연결 유지 권장
✅ 자리 비울 때도 연결 유지
✅ PC 절전 모드 진입 시 자동 재연결
❌ 작업 중 Disconnect 하지 말 것
```

### 💡 배터리 절약 (노트북)

```
업무 중:
- VPN 연결 유지
- 화면 밝기 조절

점심시간/휴식:
- VPN Disconnect 가능
- PC 절전 모드
```

---

## 10. 보안 및 주의사항

### 🔒 계정 보안

```
✅ 비밀번호 복잡하게 설정
✅ 정기적으로 비밀번호 변경 (3개월마다)
✅ 다른 사람과 계정 공유 금지
✅ 공용 PC에서 사용 후 반드시 로그아웃
✅ 비밀번호 자동 저장 기능 사용 주의
```

### ⚠️ VPN 사용 주의사항

```
✅ VPN은 업무 목적으로만 사용
✅ 한국 법률 및 중국 법률 준수
✅ 불법 콘텐츠 접속 금지
✅ 회사 보안 정책 준수
❌ P2P 다운로드 금지
❌ 불법 사이트 접속 금지
```

### 🛡️ 개인정보 보호

```
✅ ELCANTO SCM 계정 정보 보호
✅ 주문 데이터 유출 방지
✅ 스크린샷 공유 시 민감 정보 가리기
✅ 공용 WiFi 사용 시 특히 주의
```

---

## 11. 자주 묻는 질문 (FAQ)

### Q1: VPN 비용이 드나요?

**A:** 무료 버전 사용 가능
```
✅ Proton VPN 무료 버전 제공
✅ 3개국 서버 무료 (Japan, Netherlands, USA)
✅ 속도 제한 없음
✅ 데이터 제한 없음
✅ 업무용으로 충분
❌ 업그레이드 불필요
```

### Q2: 여러 대 PC에서 사용 가능한가요?

**A:** 하나의 계정으로 여러 기기 사용 가능
```
✅ 무료 버전: 1개 기기 동시 연결
✅ 같은 계정을 여러 PC에 설치 가능
✅ 사용 시 하나씩 연결
```

### Q3: 모바일에서도 사용 가능한가요?

**A:** 가능
```
✅ Proton VPN 모바일 앱 제공
✅ Android: APK 직접 설치
✅ iOS: App Store 다운로드 (VPN 가능 시)
✅ 동일 계정 사용
```

### Q4: VPN 없이 접속 가능한 곳은?

**A:** 국가별 상이
```
✅ 한국: VPN 불필요 (직접 접속 가능)
✅ 일본, 싱가포르, 미국: VPN 불필요
⚠️ 중국: VPN 필수 (Google 서비스 차단)
⚠️ 베트남: VPN 권장 (안정성)
```

### Q5: 어떤 서버가 가장 빠른가요?

**A:** 거리순 추천
```
1위: 🇯🇵 Japan - 가장 빠름
2위: 🇰🇷 Korea - ELCANTO 최적
3위: 🇸🇬 Singapore - 안정적
4위: 🇳🇱 Netherlands - 백업용
```

### Q6: VPN 연결이 끊기면?

**A:** 자동 재연결
```
✅ 네트워크 복구 시 자동 재연결 시도
✅ 실패 시 수동으로 "Connect" 클릭
✅ 다른 서버로 변경 시도
```

### Q7: 회사 네트워크에서 VPN 사용 가능한가요?

**A:** 일반적으로 가능
```
✅ 대부분의 회사 네트워크에서 작동
⚠️ 방화벽 설정에 따라 차단될 수 있음
⚠️ 차단 시 IT 부서에 Proton VPN 허용 요청
```

### Q8: VPN 사용이 합법인가요?

**A:** 국가별 상이
```
✅ 한국: 합법
✅ 일본, 미국, 유럽: 합법
⚠️ 중국: 개인 VPN 사용 제한
   - 업무용 목적은 일반적으로 허용
   - 회사 정책 및 현지 법률 준수 필요
```

---

## 12. 연락처 및 지원

### 📞 기술 지원

```
담당자: 양형욱
이메일: yang_hyeonguk@elcanto.co.kr
지원 시간: 평일 09:00-18:00 (한국 시간)
```

### 📧 문의 시 포함 정보

```
1. 회사명
2. 사용자 이름
3. 사용 환경:
   - Windows 버전 (예: Windows 10)
   - VPN 서버 (예: Japan)
4. 문제 상황:
   - 발생 시간
   - 오류 메시지
   - 스크린샷
5. 시도한 해결 방법
6. 연락 가능 시간
```

### 🌐 유용한 링크

```
ELCANTO SCM: https://elcanto-scm.web.app

Proton VPN:
- 공식 사이트: https://protonvpn.com
- Windows 다운로드: https://protonvpn.com/download-windows
- 지원 센터: https://protonvpn.com/support

IP 확인 사이트:
- https://www.whatismyip.com
- https://ipinfo.io
```

---

## 13. 체크리스트

### ✅ 설치 완료 체크리스트

```
□ Proton VPN 다운로드 완료
□ 설치 완료 (바탕화면 아이콘 확인)
□ 무료 계정 생성
□ 이메일 인증 완료
□ VPN 로그인 성공
□ Japan 서버 연결 테스트
□ "Protected" 상태 확인
□ IP 주소 변경 확인
□ ELCANTO SCM 접속 성공
□ 로그인 및 데이터 확인
```

### ✅ 일일 사용 체크리스트

```
□ Proton VPN 실행
□ Japan 또는 Korea 서버 연결
□ "Protected" 상태 확인
□ Chrome 브라우저 열기
□ ELCANTO SCM 접속
□ 로그인
□ 업무 진행
□ 작업 완료 후 로그아웃
```

---

## 14. 빠른 참조 카드

### 🎯 핵심 정보

```
VPN 다운로드: https://protonvpn.com/download-windows
ELCANTO SCM: https://elcanto-scm.web.app
IP 확인: https://www.whatismyip.com
기술 지원: yang_hyeonguk@elcanto.co.kr
```

### 🚀 빠른 연결 순서

```
1. Proton VPN 실행
2. Japan 서버 선택
3. Connect 클릭
4. Protected ✅ 확인
5. Chrome 열기
6. elcanto-scm.web.app 접속
```

### 🔧 긴급 문제 해결

```
VPN 연결 안됨:
→ 다른 서버 시도 (Japan → Korea → Singapore)

웹사이트 접속 안됨:
→ VPN "Protected" 확인
→ 브라우저 캐시 삭제 (Ctrl+Shift+Delete)

로그인 안됨:
→ ID/비밀번호 재확인
→ 관리자 연락
```

---

## 📋 버전 정보

```
문서 버전: 1.0
최종 업데이트: 2025-12-15
언어: 한국어
대상: Windows PC 사용자
작성자: ELCANTO IT Team
```

---

## ✨ 성공적인 설치와 사용을 축하합니다!

**이제 중국에서도 ELCANTO SCM을 안전하게 사용할 수 있습니다.**

추가 지원이 필요하시면 언제든 연락주시기 바랍니다.

📧 **이메일**: yang_hyeonguk@elcanto.co.kr

---

**END OF MANUAL**
