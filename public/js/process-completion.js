// 공정별 완료일 등록
import { getOrdersWithProcesses, getOrdersByRequiredMonth, updateProcess } from './firestore-service.js';
import { renderEmptyState, createProcessTableHeaders, showArrivalRegistrationModal, showArrivalHistoryModal } from './ui-components.js';
import { UIUtils, ExcelUtils, DateUtils, FormatUtils } from './utils.js';
import { getCurrentUser } from './auth.js';

let orders = [];
let allOrders = [];

// 캐싱 관련 변수
let cachedAllData = null; // 전체 데이터 캐시
let cacheTimestamp = null; // 캐시 생성 시간
const CACHE_DURATION = 60 * 60 * 1000; // 1시간 (밀리초)

let filterState = {
  supplier: '',
  seasonOrder: '',
  requiredDelivery: '',
  requiredMonth: '' // 입고요구월 필터 (YYYY-MM)
};
let sortState = { column: null, direction: null };
let paginationState = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0
};

export async function renderProcessCompletion(container) {
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
    
    container.innerHTML = `
      <div class="space-y-3">
        <!-- 모바일 최적화 레이아웃 -->
        <div class="flex flex-col gap-3">
          <!-- 제목 (첫 번째 줄) -->
          <div class="flex items-center" style="display: flex !important; flex-wrap: nowrap !important; align-items: center !important; gap: 0.5rem !important; width: auto !important;">
            <h2 class="text-xl font-bold text-gray-800" style="margin: 0 !important; white-space: nowrap !important;">공정별 완료일 등록</h2>
            <i id="process-completion-info-icon" 
               class="fas fa-lightbulb cursor-pointer" 
               style="font-size: 19px; color: #f59e0b; margin-left: 8px !important; vertical-align: middle; transition: color 0.2s; flex-shrink: 0 !important; position: static !important;"
               tabindex="0"
               role="button"
               aria-label="안내사항 보기"
               onmouseover="this.style.color='#d97706'"
               onmouseout="this.style.color='#f59e0b'"></i>
          </div>
          
          <!-- 입고요구월 필터 + 페이지네이션 + Excel 다운로드 (두 번째 줄) -->
          <div class="flex flex-wrap gap-2 items-center justify-between">
            <!-- 왼쪽: 총 건수 + 입고요구월 + 보기 -->
            <div class="flex items-center gap-2">
              <span id="total-count-completion" class="text-sm font-semibold text-gray-700">총 0건</span>
              <select id="required-month-filter-completion" class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">입고요구월 선택</option>
              </select>
              <select id="items-per-page-completion" class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="10">10개씩 보기</option>
                <option value="50">50개씩 보기</option>
                <option value="100">100개씩 보기</option>
                <option value="500">500개씩 보기</option>
              </select>
            </div>
            
            <!-- 오른쪽: Excel 다운로드 버튼 -->
            <div class="flex gap-2">
              <button id="download-month-excel-btn-completion" class="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm">
                <i class="fas fa-file-excel mr-1"></i>현재월 Excel 다운로드
              </button>
              <button id="download-all-excel-btn-completion" class="bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 text-sm">
                <i class="fas fa-file-excel mr-1"></i>전체 데이터 Excel 다운로드
              </button>
            </div>
          </div>
          
          <!-- 검색 + 버튼 그룹 (세 번째 줄, 오른쪽 정렬) -->
          <div class="flex flex-wrap gap-2 justify-end items-center">
            <!-- 생산업체 검색 -->
            <div class="relative">
              <input type="text" 
                     id="supplier-filter-input-completion" 
                     placeholder="생산업체 검색" 
                     class="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     style="padding-right: 60px;">
              <div class="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button id="supplier-filter-apply-completion" 
                        class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        title="검색">
                  <i class="fas fa-search"></i>
                </button>
                <button id="supplier-filter-clear-completion" 
                        class="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                        title="초기화">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <!-- 연도시즌+차수 검색 -->
            <div class="relative">
              <input type="text" 
                     id="season-filter-input-completion" 
                     placeholder="연도시즌+차수 검색" 
                     class="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     style="padding-right: 60px;">
              <div class="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button id="season-filter-apply-completion" 
                        class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        title="검색">
                  <i class="fas fa-search"></i>
                </button>
                <button id="season-filter-clear-completion" 
                        class="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                        title="초기화">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <!-- 입고요구일 검색 -->
            <div class="relative">
              <input type="date" 
                     id="required-delivery-filter-input-completion" 
                     placeholder="입고요구일 검색" 
                     class="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     style="padding-right: 60px;">
              <div class="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button id="required-delivery-filter-apply-completion" 
                        class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        title="검색">
                  <i class="fas fa-search"></i>
                </button>
                <button id="required-delivery-filter-clear-completion" 
                        class="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                        title="초기화">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <button id="template-completion-btn" class="bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-600 text-sm">
              <i class="fas fa-file-download mr-1"></i>템플릿 다운로드
            </button>
            <button id="upload-completion-btn" class="bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700 text-sm">
              <i class="fas fa-file-excel mr-1"></i>엑셀 업로드
            </button>
            <input type="file" id="excel-completion-uploader" accept=".xlsx,.xls" class="hidden">
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-3">
          <div id="completion-table" class="overflow-auto" style="max-height: calc(100vh - 240px);"></div>
          
          <!-- 페이지네이션 -->
          <div id="pagination-container-completion" class="flex justify-center items-center gap-2 mt-4">
            <!-- 페이지네이션 버튼이 여기에 동적으로 생성됩니다 -->
          </div>
        </div>
        
        <!-- 인포메이션 툴팁 -->
        <div id="process-completion-info-tooltip" class="hidden fixed bg-white rounded-lg z-[1001]" 
             style="width: 420px; padding: 20px; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center">
              <span style="font-size: 16px; margin-right: 8px;">💡</span>
              <h3 class="font-bold text-gray-800" style="font-size: 15px;">안내사항</h3>
            </div>
            <button id="close-completion-info-tooltip" class="text-gray-400 hover:text-gray-600 text-xl leading-none" style="margin-top: -4px;">&times;</button>
          </div>
          <div style="font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0;">• 생산업체에서 직접 완료일을 등록할 수 없는 경우, 엘칸토 관리자가 대신 공정별 완료일정을 등록하는 메뉴입니다.</p>
          </div>
          <div class="flex items-start mb-2">
            <span style="font-size: 16px; margin-right: 8px;">📌</span>
            <h3 class="font-bold text-gray-800" style="font-size: 15px;">사용 프로세스</h3>
          </div>
          <div style="font-size: 14px; color: #333; line-height: 1.7;">
            <p style="margin: 0 0 6px 0;">1. 템플릿 다운로드: 생산업체에 전달할 엑셀 템플릿 다운로드</p>
            <p style="margin: 0 0 6px 0;">2. 생산업체 작성: 발주 스타일별 공정별 완료일 기재</p>
            <p style="margin: 0 0 6px 0;">3. 엑셀 업로드: 생산업체가 작성한 완료일정 엑셀 업로드</p>
            <p style="margin: 0;">4. 진척 현황 반영: 공정 입고진척 현황에서 완료일 확인 가능</p>
          </div>
          <div class="absolute" style="top: -8px; left: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid white;"></div>
          <div class="absolute" style="top: -9px; left: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid #ddd;"></div>
        </div>
      </div>
    `;
    
    initializeRequiredMonthFilter();
    renderCompletionTable();
    setupEventListeners();
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Process completion render error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.', 'fa-exclamation-circle');
  }
}

function applyFilters() {
  const supplierValue = filterState.supplier.trim().toLowerCase();
  const seasonValue = filterState.seasonOrder.trim().toLowerCase();
  const requiredDeliveryValue = filterState.requiredDelivery.trim();
  
  if (!supplierValue && !seasonValue && !requiredDeliveryValue) {
    orders = [...allOrders];
  } else {
    orders = allOrders.filter(order => {
      const supplierMatch = !supplierValue || (order.supplier || '').toLowerCase().includes(supplierValue);
      const seasonMatch = !seasonValue || (order.seasonOrder || '').toLowerCase().includes(seasonValue);
      const requiredDeliveryMatch = !requiredDeliveryValue || (order.requiredDelivery || '') === requiredDeliveryValue;
      return supplierMatch && seasonMatch && requiredDeliveryMatch;
    });
  }
  
  // 필터 변경 시 첫 페이지로 이동
  paginationState.currentPage = 1;
  
  console.log(`🔍 필터: 생산업체="${supplierValue}", 연도시즌+차수="${seasonValue}", 입고요구일="${requiredDeliveryValue}" → ${orders.length}/${allOrders.length}건 표시`);
}

function getRegisteredBy(processes) {
  // 완료일이 등록된 프로세스 찾기
  const completedProcesses = processes.filter(p => p.completedDate);
  
  if (completedProcesses.length === 0) {
    return '-';
  }
  
  // updatedBy가 있는 프로세스 찾기
  const processWithUpdater = completedProcesses.find(p => p.updatedBy);
  
  if (!processWithUpdater || !processWithUpdater.updatedBy) {
    return '<span class="text-gray-600 font-semibold">미상</span>';
  }
  
  // 현재 로그인한 사용자의 UID와 비교
  const currentUser = getCurrentUser();
  
  // updatedBy가 현재 사용자와 같으면 현재 사용자의 역할 표시
  if (currentUser && processWithUpdater.updatedBy === currentUser.uid) {
    if (currentUser.role === 'admin') {
      return '<span class="text-purple-600 font-semibold">관리자</span>';
    } else if (currentUser.role === 'supplier') {
      return '<span class="text-blue-600 font-semibold">생산업체</span>';
    }
  }
  
  // 다른 사용자가 등록한 경우 → Firebase에서 사용자 정보 조회 필요
  // 간단하게 처리: 관리자로 가정 (추후 개선 가능)
  return '<span class="text-purple-600 font-semibold">관리자</span>';
}

// 입고현황 셀 렌더링 (간소화 버전)
function renderArrivalStatusCellCompletion(order) {
  const arrivalSummary = order.arrivalSummary || {
    totalReceived: 0,
    progress: 0,
    count: 0,
    status: 'pending'
  };
  
  const remaining = (order.quantity || 0) - arrivalSummary.totalReceived;
  
  // 상태별 색상 및 이모지
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
    <div class="flex flex-col gap-1 text-xs">
      <div class="font-semibold ${progressColor}">
        ${progressEmoji} ${arrivalSummary.progress}%
      </div>
      <div class="text-gray-700">
        ${FormatUtils.number(arrivalSummary.totalReceived)} / ${FormatUtils.number(order.quantity || 0)}
      </div>
      <div class="text-gray-500 text-[10px]">
        ${arrivalSummary.count > 0 ? `${arrivalSummary.count}회 입고` : '미입고'}
      </div>
      <div class="flex gap-1 mt-1">
        <button onclick="openArrivalRegistrationCompletion('${order.id}')" 
                class="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700 whitespace-nowrap">
          등록
        </button>
        <button onclick="openArrivalHistoryCompletion('${order.id}')" 
                class="px-1.5 py-0.5 bg-green-600 text-white text-[10px] rounded hover:bg-green-700 whitespace-nowrap">
          이력
        </button>
      </div>
    </div>
  `;
}

function renderCompletionTable() {
  const tableContainer = document.getElementById('completion-table');
  const headers = createProcessTableHeaders();
  
  // 정렬 적용
  if (sortState.column && sortState.direction) {
    orders = [...orders].sort((a, b) => {
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
        case 'requiredDelivery':
          aVal = a.requiredDelivery ? new Date(a.requiredDelivery).getTime() : 0;
          bVal = b.requiredDelivery ? new Date(b.requiredDelivery).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      // 문자열 비교
      if (typeof aVal === 'string') {
        const result = aVal.localeCompare(bVal, 'ko');
        return sortState.direction === 'asc' ? result : -result;
      }
      
      // 숫자 비교
      const result = aVal - bVal;
      return sortState.direction === 'asc' ? result : -result;
    });
  }
  
  // 페이지네이션 적용
  paginationState.totalItems = orders.length;
  paginationState.totalPages = Math.ceil(orders.length / paginationState.itemsPerPage);
  
  // 현재 페이지 데이터 추출
  const startIndex = (paginationState.currentPage - 1) * paginationState.itemsPerPage;
  const endIndex = startIndex + paginationState.itemsPerPage;
  const pageOrders = orders.slice(startIndex, endIndex);
  
  const getSortIcon = (column) => {
    if (sortState.column !== column) return '<i class="fas fa-sort text-gray-400 ml-1"></i>';
    return sortState.direction === 'asc' 
      ? '<i class="fas fa-sort-up text-blue-600 ml-1"></i>'
      : '<i class="fas fa-sort-down text-blue-600 ml-1"></i>';
  };
  
  const getHeaderClass = (column) => {
    return sortState.column === column
      ? 'cursor-pointer hover:bg-gray-200 bg-gray-100'
      : 'cursor-pointer hover:bg-gray-200';
  };
  
  tableContainer.innerHTML = `
    <table class="text-xs border-collapse" style="width: 100%; table-layout: fixed;">
      <thead class="bg-gray-50 text-xs uppercase sticky top-0 z-10">
        <tr>
          <th rowspan="2" class="px-3 py-3 border" style="width: 50px;">번호</th>
          <th colspan="8" class="px-3 py-3 border bg-blue-100">발주 정보</th>
          <th colspan="${headers.production.length}" class="px-3 py-3 border bg-green-100">생산 공정 완료일</th>
          <th colspan="2" class="px-3 py-3 border bg-yellow-100">운송 공정 완료일</th>
          <th rowspan="2" class="px-3 py-3 border bg-orange-100" style="width: 150px;">입고현황</th>
          <th rowspan="2" class="px-3 py-3 border bg-purple-100" style="width: 80px;">등록자</th>
        </tr>
        <tr>
          <th class="px-3 py-3 border ${getHeaderClass('channel')}" data-completion-sort="channel" style="width: 70px;">채널 ${getSortIcon('channel')}</th>
          <th class="px-3 py-3 border" style="width: 120px;">연도시즌+차수</th>
          <th class="px-3 py-3 border" style="width: 110px;">스타일</th>
          <th class="px-3 py-3 border" style="width: 60px;">색상</th>
          <th class="px-3 py-3 border" style="width: 70px;">국가</th>
          <th class="px-3 py-3 border ${getHeaderClass('supplier')}" data-completion-sort="supplier" style="width: 100px;">생산업체 ${getSortIcon('supplier')}</th>
          <th class="px-3 py-3 border" style="width: 100px;">발주일</th>
          <th class="px-3 py-3 border ${getHeaderClass('requiredDelivery')}" data-completion-sort="requiredDelivery" style="width: 110px;">입고요구일 ${getSortIcon('requiredDelivery')}</th>
          ${headers.production.map(h => `<th class="px-3 py-3 border" style="width: 100px;">${h.name}</th>`).join('')}
          <th class="px-3 py-3 border" style="width: 100px;">선적</th>
          <th class="px-3 py-3 border" style="width: 100px;">입항</th>
        </tr>
      </thead>
      <tbody id="completion-tbody">
        ${pageOrders.length === 0 ? `
          <tr>
            <td colspan="${11 + headers.production.length}" class="text-center py-8 text-gray-500">
              <i class="fas fa-inbox text-4xl mb-2"></i>
              <p>등록된 발주 정보가 없습니다.</p>
            </td>
          </tr>
        ` : pageOrders.map((order, index) => {
          // processes 구조 우선, schedule 호환성 유지
          const productionProcesses = order.processes?.production || order.schedule?.production || [];
          const shippingProcesses = order.processes?.shipping || order.schedule?.shipping || [];
          const shippingProcess = shippingProcesses.find(p => p.key === 'shipping' || p.processKey === 'shipping');
          const arrivalProcess = shippingProcesses.find(p => p.key === 'arrival' || p.processKey === 'arrival');
          
          return `
            <tr data-order-id="${order.id}" class="hover:bg-blue-50">
              <td class="px-3 py-3 border text-center">${startIndex + index + 1}</td>
              <td class="px-3 py-3 border">${order.channel || ''}</td>
              <td class="px-3 py-3 border">${order.seasonOrder || ''}</td>
              <td class="px-3 py-3 border">${order.style || ''}</td>
              <td class="px-3 py-3 border text-center">${order.color || ''}</td>
              <td class="px-3 py-3 border">${order.country || ''}</td>
              <td class="px-3 py-3 border">${order.supplier || ''}</td>
              <td class="px-3 py-3 border text-center">${order.orderDate || ''}</td>
              <td class="px-3 py-3 border text-center">${order.requiredDelivery || ''}</td>
              ${headers.production.map(header => {
                const process = productionProcesses.find(p => p.key === header.key || p.processKey === header.key);
                const completedDate = process?.completedDate || '';
                const targetDate = process?.targetDate || '';
                const isCompleted = !!completedDate;
                const isDelayed = completedDate && targetDate && new Date(completedDate) > new Date(targetDate);
                
                return `
                  <td class="px-3 py-3 border text-center ${isCompleted ? (isDelayed ? 'bg-red-50' : 'bg-green-50') : ''}">
                    ${completedDate || '-'}
                  </td>
                `;
              }).join('')}
              <td class="px-3 py-3 border text-center ${shippingProcess?.completedDate ? 'bg-green-50' : ''}">
                ${shippingProcess?.completedDate || '-'}
              </td>
              <td class="px-3 py-3 border text-center ${arrivalProcess?.completedDate ? 'bg-green-50' : ''}">
                ${arrivalProcess?.completedDate || '-'}
              </td>
              <td class="px-2 py-2 border text-center">
                ${renderArrivalStatusCellCompletion(order)}
              </td>
              <td class="px-3 py-3 border text-center">
                ${getRegisteredBy(productionProcesses.concat(shippingProcesses))}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  
  renderPagination();
  updateTotalCount();
}

function setupEventListeners() {
  // 입고요구월 필터
  const requiredMonthFilter = document.getElementById('required-month-filter-completion');
  requiredMonthFilter?.addEventListener('change', (e) => {
    handleRequiredMonthChange(e.target.value);
  });
  
  // 페이지당 항목 수 변경
  const itemsPerPageSelect = document.getElementById('items-per-page-completion');
  itemsPerPageSelect?.addEventListener('change', (e) => {
    paginationState.itemsPerPage = parseInt(e.target.value);
    paginationState.currentPage = 1;
    renderCompletionTable();
    setupEventListeners();
  });
  
  // Excel 다운로드 버튼
  document.getElementById('download-month-excel-btn-completion')?.addEventListener('click', downloadMonthExcelCompletion);
  document.getElementById('download-all-excel-btn-completion')?.addEventListener('click', downloadAllExcelCompletion);
  
  // Supplier Filter
  const supplierFilterInput = document.getElementById('supplier-filter-input-completion');
  const supplierFilterApply = document.getElementById('supplier-filter-apply-completion');
  const supplierFilterClear = document.getElementById('supplier-filter-clear-completion');
  
  supplierFilterInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterState.supplier = supplierFilterInput.value;
      applyFilters();
      renderCompletionTable();
      setupEventListeners();
    }
  });
  
  supplierFilterApply?.addEventListener('click', () => {
    filterState.supplier = supplierFilterInput.value;
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  supplierFilterClear?.addEventListener('click', () => {
    filterState.supplier = '';
    supplierFilterInput.value = '';
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  // Season Filter
  const seasonFilterInput = document.getElementById('season-filter-input-completion');
  const seasonFilterApply = document.getElementById('season-filter-apply-completion');
  const seasonFilterClear = document.getElementById('season-filter-clear-completion');
  
  seasonFilterInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterState.seasonOrder = seasonFilterInput.value;
      applyFilters();
      renderCompletionTable();
      setupEventListeners();
    }
  });
  
  seasonFilterApply?.addEventListener('click', () => {
    filterState.seasonOrder = seasonFilterInput.value;
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  seasonFilterClear?.addEventListener('click', () => {
    filterState.seasonOrder = '';
    seasonFilterInput.value = '';
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  // Required Delivery Filter
  const requiredDeliveryFilterInput = document.getElementById('required-delivery-filter-input-completion');
  const requiredDeliveryFilterApply = document.getElementById('required-delivery-filter-apply-completion');
  const requiredDeliveryFilterClear = document.getElementById('required-delivery-filter-clear-completion');
  
  requiredDeliveryFilterInput?.addEventListener('change', () => {
    filterState.requiredDelivery = requiredDeliveryFilterInput.value;
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  requiredDeliveryFilterApply?.addEventListener('click', () => {
    filterState.requiredDelivery = requiredDeliveryFilterInput.value;
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  requiredDeliveryFilterClear?.addEventListener('click', () => {
    filterState.requiredDelivery = '';
    requiredDeliveryFilterInput.value = '';
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  // Sort event listeners
  document.querySelectorAll('[data-completion-sort]').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.completionSort;
      
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
      
      renderCompletionTable();
      setupEventListeners();
    });
  });
  
  // Buttons
  document.getElementById('template-completion-btn')?.addEventListener('click', downloadTemplate);
  document.getElementById('upload-completion-btn')?.addEventListener('click', () => {
    document.getElementById('excel-completion-uploader').click();
  });
  document.getElementById('excel-completion-uploader')?.addEventListener('change', handleExcelUpload);
  
  // Info tooltip
  const infoIcon = document.getElementById('process-completion-info-icon');
  const tooltip = document.getElementById('process-completion-info-tooltip');
  const closeTooltip = document.getElementById('close-completion-info-tooltip');
  
  infoIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    const iconRect = infoIcon.getBoundingClientRect();
    tooltip.style.top = `${iconRect.bottom + 10}px`;
    tooltip.style.left = `${Math.min(iconRect.left, window.innerWidth - 440)}px`;
    tooltip.classList.remove('hidden');
  });
  
  closeTooltip?.addEventListener('click', () => {
    tooltip.classList.add('hidden');
  });
  
  document.addEventListener('click', (e) => {
    if (!tooltip.contains(e.target) && e.target !== infoIcon) {
      tooltip.classList.add('hidden');
    }
  });
}

function downloadTemplate() {
  const headers = createProcessTableHeaders();
  
  const excelData = orders.map(order => {
    const row = {
      '채널': order.channel || '',
      '연도시즌+차수': order.seasonOrder || '',
      '스타일': order.style || '',
      '색상': order.color || '',
      '국가': order.country || '',
      '생산업체': order.supplier || '',
      '발주일': order.orderDate || '',
      '입고요구일': order.requiredDelivery || '',
    };
    
    // 생산 공정 완료일
    const productionProcesses = order.schedule?.production || [];
    headers.production.forEach(header => {
      const process = productionProcesses.find(p => p.processKey === header.key);
      row[`${header.name}_완료일`] = process?.completedDate || '';
    });
    
    // 운송 공정 완료일
    const shippingProcesses = order.schedule?.shipping || [];
    const shippingProcess = shippingProcesses.find(p => p.processKey === 'shipping');
    const arrivalProcess = shippingProcesses.find(p => p.processKey === 'arrival');
    
    row['선적_완료일'] = shippingProcess?.completedDate || '';
    row['입항_완료일'] = arrivalProcess?.completedDate || '';
    
    // 입고 내역 (최대 3회 분할 입고 지원)
    const arrivals = order.arrivals || [];
    row['입고일_1차'] = arrivals[0]?.date || '';
    row['입고수량_1차'] = arrivals[0]?.quantity || '';
    row['입고일_2차'] = arrivals[1]?.date || '';
    row['입고수량_2차'] = arrivals[1]?.quantity || '';
    row['입고일_3차'] = arrivals[2]?.date || '';
    row['입고수량_3차'] = arrivals[2]?.quantity || '';
    
    return row;
  });
  
  ExcelUtils.downloadExcel(excelData, '생산공정_완료일_템플릿.xlsx');
  UIUtils.showAlert('템플릿이 다운로드되었습니다.', 'success');
}

async function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  console.log('📤 엑셀 업로드 시작:', file.name);
  
  try {
    UIUtils.showLoading();
    
    const data = await ExcelUtils.readExcel(file);
    
    console.log('📊 읽어온 데이터:', data);
    console.log('📊 데이터 행 수:', data?.length);
    
    if (!data || data.length === 0) {
      throw new Error('엑셀 파일이 비어있습니다.');
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const row of data) {
      try {
        // 발주 찾기
        const order = allOrders.find(o => 
          o.channel === row['채널'] &&
          o.seasonOrder === row['연도시즌+차수'] &&
          o.style === row['스타일'] &&
          o.color === row['색상']
        );
        
        if (!order) {
          throw new Error(`발주를 찾을 수 없습니다: ${row['스타일']}_${row['색상']}`);
        }
        
        // 생산 공정 완료일 업데이트 (processes 구조 사용)
        const productionProcesses = order.processes?.production || order.schedule?.production || [];
        console.log(`📦 ${order.style}_${order.color} 생산공정:`, productionProcesses);
        
        for (let i = 0; i < productionProcesses.length; i++) {
          const process = productionProcesses[i];
          const completedDateKey = `${process.name}_완료일`;
          const completedDate = row[completedDateKey];
          
          console.log(`  🔍 ${process.name}: 엑셀=${completedDate || '없음'}, DB=${process.completedDate || '없음'}`);
          
          // 기존 데이터 보존: 엑셀에 값이 있고, DB에 없을 때만 업데이트
          if (completedDate && !process.completedDate) {
            const formattedDate = DateUtils.excelDateToString(completedDate);
            console.log(`  ✅ ${process.name} 완료일 신규 등록: ${formattedDate}`);
            await updateProcess(order.id, 'production', i, {
              completedDate: formattedDate
            });
          } else if (completedDate && process.completedDate) {
            console.log(`  ⏭️ ${process.name} 완료일 이미 등록됨: ${process.completedDate} (스킵)`);
          }
        }
        
        // 운송 공정 완료일 업데이트 (processes 구조 사용)
        const shippingProcesses = order.processes?.shipping || order.schedule?.shipping || [];
        console.log(`🚢 ${order.style}_${order.color} 운송공정:`, shippingProcesses);
        
        const shippingIndex = shippingProcesses.findIndex(p => p.key === 'shipping' || p.processKey === 'shipping');
        const arrivalIndex = shippingProcesses.findIndex(p => p.key === 'arrival' || p.processKey === 'arrival');
        
        // 선적 완료일: 엑셀에 값이 있고, DB에 없을 때만 업데이트
        if (shippingIndex >= 0 && row['선적_완료일']) {
          const shippingProcess = shippingProcesses[shippingIndex];
          if (!shippingProcess.completedDate) {
            const formattedDate = DateUtils.excelDateToString(row['선적_완료일']);
            console.log(`  ✅ 선적 완료일 신규 등록: ${formattedDate}`);
            await updateProcess(order.id, 'shipping', shippingIndex, {
              completedDate: formattedDate
            });
          } else {
            console.log(`  ⏭️ 선적 완료일 이미 등록됨: ${shippingProcess.completedDate} (스킵)`);
          }
        }
        
        // 입항 완료일: 엑셀에 값이 있고, DB에 없을 때만 업데이트
        if (arrivalIndex >= 0 && row['입항_완료일']) {
          const arrivalProcess = shippingProcesses[arrivalIndex];
          if (!arrivalProcess.completedDate) {
            const formattedDate = DateUtils.excelDateToString(row['입항_완료일']);
            console.log(`  ✅ 입항 완료일 신규 등록: ${formattedDate}`);
            await updateProcess(order.id, 'shipping', arrivalIndex, {
              completedDate: formattedDate
            });
          } else {
            console.log(`  ⏭️ 입항 완료일 이미 등록됨: ${arrivalProcess.completedDate} (스킵)`);
          }
        }
        
        // 입고 내역 업로드 (최대 3회)
        const existingArrivals = order.arrivals || [];
        const arrivalDataToAdd = [];
        
        for (let i = 1; i <= 3; i++) {
          const dateKey = `입고일_${i}차`;
          const qtyKey = `입고수량_${i}차`;
          const date = row[dateKey];
          const quantity = row[qtyKey];
          
          // 엑셀에 날짜와 수량이 모두 있어야 함
          if (date && quantity) {
            const formattedDate = DateUtils.excelDateToString(date);
            const parsedQty = parseInt(quantity);
            
            if (parsedQty > 0) {
              // 동일한 날짜의 입고가 이미 존재하는지 확인
              const alreadyExists = existingArrivals.some(a => a.date === formattedDate && a.quantity === parsedQty);
              
              if (!alreadyExists) {
                arrivalDataToAdd.push({
                  date: formattedDate,
                  quantity: parsedQty,
                  note: `${i}차 입고 (엑셀 업로드)`
                });
                console.log(`  📦 입고 ${i}차 추가 예정: ${formattedDate}, ${parsedQty}개`);
              } else {
                console.log(`  ⏭️ 입고 ${i}차 이미 등록됨: ${formattedDate}, ${parsedQty}개 (스킵)`);
              }
            }
          }
        }
        
        // 입고 데이터 등록 (addArrival 사용)
        if (arrivalDataToAdd.length > 0) {
          const { addArrival } = await import('./firestore-service.js');
          
          for (const arrivalData of arrivalDataToAdd) {
            try {
              await addArrival(order.id, arrivalData);
              console.log(`  ✅ 입고 등록 완료: ${arrivalData.date}, ${arrivalData.quantity}개`);
            } catch (arrivalError) {
              console.error(`  ❌ 입고 등록 실패: ${arrivalError.message}`);
            }
          }
        }
        
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`${row['스타일']}_${row['색상']}: ${error.message}`);
        console.error('업데이트 실패:', error);
      }
    }
    
    if (errorCount === 0) {
      UIUtils.showAlert(`${successCount}건의 공정 완료일 및 입고 내역이 성공적으로 등록되었습니다!`, 'success');
    } else {
      const message = `성공: ${successCount}건, 실패: ${errorCount}건\n\n실패 내역:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`;
      UIUtils.showAlert(message, 'warning');
    }
    
    // 데이터 새로고침
    orders = await getOrdersWithProcesses();
    allOrders = [...orders];
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
    
    UIUtils.hideLoading();
    e.target.value = '';
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Excel upload error:', error);
    UIUtils.showAlert(`엑셀 업로드 실패: ${error.message}`, 'error');
    e.target.value = '';
  }
}

// ============ 페이지네이션 및 입고요구월 필터 (공정별 완료일 등록) ============

// 입고요구월 드롭다운 초기화
function initializeRequiredMonthFilter() {
  const select = document.getElementById('required-month-filter-completion');
  if (!select) return;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // 지난 6개월 + 현재월 + 향후 3개월
  const months = [];
  for (let i = -6; i <= 3; i++) {
    const date = new Date(currentYear, currentMonth - 1 + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    months.push({ year, month, value: `${year}-${String(month).padStart(2, '0')}` });
  }
  
  select.innerHTML = months.map(m => 
    `<option value="${m.value}" ${m.value === filterState.requiredMonth ? 'selected' : ''}>
      ${m.year}년 ${m.month}월
    </option>`
  ).join('');
  
  updateTotalCount();
}

// 총 건수 업데이트
function updateTotalCount() {
  const countEl = document.getElementById('total-count-completion');
  if (countEl) {
    countEl.textContent = `총 ${orders.length}건`;
  }
}

// 입고요구월 변경 처리
async function handleRequiredMonthChange(yearMonth) {
  try {
    UIUtils.showLoading();
    
    if (!yearMonth) {
      // 전체 데이터 로드
      orders = await getOrdersWithProcesses();
    } else {
      // 해당 월 데이터만 로드
      const [year, month] = yearMonth.split('-');
      orders = await getOrdersByRequiredMonth(parseInt(year), parseInt(month));
    }
    
    allOrders = [...orders];
    filterState.requiredMonth = yearMonth;
    
    // 생산업체/연도시즌 필터 재적용
    applyFilters();
    
    // 페이지네이션 초기화
    paginationState.currentPage = 1;
    
    renderCompletionTable();
    setupEventListeners();
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('입고요구월 필터 오류:', error);
    UIUtils.showAlert('데이터 로드 실패', 'error');
  }
}

// 페이지네이션 UI 렌더링
function renderPagination() {
  const container = document.getElementById('pagination-container-completion');
  if (!container) return;
  
  const { currentPage, totalPages } = paginationState;
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let pages = [];
  pages.push(1);
  
  const startPage = Math.max(2, currentPage - 2);
  const endPage = Math.min(totalPages - 1, currentPage + 2);
  
  if (startPage > 2) pages.push('...');
  for (let i = startPage; i <= endPage; i++) pages.push(i);
  if (endPage < totalPages - 1) pages.push('...');
  if (totalPages > 1) pages.push(totalPages);
  
  container.innerHTML = `
    <button id="prev-page-completion" 
            class="px-3 py-1 border rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
            ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
    ${pages.map(page => {
      if (page === '...') return '<span class="px-3 py-1">...</span>';
      return `<button class="page-btn-completion px-3 py-1 border rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}" data-page="${page}">${page}</button>`;
    }).join('')}
    <button id="next-page-completion" 
            class="px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
            ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  
  document.getElementById('prev-page-completion')?.addEventListener('click', () => {
    if (paginationState.currentPage > 1) {
      paginationState.currentPage--;
      renderCompletionTable();
      setupEventListeners();
    }
  });
  
  document.getElementById('next-page-completion')?.addEventListener('click', () => {
    if (paginationState.currentPage < paginationState.totalPages) {
      paginationState.currentPage++;
      renderCompletionTable();
      setupEventListeners();
    }
  });
  
  document.querySelectorAll('.page-btn-completion').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = parseInt(e.target.dataset.page);
      paginationState.currentPage = page;
      renderCompletionTable();
      setupEventListeners();
    });
  });
}

// 캐시에서 전체 데이터 가져오기
async function getCachedAllData() {
  const now = Date.now();
  
  if (cachedAllData && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    const cacheAge = Math.round((now - cacheTimestamp) / 1000 / 60);
    console.log(`✅ 캐시된 데이터 사용 (${cacheAge}분 전 캐시, Firebase 읽기 없음)`);
    return cachedAllData;
  }
  
  console.log('📊 Firebase에서 전체 데이터 로드 중...');
  cachedAllData = await getOrdersWithProcesses();
  cacheTimestamp = now;
  console.log(`✅ 전체 ${cachedAllData.length}건 로드 완료 및 캐시 저장`);
  
  return cachedAllData;
}

// Excel 데이터 생성 함수 (공통)
function generateCompletionExcelData(ordersData) {
  const headers = createProcessTableHeaders();
  
  const excelData = ordersData.map(order => {
    const row = {
      '채널': order.channel || '',
      '연도시즌+차수': order.seasonOrder || '',
      '스타일': order.style || '',
      '색상': order.color || '',
      '국가': order.country || '',
      '생산업체': order.supplier || '',
      '발주일': order.orderDate || '',
      '입고요구일': order.requiredDelivery || '',
    };
    
    // 생산 공정 완료일
    const productionProcesses = order.schedule?.production || order.processes?.production || [];
    headers.production.forEach(header => {
      const process = productionProcesses.find(p => p.processKey === header.key || p.key === header.key);
      row[`${header.name}_완료일`] = process?.completedDate || '';
    });
    
    // 운송 공정 완료일
    const shippingProcesses = order.schedule?.shipping || order.processes?.shipping || [];
    const shippingProcess = shippingProcesses.find(p => p.processKey === 'shipping' || p.key === 'shipping');
    const arrivalProcess = shippingProcesses.find(p => p.processKey === 'arrival' || p.key === 'arrival');
    
    row['선적_완료일'] = shippingProcess?.completedDate || '';
    row['입항_완료일'] = arrivalProcess?.completedDate || '';
    
    // 입고 내역 (최대 3회 분할 입고 지원)
    const arrivals = order.arrivals || [];
    row['입고일_1차'] = arrivals[0]?.date || '';
    row['입고수량_1차'] = arrivals[0]?.quantity || '';
    row['입고일_2차'] = arrivals[1]?.date || '';
    row['입고수량_2차'] = arrivals[1]?.quantity || '';
    row['입고일_3차'] = arrivals[2]?.date || '';
    row['입고수량_3차'] = arrivals[2]?.quantity || '';
    
    return row;
  });
  
  return excelData;
}

// 현재월 Excel 다운로드
async function downloadMonthExcelCompletion() {
  try {
    if (orders.length === 0) {
      UIUtils.showAlert('다운로드할 데이터가 없습니다.', 'warning');
      return;
    }
    
    const monthFilter = document.getElementById('required-month-filter-completion');
    const selectedMonth = monthFilter?.options[monthFilter.selectedIndex]?.text || '현재월';
    
    const confirmed = await UIUtils.confirm(
      `${selectedMonth} 데이터 ${orders.length}건을 Excel로 다운로드하시겠습니까?`
    );
    
    if (!confirmed) return;
    
    UIUtils.showLoading();
    UIUtils.showAlert(`${orders.length}건의 데이터를 Excel로 변환 중...`, 'info');
    
    // Excel 데이터 생성
    const excelData = generateCompletionExcelData(orders);
    
    // Excel 다운로드
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = filterState.requiredMonth 
      ? `생산공정_완료일_${filterState.requiredMonth.replace('-', '')}_${timestamp}.xlsx`
      : `생산공정_완료일_${timestamp}.xlsx`;
    
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
async function downloadAllExcelCompletion() {
  try {
    const confirmed = await UIUtils.confirm(
      '전체 데이터를 Excel로 다운로드하시겠습니까?\n(현재 필터와 관계없이 모든 데이터가 다운로드됩니다)'
    );
    
    if (!confirmed) return;
    
    UIUtils.showLoading();
    
    // 캐시에서 데이터 가져오기
    const allData = await getCachedAllData();
    
    if (allData.length === 0) {
      UIUtils.hideLoading();
      UIUtils.showAlert('다운로드할 데이터가 없습니다.', 'warning');
      return;
    }
    
    UIUtils.showAlert(`${allData.length}건의 데이터를 Excel로 변환 중...`, 'info');
    
    // Excel 데이터 생성
    const excelData = generateCompletionExcelData(allData);
    
    // Excel 다운로드
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    ExcelUtils.downloadExcel(excelData, `생산공정_완료일_전체데이터_${timestamp}.xlsx`);
    
    UIUtils.hideLoading();
    UIUtils.showAlert(`전체 ${allData.length}건 데이터를 Excel로 다운로드했습니다.`, 'success');
  } catch (error) {
    UIUtils.hideLoading();
    console.error('전체 Excel 다운로드 오류:', error);
    UIUtils.showAlert(`Excel 다운로드 실패: ${error.message}`, 'error');
  }
}

// ============ 입고 관리 전역 함수 (공정별 완료일 등록) ============

/**
 * 입고 등록 모달 열기
 */
window.openArrivalRegistrationCompletion = function(orderId) {
  const order = orders.find(o => o.id === orderId) || allOrders.find(o => o.id === orderId);
  
  if (!order) {
    UIUtils.showToast('발주 정보를 찾을 수 없습니다.', 'error');
    return;
  }
  
  showArrivalRegistrationModal(order, async () => {
    // 등록 완료 후 데이터 다시 로드
    await reloadCurrentDataCompletion();
  });
};

/**
 * 입고 이력 모달 열기
 */
window.openArrivalHistoryCompletion = function(orderId) {
  const order = orders.find(o => o.id === orderId) || allOrders.find(o => o.id === orderId);
  
  if (!order) {
    UIUtils.showToast('발주 정보를 찾을 수 없습니다.', 'error');
    return;
  }
  
  showArrivalHistoryModal(order, async () => {
    // 이력 업데이트 후 데이터 다시 로드
    await reloadCurrentDataCompletion();
  });
};

/**
 * 현재 데이터 다시 로드
 */
async function reloadCurrentDataCompletion() {
  try {
    UIUtils.showLoading();
    
    // 현재 선택된 입고요구월로 데이터 다시 로드
    const [year, month] = filterState.requiredMonth.split('-').map(Number);
    const freshOrders = await getOrdersByRequiredMonth(year, month);
    
    // 전역 변수 업데이트
    allOrders = [...freshOrders];
    
    // 필터 적용
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
    
    UIUtils.hideLoading();
    UIUtils.showToast('데이터가 업데이트되었습니다.', 'success');
  } catch (error) {
    UIUtils.hideLoading();
    console.error('데이터 재로드 실패:', error);
    UIUtils.showToast('데이터 업데이트에 실패했습니다.', 'error');
  }
}

export default { renderProcessCompletion };
