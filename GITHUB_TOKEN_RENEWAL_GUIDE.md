# GitHub 토큰 갱신 가이드

## 📋 상황 설명
GitHub에서 개인 액세스 토큰(PAT)이 만료되어 코드 푸시가 불가능한 상황입니다.

## 🚀 해결 방법 (2가지 옵션)

---

### **옵션 1: 토큰 갱신 (추천 - 3분)**

#### 1단계: GitHub 토큰 설정 페이지 접속
```
https://github.com/settings/tokens/2813804828/regenerate
```
위 링크를 클릭하면 바로 토큰 갱신 페이지로 이동합니다.

#### 2단계: 토큰 재생성
1. **"Regenerate token"** 버튼 클릭
2. 만료 기간 선택:
   - **추천:** `90 days` (3개월)
   - 또는 `No expiration` (만료 없음 - 보안 주의 필요)
3. **"Regenerate token"** 버튼 다시 클릭

#### 3단계: 새 토큰 복사
```
⚠️ 중요: 토큰이 화면에 한 번만 표시됩니다!
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**즉시 복사하여 안전한 곳에 저장하세요.**

#### 4단계: 토큰 적용 (터미널에서 실행)
```bash
# Claude에게 새 토큰을 알려주시면 자동으로 적용해드립니다
# 또는 직접 실행하려면:

cd /home/user/webapp

# Git 자격증명 업데이트
git config credential.helper store

# 새 토큰으로 푸시 테스트 (토큰 입력 요청 시 붙여넣기)
git push origin main
# Username: hyeonguk04-cmd
# Password: [여기에 새 토큰 붙여넣기]
```

---

### **옵션 2: 새 토큰 생성 (5분)**

만약 위 링크가 작동하지 않으면 새로 생성:

#### 1단계: GitHub 설정 페이지
```
https://github.com/settings/tokens/new
```

#### 2단계: 토큰 설정
| 항목 | 값 |
|------|-----|
| **Note** | `elcanto-scm-deploy-new` |
| **Expiration** | `90 days` 또는 `No expiration` |
| **Scopes** | ✅ `repo` (전체 체크) |

#### 3단계: 생성 및 복사
1. 페이지 하단의 **"Generate token"** 클릭
2. 생성된 토큰 복사 (ghp_로 시작)

#### 4단계: 적용 (위 옵션 1의 4단계와 동일)

---

## 🔐 보안 권장사항

### 토큰 저장 위치
```
❌ 나쁜 예: 코드에 하드코딩, 공개 문서
✅ 좋은 예: 
  - 비밀번호 관리자 (1Password, LastPass)
  - 로컬 환경변수 파일 (.env - Git 제외)
  - GitHub Secrets (CI/CD용)
```

### 만료 기간 선택 가이드
```
개인 프로젝트: 90 days (3개월)
팀 프로젝트: 30 days (1개월) - 정기 갱신
운영 서버: No expiration (단, 정기 감사 필요)
```

---

## 🚨 토큰 만료 시 증상

```bash
# Git push 시 에러 메시지:
remote: Invalid username or token.
fatal: Authentication failed for 'https://github.com/...'

# Firebase 자동 배포 실패
# → 사이트는 정상 작동하지만 업데이트 불가
```

---

## ✅ 확인 방법

토큰 갱신 후 정상 작동 테스트:

```bash
cd /home/user/webapp

# 테스트 커밋
echo "# Token renewal test" >> TOKEN_TEST.md
git add TOKEN_TEST.md
git commit -m "test: Verify new GitHub token"
git push origin main

# 성공 메시지 확인:
# Enumerating objects: 5, done.
# Writing objects: 100% (3/3), 300 bytes | 300.00 KiB/s, done.
# To https://github.com/hyeonguk04-cmd/elcanto-scm.git
#    abc1234..def5678  main -> main
```

---

## 📞 도움이 필요하면

1. **토큰 재생성 링크 접속 불가:**
   → GitHub 로그인 상태 확인 (계정: hyeonguk04-cmd)

2. **토큰 복사 실패:**
   → 페이지 새로고침 금지! 뒤로가기 후 재생성

3. **Push 여전히 실패:**
   → Claude에게 에러 메시지 전체 복사하여 공유

---

## 🎯 요약: 3분 해결법

```
1. https://github.com/settings/tokens/2813804828/regenerate 접속
2. "Regenerate token" 클릭 → 만료 기간 선택
3. 토큰 복사 (ghp_xxxx...)
4. Claude에게 알려주기 (자동 적용)
```

**다음 만료 예정일:** 갱신 후 90일 뒤  
**캘린더 알림 설정 권장:** 만료 1주일 전
