# ELCANTO SCM VPN 접속 가이드 종합 요약

## 📋 작성 완료된 가이드 문서

### 1. 한국어 가이드 (관리자/국내 사용자용)
- **파일명**: `ELCANTO_SCM_ACCESS_GUIDE_PC_KR.md`
- **웹 링크**: https://elcanto-scm.web.app/guide-kr.txt
- **대상**: 시스템 관리자, 국내 사용자
- **주요 내용**:
  - 국내 직접 접속 방법 (VPN 불필요)
  - 해외 생산업체 VPN 지원 가이드
  - Firebase 시스템 관리 방법
  - 문제 해결 및 운영 가이드
  - 보안 규칙 및 배포 관리

### 2. 중국어 가이드 (중국 생산업체용)
- **파일명**: `ELCANTO_SCM_ACCESS_GUIDE_PC_CN.md`
- **웹 링크 (HTML)**: https://elcanto-scm.web.app/guide-cn.html
- **대상**: 중국 생산업체 Windows PC 사용자
- **주요 내용**:
  - VPN 설치 파일 다운로드 방법
  - 단계별 설치 가이드 (스크린샷 설명 포함)
  - 무료 계정 생성 방법
  - 서버 선택 및 연결 방법
  - 상세한 문제 해결 가이드
  - 기술 지원 연락처

### 3. 베트남어 가이드 (베트남 생산업체용)
- **파일명**: `ELCANTO_SCM_ACCESS_GUIDE_PC_VN.md`
- **웹 링크**: https://elcanto-scm.web.app/guide-vn.txt
- **대상**: 베트남 생산업체 Windows PC 사용자
- **주요 내용**:
  - VPN 설치 및 설정 가이드
  - 계정 생성 및 로그인 방법
  - 시스템 접속 테스트
  - 일반적인 문제 해결
  - 지원 연락처

---

## 🚀 배포 상태

### Git 커밋 히스토리
```
ce8851e - docs: Add Korean VPN access guide for system administrators
80d84c4 - docs: Add VPN access guides for China and Vietnam producers (Windows PC)
901494d - fix: Add horizontal scroll to process detail modal table
34fc5a5 - fix: Fix modal scrolling and close button issues on mobile
```

### Firebase 배포
- **자동 배포**: GitHub main 브랜치 push 시 자동 배포
- **예상 배포 시간**: 2-3분
- **배포 URL**: https://elcanto-scm.web.app

---

## 📥 파일 전달 방법

### 방법 1: 웹 링크 공유 (가장 간편, 추천!)

**한국 관리자/사용자:**
```
https://elcanto-scm.web.app/guide-kr.txt
```

**중국 생산업체:**
```
https://elcanto-scm.web.app/guide-cn.html
```

**베트남 생산업체:**
```
https://elcanto-scm.web.app/guide-vn.txt
```

### 방법 2: VPN 설치 파일 다운로드

**Proton VPN Windows:**
- 다운로드: https://protonvpn.com/download-windows
- 파일명: `ProtonVPN_win_v3.x.x.exe`
- 크기: 약 100-150MB
- 무료 버전: 3개국 서버 (일본, 싱가포르, 네덜란드 등)

### 방법 3: USB 전달 (현장 지원)

**준비 파일:**
1. `ProtonVPN_win_v3.x.x.exe` (VPN 설치 파일)
2. 가이드 문서 (중국어/베트남어)
3. 연락처 정보

---

## 💬 생산업체 전달 메시지 템플릿

### 중국 생산업체 (WeChat/QQ)

```
您好！

为了访问 ELCANTO SCM 系统，请查看以下指南：

📱 系统网址: https://elcanto-scm.web.app
📖 详细指南: https://elcanto-scm.web.app/guide-cn.html
🔧 VPN下载: https://protonvpn.com/download-windows

指南包含：
✅ VPN 安装步骤（附图说明）
✅ 常见问题解决方案
✅ 推荐服务器设置
   - 第一选择: 日本 (Japan)
   - 第二选择: 新加坡 (Singapore)
   - 第三选择: 韩国 (Korea)

技术支持: yang_hyeonguk@elcanto.co.kr

祝您使用愉快！
ELCANTO 技术支持团队
```

### 베트남 생산업체 (Zalo/Email)

```
Xin chào!

Để truy cập hệ thống ELCANTO SCM, vui lòng xem hướng dẫn:

📱 Website: https://elcanto-scm.web.app
📖 Hướng dẫn chi tiết: https://elcanto-scm.web.app/guide-vn.txt
🔧 Tải VPN: https://protonvpn.com/download-windows

Nội dung hướng dẫn:
✅ Các bước cài đặt VPN
✅ Giải pháp các lỗi thường gặp
✅ Server đề xuất:
   - Ưu tiên 1: Nhật Bản (Japan)
   - Ưu tiên 2: Singapore
   - Ưu tiên 3: Hàn Quốc (Korea)

Hỗ trợ kỹ thuật: yang_hyeonguk@elcanto.co.kr

Chúc bạn sử dụng tốt!
ELCANTO Support Team
```

---

## 🔧 VPN 원격 지원 체크리스트

### 사전 확인
```
□ 생산업체 PC: Windows 7 이상
□ 관리자 권한 확보
□ 인터넷 연결 상태 양호
□ 이메일 주소 준비 (VPN 계정용)
□ 통화/화상회의 가능
□ 예상 소요 시간: 20-30분
```

### 설치 단계별 지원 스크립트

**1단계: 파일 다운로드 (5분)**
```
Q: "VPN 설치 파일을 받으셨나요?"
A: "Downloads 폴더를 확인해보세요"

Q: "파일 크기가 100-150MB 정도인가요?"
A: "맞으면 정상입니다"
```

**2단계: 설치 진행 (5분)**
```
안내:
1. "파일을 더블클릭하세요"
2. "Windows 보안 경고가 나오면 '추가 정보' → '실행' 클릭"
3. "'예' 버튼 클릭 (관리자 권한)"
4. "Next → I agree → Next → Install"
5. "2-3분 기다리세요"
6. "Finish 클릭"
```

**3단계: 계정 생성 (5분)**
```
안내:
1. "바탕화면 Proton VPN 아이콘 더블클릭"
2. "'Create Free Account' 클릭"
3. "이메일 주소 입력"
4. "비밀번호 생성 (8자 이상, 영문+숫자)"
5. "'Create Account' 클릭"
6. "이메일 확인 → 인증 링크 클릭"
```

**4단계: VPN 연결 (5분)**
```
안내:
1. "이메일과 비밀번호로 로그인"
2. "서버 목록에서 'Japan' 선택"
   (대안: Singapore, Korea)
3. "'Connect' 버튼 클릭"
4. "초록색 'Connected' 확인 ✅"
5. "작업 표시줄에 초록색 방패 아이콘 확인"
```

**5단계: 접속 테스트 (5분)**
```
확인:
1. "Chrome 브라우저 열기"
2. "주소 입력: https://elcanto-scm.web.app"
3. "로그인 화면 표시 확인"
4. "테스트 로그인"
5. "데이터 확인 ✅"
```

---

## 🔍 자주 묻는 질문 (FAQ)

### Q1: VPN 없이 접속 가능한가요?
**A**: 
- 🇰🇷 한국: VPN 불필요 (직접 접속 가능)
- 🇨🇳 중국: VPN 필수 (Google 서비스 차단)
- 🇻🇳 베트남: VPN 권장 (연결 안정성)

### Q2: VPN 비용이 드나요?
**A**: Proton VPN 무료 버전 사용 가능
- 무료 제공: 3개국 서버
- 속도 제한 없음
- 데이터 제한 없음
- 업그레이드 불필요 (업무용 충분)

### Q3: 어떤 서버를 선택해야 하나요?
**A**: 우선순위
1. 🇯🇵 일본 (Japan) - 가장 빠름
2. 🇸🇬 싱가포르 (Singapore) - 안정적
3. 🇰🇷 한국 (Korea) - 최적
4. 🇳🇱 네덜란드 (Netherlands) - 백업

### Q4: VPN 연결이 안되면?
**A**: 
1. 다른 서버 시도
2. VPN 재시작
3. PC 재부팅
4. 방화벽 확인
5. 대안: TeamViewer 원격 접속

### Q5: 모바일에서도 사용 가능한가요?
**A**: 
- 웹사이트는 모바일 최적화 완료
- Proton VPN 모바일 앱 제공
- Android: APK 직접 설치
- iOS: App Store 다운로드 (VPN 가능 시)

### Q6: 여러 명이 동시에 사용 가능한가요?
**A**: 
- 각자 VPN 계정 생성 필요
- 동시 접속 제한 없음
- 계정별 독립적 운영

---

## 📞 기술 지원

### 연락처
```
담당자: 양형욱
이메일: yang_hyeonguk@elcanto.co.kr
전화: [전화번호]
지원 시간: 평일 09:00-18:00 (한국 시간)
```

### 문의 시 필요 정보
```
1. 회사명
2. 사용 환경 (Windows 버전)
3. 문제 상황 (스크린샷 첨부)
4. 시도한 해결 방법
5. 연락 가능 시간
```

---

## ✅ 최종 체크리스트

### 관리자 준비사항
```
□ VPN 설치 파일 다운로드 완료
□ 가이드 문서 링크 확인
□ 생산업체 연락처 정리
□ 메시지 템플릿 준비
□ 원격 지원 도구 설치 (TeamViewer)
□ 테스트 계정 준비
□ 지원 시간 스케줄 조율
```

### 생산업체 전달 자료
```
□ 시스템 URL: https://elcanto-scm.web.app
□ 가이드 링크 (해당 언어)
□ VPN 다운로드 링크
□ 로그인 계정 정보
□ 기술 지원 연락처
□ 간단 사용 설명서
```

---

## 📈 다음 단계

### 단기 (1주일 이내)
```
1. ✅ 가이드 문서 생산업체 전달
2. ✅ VPN 설치 지원 및 테스트
3. ⏳ 피드백 수집 및 FAQ 업데이트
4. ⏳ 추가 언어 버전 검토 (필요 시)
```

### 중기 (1개월 이내)
```
1. 동영상 가이드 제작 검토
2. TeamViewer 백업 방안 준비
3. 접속 통계 모니터링
4. 사용자 만족도 조사
```

### 장기 (3개월 이내)
```
1. China-friendly 대안 검토
   - AWS Seoul 리전 마이그레이션
   - Proxy 서버 구축
   - Hybrid 솔루션
2. 성능 최적화
3. 모바일 앱 개발 검토
```

---

## 📚 참고 자료

### VPN 관련
- Proton VPN 공식: https://protonvpn.com
- Windows 다운로드: https://protonvpn.com/download-windows
- 지원 센터: https://protonvpn.com/support

### Firebase 관련
- Firebase Console: https://console.firebase.google.com
- 프로젝트: elcanto-scm
- Documentation: https://firebase.google.com/docs

### 개발 자료
- GitHub 저장소: https://github.com/hyeonguk04-cmd/elcanto-scm
- 배포 URL: https://elcanto-scm.web.app

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-12-15  
**작성자**: ELCANTO IT Team  
**언어**: 한국어, 중국어, 베트남어

---

✨ **모든 준비가 완료되었습니다!**

생산업체에게 가이드를 전달하고 VPN 설치를 지원해주세요.
추가 지원이 필요하시면 언제든 연락주시기 바랍니다.
