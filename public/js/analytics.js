// 공정 입고진척 현황 - 완전 재설계
import { getOrdersWithProcesses, getOrdersByRequiredMonth, getSupplierByName } from './firestore-service.js';
import { renderEmptyState, showArrivalRegistrationModal, showArrivalHistoryModal } from './ui-components.js';
import { UIUtils, DateUtils, ExcelUtils } from './utils.js';
import { PROCESS_CONFIG } from './process-config.js';

// 로컬 숫자 포맷 함수
const formatNumber = (num) => num?.toLocaleString() || '0';

let allOrders = [];
let orders = []; // 현재 표시 중인 데이터
let sortState = { column: null, direction: null };
let supplierList = [];
let dateFilter = { start: '', end: '' };

// 캐싱 관련 변수
let cachedAllData = null; // 전체 데이터 캐시
let cacheTimestamp = null; // 캐시 생성 시간
const CACHE_DURATION = 60 * 60 * 1000; // 1시간 (밀리초)

// 페이지네이션 상태
let paginationState = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0
};

// 필터 상태
let filterState = {
  requiredMonth: '', // 입고요구월 (YYYY-MM)
  channel: '전체',
  supplier: '전체'
};

export async function renderAnalytics(container) {
  try {
    UIUtils.showLoading();
    
    // 현재 월 계산
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    filterState.requiredMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // 현재 월 데이터 로드 (서버 필터링)
    orders = await getOrdersByRequiredMonth(currentYear, currentMonth);
    allOrders = [...orders]; // 현재 보이는 데이터 복사
    
    // 생산업체 목록 추출
    supplierList = ['전체', ...new Set(orders.map(o => o.supplier).filter(Boolean).sort())];
    
    // 입고요구월 드롭다운 옵션 생성 (지난 6개월 ~ 향후 3개월)
    const monthOptions = [];
    for (let i = -6; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${year}년 ${month}월`;
      monthOptions.push({ value, label });
    }
    
    container.innerHTML = `
      <div class="space-y-3">
        <!-- 모바일 최적화 레이아웃 -->
        <div class="flex flex-col gap-3">
          <!-- 제목 (첫 번째 줄) -->
          <div class="flex items-center justify-between">
            <div class="flex items-center" style="display: flex !important; flex-wrap: nowrap !important; align-items: center !important; gap: 0.5rem !important; width: auto !important;">
              <h2 class="text-xl font-bold text-gray-800" style="margin: 0 !important; white-space: nowrap !important;">공정 입고진척 현황</h2>
              <i id="analytics-info-icon" 
                 class="fas fa-lightbulb cursor-pointer" 
                 style="font-size: 19px; color: #f59e0b; margin-left: 8px !important; vertical-align: middle; transition: color 0.2s; flex-shrink: 0 !important; position: static !important;"
                 tabindex="0"
                 role="button"
                 aria-label="안내사항 보기"
                 onmouseover="this.style.color='#d97706'"
                 onmouseout="this.style.color='#f59e0b'"></i>
            </div>
          </div>
          
          <!-- 필터 및 버튼 영역 (두 번째 줄) -->
          <div class="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            <!-- 왼쪽: 총 건수 + 입고요구월 + 보기 -->
            <div class="flex gap-2 items-center">
              <span id="total-count-analytics" class="text-sm font-semibold text-gray-700">총 0건</span>
              <select id="required-month-filter-analytics" class="px-2 py-1.5 border rounded-lg text-sm">
                ${monthOptions.map(opt => `<option value="${opt.value}" ${opt.value === filterState.requiredMonth ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
              <select id="items-per-page-analytics" class="px-2 py-1.5 border rounded-lg text-sm">
                <option value="10">10개씩 보기</option>
                <option value="50">50개씩 보기</option>
                <option value="100">100개씩 보기</option>
                <option value="500">500개씩 보기</option>
              </select>
            </div>
            
            <!-- 오른쪽: Excel 다운로드 버튼 -->
            <div class="flex gap-2">
              <button id="download-month-excel-btn-analytics" class="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm">
                <i class="fas fa-file-excel mr-1"></i>현재월 Excel 다운로드
              </button>
              <button id="download-all-excel-btn-analytics" class="bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 text-sm">
                <i class="fas fa-file-excel mr-1"></i>전체 데이터 Excel 다운로드
              </button>
            </div>
          </div>
          
          <!-- 필터 영역 (세 번째 줄) -->
          <div class="flex flex-col sm:flex-row gap-2 items-end sm:items-center justify-end">
            <!-- 채널, 생산업체, 입고상태 필터 -->
            <div class="flex gap-2 w-full sm:w-auto">
              <select id="analytics-channel-filter" class="px-2 py-1.5 border rounded-lg text-sm flex-1 sm:flex-none">
                <option value="전체">전체 채널</option>
                <option value="IM">IM</option>
                <option value="ELCANTO">ELCANTO</option>
              </select>
              <select id="analytics-supplier-filter" class="px-2 py-1.5 border rounded-lg text-sm flex-1 sm:flex-none">
                ${supplierList.map(s => `<option value="${s}">${s === '전체' ? '전체 생산업체' : s}</option>`).join('')}
              </select>
              <select id="analytics-arrival-status-filter" class="px-2 py-1.5 border rounded-lg text-sm flex-1 sm:flex-none">
                <option value="전체">전체 입고상태</option>
                <option value="pending">🔴 미입고</option>
                <option value="partial">🟡 파셜입고</option>
                <option value="completed">🟢 입고완료</option>
                <option value="over">🔵 초과입고</option>
              </select>
            </div>
            
            <!-- 기간 선택 -->
            <div class="flex items-center gap-1 w-full sm:w-auto justify-end">
              <input type="date" id="analytics-start-date" class="px-2 py-1.5 border rounded-lg text-sm flex-1 sm:flex-none" />
              <span class="text-gray-500">~</span>
              <input type="date" id="analytics-end-date" class="px-2 py-1.5 border rounded-lg text-sm flex-1 sm:flex-none" />
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-3">
          <div id="analytics-table-container" class="overflow-auto" style="max-height: calc(100vh - 110px);"></div>
        </div>
      </div>
      
      <!-- 인포메이션 툴팁 -->
      <div id="analytics-info-tooltip" class="hidden fixed bg-white rounded-lg z-[1001]" 
           style="width: 420px; padding: 20px; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center">
            <span style="font-size: 16px; margin-right: 8px;">💡</span>
            <h3 class="font-bold text-gray-800" style="font-size: 15px;">안내사항</h3>
          </div>
          <button id="close-info-tooltip" class="text-gray-400 hover:text-gray-600 text-xl leading-none" style="margin-top: -4px;">&times;</button>
        </div>
        <div style="font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0;">• 생산업체가 등록한 실제 공정 완료일 기준으로 목표대비 실적차이를 통해 납기 리스크를 관리합니다.</p>
        </div>
        <div class="flex items-start mb-2">
          <span style="font-size: 16px; margin-right: 8px;">📌</span>
          <h3 class="font-bold text-gray-800" style="font-size: 15px;">사용 팁</h3>
        </div>
        <div style="font-size: 14px; color: #333; line-height: 1.7;">
          <p style="margin: 0 0 6px 0;">• 기간 선택: 입고요구일 기준</p>
          <p style="margin: 0 0 6px 0;">• 공정 지연일수 클릭: 생산업체의 공정별 진행현황 확인</p>
          <p style="margin: 0 0 6px 0;">• 공정상태 클릭: 스타일별 상세 공정 현황 확인</p>
          <p style="margin: 0;">• 특정 스타일코드 검색: Ctrl+F 스타일코드 입력후 확인</p>
        </div>
        <!-- 툴팁 화살표 -->
        <div class="absolute" style="top: -8px; left: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid white;"></div>
        <div class="absolute" style="top: -9px; left: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid #ddd;"></div>
      </div>
      
      <!-- 공정 상세 정보 모달 -->
      <div id="process-detail-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50" onclick="if(event.target === this) closeProcessDetailModal();">
        <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center flex-shrink-0">
            <h3 class="text-xl font-bold text-gray-800" id="modal-title">공정 상세 정보</h3>
            <button onclick="closeProcessDetailModal()" class="text-gray-500 hover:text-gray-700 close-process-modal-btn" type="button">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div id="modal-content" class="p-6 overflow-y-auto flex-1">
            <!-- 동적으로 채워짐 -->
          </div>
        </div>
      </div>
    `;
    
    renderAnalyticsTable(orders);
    setupEventListeners();
    
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Analytics render error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

function setupEventListeners() {
  // 입고요구월 필터
  document.getElementById('required-month-filter-analytics')?.addEventListener('change', (e) => {
    handleRequiredMonthChangeAnalytics(e.target.value);
  });
  
  // 보기 드롭다운 (페이지네이션)
  document.getElementById('items-per-page-analytics')?.addEventListener('change', (e) => {
    paginationState.itemsPerPage = parseInt(e.target.value);
    paginationState.currentPage = 1; // 첫 페이지로 이동
    renderAnalyticsTable(orders);
    setupEventListeners();
  });
  
  // Excel 다운로드 버튼
  document.getElementById('download-month-excel-btn-analytics')?.addEventListener('click', downloadMonthExcelAnalytics);
  document.getElementById('download-all-excel-btn-analytics')?.addEventListener('click', downloadAllExcelAnalytics);
  
  // 채널 필터
  document.getElementById('analytics-channel-filter')?.addEventListener('change', filterOrders);
  
  // 생산업체 필터
  document.getElementById('analytics-supplier-filter')?.addEventListener('change', filterOrders);
  
  // 입고상태 필터
  document.getElementById('analytics-arrival-status-filter')?.addEventListener('change', filterOrders);
  
  // 날짜 필터
  document.getElementById('analytics-start-date')?.addEventListener('change', filterOrders);
  document.getElementById('analytics-end-date')?.addEventListener('change', filterOrders);
  
  // 인포메이션 툴팁 기능
  setupInfoTooltip();
}

// 인포메이션 툴팁 기능 설정
function setupInfoTooltip() {
  const icon = document.getElementById('analytics-info-icon');
  const tooltip = document.getElementById('analytics-info-tooltip');
  const closeBtn = document.getElementById('close-info-tooltip');
  
  let hoverTimeout = null;
  let hideTimeout = null;
  let isFixed = false; // 클릭으로 고정된 상태
  
  // 툴팁 위치 조정 함수
  function positionTooltip() {
    if (!icon || !tooltip) return;
    
    const iconRect = icon.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // 기본 위치: 아이콘 아래-오른쪽
    let top = iconRect.bottom + 10;
    let left = iconRect.left;
    
    // 화면 경계 체크 및 조정
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 20;
    }
    
    if (top + tooltipRect.height > window.innerHeight) {
      top = iconRect.top - tooltipRect.height - 10;
    }
    
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }
  
  // 툴팁 표시
  function showTooltip() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    tooltip.classList.remove('hidden');
    positionTooltip();
  }
  
  // 툴팁 숨기기
  function hideTooltip() {
    if (!isFixed) {
      hideTimeout = setTimeout(() => {
        tooltip.classList.add('hidden');
      }, 300);
    }
  }
  
  // 마우스 호버 이벤트
  icon.addEventListener('mouseenter', () => {
    if (!isFixed) {
      hoverTimeout = setTimeout(showTooltip, 200);
    }
  });
  
  icon.addEventListener('mouseleave', () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    hideTooltip();
  });
  
  // 툴팁 위에 마우스 있을 때는 숨기지 않음
  tooltip.addEventListener('mouseenter', () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  });
  
  tooltip.addEventListener('mouseleave', () => {
    hideTooltip();
  });
  
  // 클릭으로 고정
  icon.addEventListener('click', (e) => {
    e.stopPropagation();
    isFixed = !isFixed;
    if (isFixed) {
      showTooltip();
    } else {
      tooltip.classList.add('hidden');
    }
  });
  
  // 닫기 버튼
  closeBtn.addEventListener('click', () => {
    isFixed = false;
    tooltip.classList.add('hidden');
  });
  
  // 툴팁 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (isFixed && !tooltip.contains(e.target) && e.target !== icon) {
      isFixed = false;
      tooltip.classList.add('hidden');
    }
  });
  
  // 키보드 접근성
  icon.addEventListener('focus', () => {
    if (!isFixed) {
      showTooltip();
    }
  });
  
  icon.addEventListener('blur', () => {
    if (!isFixed) {
      hideTooltip();
    }
  });
  
  icon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      isFixed = !isFixed;
      if (isFixed) {
        showTooltip();
      } else {
        tooltip.classList.add('hidden');
      }
    } else if (e.key === 'Escape') {
      isFixed = false;
      tooltip.classList.add('hidden');
      icon.blur();
    }
  });
  
  // ESC 키로 고정된 툴팁 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFixed) {
      isFixed = false;
      tooltip.classList.add('hidden');
    }
  });
  
  // 창 크기 변경 시 위치 재조정
  window.addEventListener('resize', () => {
    if (!tooltip.classList.contains('hidden')) {
      positionTooltip();
    }
  });
}

function filterOrders() {
  const channelFilter = document.getElementById('analytics-channel-filter').value;
  const supplierFilter = document.getElementById('analytics-supplier-filter').value;
  const arrivalStatusFilter = document.getElementById('analytics-arrival-status-filter').value;
  const startDate = document.getElementById('analytics-start-date').value;
  const endDate = document.getElementById('analytics-end-date').value;
  
  let filtered = allOrders;
  
  // 채널 필터링
  if (channelFilter !== '전체') {
    filtered = filtered.filter(o => o.channel === channelFilter);
  }
  
  // 생산업체 필터링
  if (supplierFilter !== '전체') {
    filtered = filtered.filter(o => o.supplier === supplierFilter);
  }
  
  // 입고상태 필터링
  if (arrivalStatusFilter !== '전체') {
    filtered = filtered.filter(o => {
      const status = o.arrivalSummary?.status || 'pending';
      return status === arrivalStatusFilter;
    });
  }
  
  // 입고요구일 기간 필터링
  if (startDate) {
    filtered = filtered.filter(o => o.requiredDelivery >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(o => o.requiredDelivery <= endDate);
  }
  
  // 필터링된 데이터를 orders에 저장
  orders = filtered;
  
  // 페이지네이션 초기화
  paginationState.currentPage = 1;
  
  renderAnalyticsTable(orders);
}

function checkIfDelayed(order) {
  const allProcesses = [...(order.processes?.production || order.schedule?.production || []), ...(order.processes?.shipping || order.schedule?.shipping || [])];
  return allProcesses.some(p => {
    const completedDate = p.completedDate || p.actualDate;
    if (!completedDate || !p.targetDate) return false;
    return new Date(completedDate) > new Date(p.targetDate);
  });
}

function checkIfAllCompleted(order) {
  const allProcesses = [...(order.processes?.production || order.schedule?.production || []), ...(order.processes?.shipping || order.schedule?.shipping || [])];
  return allProcesses.length > 0 && allProcesses.every(p => p.completedDate || p.actualDate);
}

function renderAnalyticsTable(ordersData) {
  const container = document.getElementById('analytics-table-container');
  
  // 페이지네이션 상태 업데이트
  paginationState.totalItems = ordersData.length;
  paginationState.totalPages = Math.ceil(ordersData.length / paginationState.itemsPerPage);
  
  // 총 건수 업데이트
  updateTotalCountAnalytics();
  
  if (ordersData.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-gray-500">
        <i class="fas fa-inbox text-4xl mb-2"></i>
        <p>데이터가 없습니다.</p>
      </div>
    `;
    // 페이지네이션 숨기기
    const paginationContainer = document.getElementById('pagination-container-analytics');
    if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
    return;
  }
  
  // 정렬 적용
  let sortedOrders = [...ordersData];
  if (sortState.column && sortState.direction) {
    sortedOrders = sortedOrders.sort((a, b) => {
      let aVal, bVal;
      
      switch(sortState.column) {
        case 'channel':
          aVal = a.channel || '';
          bVal = b.channel || '';
          break;
        case 'supplier':
          aVal = a.supplier || '';
          bVal = b.supplier || '';
          break;
        case 'style':
          aVal = (a.style || '').toLowerCase();
          bVal = (b.style || '').toLowerCase();
          break;
        case 'orderDate':
          aVal = a.orderDate ? new Date(a.orderDate).getTime() : 0;
          bVal = b.orderDate ? new Date(b.orderDate).getTime() : 0;
          break;
        case 'requiredDelivery':
          aVal = a.requiredDelivery ? new Date(a.requiredDelivery).getTime() : 0;
          bVal = b.requiredDelivery ? new Date(b.requiredDelivery).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      // 빈 값 처리
      if (!aVal && bVal) return 1;
      if (aVal && !bVal) return -1;
      if (!aVal && !bVal) return 0;
      
      // 정렬
      if (typeof aVal === 'string') {
        const result = aVal.localeCompare(bVal, 'ko');
        return sortState.direction === 'asc' ? result : -result;
      } else {
        const result = aVal - bVal;
        return sortState.direction === 'asc' ? result : -result;
      }
    });
  }
  
  // 페이지네이션 적용
  const startIndex = (paginationState.currentPage - 1) * paginationState.itemsPerPage;
  const endIndex = startIndex + paginationState.itemsPerPage;
  const pageOrders = sortedOrders.slice(startIndex, endIndex);
  
  const getSortIcon = (column) => {
    if (sortState.column !== column) return '<i class="fas fa-sort text-gray-400 ml-1"></i>';
    return sortState.direction === 'asc' 
      ? '<i class="fas fa-sort-up text-blue-600 ml-1"></i>'
      : '<i class="fas fa-sort-down text-blue-600 ml-1"></i>';
  };
  
  const getHeaderClass = (column) => {
    return sortState.column === column
      ? 'px-3 py-2 border cursor-pointer hover:bg-blue-200 bg-blue-100 text-blue-800'
      : 'px-3 py-2 border cursor-pointer hover:bg-gray-100';
  };
  
  // 생산 공정 헤더
  const productionHeaders = PROCESS_CONFIG.production.map(p => p.name);
  
  // 운송 공정 헤더
  const shippingHeaders = PROCESS_CONFIG.shipping.map(p => p.name);
  
  container.innerHTML = `
    <table class="text-xs border-collapse" style="width: 100%; table-layout: fixed;">
      <thead class="bg-gray-50 text-xs uppercase sticky top-0 z-10">
        <!-- 메인 헤더 -->
        <tr>
          <th rowspan="2" class="px-3 py-3 border" style="width: 3%;">NO.</th>
          <th colspan="8" class="px-3 py-3 border bg-blue-100">발주 정보</th>
          <th colspan="${productionHeaders.length}" class="px-3 py-3 border bg-green-100">생산 공정 (일)</th>
          <th colspan="${shippingHeaders.length}" class="px-3 py-3 border bg-yellow-100">운송 상황 (일)</th>
          <th colspan="5" class="px-3 py-3 bg-purple-100">최종 현황</th>
        </tr>
        
        <!-- 서브 헤더 -->
        <tr>
          <!-- 발주 정보 -->
          <th class="${getHeaderClass('channel')}" style="width: 4%;" data-analytics-sort="channel">채널 ${getSortIcon('channel')}</th>
          <th class="${getHeaderClass('supplier')}" style="width: 6%;" data-analytics-sort="supplier">생산업체 ${getSortIcon('supplier')}</th>
          <th class="${getHeaderClass('style')}" style="width: 7%;" data-analytics-sort="style">스타일 ${getSortIcon('style')}</th>
          <th class="px-3 py-3 border" style="width: 5%;">이미지</th>
          <th class="px-3 py-3 border" style="width: 4%;">색상</th>
          <th class="px-3 py-3 border" style="width: 4%;">수량</th>
          <th class="${getHeaderClass('orderDate')}" style="width: 7%;" data-analytics-sort="orderDate">발주일 ${getSortIcon('orderDate')}</th>
          <th class="${getHeaderClass('requiredDelivery')}" style="width: 7%;" data-analytics-sort="requiredDelivery">입고요구일 ${getSortIcon('requiredDelivery')}</th>
          
          <!-- 생산 공정 -->
          ${productionHeaders.map((name, idx) => {
            // 모든 항목 두 줄로 표시
            let displayName = name;
            
            if (name === '원단검수') {
              displayName = '원단<br>검수';
            } else if (name === '원도CFM') {
              displayName = '원도<br>CFM';
            } else if (name === '재단초조립') {
              displayName = '재단<br>조립';
            } else if (name === '공정출고') {
              displayName = '공정<br>출고';
            } else if (name.length > 2) {
              // 기타 긴 이름도 두 줄로
              displayName = name.slice(0, 2) + '<br>' + name.slice(2);
            }
            
            return `<th class="px-3 py-3 border" style="width: 5%; line-height: 1.2;">${displayName}</th>`;
          }).join('')}
          
          <!-- 운송 상황 -->
          ${shippingHeaders.map(name => {
            return `<th class="px-3 py-3 border" style="width: 5%;">${name}</th>`;
          }).join('')}
          
          <!-- 최종 현황 -->
          <th class="px-3 py-3 border" style="width: 4%; line-height: 1.2;">지연<br>일수</th>
          <th class="px-3 py-3 border" style="width: 7%;">물류입고<br>예정일</th>
          <th class="px-3 py-3 border" style="width: 10%; line-height: 1.2;">입고<br>현황</th>
          <th class="px-3 py-3 border" style="width: 6%; line-height: 1.2;">공정<br>상태</th>
          <th class="px-3 py-3 border" style="width: 8%;">액션</th>
        </tr>
      </thead>
      <tbody>
        ${pageOrders.map((order, index) => renderOrderRow(order, startIndex + index + 1)).join('')}
      </tbody>
    </table>
  `;
  
  // 페이지네이션 렌더링
  renderPaginationAnalytics();
  
  // 정렬 이벤트 리스너 추가
  setTimeout(() => {
    document.querySelectorAll('[data-analytics-sort]').forEach(header => {
      header.addEventListener('click', () => {
        const column = header.dataset.analyticsSort;
        
        if (sortState.column === column) {
          if (sortState.direction === 'asc') {
            sortState.direction = 'desc';
          } else if (sortState.direction === 'desc') {
            sortState.column = null;
            sortState.direction = null;
          }
        } else {
          sortState.column = column;
          sortState.direction = 'asc';
        }
        
        filterOrders();
      });
    });
  }, 0);
}

// 공정상태 판단 함수
function determineProcessStatus(order, productionProcesses, shippingProcesses) {
  // 입항 완료 여부 확인
  const arrivalProcess = shippingProcesses.find(p => p.key === 'arrival' || p.processKey === 'arrival');
  const isArrivalCompleted = arrivalProcess?.completedDate || arrivalProcess?.actualDate;
  
  // 모든 공정의 지연일수 합산
  let totalDelayDays = 0;
  let hasDelay = false;
  
  [...productionProcesses, ...shippingProcesses].forEach(process => {
    const completedDate = process.completedDate || process.actualDate;
    if (process.targetDate && completedDate) {
      const targetDate = new Date(process.targetDate);
      const actualDate = new Date(completedDate);
      const diff = Math.floor((actualDate - targetDate) / (1000 * 60 * 60 * 24));
      
      if (diff > 0) {
        totalDelayDays += diff;
        hasDelay = true;
      }
    }
  });
  
  if (isArrivalCompleted) {
    // 입고완료
    if (hasDelay || totalDelayDays > 0) {
      return { text: '입고완료(지연)', class: 'text-orange-600 font-semibold' };
    } else {
      return { text: '입고완료(정상)', class: 'text-green-600 font-semibold' };
    }
  } else {
    // 생산중
    if (hasDelay || totalDelayDays > 0) {
      return { text: '생산중(지연)', class: 'text-red-600 font-semibold' };
    } else {
      return { text: '생산중(정상)', class: 'text-blue-600 font-semibold' };
    }
  }
}

// 입고현황 셀 렌더링 (2x2 그리드)
function renderArrivalStatusCell(order) {
  const arrivalSummary = order.arrivalSummary || {
    totalReceived: 0,
    progress: 0,
    count: 0,
    status: 'pending'
  };
  
  const firstArrival = order.firstArrival || null;
  const lastArrival = order.lastArrival || null;
  const remaining = (order.quantity || 0) - arrivalSummary.totalReceived;
  
  // 상태별 색상
  let progressColor = 'text-red-600';
  let progressEmoji = '🔴';
  if (arrivalSummary.status === 'over') {
    progressColor = 'text-blue-600';
    progressEmoji = '🔵';
  } else if (arrivalSummary.status === 'completed') {
    progressColor = 'text-green-600';
    progressEmoji = '🟢';
  } else if (arrivalSummary.status === 'partial') {
    progressColor = 'text-yellow-600';
    progressEmoji = '🟡';
  }
  
  return `
    <div class="grid grid-cols-2 gap-1 text-xs">
      <!-- 최초입고 -->
      <div class="p-1 bg-blue-50 rounded border border-blue-200">
        <div class="font-semibold text-gray-600 mb-0.5" style="font-size: 10px;">최초입고</div>
        <div class="text-gray-800" style="font-size: 11px;">${firstArrival ? firstArrival.date : '-'}</div>
        <div class="text-gray-600" style="font-size: 10px;">${firstArrival ? `${formatNumber(firstArrival.quantity)}개` : '-'}</div>
      </div>
      
      <!-- 최종입고 -->
      <div class="p-1 bg-green-50 rounded border border-green-200">
        <div class="font-semibold text-gray-600 mb-0.5" style="font-size: 10px;">최종입고</div>
        <div class="text-gray-800" style="font-size: 11px;">${lastArrival ? lastArrival.date : '-'}</div>
        <div class="text-gray-600" style="font-size: 10px;">${lastArrival ? `${formatNumber(lastArrival.quantity)}개 (${arrivalSummary.count}차)` : '-'}</div>
      </div>
      
      <!-- 누적입고 -->
      <div class="p-1 bg-purple-50 rounded border border-purple-200">
        <div class="font-semibold text-gray-600 mb-0.5" style="font-size: 10px;">누적입고</div>
        <div class="font-bold text-gray-800" style="font-size: 11px;">
          ${formatNumber(arrivalSummary.totalReceived)} / ${formatNumber(order.quantity || 0)}
        </div>
      </div>
      
      <!-- 미입고 -->
      <div class="p-1 bg-yellow-50 rounded border border-yellow-200">
        <div class="font-semibold text-gray-600 mb-0.5" style="font-size: 10px;">미입고</div>
        <div class="font-bold ${progressColor}" style="font-size: 11px;">
          ${formatNumber(Math.max(0, remaining))}개
        </div>
        <div class="font-bold ${progressColor}" style="font-size: 10px;">
          ${progressEmoji} ${arrivalSummary.progress}%
        </div>
      </div>
    </div>
  `;
}

function renderOrderRow(order, rowNum) {
  // processes 구조 우선, schedule 호환성 유지
  const productionProcesses = order.processes?.production || order.schedule?.production || [];
  const shippingProcesses = order.processes?.shipping || order.schedule?.shipping || [];
  
  console.log(`📊 ${order.style}_${order.color} 분석:`, {
    hasProcesses: !!order.processes,
    hasSchedule: !!order.schedule,
    productionCount: productionProcesses.length,
    shippingCount: shippingProcesses.length,
    production: productionProcesses,
    shipping: shippingProcesses
  });
  
  // 물류입고 예정일 계산
  const expectedArrivalInfo = calculateExpectedArrival(order, productionProcesses, shippingProcesses);
  
  // 최종 지연일수 계산 (물류입고 예정일 - 입고요구일)
  let finalDelayDays = '-';
  let finalDelayClass = '';
  if (expectedArrivalInfo.date && order.requiredDelivery) {
    const expectedDate = new Date(expectedArrivalInfo.date);
    const requiredDate = new Date(order.requiredDelivery);
    const diff = Math.floor((expectedDate - requiredDate) / (1000 * 60 * 60 * 24));
    
    if (diff > 0) {
      finalDelayDays = `+${diff}`;
      finalDelayClass = 'text-red-700 font-bold';
    } else if (diff < 0) {
      finalDelayDays = `${diff}`;
      finalDelayClass = 'text-blue-700 font-bold';
    } else {
      finalDelayDays = '0';
      finalDelayClass = 'text-green-700 font-bold';
    }
  }
  
  // 공정상태 판단
  const processStatus = determineProcessStatus(order, productionProcesses, shippingProcesses);
  
  return `
    <tr class="border-b hover:bg-gray-50">
      <td class="px-3 py-3 text-center border">${rowNum}</td>
      
      <!-- 발주 정보 -->
      <td class="px-3 py-3 border">${order.channel || '-'}</td>
      <td class="px-3 py-3 border">${order.supplier || '-'}</td>
      <td class="px-3 py-3 border font-medium">${order.style || '-'}</td>
      <td class="px-3 py-3 border text-center">
        ${order.styleImage ? `
          <img src="${order.styleImage}" alt="${order.style}" 
               class="h-12 w-auto mx-auto cursor-pointer hover:scale-150 transition-transform"
               onclick="window.open('${order.styleImage}', '_blank')"
               onerror="this.style.display='none'; this.parentElement.innerHTML='-';">
        ` : '-'}
      </td>
      <td class="px-3 py-3 border">${order.color || '-'}</td>
      <td class="px-3 py-3 border text-right">${order.qty || 0}</td>
      <td class="px-3 py-3 border">${order.orderDate || '-'}</td>
      <td class="px-3 py-3 border">${order.requiredDelivery || '-'}</td>
      
      <!-- 생산 공정 지연일수 -->
      ${PROCESS_CONFIG.production.map(processConfig => {
        const process = productionProcesses.find(p => p.key === processConfig.key || p.processKey === processConfig.key);
        return renderProcessCell(order, process, processConfig, 'production');
      }).join('')}
      
      <!-- 운송 공정 지연일수 -->
      ${PROCESS_CONFIG.shipping.map(processConfig => {
        const process = shippingProcesses.find(p => p.key === processConfig.key || p.processKey === processConfig.key);
        return renderProcessCell(order, process, processConfig, 'shipping');
      }).join('')}
      
      <!-- 최종 현황 -->
      <td class="px-3 py-3 border text-center ${finalDelayClass}">${finalDelayDays}</td>
      <td class="px-3 py-3 border text-center">${expectedArrivalInfo.date || '-'}</td>
      
      <!-- 입고현황 -->
      <td class="px-2 py-2 border">
        ${renderArrivalStatusCell(order)}
      </td>
      
      <td class="px-3 py-3 border text-center cursor-pointer hover:bg-gray-100 ${processStatus.class}" 
          onclick="toggleProcessDetailPanel('${order.id}')" style="line-height: 1.3;">
        ${processStatus.text.replace('(', '<br>(')}
      </td>
      
      <!-- 액션 -->
      <td class="px-2 py-2 border text-center">
        <div class="flex flex-col gap-1">
          <button onclick="openArrivalRegistration('${order.id}')" 
                  class="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 whitespace-nowrap">
            <i class="fas fa-plus mr-1"></i>입고등록
          </button>
          <button onclick="openArrivalHistory('${order.id}')" 
                  class="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 whitespace-nowrap">
            <i class="fas fa-history mr-1"></i>이력보기
          </button>
        </div>
      </td>
    </tr>
  `;
}

// 물류입고 예정일 계산 함수
function calculateExpectedArrival(order, productionProcesses, shippingProcesses) {
  // 모든 공정을 순서대로 배열
  const allProcesses = [
    ...PROCESS_CONFIG.production.map(config => ({
      config,
      process: productionProcesses.find(p => p.key === config.key || p.processKey === config.key)
    })),
    ...PROCESS_CONFIG.shipping.map(config => ({
      config,
      process: shippingProcesses.find(p => p.key === config.key || p.processKey === config.key)
    }))
  ];
  
  let currentDate = null;
  let lastCompletedIndex = -1;
  
  // 완료된 마지막 공정 찾기
  for (let i = allProcesses.length - 1; i >= 0; i--) {
    const completedDate = allProcesses[i].process?.completedDate || allProcesses[i].process?.actualDate;
    if (completedDate) {
      currentDate = new Date(completedDate);
      lastCompletedIndex = i;
      break;
    }
  }
  
  // 완료된 공정이 없으면 발주일 기준으로 시작
  if (!currentDate && order.orderDate) {
    currentDate = new Date(order.orderDate);
  }
  
  // 완료되지 않은 공정들의 리드타임을 누적
  if (currentDate) {
    for (let i = lastCompletedIndex + 1; i < allProcesses.length; i++) {
      const { config, process } = allProcesses[i];
      
      // 목표일이 설정되어 있으면 목표일 사용, 없으면 리드타임 누적
      if (process?.targetDate) {
        currentDate = new Date(process.targetDate);
      } else {
        // 리드타임만큼 날짜 증가
        const leadTime = process?.leadTime || config.defaultLeadTime || 0;
        currentDate.setDate(currentDate.getDate() + leadTime);
      }
    }
    
    // 최종 날짜를 YYYY-MM-DD 형식으로 변환
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      isEstimated: lastCompletedIndex < allProcesses.length - 1
    };
  }
  
  return { date: null, isEstimated: false };
}

function renderProcessCell(order, process, processConfig, category) {
  if (!process) {
    return `<td class="px-3 py-3 border text-center">-</td>`;
  }
  
  // 지연일수 계산
  let delayDays = null;
  let cellClass = '';
  let cellContent = '-';
  let isClickable = false;
  
  // completedDate 또는 actualDate 사용 (호환성)
  const completedDate = process.completedDate || process.actualDate;
  
  if (process.targetDate && completedDate) {
    const targetDate = new Date(process.targetDate);
    const actualDate = new Date(completedDate);
    const diff = Math.floor((actualDate - targetDate) / (1000 * 60 * 60 * 24));
    
    delayDays = diff;
    isClickable = true;
    
    if (diff > 0) {
      cellContent = `+${diff}`;
      cellClass = 'text-red-700 font-bold cursor-pointer hover:bg-gray-100';
    } else if (diff < 0) {
      cellContent = `${diff}`;
      cellClass = 'text-blue-700 font-bold cursor-pointer hover:bg-gray-100';
    } else {
      cellContent = '0';
      cellClass = 'text-green-700 font-bold cursor-pointer hover:bg-gray-100';
    }
  } else if (completedDate) {
    // 목표일은 없지만 완료일은 있는 경우
    cellContent = '✓';
    cellClass = 'text-green-700 cursor-pointer hover:bg-gray-100';
    isClickable = true;
  } else if (process.targetDate) {
    // 목표일만 있고 완료일이 없는 경우 - 대기중
    cellContent = '⋯';
    cellClass = 'text-gray-400';
  }
  
  const clickHandler = isClickable 
    ? `onclick="showProcessDetail('${order.id}', '${processConfig.key}', '${category}')"` 
    : '';
  
  return `
    <td class="px-3 py-3 border text-center ${cellClass}" ${clickHandler}>
      ${cellContent}
    </td>
  `;
}

// 공정 상세 정보 표시
window.showProcessDetail = async function(orderId, processKey, category) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  
  const processes = category === 'production' ? order.schedule.production : order.schedule.shipping;
  const process = processes.find(p => (p.key || p.processKey) === processKey);
  if (!process) return;
  
  // 공정 정보 가져오기
  const processConfig = PROCESS_CONFIG[category].find(p => p.key === processKey);
  const processName = processConfig ? processConfig.name : processKey;
  
  // 차이일수 계산
  let diffDays = '-';
  let diffClass = '';
  const completedDate = process.completedDate || process.actualDate;
  if (process.targetDate && completedDate) {
    const targetDate = new Date(process.targetDate);
    const actualDate = new Date(completedDate);
    const diff = Math.floor((actualDate - targetDate) / (1000 * 60 * 60 * 24));
    
    if (diff > 0) {
      diffDays = `+${diff}일 (지연)`;
      diffClass = 'text-red-600 font-bold';
    } else if (diff < 0) {
      diffDays = `${diff}일 (앞당김)`;
      diffClass = 'text-blue-600 font-bold';
    } else {
      diffDays = '정시 완료';
      diffClass = 'text-green-600 font-bold';
    }
  }
  
  // 모달 내용 구성
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  
  modalTitle.textContent = `${order.style} - ${processName}`;
  
  modalContent.innerHTML = `
    <div class="space-y-6">
      <!-- 발주 기본 정보 -->
      <div class="bg-blue-100 rounded-lg p-4">
        <h4 class="font-bold text-gray-800 mb-3">📦 발주 정보</h4>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-600">채널:</span>
            <span class="font-medium ml-2">${order.channel || '-'}</span>
          </div>
          <div>
            <span class="text-gray-600">스타일:</span>
            <span class="font-medium ml-2">${order.style || '-'}</span>
          </div>
          <div>
            <span class="text-gray-600">색상:</span>
            <span class="font-medium ml-2">${order.color || '-'}</span>
          </div>
          <div>
            <span class="text-gray-600">수량:</span>
            <span class="font-medium ml-2">${order.qty || 0}개</span>
          </div>
          <div>
            <span class="text-gray-600">생산업체:</span>
            <span class="font-medium ml-2">${order.supplier || '-'}</span>
          </div>
          <div>
            <span class="text-gray-600">국가:</span>
            <span class="font-medium ml-2">${order.country || '-'}</span>
          </div>
        </div>
      </div>
      
      <!-- 공정 상세 정보 -->
      <div class="bg-green-50 rounded-lg p-4">
        <h4 class="font-bold text-gray-800 mb-3">🏭 ${processName} 공정 상세</h4>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b">
            <span class="text-gray-600 font-medium">목표일:</span>
            <span class="font-bold text-gray-800">${process.targetDate || '-'}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b">
            <span class="text-gray-600 font-medium">실제 완료일:</span>
            <span class="font-bold text-gray-800">${process.completedDate || process.actualDate || '-'}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b">
            <span class="text-gray-600 font-medium">차이일수:</span>
            <span class="${diffClass}">${diffDays}</span>
          </div>
        </div>
      </div>
      
      <!-- 증빙 사진 -->
      ${process.evidenceUrl || process.photo ? `
        <div class="bg-yellow-50 rounded-lg p-4">
          <h4 class="font-bold text-gray-800 mb-3">📷 증빙 사진</h4>
          <img src="${process.evidenceUrl || process.photo}" 
               alt="증빙 사진" 
               class="w-full rounded-lg shadow-md cursor-pointer hover:opacity-90"
               onclick="window.open('${process.evidenceUrl || process.photo}', '_blank')">
          <p class="text-xs text-gray-500 mt-2 text-center">클릭하면 크게 볼 수 있습니다</p>
        </div>
      ` : `
        <div class="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
          <i class="fas fa-camera text-3xl mb-2"></i>
          <p>등록된 증빙 사진이 없습니다</p>
        </div>
      `}
      
      <!-- 차이원인 -->
      ${process.delayReason ? `
        <div class="bg-orange-50 rounded-lg p-4">
          <h4 class="font-bold text-gray-800 mb-3">📝 차이원인</h4>
          <p class="text-gray-700 whitespace-pre-wrap">${process.delayReason}</p>
        </div>
      ` : ''}
    </div>
  `;
  
  // 모달 표시
  const modal = document.getElementById('process-detail-modal');
  modal.classList.remove('hidden');
  
  // ESC 키로 모달 닫기 이벤트 추가
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      window.closeProcessDetailModal();
    }
  };
  
  // 이전 이벤트 리스너 제거 후 새로 추가
  document.removeEventListener('keydown', escHandler);
  document.addEventListener('keydown', escHandler);
  
  // 모달 배경 클릭 시 닫기
  const clickHandler = (e) => {
    if (e.target.id === 'process-detail-modal') {
      window.closeProcessDetailModal();
    }
  };
  
  modal.removeEventListener('click', clickHandler);
  modal.addEventListener('click', clickHandler);
};

// 모달 닫기
window.closeProcessDetailModal = function() {
  // 정적 모달 닫기
  const modal1 = document.getElementById('process-detail-modal');
  if (modal1) {
    modal1.classList.add('hidden');
  }
  
  // 동적 모달 닫기 (공정상태 클릭 시 생성되는 모달)
  const modal2 = document.getElementById('process-detail-modal-panel');
  if (modal2) {
    modal2.classList.add('hidden');
    document.body.style.overflow = ''; // 스크롤 복원
  }
};

// 엑셀 다운로드
function downloadExcel() {
  const channelFilter = document.getElementById('analytics-channel-filter').value;
  const supplierFilter = document.getElementById('analytics-supplier-filter').value;
  const startDate = document.getElementById('analytics-start-date').value;
  const endDate = document.getElementById('analytics-end-date').value;
  
  let filtered = allOrders;
  
  // 필터 적용
  if (channelFilter !== '전체') {
    filtered = filtered.filter(o => o.channel === channelFilter);
  }
  if (supplierFilter !== '전체') {
    filtered = filtered.filter(o => o.supplier === supplierFilter);
  }
  if (startDate) {
    filtered = filtered.filter(o => o.requiredDelivery >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(o => o.requiredDelivery <= endDate);
  }
  
  // 엑셀 데이터 준비
  const excelData = filtered.map((order, idx) => {
    const row = {
      'NO.': idx + 1,
      '채널': order.channel || '',
      '생산업체': order.supplier || '',
      '스타일': order.style || '',
      '색상': order.color || '',
      '수량': order.qty || 0,
      '발주일': order.orderDate || '',
      '입고요구일': order.requiredDelivery || ''
    };
    
    // 생산 공정 추가
    PROCESS_CONFIG.production.forEach(p => {
      const process = (order.processes?.production || order.schedule?.production || []).find(pr => pr.key === p.key || pr.processKey === p.key);
      let delayValue = '';
      const completedDate = process?.completedDate || process?.actualDate;
      if (process && completedDate && process.targetDate) {
        const delayDays = Math.floor((new Date(completedDate) - new Date(process.targetDate)) / (1000 * 60 * 60 * 24));
        delayValue = delayDays > 0 ? `+${delayDays}` : delayDays < 0 ? `${delayDays}` : '0';
      } else if (process && completedDate) {
        delayValue = '완료';
      } else if (process && process.targetDate) {
        delayValue = '대기중';
      }
      row[p.name] = delayValue;
    });
    
    // 운송 공정 추가
    PROCESS_CONFIG.shipping.forEach(p => {
      const process = (order.processes?.shipping || order.schedule?.shipping || []).find(pr => pr.key === p.key || pr.processKey === p.key);
      let delayValue = '';
      const completedDate = process?.completedDate || process?.actualDate;
      if (process && completedDate && process.targetDate) {
        const delayDays = Math.floor((new Date(completedDate) - new Date(process.targetDate)) / (1000 * 60 * 60 * 24));
        delayValue = delayDays > 0 ? `+${delayDays}` : delayDays < 0 ? `${delayDays}` : '0';
      } else if (process && completedDate) {
        delayValue = '완료';
      } else if (process && process.targetDate) {
        delayValue = '대기중';
      }
      row[p.name] = delayValue;
    });
    
    // 최종 현황
    const expectedArrivalInfo = calculateExpectedArrival(order, order.schedule?.production || [], order.schedule?.shipping || []);
    let finalDelayDays = '';
    if (expectedArrivalInfo.date && order.requiredDelivery) {
      const expectedDate = new Date(expectedArrivalInfo.date);
      const requiredDate = new Date(order.requiredDelivery);
      const diff = Math.floor((expectedDate - requiredDate) / (1000 * 60 * 60 * 24));
      finalDelayDays = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0';
    }
    row['최종지연일수'] = finalDelayDays;
    row['물류입고예정일'] = expectedArrivalInfo.date || '';
    
    return row;
  });
  
  // ExcelUtils를 사용하여 다운로드
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  ExcelUtils.downloadExcel(excelData, `공정입고진척현황_${timestamp}.xlsx`);
}

// 공정 상세 패널 모달 열기
window.toggleProcessDetailPanel = function(orderId) {
  // 모달 생성 또는 가져오기
  let modal = document.getElementById('process-detail-modal-panel');
  
  if (!modal) {
    // 모달이 없으면 생성
    modal = document.createElement('div');
    modal.id = 'process-detail-modal-panel';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div id="modal-panel-content" class="flex flex-col flex-1 overflow-hidden"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeProcessDetailModal();
      }
    });
  }
  
  // 모달 내용 렌더링
  const modalContent = document.getElementById('modal-panel-content');
  renderProcessDetailPanel(orderId, modalContent);
  
  // 모달 표시
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
  
  // ESC 키로 모달 닫기
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeProcessDetailModal();
    }
  };
  
  // 이전 이벤트 제거 후 새로 추가
  document.removeEventListener('keydown', escHandler);
  document.addEventListener('keydown', escHandler);
};

// 모달 닫기 함수 (중복 제거 - 첫 번째 정의 사용)

// 표준 공정 목표일 계산 (발주일 + 리드타임)
function calculateStandardDates(orderDate, leadTimes, route) {
  const result = {
    production: {},
    shipping: {}
  };
  
  if (!orderDate) return result;
  
  let currentDate = new Date(orderDate);
  
  // 생산 공정 계산
  PROCESS_CONFIG.production.forEach(config => {
    const leadTime = leadTimes?.[config.key] || 0;
    currentDate.setDate(currentDate.getDate() + leadTime);
    result.production[config.key] = currentDate.toISOString().split('T')[0];
  });
  
  // 운송 공정 계산
  PROCESS_CONFIG.shipping.forEach(config => {
    let leadTime = leadTimes?.[config.key] || 0;
    
    // 입항 공정은 경로에 따라 리드타임 조정
    if (config.key === 'arrival') {
      if (route === '항공') {
        leadTime = 3;
      } else if (route === '해상') {
        leadTime = 21;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + leadTime);
    result.shipping[config.key] = currentDate.toISOString().split('T')[0];
  });
  
  return result;
}

// 공정 상세 패널 내용 렌더링
async function renderProcessDetailPanel(orderId, panelElement) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  
  const productionProcesses = order.schedule?.production || [];
  const shippingProcesses = order.schedule?.shipping || [];
  
  // 생산업체 리드타임 가져오기
  let supplierLeadTimes = null;
  if (order.supplier) {
    try {
      const supplier = await getSupplierByName(order.supplier);
      if (supplier && supplier.leadTimes) {
        supplierLeadTimes = supplier.leadTimes;
      }
    } catch (error) {
      console.warn('생산업체 리드타임 로드 실패:', error);
    }
  }
  
  // 표준 공정 목표일 계산 (발주일 기준 + 리드타임)
  const standardDates = calculateStandardDates(order.orderDate, supplierLeadTimes, order.route);
  
  // 생산 공정 데이터
  const productionData = PROCESS_CONFIG.production.map(config => ({
    ...config,
    process: productionProcesses.find(p => p.key === config.key || p.processKey === config.key),
    standardDate: standardDates.production[config.key]
  }));
  
  // 운송 공정 데이터
  const shippingData = PROCESS_CONFIG.shipping.map(config => ({
    ...config,
    process: shippingProcesses.find(p => p.key === config.key || p.processKey === config.key),
    standardDate: standardDates.shipping[config.key]
  }));
  
  panelElement.innerHTML = `
    <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center flex-shrink-0">
      <h3 class="text-xl font-bold text-gray-800">공정별 목표대비 실적 현황</h3>
      <button onclick="closeProcessDetailModal()" class="text-gray-500 hover:text-gray-700 close-process-modal-btn" type="button">
        <i class="fas fa-times text-xl"></i>
      </button>
    </div>
    <div class="p-6 overflow-y-auto flex-1">
      <!-- 주문 정보 -->
      <div class="bg-blue-50 rounded-lg p-4 mb-4">
        <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div class="flex-shrink-0">
            <span class="text-gray-600">채널:</span>
            <span class="font-medium ml-2">${order.channel || '-'}</span>
          </div>
          <div class="flex-shrink-0">
            <span class="text-gray-600">스타일:</span>
            <span class="font-medium ml-2">${order.style || '-'}</span>
          </div>
          <div class="flex-shrink-0">
            <span class="text-gray-600">생산업체:</span>
            <span class="font-medium ml-2">${order.supplier || '-'}</span>
          </div>
          <div class="flex-shrink-0">
            <span class="text-gray-600">입고요구일:</span>
            <span class="font-medium ml-2">${order.requiredDelivery || '-'}</span>
          </div>
          <div class="flex-shrink-0">
            <span class="text-gray-600 whitespace-nowrap">물류입고예정일:</span>
            <span class="font-medium ml-2">${calculateExpectedArrival(order, productionData.map(p => p.process).filter(Boolean), shippingData.map(p => p.process).filter(Boolean)).date || '-'}</span>
          </div>
        </div>
      </div>
      
      <!-- 공정 테이블 -->
      <div class="bg-white border rounded-lg overflow-x-auto">
        <table class="w-full text-xs border-collapse" style="min-width: 1200px;">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 border text-center" style="min-width: 120px;">구분</th>
              ${productionData.map(p => `<th class="px-3 py-2 border text-center" style="min-width: 100px;">${p.name}</th>`).join('')}
              ${shippingData.map(p => `<th class="px-3 py-2 border text-center" style="min-width: 100px;">${p.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <!-- 표준 공정 목표일 -->
            <tr class="bg-green-50">
              <td class="px-3 py-2 border font-semibold text-center text-green-700" style="white-space: nowrap;">표준 공정 목표일</td>
              ${productionData.map(({ standardDate }) => `
                <td class="px-3 py-2 border text-center text-green-600 text-xs">
                  ${standardDate || '-'}
                </td>
              `).join('')}
              ${shippingData.map(({ standardDate }) => `
                <td class="px-3 py-2 border text-center text-green-600 text-xs">
                  ${standardDate || '-'}
                </td>
              `).join('')}
            </tr>
            
            <!-- 목표일 -->
            <tr class="bg-gray-50">
              <td class="px-3 py-2 border font-semibold text-center">목표일</td>
              ${productionData.map(({ process }) => `
                <td class="px-3 py-2 border text-center text-gray-600">
                  ${process?.targetDate || '-'}
                </td>
              `).join('')}
              ${shippingData.map(({ process }) => `
                <td class="px-3 py-2 border text-center text-gray-600">
                  ${process?.targetDate || '-'}
                </td>
              `).join('')}
            </tr>
            
            <!-- 실적일 -->
            <tr class="bg-blue-50">
              <td class="px-3 py-2 border font-semibold text-center">실적일</td>
              ${productionData.map(({ process }) => `
                <td class="px-3 py-2 border text-center text-blue-600 font-medium">
                  ${process?.actualDate || '-'}
                </td>
              `).join('')}
              ${shippingData.map(({ process }) => `
                <td class="px-3 py-2 border text-center text-blue-600 font-medium">
                  ${process?.actualDate || '-'}
                </td>
              `).join('')}
            </tr>
            
            <!-- 차이일수 -->
            <tr>
              <td class="px-3 py-2 border font-semibold text-center">차이일수</td>
              ${productionData.map(({ process }) => {
                const completedDate = process?.completedDate || process?.actualDate;
                if (!process?.targetDate || !completedDate) {
                  return `<td class="px-3 py-2 border text-center text-gray-400">-</td>`;
                }
                const target = new Date(process.targetDate);
                const actual = new Date(completedDate);
                const diff = Math.floor((actual - target) / (1000 * 60 * 60 * 24));
                
                let className = 'px-3 py-2 border text-center font-bold';
                let content = '';
                
                if (diff > 0) {
                  className += ' text-red-600';
                  content = `+${diff}일`;
                } else if (diff < 0) {
                  className += ' text-blue-600';
                  content = `${diff}일`;
                } else {
                  className += ' text-green-600';
                  content = '0일';
                }
                
                return `<td class="${className}">${content}</td>`;
              }).join('')}
              ${shippingData.map(({ process }) => {
                const completedDate = process?.completedDate || process?.actualDate;
                if (!process?.targetDate || !completedDate) {
                  return `<td class="px-3 py-2 border text-center text-gray-400">-</td>`;
                }
                const target = new Date(process.targetDate);
                const actual = new Date(completedDate);
                const diff = Math.floor((actual - target) / (1000 * 60 * 60 * 24));
                
                let className = 'px-3 py-2 border text-center font-bold';
                let content = '';
                
                if (diff > 0) {
                  className += ' text-red-600';
                  content = `+${diff}일`;
                } else if (diff < 0) {
                  className += ' text-blue-600';
                  content = `${diff}일`;
                } else {
                  className += ' text-green-600';
                  content = '0일';
                }
                
                return `<td class="${className}">${content}</td>`;
              }).join('')}
            </tr>
            
            <!-- 증빙사진 -->
            <tr class="bg-yellow-50">
              <td class="px-3 py-2 border font-semibold text-center">증빙사진</td>
              ${productionData.map(({ process }) => `
                <td class="px-3 py-2 border text-center">
                  ${process?.proofPhoto || process?.evidenceUrl ? `
                    <img src="${process.proofPhoto || process.evidenceUrl}" 
                         alt="증빙" 
                         class="h-16 w-auto mx-auto cursor-pointer hover:opacity-80 rounded"
                         onclick="openPhotoModal('${process.proofPhoto || process.evidenceUrl}')">
                  ` : `<span class="text-gray-400 text-xs">-</span>`}
                </td>
              `).join('')}
              ${shippingData.map(({ process }) => `
                <td class="px-3 py-2 border text-center">
                  ${process?.proofPhoto || process?.evidenceUrl ? `
                    <img src="${process.proofPhoto || process.evidenceUrl}" 
                         alt="증빙" 
                         class="h-16 w-auto mx-auto cursor-pointer hover:opacity-80 rounded"
                         onclick="openPhotoModal('${process.proofPhoto || process.evidenceUrl}')">
                  ` : `<span class="text-gray-400 text-xs">-</span>`}
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 사진 확대 모달
window.openPhotoModal = function(photoUrl) {
  let photoModal = document.getElementById('analytics-photo-modal');
  if (!photoModal) {
    photoModal = document.createElement('div');
    photoModal.id = 'analytics-photo-modal';
    photoModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] hidden';
    photoModal.innerHTML = `
      <button onclick="closeAnalyticsPhotoModal()" class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300">
        <i class="fas fa-times"></i>
      </button>
      <img id="analytics-photo-modal-img" src="" alt="증빙사진" class="max-w-[90%] max-h-[90vh] rounded-lg">
    `;
    photoModal.onclick = function(e) {
      if (e.target === photoModal) {
        closeAnalyticsPhotoModal();
      }
    };
    document.body.appendChild(photoModal);
  }
  
  document.getElementById('analytics-photo-modal-img').src = photoUrl;
  photoModal.classList.remove('hidden');
};

window.closeAnalyticsPhotoModal = function() {
  const photoModal = document.getElementById('analytics-photo-modal');
  if (photoModal) {
    photoModal.classList.add('hidden');
  }
};

// 페이지네이션 렌더링
function renderPaginationAnalytics() {
  const paginationContainer = document.getElementById('pagination-container-analytics');
  if (!paginationContainer) {
    // 페이지네이션 컨테이너가 없으면 생성
    const tableContainer = document.getElementById('analytics-table-container');
    if (tableContainer && tableContainer.parentElement) {
      const newContainer = document.createElement('div');
      newContainer.id = 'pagination-container-analytics';
      newContainer.className = 'mt-3';
      tableContainer.parentElement.appendChild(newContainer);
    } else {
      return;
    }
  }
  
  const container = document.getElementById('pagination-container-analytics');
  const { currentPage, totalPages } = paginationState;
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let pages = [];
  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    if (currentPage <= 4) {
      pages = [1, 2, 3, 4, 5, '...', totalPages];
    } else if (currentPage >= totalPages - 3) {
      pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }
  }
  
  container.innerHTML = `
    <div class="flex justify-center items-center gap-1">
      <button id="prev-page-analytics" 
              class="px-3 py-1 border rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
              ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
      </button>
      ${pages.map(page => {
        if (page === '...') {
          return `<span class="px-3 py-1">...</span>`;
        }
        return `
          <button class="page-btn-analytics px-3 py-1 border rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}"
                  data-page="${page}">
            ${page}
          </button>
        `;
      }).join('')}
      <button id="next-page-analytics" 
              class="px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
              ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;
  
  // 페이지네이션 이벤트 리스너
  document.getElementById('prev-page-analytics')?.addEventListener('click', () => {
    if (paginationState.currentPage > 1) {
      paginationState.currentPage--;
      renderAnalyticsTable(orders);
      setupEventListeners();
    }
  });
  
  document.getElementById('next-page-analytics')?.addEventListener('click', () => {
    if (paginationState.currentPage < paginationState.totalPages) {
      paginationState.currentPage++;
      renderAnalyticsTable(orders);
      setupEventListeners();
    }
  });
  
  document.querySelectorAll('.page-btn-analytics').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = parseInt(e.target.dataset.page);
      paginationState.currentPage = page;
      renderAnalyticsTable(orders);
      setupEventListeners();
    });
  });
}

// 총 건수 업데이트
function updateTotalCountAnalytics() {
  const countEl = document.getElementById('total-count-analytics');
  if (countEl) {
    countEl.textContent = `총 ${orders.length}건`;
  }
}

// 입고요구월 변경 처리
async function handleRequiredMonthChangeAnalytics(yearMonth) {
  try {
    UIUtils.showLoading();
    
    const [year, month] = yearMonth.split('-');
    orders = await getOrdersByRequiredMonth(parseInt(year), parseInt(month));
    allOrders = [...orders];
    filterState.requiredMonth = yearMonth;
    
    // 생산업체 목록 갱신
    supplierList = ['전체', ...new Set(orders.map(o => o.supplier).filter(Boolean).sort())];
    
    // 생산업체 필터 드롭다운 갱신
    const supplierFilter = document.getElementById('analytics-supplier-filter');
    if (supplierFilter) {
      supplierFilter.innerHTML = supplierList.map(s => 
        `<option value="${s}">${s === '전체' ? '전체 생산업체' : s}</option>`
      ).join('');
    }
    
    // 필터 재적용
    applyFilters();
    
    // 페이지네이션 초기화
    paginationState.currentPage = 1;
    
    renderAnalyticsTable(orders);
    setupEventListeners();
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('입고요구월 필터 오류:', error);
    UIUtils.showAlert('데이터 로드 실패', 'error');
  }
}

// 캐시에서 전체 데이터 가져오기 (1시간 캐시)
async function getCachedAllDataAnalytics() {
  const now = Date.now();
  
  // 캐시가 유효한지 확인
  if (cachedAllData && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    const cacheAge = Math.round((now - cacheTimestamp) / 1000 / 60); // 분 단위
    console.log(`✅ 캐시된 데이터 사용 (${cacheAge}분 전 캐시, Firebase 읽기 없음)`);
    return cachedAllData;
  }
  
  // 캐시가 없거나 만료됨 - Firebase에서 로드
  console.log('📊 Firebase에서 전체 데이터 로드 중...');
  cachedAllData = await getOrdersWithProcesses();
  cacheTimestamp = now;
  console.log(`✅ 전체 ${cachedAllData.length}건 로드 완료 및 캐시 저장`);
  
  return cachedAllData;
}

// Excel 데이터 생성 함수 (공통)
// 공정 지연일수 계산 함수
function calculateProcessDelay(process) {
  if (!process) return null;
  
  const completedDate = process.completedDate || process.actualDate;
  
  if (process.targetDate && completedDate) {
    const targetDate = new Date(process.targetDate);
    const actualDate = new Date(completedDate);
    const diff = Math.floor((actualDate - targetDate) / (1000 * 60 * 60 * 24));
    return diff;
  }
  
  return null;
}

// 최종 현황 계산 함수
function calculateFinalStatus(order) {
  const productionProcesses = order.processes?.production || order.schedule?.production || [];
  const shippingProcesses = order.processes?.shipping || order.schedule?.shipping || [];
  
  // 물류입고 예정일 계산
  const expectedArrivalInfo = calculateExpectedArrival(order, productionProcesses, shippingProcesses);
  
  // 최종 지연일수 계산
  let totalDelay = null;
  if (expectedArrivalInfo.date && order.requiredDelivery) {
    const expectedDate = new Date(expectedArrivalInfo.date);
    const requiredDate = new Date(order.requiredDelivery);
    const diff = Math.floor((expectedDate - requiredDate) / (1000 * 60 * 60 * 24));
    
    if (diff > 0) {
      totalDelay = `+${diff}`;
    } else if (diff < 0) {
      totalDelay = `${diff}`;
    } else {
      totalDelay = '0';
    }
  }
  
  // 공정상태 판단
  const processStatus = determineProcessStatus(order, productionProcesses, shippingProcesses);
  
  return {
    totalDelay,
    estimatedArrival: expectedArrivalInfo.date || '',
    status: processStatus.text || ''
  };
}

function generateAnalyticsExcelData(ordersData) {
  const excelData = ordersData.map(order => {
    const row = {
      '채널': order.channel || '',
      '생산업체': order.supplier || '',
      '스타일': order.style || '',
      '색상': order.color || '',
      '수량': order.quantity || '',
      '발주일': order.orderDate || '',
      '입고요구일': order.requiredDelivery || ''
    };
    
    // 생산 공정 지연일수 추가
    const productionProcesses = order.processes?.production || order.schedule?.production || [];
    PROCESS_CONFIG.production.forEach(config => {
      const process = productionProcesses.find(p => p.key === config.key || p.processKey === config.key);
      const delay = calculateProcessDelay(process);
      row[`${config.name}_지연일수`] = delay !== null ? delay : '';
    });
    
    // 운송 공정 지연일수 추가
    const shippingProcesses = order.processes?.shipping || order.schedule?.shipping || [];
    PROCESS_CONFIG.shipping.forEach(config => {
      const process = shippingProcesses.find(p => p.key === config.key || p.processKey === config.key);
      const delay = calculateProcessDelay(process);
      row[`${config.name}_지연일수`] = delay !== null ? delay : '';
    });
    
    // 최종 현황
    const { totalDelay, estimatedArrival, status } = calculateFinalStatus(order);
    row['지연일수'] = totalDelay || '';
    row['물류입고예정일'] = estimatedArrival || '';
    
    // 입고 관련 정보 추가
    const arrivalSummary = order.arrivalSummary || { totalReceived: 0, progress: 0, count: 0, status: 'pending' };
    const firstArrival = order.firstArrival || null;
    const lastArrival = order.lastArrival || null;
    const remaining = (order.quantity || 0) - arrivalSummary.totalReceived;
    
    row['최초입고일'] = firstArrival ? firstArrival.date : '';
    row['최초입고수량'] = firstArrival ? firstArrival.quantity : '';
    row['최종입고일'] = lastArrival ? lastArrival.date : '';
    row['최종입고수량'] = lastArrival ? lastArrival.quantity : '';
    row['누적입고수량'] = arrivalSummary.totalReceived;
    row['입고진행률'] = `${arrivalSummary.progress}%`;
    row['입고횟수'] = arrivalSummary.count;
    row['미입고수량'] = Math.max(0, remaining);
    row['입고상태'] = arrivalSummary.status === 'over' ? '초과입고' : 
                      arrivalSummary.status === 'completed' ? '입고완료' : 
                      arrivalSummary.status === 'partial' ? '파셜입고' : '미입고';
    
    row['공정상태'] = status || '';
    
    return row;
  });
  
  return excelData;
}

// 현재월 Excel 다운로드
async function downloadMonthExcelAnalytics() {
  try {
    if (orders.length === 0) {
      UIUtils.showAlert('다운로드할 데이터가 없습니다.', 'warning');
      return;
    }
    
    const monthFilter = document.getElementById('required-month-filter-analytics');
    const selectedMonth = monthFilter?.options[monthFilter.selectedIndex]?.text || '현재월';
    
    const confirmed = await UIUtils.confirm(
      `${selectedMonth} 데이터 ${orders.length}건을 Excel로 다운로드하시겠습니까?`
    );
    
    if (!confirmed) return;
    
    UIUtils.showLoading();
    UIUtils.showAlert(`${orders.length}건의 데이터를 Excel로 변환 중...`, 'info');
    
    // Excel 데이터 생성
    const excelData = generateAnalyticsExcelData(orders);
    
    // Excel 다운로드
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = filterState.requiredMonth 
      ? `공정입고진척_${filterState.requiredMonth.replace('-', '')}_${timestamp}.xlsx`
      : `공정입고진척_${timestamp}.xlsx`;
    
    ExcelUtils.downloadExcel(excelData, fileName);
    
    UIUtils.hideLoading();
    UIUtils.showAlert(`${orders.length}건 데이터를 Excel로 다운로드했습니다.`, 'success');
  } catch (error) {
    UIUtils.hideLoading();
    console.error('현재월 Excel 다운로드 오류:', error);
    UIUtils.showAlert(`Excel 다운로드 실패: ${error.message}`, 'error');
  }
}

// 전체 데이터 Excel 다운로드 (캐싱 적용)
async function downloadAllExcelAnalytics() {
  try {
    const confirmed = await UIUtils.confirm(
      '전체 데이터를 Excel로 다운로드하시겠습니까?\n(현재 필터와 관계없이 모든 데이터가 다운로드됩니다)'
    );
    
    if (!confirmed) return;
    
    UIUtils.showLoading();
    
    // 캐시에서 데이터 가져오기
    const allData = await getCachedAllDataAnalytics();
    
    if (allData.length === 0) {
      UIUtils.hideLoading();
      UIUtils.showAlert('다운로드할 데이터가 없습니다.', 'warning');
      return;
    }
    
    UIUtils.showAlert(`${allData.length}건의 데이터를 Excel로 변환 중...`, 'info');
    
    // Excel 데이터 생성
    const excelData = generateAnalyticsExcelData(allData);
    
    // Excel 다운로드
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    ExcelUtils.downloadExcel(excelData, `공정입고진척_전체데이터_${timestamp}.xlsx`);
    
    UIUtils.hideLoading();
    UIUtils.showAlert(`전체 ${allData.length}건 데이터를 Excel로 다운로드했습니다.`, 'success');
  } catch (error) {
    UIUtils.hideLoading();
    console.error('전체 Excel 다운로드 오류:', error);
    UIUtils.showAlert(`Excel 다운로드 실패: ${error.message}`, 'error');
  }
}

// ============ 입고 관리 전역 함수 ============

/**
 * 입고 등록 모달 열기
 */
window.openArrivalRegistration = function(orderId) {
  const order = orders.find(o => o.id === orderId) || allOrders.find(o => o.id === orderId);
  
  if (!order) {
    UIUtils.showToast('발주 정보를 찾을 수 없습니다.', 'error');
    return;
  }
  
  showArrivalRegistrationModal(order, async () => {
    // 등록 완료 후 데이터 다시 로드
    await reloadCurrentData();
  });
};

/**
 * 입고 이력 모달 열기
 */
window.openArrivalHistory = function(orderId) {
  const order = orders.find(o => o.id === orderId) || allOrders.find(o => o.id === orderId);
  
  if (!order) {
    UIUtils.showToast('발주 정보를 찾을 수 없습니다.', 'error');
    return;
  }
  
  showArrivalHistoryModal(order, async () => {
    // 이력 업데이트 후 데이터 다시 로드
    await reloadCurrentData();
  });
};

/**
 * 현재 데이터 다시 로드
 */
async function reloadCurrentData() {
  try {
    UIUtils.showLoading();
    
    // 현재 선택된 입고요구월로 데이터 다시 로드
    const [year, month] = filterState.requiredMonth.split('-').map(Number);
    const freshOrders = await getOrdersByRequiredMonth(year, month);
    
    // 전역 변수 업데이트
    allOrders = [...freshOrders];
    
    // 필터 적용
    filterOrders();
    
    UIUtils.hideLoading();
    UIUtils.showToast('데이터가 업데이트되었습니다.', 'success');
  } catch (error) {
    UIUtils.hideLoading();
    console.error('데이터 재로드 실패:', error);
    UIUtils.showToast('데이터 업데이트에 실패했습니다.', 'error');
  }
}

export default { renderAnalytics };
