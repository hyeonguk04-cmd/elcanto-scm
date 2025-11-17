// 사용 메뉴얼 페이지
import { UIUtils } from './utils.js';

export function renderUserManual() {
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-3">
      <!-- 페이지 타이틀 -->
      <div class="bg-white rounded-lg shadow-sm p-3">
        <h2 class="text-xl font-bold text-gray-800 flex items-center">
          <span class="text-2xl mr-2">📖</span>
          사용 메뉴얼
        </h2>
        <p class="text-sm text-gray-600 mt-1">엘칸토 SCM 포털 사용 가이드</p>
      </div>

      <!-- 목차 -->
      <div class="bg-white rounded-lg shadow-sm p-4">
        <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <span class="mr-2">📋</span>목차
        </h3>
        <div class="space-y-2 text-sm">
          <a href="#intro" class="block text-blue-600 hover:text-blue-800 hover:underline">1. SCM 포털 소개</a>
          <a href="#login" class="block text-blue-600 hover:text-blue-800 hover:underline ml-4">1.1. 로그인</a>
          <a href="#main-screen" class="block text-blue-600 hover:text-blue-800 hover:underline ml-4">1.2. 메인 화면 구성</a>
          <a href="#sidebar" class="block text-blue-600 hover:text-blue-800 hover:underline">2. 사이드바 메뉴</a>
          <a href="#dashboard" class="block text-blue-600 hover:text-blue-800 hover:underline ml-4">2.1. 📊 종합 현황</a>
          <a href="#order-management" class="block text-blue-600 hover:text-blue-800 hover:underline ml-4">2.2. 📋 생산 목표일정 수립</a>
          <a href="#analytics" class="block text-blue-600 hover:text-blue-800 hover:underline ml-4">2.3. 📈 공정 입고진척 현황</a>
          <a href="#weekly-report" class="block text-blue-600 hover:text-blue-800 hover:underline ml-4">2.4. 📅 주간 리포트</a>
          <a href="#manufacturer" class="block text-blue-600 hover:text-blue-800 hover:underline ml-4">2.5. 🏭 생산업체 관리</a>
          <a href="#user-management" class="block text-blue-600 hover:text-blue-800 hover:underline ml-4">2.6. 👥 사용자 관리</a>
          <a href="#supplier-menu" class="block text-blue-600 hover:text-blue-800 hover:underline">3. 생산업체 메뉴</a>
          <a href="#supplier-dashboard" class="block text-blue-600 hover:text-blue-800 hover:underline ml-4">3.1. 📊 내 대시보드</a>
          <a href="#supplier-orders" class="block text-blue-600 hover:text-blue-800 hover:underline ml-4">3.2. ✅ 실적 입력</a>
          <a href="#tips" class="block text-blue-600 hover:text-blue-800 hover:underline">4. 🎯 AI 분석 기능 활용법</a>
        </div>
      </div>

      <!-- 1. SCM 포털 소개 -->
      <div id="intro" class="bg-white rounded-lg shadow-sm p-4 scroll-mt-20">
        <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <span class="mr-2">1.</span>
          <span class="text-xl mr-2">🎯</span>
          SCM 포털 소개
        </h3>
        <div class="space-y-3 text-sm text-gray-700">
          <p class="leading-relaxed">
            <strong>엘칸토 SCM 포털</strong>은 신발 생산의 모든 공정을 실시간으로 관리하고 추적할 수 있는 통합 관리 시스템입니다.
          </p>
          
          <div class="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <h4 class="font-bold text-blue-900 mb-2">🎯 주요 목적</h4>
            <ul class="list-disc list-inside space-y-1 text-blue-800">
              <li><strong>생산 가시성 확보</strong>: 주문부터 입고까지 전 공정 실시간 모니터링</li>
              <li><strong>일정 관리 자동화</strong>: 각 공정별 목표일 자동 계산 및 지연 알림</li>
              <li><strong>협업 강화</strong>: 엘칸토와 생산업체 간 정보 공유 및 소통</li>
              <li><strong>데이터 기반 의사결정</strong>: KPI 및 통계 분석으로 개선점 파악</li>
            </ul>
          </div>

          <div class="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <h4 class="font-bold text-green-900 mb-2">✨ 핵심 기능</h4>
            <ul class="list-disc list-inside space-y-1 text-green-800">
              <li><strong>주문 관리</strong>: 엑셀 업로드로 간편한 주문 등록 및 수정</li>
              <li><strong>공정 스케줄링</strong>: 리드타임 기반 자동 일정 계산</li>
              <li><strong>실적 입력</strong>: 생산업체의 실제 완료일 및 증빙 사진 업로드</li>
              <li><strong>진척률 추적</strong>: 각 주문별 공정 진행률 실시간 확인</li>
              <li><strong>지연 모니터링</strong>: 지연 위험 주문 자동 감지 및 알림</li>
              <li><strong>주간 리포트</strong>: 채널별 입고 현황 및 트래픽 라이트 표시</li>
            </ul>
          </div>
        </div>

        <!-- 1.1 로그인 -->
        <div id="login" class="mt-4 pl-4 border-l-2 border-gray-300 scroll-mt-20">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center">
            <span class="mr-2">1.1.</span>
            <span class="text-lg mr-2">🔑</span>
            로그인
          </h4>
          <div class="space-y-2 text-sm text-gray-700">
            <p><strong>초기 화면</strong>에서 로그인 정보를 입력합니다:</p>
            <ol class="list-decimal list-inside space-y-1 ml-2">
              <li><strong>아이디</strong>: 엘칸토 IT팀으로부터 받은 사용자 ID 입력</li>
              <li><strong>비밀번호</strong>: 초기 비밀번호 입력 (최초 로그인 시 변경 권장)</li>
              <li><strong>로그인 버튼</strong> 클릭</li>
            </ol>
            
            <div class="bg-yellow-50 border border-yellow-200 p-2 rounded mt-2">
              <p class="text-yellow-800 text-xs">
                <i class="fas fa-info-circle mr-1"></i>
                <strong>계정 문의</strong>: 계정이 없거나 비밀번호를 분실한 경우 엘칸토 IT팀에 문의하세요.
              </p>
            </div>

            <div class="bg-gray-50 border border-gray-200 p-3 rounded mt-3">
              <h5 class="font-bold text-gray-800 mb-2">📌 사용자 역할</h5>
              <div class="space-y-2">
                <div>
                  <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold mr-2">관리자 (Admin)</span>
                  <span class="text-xs">모든 메뉴 접근 가능 (주문 관리, 통계, 업체 관리 등)</span>
                </div>
                <div>
                  <span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold mr-2">생산업체 (Supplier)</span>
                  <span class="text-xs">내 대시보드 및 실적 입력 메뉴만 접근</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 1.2 메인 화면 구성 -->
        <div id="main-screen" class="mt-4 pl-4 border-l-2 border-gray-300 scroll-mt-20">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center">
            <span class="mr-2">1.2.</span>
            <span class="text-lg mr-2">🖥️</span>
            메인 화면 구성
          </h4>
          <div class="space-y-3 text-sm text-gray-700">
            <p>로그인 후 화면은 크게 <strong>3개 영역</strong>으로 구성됩니다:</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <!-- 상단 헤더 -->
              <div class="bg-blue-50 border border-blue-200 p-3 rounded">
                <h5 class="font-bold text-blue-900 mb-1 flex items-center">
                  <i class="fas fa-bars mr-2"></i>상단 헤더
                </h5>
                <ul class="text-xs text-blue-800 space-y-1">
                  <li>• 로고 및 시스템 이름</li>
                  <li>• 실시간 연결 상태 표시</li>
                  <li>• 현재 로그인 사용자명</li>
                  <li>• 로그아웃 버튼</li>
                </ul>
              </div>

              <!-- 좌측 사이드바 -->
              <div class="bg-green-50 border border-green-200 p-3 rounded">
                <h5 class="font-bold text-green-900 mb-1 flex items-center">
                  <i class="fas fa-list mr-2"></i>좌측 사이드바
                </h5>
                <ul class="text-xs text-green-800 space-y-1">
                  <li>• 메뉴 네비게이션</li>
                  <li>• 역할별 메뉴 표시</li>
                  <li>• 활성 메뉴 하이라이트</li>
                  <li>• 컬러 이모지 아이콘</li>
                </ul>
              </div>

              <!-- 메인 콘텐츠 -->
              <div class="bg-purple-50 border border-purple-200 p-3 rounded">
                <h5 class="font-bold text-purple-900 mb-1 flex items-center">
                  <i class="fas fa-window-maximize mr-2"></i>메인 콘텐츠
                </h5>
                <ul class="text-xs text-purple-800 space-y-1">
                  <li>• 선택한 메뉴 내용 표시</li>
                  <li>• 테이블, 차트, 폼 등</li>
                  <li>• 필터 및 검색 기능</li>
                  <li>• 데이터 입력/수정 영역</li>
                </ul>
              </div>
            </div>

            <div class="bg-gray-100 border border-gray-300 p-3 rounded">
              <h5 class="font-bold text-gray-800 mb-2">💡 화면 구성 팁</h5>
              <ul class="text-xs text-gray-700 space-y-1">
                <li>• <strong>스크롤</strong>: 테이블이 길 경우 헤더는 고정되어 항상 보입니다</li>
                <li>• <strong>반응형</strong>: 화면 크기에 따라 레이아웃이 자동 조정됩니다</li>
                <li>• <strong>새로고침</strong>: 데이터는 실시간으로 업데이트되므로 새로고침이 필요 없습니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 사이드바 메뉴 (관리자) -->
      <div id="sidebar" class="bg-white rounded-lg shadow-sm p-4 scroll-mt-20">
        <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <span class="mr-2">2.</span>
          <span class="text-xl mr-2">📑</span>
          사이드바 메뉴 (관리자)
        </h3>
        <p class="text-sm text-gray-600 mb-3">관리자 계정으로 로그인하면 다음 6개 메뉴를 사용할 수 있습니다:</p>

        <!-- 2.1 종합 현황 -->
        <div id="dashboard" class="mt-4 pl-4 border-l-2 border-blue-300 scroll-mt-20">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center">
            <span class="mr-2">2.1.</span>
            <span class="text-xl mr-2">📊</span>
            종합 현황
          </h4>
          <div class="space-y-2 text-sm text-gray-700">
            <p><strong>목적</strong>: 전체 주문 및 공정 상황을 한눈에 파악하는 대시보드</p>
            
            <div class="bg-blue-50 border border-blue-200 p-3 rounded">
              <h5 class="font-bold text-blue-900 mb-2">📈 주요 KPI 카드</h5>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-white p-2 rounded border border-blue-100">
                  <strong>📦 전체 주문</strong>
                  <p class="text-gray-600">현재 진행 중인 총 주문 수</p>
                </div>
                <div class="bg-white p-2 rounded border border-blue-100">
                  <strong>⏳ 미입고 주문</strong>
                  <p class="text-gray-600">아직 입고되지 않은 주문 수</p>
                </div>
                <div class="bg-white p-2 rounded border border-blue-100">
                  <strong>🚨 지연 주문</strong>
                  <p class="text-gray-600">입고요구일이 지난 주문 수</p>
                </div>
                <div class="bg-white p-2 rounded border border-blue-100">
                  <strong>✅ 정시 입고율</strong>
                  <p class="text-gray-600">전체 대비 정시 입고 비율</p>
                </div>
              </div>
            </div>

            <div class="bg-green-50 border border-green-200 p-3 rounded">
              <h5 class="font-bold text-green-900 mb-2">🔍 필터 기능</h5>
              <ul class="text-xs text-green-800 space-y-1">
                <li>• <strong>채널 필터</strong>: 특정 판매 채널만 선택 (전체/홈쇼핑/백화점 등)</li>
                <li>• <strong>업체 필터</strong>: 특정 생산업체만 선택</li>
                <li>• <strong>날짜 범위</strong>: 시작일~종료일 기간 지정</li>
                <li>• 필터 변경 시 KPI 및 차트가 자동 업데이트됩니다</li>
              </ul>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <h5 class="font-bold text-yellow-900 mb-2">⚠️ 지연 위험 주문 테이블</h5>
              <p class="text-xs text-yellow-800 mb-2">입고요구일이 지났지만 아직 미입고된 주문을 표시합니다:</p>
              <ul class="text-xs text-yellow-800 space-y-1">
                <li>• 스타일, 채널, 생산업체 정보</li>
                <li>• 입고요구일 및 공정 진행률</li>
                <li>• 주문 클릭 시 상세 정보 확인 가능</li>
              </ul>
            </div>

            <div class="bg-purple-50 border border-purple-200 p-3 rounded">
              <h5 class="font-bold text-purple-900 mb-2">📊 공정 진행 현황 차트</h5>
              <p class="text-xs text-purple-800">가로 막대 차트로 각 공정별 진행 상황을 시각화합니다</p>
            </div>
          </div>
        </div>

        <!-- 2.2 생산 목표일정 수립 -->
        <div id="order-management" class="mt-4 pl-4 border-l-2 border-green-300 scroll-mt-20">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center">
            <span class="mr-2">2.2.</span>
            <span class="text-xl mr-2">📋</span>
            생산 목표일정 수립
          </h4>
          <div class="space-y-2 text-sm text-gray-700">
            <p><strong>목적</strong>: 주문을 등록하고 각 공정별 목표일을 설정하는 메뉴</p>
            
            <div class="bg-green-50 border border-green-200 p-3 rounded">
              <h5 class="font-bold text-green-900 mb-2">📥 주문 등록 방법</h5>
              <ol class="text-xs text-green-800 space-y-1 list-decimal list-inside">
                <li><strong>엑셀 업로드</strong>: "📤 엑셀 업로드" 버튼 클릭 → 엑셀 파일 선택
                  <ul class="ml-6 mt-1 space-y-1 list-disc list-inside">
                    <li>필수 컬럼: 스타일, 채널, 생산업체, 입고요구일 등</li>
                    <li>업로드 시 자동으로 목표일이 계산됩니다</li>
                  </ul>
                </li>
                <li><strong>수동 등록</strong>: "➕ 주문 추가" 버튼 클릭 → 폼 작성</li>
              </ol>
            </div>

            <div class="bg-blue-50 border border-blue-200 p-3 rounded">
              <h5 class="font-bold text-blue-900 mb-2">⚙️ 공정 일정 설정</h5>
              <ul class="text-xs text-blue-800 space-y-1">
                <li>• <strong>자동 계산</strong>: 입고요구일 기준으로 역산하여 각 공정별 목표일 자동 계산</li>
                <li>• <strong>수동 조정</strong>: 각 공정의 목표일을 개별적으로 수정 가능</li>
                <li>• <strong>리드타임 기반</strong>: 공정별 기본 리드타임이 적용됩니다</li>
                <li>• 공정: 원단(갑피/창), 핸도 컨펌, 재단, 갑피 제작, 조립, 자체 검품, 공장 출하, 출하, 입고</li>
              </ul>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <h5 class="font-bold text-yellow-900 mb-2">✏️ 주문 수정/삭제</h5>
              <ul class="text-xs text-yellow-800 space-y-1">
                <li>• <strong>수정</strong>: 각 행의 "✏️" 버튼 클릭 → 정보 수정</li>
                <li>• <strong>삭제</strong>: "🗑️" 버튼 클릭 → 확인 후 삭제</li>
                <li>• 생산업체가 실적을 입력한 공정은 목표일 수정 불가</li>
              </ul>
            </div>

            <div class="bg-purple-50 border border-purple-200 p-3 rounded">
              <h5 class="font-bold text-purple-900 mb-2">🔍 필터 및 검색</h5>
              <ul class="text-xs text-purple-800 space-y-1">
                <li>• <strong>채널/업체 필터</strong>: 드롭다운으로 원하는 데이터만 표시</li>
                <li>• <strong>검색</strong>: 스타일명으로 빠른 검색</li>
                <li>• <strong>엑셀 다운로드</strong>: 현재 화면의 데이터를 엑셀로 내보내기</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 2.3 공정 입고진척 현황 -->
        <div id="analytics" class="mt-4 pl-4 border-l-2 border-purple-300 scroll-mt-20">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center">
            <span class="mr-2">2.3.</span>
            <span class="text-xl mr-2">📈</span>
            공정 입고진척 현황
          </h4>
          <div class="space-y-2 text-sm text-gray-700">
            <p><strong>목적</strong>: 모든 주문의 공정별 진척 상황을 한 테이블에서 확인</p>
            
            <div class="bg-purple-50 border border-purple-200 p-3 rounded">
              <h5 class="font-bold text-purple-900 mb-2">📊 테이블 구성</h5>
              <ul class="text-xs text-purple-800 space-y-1">
                <li>• <strong>좌측 컬럼</strong>: 스타일, 채널, 생산업체, 입고요구일</li>
                <li>• <strong>중앙 컬럼</strong>: 8개 생산 공정 (원단~공장출하)</li>
                <li>• <strong>우측 컬럼</strong>: 2개 운송 공정 (출하~입고)</li>
                <li>• <strong>각 셀 표시</strong>:
                  <ul class="ml-4 mt-1 space-y-1">
                    <li>- 목표일 (상단)</li>
                    <li>- 실제 완료일 (하단, 입력된 경우 <span class="text-blue-600 font-bold">파란색</span>)</li>
                    <li>- 증빙 사진이 있으면 📷 아이콘 표시</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div class="bg-blue-50 border border-blue-200 p-3 rounded">
              <h5 class="font-bold text-blue-900 mb-2">🎨 색상 코드</h5>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex items-center">
                  <span class="inline-block w-4 h-4 bg-white border border-gray-300 mr-2"></span>
                  <span>미완료 (목표일만 표시)</span>
                </div>
                <div class="flex items-center">
                  <span class="inline-block w-4 h-4 bg-blue-100 border border-blue-300 mr-2"></span>
                  <span class="text-blue-800">완료 (실제일 입력됨)</span>
                </div>
                <div class="flex items-center">
                  <span class="inline-block w-4 h-4 bg-green-100 border border-green-300 mr-2"></span>
                  <span class="text-green-800">정상 (목표일 이전 완료)</span>
                </div>
                <div class="flex items-center">
                  <span class="inline-block w-4 h-4 bg-red-100 border border-red-300 mr-2"></span>
                  <span class="text-red-800">지연 (목표일 초과)</span>
                </div>
              </div>
            </div>

            <div class="bg-green-50 border border-green-200 p-3 rounded">
              <h5 class="font-bold text-green-900 mb-2">📷 증빙 사진 확인</h5>
              <p class="text-xs text-green-800">📷 아이콘을 클릭하면 생산업체가 업로드한 증빙 사진과 상세 정보를 확인할 수 있습니다.</p>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <h5 class="font-bold text-yellow-900 mb-2">📥 엑셀 다운로드</h5>
              <p class="text-xs text-yellow-800">"📥 엑셀 다운로드" 버튼을 클릭하면 현재 테이블의 모든 데이터를 엑셀 파일로 내보낼 수 있습니다.</p>
            </div>
          </div>
        </div>

        <!-- 2.4 주간 리포트 -->
        <div id="weekly-report" class="mt-4 pl-4 border-l-2 border-yellow-300 scroll-mt-20">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center">
            <span class="mr-2">2.4.</span>
            <span class="text-xl mr-2">📅</span>
            주간 리포트
          </h4>
          <div class="space-y-2 text-sm text-gray-700">
            <p><strong>목적</strong>: 채널별 주간 입고 현황을 트래픽 라이트로 한눈에 파악</p>
            
            <div class="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <h5 class="font-bold text-yellow-900 mb-2">🚦 트래픽 라이트 시스템</h5>
              <div class="space-y-2 text-xs text-yellow-800">
                <div class="flex items-start">
                  <span class="text-2xl mr-2">🔴</span>
                  <div>
                    <strong>지연입고</strong>
                    <p>물류입고 예정일이 입고요구일보다 늦음</p>
                  </div>
                </div>
                <div class="flex items-start">
                  <span class="text-2xl mr-2">🟢</span>
                  <div>
                    <strong>정상입고</strong>
                    <p>물류입고 예정일이 입고요구일 이전이거나 같음</p>
                  </div>
                </div>
                <div class="flex items-start">
                  <span class="text-2xl mr-2">⚪</span>
                  <div>
                    <strong>미입고</strong>
                    <p>아직 실제 입고일이 입력되지 않음</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 p-3 rounded">
              <h5 class="font-bold text-blue-900 mb-2">📊 테이블 구성</h5>
              <ul class="text-xs text-blue-800 space-y-1">
                <li>• <strong>채널별 그룹화</strong>: 홈쇼핑, 백화점, 온라인몰 등으로 자동 분류</li>
                <li>• <strong>주요 정보</strong>: 스타일, 생산업체, 입고요구일, 물류입고 예정일, 실제입고일</li>
                <li>• <strong>상태 표시</strong>: 트래픽 라이트 + 텍스트 (정상입고/지연입고/미입고)</li>
              </ul>
            </div>

            <div class="bg-green-50 border border-green-200 p-3 rounded">
              <h5 class="font-bold text-green-900 mb-2">🔍 필터 기능</h5>
              <ul class="text-xs text-green-800 space-y-1">
                <li>• <strong>채널 필터</strong>: 특정 채널만 보기</li>
                <li>• <strong>날짜 필터</strong>: 입고요구일 기준으로 기간 설정</li>
                <li>• <strong>상태 필터</strong>: 정상/지연/미입고 중 선택</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 2.5 생산업체 관리 -->
        <div id="manufacturer" class="mt-4 pl-4 border-l-2 border-orange-300 scroll-mt-20">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center">
            <span class="mr-2">2.5.</span>
            <span class="text-xl mr-2">🏭</span>
            생산업체 관리
          </h4>
          <div class="space-y-2 text-sm text-gray-700">
            <p><strong>목적</strong>: 협력 생산업체 정보를 등록하고 관리</p>
            
            <div class="bg-orange-50 border border-orange-200 p-3 rounded">
              <h5 class="font-bold text-orange-900 mb-2">➕ 업체 등록</h5>
              <ol class="text-xs text-orange-800 space-y-1 list-decimal list-inside">
                <li>"➕ 업체 추가" 버튼 클릭</li>
                <li>업체 정보 입력:
                  <ul class="ml-6 mt-1 space-y-1 list-disc list-inside">
                    <li><strong>업체명</strong>: 생산업체 이름 (필수)</li>
                    <li><strong>담당자</strong>: 연락 담당자 이름</li>
                    <li><strong>연락처</strong>: 전화번호 또는 이메일</li>
                    <li><strong>주소</strong>: 업체 주소</li>
                  </ul>
                </li>
                <li>"저장" 버튼 클릭</li>
              </ol>
            </div>

            <div class="bg-blue-50 border border-blue-200 p-3 rounded">
              <h5 class="font-bold text-blue-900 mb-2">✏️ 업체 수정/삭제</h5>
              <ul class="text-xs text-blue-800 space-y-1">
                <li>• <strong>수정</strong>: "✏️" 버튼 클릭 → 정보 수정 → 저장</li>
                <li>• <strong>삭제</strong>: "🗑️" 버튼 클릭 → 확인 메시지 → 삭제</li>
                <li>• <strong>주의</strong>: 해당 업체에 진행 중인 주문이 있으면 삭제 불가</li>
              </ul>
            </div>

            <div class="bg-green-50 border border-green-200 p-3 rounded">
              <h5 class="font-bold text-green-900 mb-2">🔍 업체 검색</h5>
              <p class="text-xs text-green-800">검색창에 업체명 또는 담당자명을 입력하여 빠르게 찾을 수 있습니다.</p>
            </div>
          </div>
        </div>

        <!-- 2.6 사용자 관리 -->
        <div id="user-management" class="mt-4 pl-4 border-l-2 border-red-300 scroll-mt-20">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center">
            <span class="mr-2">2.6.</span>
            <span class="text-xl mr-2">👥</span>
            사용자 관리
          </h4>
          <div class="space-y-2 text-sm text-gray-700">
            <p><strong>목적</strong>: 시스템 사용자 계정을 생성하고 권한을 관리</p>
            
            <div class="bg-red-50 border border-red-200 p-3 rounded">
              <h5 class="font-bold text-red-900 mb-2">➕ 사용자 추가</h5>
              <ol class="text-xs text-red-800 space-y-1 list-decimal list-inside">
                <li>"➕ 사용자 추가" 버튼 클릭</li>
                <li>사용자 정보 입력:
                  <ul class="ml-6 mt-1 space-y-1 list-disc list-inside">
                    <li><strong>아이디</strong>: 로그인 ID (중복 불가)</li>
                    <li><strong>이름</strong>: 실명</li>
                    <li><strong>비밀번호</strong>: 초기 비밀번호 (8자 이상)</li>
                    <li><strong>역할</strong>: 관리자(admin) 또는 생산업체(supplier)</li>
                    <li><strong>소속 업체</strong>: 생산업체 역할인 경우 업체 선택</li>
                  </ul>
                </li>
                <li>"저장" 버튼 클릭</li>
              </ol>
            </div>

            <div class="bg-blue-50 border border-blue-200 p-3 rounded">
              <h5 class="font-bold text-blue-900 mb-2">🔐 권한 관리</h5>
              <div class="space-y-2 text-xs">
                <div class="bg-white p-2 rounded border border-blue-100">
                  <strong class="text-blue-900">👨‍💼 관리자 (admin)</strong>
                  <ul class="mt-1 text-blue-800 space-y-1 list-disc list-inside ml-2">
                    <li>모든 메뉴 접근 가능</li>
                    <li>주문 등록/수정/삭제</li>
                    <li>통계 및 리포트 조회</li>
                    <li>업체 및 사용자 관리</li>
                  </ul>
                </div>
                <div class="bg-white p-2 rounded border border-blue-100">
                  <strong class="text-green-900">🏭 생산업체 (supplier)</strong>
                  <ul class="mt-1 text-green-800 space-y-1 list-disc list-inside ml-2">
                    <li>내 대시보드 접근</li>
                    <li>실적 입력 (자신의 주문만)</li>
                    <li>증빙 사진 업로드</li>
                    <li>완료일 입력/수정</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <h5 class="font-bold text-yellow-900 mb-2">✏️ 사용자 수정/삭제</h5>
              <ul class="text-xs text-yellow-800 space-y-1">
                <li>• <strong>수정</strong>: "✏️" 버튼 → 정보 수정 (비밀번호는 입력 시에만 변경)</li>
                <li>• <strong>삭제</strong>: "🗑️" 버튼 → 확인 후 삭제</li>
                <li>• <strong>주의</strong>: 관리자 계정은 최소 1개 이상 유지되어야 합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 생산업체 메뉴 -->
      <div id="supplier-menu" class="bg-white rounded-lg shadow-sm p-4 scroll-mt-20">
        <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <span class="mr-2">3.</span>
          <span class="text-xl mr-2">🏭</span>
          생산업체 메뉴
        </h3>
        <p class="text-sm text-gray-600 mb-3">생산업체 계정으로 로그인하면 다음 2개 메뉴를 사용할 수 있습니다:</p>

        <!-- 3.1 내 대시보드 -->
        <div id="supplier-dashboard" class="mt-4 pl-4 border-l-2 border-green-300 scroll-mt-20">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center">
            <span class="mr-2">3.1.</span>
            <span class="text-xl mr-2">📊</span>
            내 대시보드
          </h4>
          <div class="space-y-2 text-sm text-gray-700">
            <p><strong>목적</strong>: 우리 업체에 배정된 주문 현황을 한눈에 확인</p>
            
            <div class="bg-green-50 border border-green-200 p-3 rounded">
              <h5 class="font-bold text-green-900 mb-2">📊 KPI 카드</h5>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-white p-2 rounded border border-green-100">
                  <strong>📦 배정된 주문</strong>
                  <p class="text-gray-600">우리 업체의 총 주문 수</p>
                </div>
                <div class="bg-white p-2 rounded border border-green-100">
                  <strong>✅ 완료율</strong>
                  <p class="text-gray-600">모든 공정이 완료된 비율</p>
                </div>
                <div class="bg-white p-2 rounded border border-green-100">
                  <strong>⏰ 진행 중</strong>
                  <p class="text-gray-600">아직 진행 중인 주문 수</p>
                </div>
                <div class="bg-white p-2 rounded border border-green-100">
                  <strong>🚨 지연 주문</strong>
                  <p class="text-gray-600">일정이 지연된 주문 수</p>
                </div>
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 p-3 rounded">
              <h5 class="font-bold text-blue-900 mb-2">📋 최근 발주 현황</h5>
              <ul class="text-xs text-blue-800 space-y-1">
                <li>• 최근 배정된 주문 목록 표시</li>
                <li>• 스타일, 채널, 입고요구일, 진행률 표시</li>
                <li>• <strong>스타일 클릭</strong>: 해당 주문의 실적 입력 페이지로 자동 이동 및 펼치기</li>
              </ul>
            </div>

            <div class="bg-purple-50 border border-purple-200 p-3 rounded">
              <h5 class="font-bold text-purple-900 mb-2">📈 공정 진행률 차트</h5>
              <p class="text-xs text-purple-800">우리 업체의 전체 공정 진행률을 도넛 차트로 시각화합니다.</p>
            </div>
          </div>
        </div>

        <!-- 3.2 실적 입력 -->
        <div id="supplier-orders" class="mt-4 pl-4 border-l-2 border-blue-300 scroll-mt-20">
          <h4 class="font-bold text-gray-800 mb-2 flex items-center">
            <span class="mr-2">3.2.</span>
            <span class="text-xl mr-2">✅</span>
            실적 입력
          </h4>
          <div class="space-y-2 text-sm text-gray-700">
            <p><strong>목적</strong>: 각 공정별 실제 완료일과 증빙 사진을 입력</p>
            
            <div class="bg-blue-50 border border-blue-200 p-3 rounded">
              <h5 class="font-bold text-blue-900 mb-2">📝 실적 입력 방법</h5>
              <ol class="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li><strong>주문 선택</strong>: 목록에서 입력할 주문 클릭 (카드가 펼쳐짐)</li>
                <li><strong>공정별 입력</strong>:
                  <ul class="ml-6 mt-1 space-y-1 list-disc list-inside">
                    <li>목표일이 표시되어 있습니다</li>
                    <li>"날짜 입력" 필드에 실제 완료일 선택</li>
                    <li>"📷 사진 추가" 버튼 클릭 → 증빙 사진 업로드 (선택)</li>
                  </ul>
                </li>
                <li><strong>저장</strong>: "✅ 저장" 버튼 클릭 (공정별 개별 저장)</li>
                <li><strong>확인</strong>: 입력된 실적은 파란색으로 표시됩니다</li>
              </ol>
            </div>

            <div class="bg-green-50 border border-green-200 p-3 rounded">
              <h5 class="font-bold text-green-900 mb-2">📷 증빙 사진 가이드</h5>
              <ul class="text-xs text-green-800 space-y-1">
                <li>• <strong>권장 형식</strong>: JPG, PNG (최대 5MB)</li>
                <li>• <strong>촬영 내용</strong>: 해당 공정이 완료되었음을 확인할 수 있는 사진</li>
                <li>• <strong>선택 사항</strong>: 증빙 사진은 필수가 아니지만 업로드 권장</li>
                <li>• <strong>수정</strong>: 저장 후에도 사진 재업로드 가능</li>
              </ul>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <h5 class="font-bold text-yellow-900 mb-2">⚠️ 주의사항</h5>
              <ul class="text-xs text-yellow-800 space-y-1">
                <li>• <strong>순차 입력</strong>: 이전 공정이 완료되지 않으면 다음 공정 입력 불가</li>
                <li>• <strong>날짜 제약</strong>: 실제 완료일은 목표일보다 앞설 수 있지만, 이전 공정 완료일보다는 뒤여야 합니다</li>
                <li>• <strong>수정 제한</strong>: 관리자가 승인한 실적은 수정 불가할 수 있습니다</li>
              </ul>
            </div>

            <div class="bg-purple-50 border border-purple-200 p-3 rounded">
              <h5 class="font-bold text-purple-900 mb-2">🔍 필터 기능</h5>
              <ul class="text-xs text-purple-800 space-y-1">
                <li>• <strong>채널 필터</strong>: 특정 채널 주문만 보기</li>
                <li>• <strong>상태 필터</strong>: 진행 중/완료/지연 주문 필터링</li>
                <li>• <strong>검색</strong>: 스타일명으로 빠른 검색</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. AI 분석 기능 활용법 -->
      <div id="tips" class="bg-white rounded-lg shadow-sm p-4 scroll-mt-20">
        <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <span class="mr-2">4.</span>
          <span class="text-xl mr-2">🎯</span>
          AI 분석 기능 활용법
        </h3>
        
        <div class="space-y-3">
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg">
            <h4 class="font-bold text-blue-900 mb-2 flex items-center text-base">
              <span class="text-xl mr-2">🤖</span>
              AI 본석 분야 평가
            </h4>
            <p class="text-sm text-gray-700 mb-3">
              종합현황 페이지 우측 상단의 <strong>"🤖 AI 분석 평가"</strong> 버튼을 통해 
              Gemini AI가 현재 KPI와 데이터를 기반으로 생산 현황을 분석하고 개선 제안을 제공합니다.
            </p>
            
            <div class="bg-white p-3 rounded border border-blue-100">
              <h5 class="font-bold text-blue-900 mb-2 text-sm">📊 분석 내용</h5>
              <ul class="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li><strong>KPI 평가</strong>: 정시 입고율, 지연 주문 비율 등 주요 지표 분석</li>
                <li><strong>문제점 파악</strong>: 지연이 발생하는 공정 및 업체 식별</li>
                <li><strong>개선 제안</strong>: 구체적이고 실행 가능한 개선 방안 제시</li>
                <li><strong>트렌드 분석</strong>: 시간에 따른 성과 변화 추세</li>
              </ul>
            </div>
          </div>

          <div class="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 p-4 rounded-lg">
            <h4 class="font-bold text-green-900 mb-2 flex items-center text-base">
              <span class="text-xl mr-2">💡</span>
              활용 팁
            </h4>
            <div class="space-y-2 text-sm text-gray-700">
              <div class="bg-white p-2 rounded border border-green-100">
                <strong class="text-green-900">1. 주간 정기 분석</strong>
                <p class="text-xs mt-1">매주 월요일 AI 분석을 실행하여 지난 주 성과를 검토하고 개선점을 파악하세요.</p>
              </div>
              <div class="bg-white p-2 rounded border border-green-100">
                <strong class="text-green-900">2. 필터 활용</strong>
                <p class="text-xs mt-1">특정 채널이나 업체별로 필터링한 후 AI 분석을 실행하면 더 구체적인 인사이트를 얻을 수 있습니다.</p>
              </div>
              <div class="bg-white p-2 rounded border border-green-100">
                <strong class="text-green-900">3. 개선 조치 후 재분석</strong>
                <p class="text-xs mt-1">AI가 제안한 개선 방안을 실행한 후 다시 분석하여 효과를 측정하세요.</p>
              </div>
              <div class="bg-white p-2 rounded border border-green-100">
                <strong class="text-green-900">4. 팀 공유</strong>
                <p class="text-xs mt-1">AI 분석 결과를 스크린샷하여 관련 팀원들과 공유하고 개선 방향을 논의하세요.</p>
              </div>
            </div>
          </div>

          <div class="bg-yellow-50 border border-yellow-300 p-3 rounded">
            <p class="text-sm text-yellow-900">
              <i class="fas fa-lightbulb mr-2"></i>
              <strong>Note:</strong> AI 분석은 참고용 정보입니다. 최종 의사결정은 현장 상황과 경험을 바탕으로 진행하세요.
            </p>
          </div>
        </div>
      </div>

      <!-- 하단 문의 정보 -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow-lg p-4">
        <h3 class="text-lg font-bold mb-2 flex items-center">
          <i class="fas fa-headset mr-2"></i>
          도움이 필요하신가요?
        </h3>
        <div class="text-sm space-y-2">
          <p>
            <i class="fas fa-envelope mr-2"></i>
            <strong>기술 지원:</strong> 엘칸토 IT팀에 문의하세요
          </p>
          <p>
            <i class="fas fa-phone mr-2"></i>
            <strong>긴급 상황:</strong> 시스템 오류 발생 시 즉시 연락 부탁드립니다
          </p>
          <p class="text-xs text-blue-200 mt-3">
            <i class="fas fa-info-circle mr-1"></i>
            본 메뉴얼은 SCM 포털의 주요 기능을 설명합니다. 
            추가 기능이나 세부 사항은 실제 시스템을 사용하며 익혀주시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  `;

  // 스무스 스크롤 활성화
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

export default {
  renderUserManual
};
