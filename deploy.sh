#!/bin/bash

# 엘칸토 SCM 포털 Firebase 배포 스크립트
# 사용법: ./deploy.sh [option]
# 옵션: all (기본), hosting, firestore, storage

set -e  # 오류 발생시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 헤더 출력
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  🚀 엘칸토 SCM 포털 Firebase 배포 시작${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 배포 타입 확인
DEPLOY_TYPE=${1:-all}

echo -e "${YELLOW}📋 배포 타입: ${DEPLOY_TYPE}${NC}"
echo ""

# Node.js 버전 확인
echo -e "${BLUE}🔍 Node.js 버전 확인...${NC}"
node --version
npm --version
echo ""

# Firebase CLI 확인
echo -e "${BLUE}🔍 Firebase CLI 확인...${NC}"
if ! npx firebase --version > /dev/null 2>&1; then
    echo -e "${RED}❌ Firebase CLI가 설치되지 않았습니다.${NC}"
    echo -e "${YELLOW}📦 npm install 실행 중...${NC}"
    npm install
fi
npx firebase --version
echo ""

# Firebase 로그인 상태 확인
echo -e "${BLUE}🔐 Firebase 로그인 상태 확인...${NC}"
if ! npx firebase projects:list > /dev/null 2>&1; then
    echo -e "${RED}❌ Firebase 로그인이 필요합니다.${NC}"
    echo -e "${YELLOW}🔑 Firebase 로그인 실행 중...${NC}"
    npx firebase login
fi
echo -e "${GREEN}✅ 로그인 완료${NC}"
echo ""

# 프로젝트 확인
echo -e "${BLUE}🔍 Firebase 프로젝트 확인...${NC}"
PROJECT_ID=$(npx firebase use | grep "Active Project" | awk '{print $NF}' || echo "")
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  프로젝트가 설정되지 않았습니다.${NC}"
    echo -e "${YELLOW}🔧 elcanto-scm 프로젝트로 설정 중...${NC}"
    npx firebase use elcanto-scm
    PROJECT_ID="elcanto-scm"
fi
echo -e "${GREEN}✅ 프로젝트: ${PROJECT_ID}${NC}"
echo ""

# Git 상태 확인
echo -e "${BLUE}📝 Git 상태 확인...${NC}"
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${GREEN}✅ 변경사항 없음 (커밋된 상태)${NC}"
else
    echo -e "${YELLOW}⚠️  커밋되지 않은 변경사항이 있습니다.${NC}"
    git status --short
fi
echo ""

# 배포 실행
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  🚀 배포 시작${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

case $DEPLOY_TYPE in
    all)
        echo -e "${YELLOW}📦 전체 배포: Firestore 규칙 + Storage 규칙 + Hosting${NC}"
        npx firebase deploy --only firestore:rules,storage,hosting
        ;;
    hosting)
        echo -e "${YELLOW}🌐 Hosting만 배포${NC}"
        npx firebase deploy --only hosting
        ;;
    firestore)
        echo -e "${YELLOW}🗄️  Firestore 규칙만 배포${NC}"
        npx firebase deploy --only firestore:rules
        ;;
    storage)
        echo -e "${YELLOW}📁 Storage 규칙만 배포${NC}"
        npx firebase deploy --only storage
        ;;
    *)
        echo -e "${RED}❌ 잘못된 배포 타입: ${DEPLOY_TYPE}${NC}"
        echo -e "${YELLOW}사용법: ./deploy.sh [all|hosting|firestore|storage]${NC}"
        exit 1
        ;;
esac

# 배포 완료
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}  ✅ 배포 완료!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# URL 출력
echo -e "${GREEN}🌐 웹사이트 URL:${NC}"
echo -e "   https://${PROJECT_ID}.web.app"
echo -e "   https://${PROJECT_ID}.firebaseapp.com"
echo ""
echo -e "${GREEN}🎛️  Firebase Console:${NC}"
echo -e "   https://console.firebase.google.com/project/${PROJECT_ID}"
echo ""

# 다음 단계 안내
echo -e "${YELLOW}📋 다음 단계:${NC}"
echo -e "   1. Firebase Console에서 users 컬렉션 생성"
echo -e "   2. 관리자 계정 생성 (admin@elcanto.com)"
echo -e "   3. 공급업체 계정 생성 (supplier@aau.com)"
echo -e "   4. suppliers 문서에 leadTimes 추가"
echo -e "   5. 웹사이트 접속 및 로그인 테스트"
echo ""
echo -e "${GREEN}🎉 배포 스크립트 완료!${NC}"
