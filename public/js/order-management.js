

// 생산 목표일정 수립 (발주 관리) - 완전 개선 버전
import { getOrdersWithProcesses, getOrdersByRequiredMonth, addOrder, updateOrder, deleteOrder, updateProcess, uploadStyleImage, getSuppliersByCountry, getSupplierByName } from './firestore-service.js';
import { renderEmptyState, createProcessTableHeaders } from './ui-components.js';
import { UIUtils, ExcelUtils, DateUtils } from './utils.js';
import { SUPPLIERS_BY_COUNTRY, ROUTES_BY_COUNTRY, calculateProcessSchedule, SHIPPING_LEAD_TIMES } from './process-config.js';

// 드롭다운 기준 데이터 (향후 Firestore로 이관 가능)
const MASTER_DATA = {
  channels: ['IM', 'ELCANTO'],
  orderTypes: ['정기오더', 'QR']
};

let orders = [];
let allOrders = []; // 전체 데이터 저장 (필터링용)
let selectedOrderIds = new Set();
let originalOrders = {}; // 원본 데이터 저장 (변경 감지용)
let hasUnsavedChanges = false;
let dynamicSuppliersByCountry = {}; // Firebase에서 가져온 동적 생산업체 목록

// 캐싱 관련 변수
let cachedAllData = null; // 전체 데이터 캐시
let cacheTimestamp = null; // 캐시 생성 시간
const CACHE_DURATION = 60 * 60 * 1000; // 1시간 (밀리초)

let sortState = {
  column: null,
  direction: null // null, 'asc', 'desc'
};
let filterState = {
  seasonOrder: '', // 연도시즌+차수 필터
  supplier: '', // 생산업체 필터
  requiredMonth: '' // 입고요구월 필터 (YYYY-MM)
};
let paginationState = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0
};

export async function renderOrderManagement(container) {
  try {
    UIUtils.showLoading();
    
    // Firebase에서 생산업체 목록 동적 로드
    dynamicSuppliersByCountry = await getSuppliersByCountry();
    console.log('동적 생산업체 목록 로드:', dynamicSuppliersByCountry);
    
    // 현재 월 계산
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    filterState.requiredMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // 현재 월 데이터 로드 (서버 필터링)
    orders = await getOrdersByRequiredMonth(currentYear, currentMonth);
    allOrders = [...orders]; // 현재 보이는 데이터 복사
    
    // 원본 데이터 저장
    orders.forEach(order => {
      originalOrders[order.id] = JSON.stringify(order);
    });
    
    container.innerHTML = `
      <div class="space-y-3">
        <!-- 모바일 최적화 레이아웃 -->
        <div class="flex flex-col gap-3">
          <!-- 제목 (첫 번째 줄) -->
          <div class="flex items-center" style="display: flex !important; flex-wrap: nowrap !important; align-items: center !important; gap: 0.5rem !important; width: auto !important;">
            <h2 class="text-xl font-bold text-gray-800" style="margin: 0 !important; white-space: nowrap !important;">생산 목표일정 수립</h2>
            <i id="order-management-info-icon" 
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
              <span id="total-count" class="text-sm font-semibold text-gray-700">총 0건</span>
              <select id="required-month-filter" class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">입고요구월 선택</option>
              </select>
              <select id="items-per-page" class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="10">10개씩 보기</option>
                <option value="50">50개씩 보기</option>
                <option value="100">100개씩 보기</option>
                <option value="500">500개씩 보기</option>
              </select>
            </div>
            
            <!-- 오른쪽: Excel 다운로드 버튼 -->
            <div class="flex gap-2">
              <button id="download-month-excel-btn" class="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm">
                <i class="fas fa-file-excel mr-1"></i>현재월 Excel 다운로드
              </button>
              <button id="download-all-excel-btn" class="bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 text-sm">
                <i class="fas fa-file-excel mr-1"></i>전체 데이터 Excel 다운로드
              </button>
            </div>
          </div>
          
          <!-- 검색 + 버튼 그룹 (세 번째 줄) -->
          <div class="flex flex-wrap gap-2 justify-end items-center">
            <!-- 생산업체 검색 -->
            <div class="relative">
              <input type="text" 
                     id="supplier-filter-input" 
                     placeholder="생산업체 검색" 
                     class="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     style="padding-right: 60px;">
              <div class="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button id="supplier-filter-apply" 
                        class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        title="검색">
                  <i class="fas fa-search"></i>
                </button>
                <button id="supplier-filter-clear" 
                        class="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                        title="초기화">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <!-- 연도시즌+차수 검색 -->
            <div class="relative">
              <input type="text" 
                     id="season-filter-input" 
                     placeholder="연도시즌+차수 검색" 
                     class="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     style="padding-right: 60px;">
              <div class="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button id="season-filter-apply" 
                        class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        title="검색">
                  <i class="fas fa-search"></i>
                </button>
                <button id="season-filter-clear" 
                        class="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                        title="초기화">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <button id="template-btn" class="bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-600 text-sm">
              <i class="fas fa-file-download mr-1"></i>템플릿 다운로드
            </button>
            <button id="upload-btn" class="bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700 text-sm">
              <i class="fas fa-file-excel mr-1"></i>엑셀 업로드
            </button>
            <input type="file" id="excel-uploader" accept=".xlsx,.xls" class="hidden">
            <button id="download-excel-btn" class="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm">
              <i class="fas fa-download mr-1"></i>엑셀 다운로드
            </button>
            <button id="add-row-btn" class="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 text-sm">
              <i class="fas fa-plus mr-1"></i>행 추가
            </button>
            <button id="save-btn" class="bg-gray-400 text-white px-3 py-1.5 rounded-md hover:bg-gray-500 disabled:opacity-50 text-sm" disabled>
              <i class="fas fa-save mr-1"></i>저장
            </button>
            <button id="delete-btn" class="bg-gray-400 text-white px-3 py-1.5 rounded-md hover:bg-gray-500 disabled:opacity-50 text-sm" disabled>
              <i class="fas fa-trash mr-1"></i>삭제
            </button>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-3">
          <div id="orders-table" class="overflow-auto" style="max-height: calc(100vh - 240px);"></div>
          
          <!-- 페이지네이션 -->
          <div id="pagination-container" class="flex justify-center items-center gap-2 mt-4">
            <!-- 페이지네이션 버튼이 여기에 동적으로 생성됩니다 -->
          </div>
        </div>
        
        <!-- 인포메이션 툴팁 -->
        <div id="order-management-info-tooltip" class="hidden fixed bg-white rounded-lg z-[1001]" 
             style="width: 420px; padding: 20px; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center">
              <span style="font-size: 16px; margin-right: 8px;">💡</span>
              <h3 class="font-bold text-gray-800" style="font-size: 15px;">안내사항</h3>
            </div>
            <button id="close-order-info-tooltip" class="text-gray-400 hover:text-gray-600 text-xl leading-none" style="margin-top: -4px;">&times;</button>
          </div>
          <div style="font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0;">• 승인된 발주정보 기준으로 생산 공정별 목표 일정을 수립합니다. 입고요구일과 입고예정일 차이를 확인해 주세요.</p>
          </div>
          <div class="flex items-start mb-2">
            <span style="font-size: 16px; margin-right: 8px;">📌</span>
            <h3 class="font-bold text-gray-800" style="font-size: 15px;">사용 팁</h3>
          </div>
          <div style="font-size: 14px; color: #333; line-height: 1.7;">
            <p style="margin: 0 0 6px 0;">• 승인 발주정보 등록: 템플릿 양식에 발주 정보(사진 포함)를 붙여넣기 한 후 엑셀 업로드</p>
            <p style="margin: 0 0 6px 0;">• 발주정보 수정: 일괄 업로드한 발주 정보에 수정이 필요한 경우, 보여지는 화면에서 직접 수정 가능</p>
            <p style="margin: 0 0 6px 0;">• 물류 입고(예상일): 발주일 기준 공정별 표준 리드타임이 자동 반영되어 물류 입고일이 계산되는 로직</p>
            <p style="margin: 0;">• 입고 요구일: MD가 계획한 발주서상 입고 요구일로, 표준 물류 입고일과 차이가 있을 경우, 부서간 협의후 입고 요구일 수정 필요</p>
          </div>
          <!-- 툴팁 화살표 -->
          <div class="absolute" style="top: -8px; left: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid white;"></div>
          <div class="absolute" style="top: -9px; left: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid #ddd;"></div>
        </div>
        
        <!-- 이미지 확대 팝업 -->
        <div id="image-popup" class="hidden fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" style="display: none;">
          <div class="relative max-w-4xl max-h-full">
            <button id="close-popup" class="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300">&times;</button>
            <img id="popup-image" src="" alt="확대 이미지" class="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl">
          </div>
        </div>
        
        <!-- 이미지 업로드/수정 모달 -->
        <div id="image-upload-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-md">
            <h3 class="text-xl font-bold mb-4">스타일 이미지 업로드</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-paste mr-1"></i>이미지 붙여넣기 (Ctrl+V 또는 Cmd+V)
                </label>
                <div id="paste-area" 
                     class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                     tabindex="0">
                  <i class="fas fa-clipboard text-4xl text-gray-400 mb-2"></i>
                  <p class="text-sm text-gray-600">이미지를 복사한 후 여기를 클릭하고<br><strong>Ctrl+V (Windows) 또는 Cmd+V (Mac)</strong>를 눌러주세요</p>
                  <p class="text-xs text-gray-500 mt-2">또는 아래에서 파일을 선택하세요</p>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-file-upload mr-1"></i>또는 파일 선택
                </label>
                <input type="file" id="style-image-input" accept="image/*" 
                       class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
              </div>
              <div id="image-preview-container" class="hidden">
                <p class="text-sm text-gray-500 mb-2">미리보기</p>
                <img id="image-preview" src="" alt="Preview" class="w-full h-auto rounded-lg max-h-64 object-contain border border-gray-200">
              </div>
            </div>
            <div class="mt-6 flex justify-end space-x-3">
              <button type="button" id="image-upload-cancel-btn" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                취소
              </button>
              <button type="button" id="image-upload-save-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    initializeRequiredMonthFilter();
    renderOrdersTable();
    setupEventListeners();
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Order management render error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.', 'fa-exclamation-circle');
  }
}

function getSortIcon(column) {
  if (sortState.column !== column) {
    return '<i class="fas fa-sort text-gray-400 ml-1 text-xs"></i>';
  }
  if (sortState.direction === 'asc') {
    return '<i class="fas fa-sort-up text-blue-600 ml-1 text-xs"></i>';
  }
  if (sortState.direction === 'desc') {
    return '<i class="fas fa-sort-down text-blue-600 ml-1 text-xs"></i>';
  }
  return '<i class="fas fa-sort text-gray-400 ml-1 text-xs"></i>';
}

function sortOrders() {
  if (!sortState.column || !sortState.direction) {
    // 정렬 없음: uploadOrder가 있으면 그 순서대로, 없으면 그대로 유지
    orders.sort((a, b) => {
      if (a.uploadOrder !== undefined && b.uploadOrder !== undefined) {
        return a.uploadOrder - b.uploadOrder;
      }
      if (a.uploadOrder !== undefined) return -1;
      if (b.uploadOrder !== undefined) return 1;
      return 0; // 기존 순서 유지
    });
    return;
  }
  
  orders.sort((a, b) => {
    let aVal, bVal;
    
    switch(sortState.column) {
      case 'channel':
        aVal = a.channel || '';
        bVal = b.channel || '';
        break;
      case 'seasonOrder':
        aVal = a.seasonOrder || '';
        bVal = b.seasonOrder || '';
        break;
      case 'country':
        aVal = a.country || '';
        bVal = b.country || '';
        break;
      case 'supplier':
        aVal = a.supplier || '';
        bVal = b.supplier || '';
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
    
    // 빈 값은 끝으로
    if (!aVal && bVal) return 1;
    if (aVal && !bVal) return -1;
    if (!aVal && !bVal) return 0;
    
    // 정렬 방향에 따라
    if (typeof aVal === 'string') {
      const result = aVal.localeCompare(bVal, 'ko');
      return sortState.direction === 'asc' ? result : -result;
    } else {
      const result = aVal - bVal;
      return sortState.direction === 'asc' ? result : -result;
    }
  });
}

// applySeasonFilter는 applyFilters로 통합됨 (아래 참조)

// renderOrdersTable 함수는 페이지네이션 버전으로 아래에 정의됨 (2496줄 참조)

function renderOrderRow(order, rowNum, headers) {
  console.log('🎨 renderOrderRow 호출:', {
    orderId: order.id,
    orderDate: order.orderDate,
    scheduleExists: !!order.schedule,
    productionCount: order.schedule?.production?.length,
    shippingCount: order.schedule?.shipping?.length
  });
  
  // 입항일 (운송 공정의 마지막)
  const arrivalDate = order.processes.shipping[order.processes.shipping.length - 1]?.targetDate || '-';
  
  // 물류입고일 = 입항일 + 0일 (통상 입항 당일 입고)
  // 실제 물류입고일은 수동 입력 가능 (세관검사, 운송문제 등으로 지연 가능)
  const logisticsArrival = order.logisticsArrival || arrivalDate;
  
  // 입고기준 예상차이 계산 (양수면 빨강 - 지연)
  const delayDays = logisticsArrival !== '-' ? DateUtils.diffInDays(order.requiredDelivery, logisticsArrival) : null;
  const delayClass = delayDays > 0 ? 'bg-red-600 text-white font-bold' : '';
  const delayText = delayDays !== null ? (delayDays > 0 ? `+${delayDays}` : delayDays) : '-';
  
  return `
    <tr class="border-b hover:bg-gray-50" data-order-id="${order.id}">
      <td class="px-2 py-2 border text-center">
        <input type="checkbox" class="order-checkbox" value="${order.id}">
      </td>
      <td class="px-2 py-2 border text-center">${rowNum}</td>
      
      <!-- 채널 (드롭다운) -->
      <td class="px-2 py-2 border">
        <select class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-xs" style="min-width: 70px;" 
                data-order-id="${order.id}" data-field="channel">
          <option value="">선택하세요</option>
          ${MASTER_DATA.channels.map(ch => 
            `<option value="${ch}" ${order.channel === ch ? 'selected' : ''}>${ch}</option>`
          ).join('')}
        </select>
      </td>

      <!-- 오더기준 (드롭다운) -->
      <td class="px-2 py-2 border">
        <select class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-xs" style="min-width: 80px;" 
                data-order-id="${order.id}" data-field="orderType">
          <option value="">선택하세요</option>
          ${MASTER_DATA.orderTypes.map(type => 
            `<option value="${type}" ${order.orderType === type ? 'selected' : ''}>${type}</option>`
          ).join('')}
        </select>
      </td>
      
      <!-- 연도시즌+차수 (직접입력) -->
      <td class="px-2 py-2 border">
        <input type="text" class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-xs" style="min-width: 90px;" 
               data-order-id="${order.id}" data-field="seasonOrder" value="${order.seasonOrder || ''}" 
               placeholder="예: 25FW1">
      </td>
      
      <!-- 스타일 (직접입력 - 정확히 10자리) -->
      <td class="px-2 py-2 border">
        <input type="text" class="editable-field style-input w-full px-1 py-1 border border-gray-300 rounded text-xs" style="min-width: 90px;" 
               data-order-id="${order.id}" data-field="style" value="${order.style || ''}" 
               maxlength="10" minlength="10" pattern=".{10}" 
               placeholder="10자리">
      </td>
      
      <!-- 스타일 이미지 -->
      <td class="px-2 py-2 border text-center">
        ${order.styleImage ? `
          <div class="style-image-container relative inline-block group">
            <img src="${order.styleImage}" alt="Style" class="style-image-thumb cursor-pointer rounded border border-gray-300"
                 style="height: 48px; width: auto; max-width: 200px;"
                 data-image-url="${order.styleImage}"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2212%22 fill=%22%23999%22%3E이미지 없음%3C/text%3E%3C/svg%3E'; this.classList.add('broken-image');">
            <button class="upload-image-btn absolute top-0 right-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                    data-order-id="${order.id}"
                    title="이미지 변경">
              <i class="fas fa-upload"></i>
            </button>
          </div>
        ` : `
          <button class="upload-image-btn text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded transition-colors"
                  data-order-id="${order.id}"
                  title="이미지 업로드">
            <i class="fas fa-image text-xl"></i>
            <span class="block text-xs mt-1">업로드</span>
          </button>
        `}
      </td>
      
      <!-- 색상 (직접입력) -->
      <td class="px-2 py-2 border">
        <input type="text" class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-xs" style="min-width: 50px;" 
               data-order-id="${order.id}" data-field="color" value="${order.color || ''}" 
               placeholder="색상">
      </td>
      
      <!-- 수량 (직접입력) -->
      <td class="px-2 py-2 border">
        <input type="number" class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-right text-xs" 
               data-order-id="${order.id}" data-field="qty" value="${order.qty || 0}">
      </td>
      
      <!-- 국가 (드롭다운) -->
      <td class="px-2 py-2 border">
        <select class="editable-field country-select w-full px-1 py-1 border border-gray-300 rounded text-xs" style="min-width: 70px;" 
                data-order-id="${order.id}" data-field="country">
          <option value="">선택하세요</option>
          ${Object.keys(SUPPLIERS_BY_COUNTRY).map(country => 
            `<option value="${country}" ${order.country === country ? 'selected' : ''}>${country}</option>`
          ).join('')}
        </select>
      </td>
      
      <!-- 생산업체 (드롭다운) -->
      <td class="px-2 py-2 border">
        <select class="editable-field supplier-select w-full px-1 py-1 border border-gray-300 rounded text-xs" style="min-width: 70px;" 
                data-order-id="${order.id}" data-field="supplier" data-country="${order.country}">
          <option value="">선택하세요</option>
          ${(dynamicSuppliersByCountry[order.country] || []).map(sup => 
            `<option value="${sup}" ${order.supplier === sup ? 'selected' : ''}>${sup}</option>`
          ).join('')}
        </select>
      </td>
      
      <!-- 발주일 (날짜 편집 가능) -->
      <td class="px-2 py-2 border">
        <input type="text" class="editable-field order-date-input w-full px-1 py-1 border border-gray-300 rounded text-xs" 
               data-order-id="${order.id}" data-field="orderDate" value="${order.orderDate}" 
               placeholder="YYYY-MM-DD">
      </td>
      
      <!-- 입고요구일 (날짜 편집 가능) -->
      <td class="px-2 py-2 border">
        <input type="text" class="editable-field required-delivery-input w-full px-1 py-1 border border-gray-300 rounded text-xs" 
               data-order-id="${order.id}" data-field="requiredDelivery" value="${order.requiredDelivery}" 
               placeholder="YYYY-MM-DD">
      </td>
      
      <!-- 생산 공정 목표일 (날짜 편집 가능) -->
      ${headers.production.map(h => {
        const process = order.processes.production.find(p => p.key === h.key || p.processKey === h.key);
        const processDate = process?.targetDate || '';
        console.log(`📅 생산공정 렌더링 - ${h.key}:`, {
          processFound: !!process,
          targetDate: process?.targetDate,
          processDate: processDate
        });
        return `<td class="px-2 py-2 border">
          <input type="text" class="editable-field process-date-input w-full px-1 py-1 border border-gray-300 rounded text-xs" 
                 placeholder="YYYY-MM-DD" 
                 data-order-id="${order.id}" 
                 data-process-category="production" 
                 data-process-key="${h.key}" 
                 value="${processDate}">
        </td>`;
      }).join('')}
      
      <!-- 운송 목표일정: 선적 (날짜 편집 가능) -->
      ${(() => {
        console.log('🚢 운송 공정 렌더링:', {
          hasShipping: !!order.processes?.shipping,
          shippingArray: order.processes?.shipping,
          shippingLength: order.processes?.shipping?.length
        });
        if (order.processes?.shipping) {
          console.log('🚢 운송 공정 상세:', JSON.stringify(order.processes.shipping, null, 2));
        }
        const shippingProcess = order.processes?.shipping?.find(p => p.key === 'shipping' || p.processKey === 'shipping');
        const shippingDate = shippingProcess?.targetDate || '';
        console.log('📦 선적 프로세스:', { 
          found: !!shippingProcess,
          shippingProcess: shippingProcess, 
          shippingDate: shippingDate 
        });
        return `<td class="px-2 py-2 border">
          <input type="text" class="editable-field process-date-input w-full px-1 py-1 border border-gray-300 rounded text-xs" 
                 placeholder="YYYY-MM-DD" 
                 data-order-id="${order.id}" 
                 data-process-category="shipping" 
                 data-process-key="shipping" 
                 value="${shippingDate}">
        </td>`;
      })()}
      
      <!-- 운송 목표일정: 선적항-도착항 (드롭다운) -->
      <td class="px-2 py-2 border">
        <select class="editable-field route-select w-full px-1 py-1 border border-gray-300 rounded text-xs" style="min-width: 90px;" 
                data-order-id="${order.id}" data-field="route" data-country="${order.country}">
          ${(ROUTES_BY_COUNTRY[order.country] || []).map(route => 
            `<option value="${route}" ${order.route === route ? 'selected' : ''}>${route}</option>`
          ).join('')}
        </select>
      </td>
      
      <!-- 운송 목표일정: 입항 (날짜 편집 가능) -->
      ${(() => {
        const arrivalProcess = order.processes?.shipping?.find(p => p.key === 'arrival' || p.processKey === 'arrival');
        const arrivalDate = arrivalProcess?.targetDate || '';
        console.log('📦 입항 프로세스:', { 
          found: !!arrivalProcess,
          arrivalProcess: arrivalProcess, 
          arrivalDate: arrivalDate 
        });
        return `<td class="px-2 py-2 border">
          <input type="text" class="editable-field process-date-input w-full px-1 py-1 border border-gray-300 rounded text-xs" 
                 placeholder="YYYY-MM-DD" 
                 data-order-id="${order.id}" 
                 data-process-category="shipping" 
                 data-process-key="arrival" 
                 value="${arrivalDate}">
        </td>`;
      })()}
      
      <!-- 물류입고 (수동 입력 가능) -->
      <td class="px-2 py-2 border text-center" style="min-width: 80px;">
        <input type="text" class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-xs text-center" 
               data-order-id="${order.id}" data-field="logisticsArrival" value="${logisticsArrival || ''}"
               placeholder="YYYY-MM-DD"
               style="min-width: 95px;">
      </td>
      
      <!-- 입고기준 예상차이 -->
      <td class="px-2 py-2 border text-center ${delayClass}">${delayText}</td>
           
      <!-- 비고 -->
      <td class="px-2 py-2 border" style="min-width: 100px;">
        <input type="text" class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-xs" 
               data-order-id="${order.id}" data-field="notes" value="${order.notes || ''}" 
               placeholder="예: 세관검사 지연 +2일">
      </td>
    </tr>
  `;
}

function setupEventListeners() {
  // 정렬 헤더 클릭 이벤트
  document.querySelectorAll('[data-sort]').forEach(header => {
    header.addEventListener('click', (e) => {
      const column = e.currentTarget.dataset.sort;
      
      // 정렬 상태 토글
      if (sortState.column === column) {
        if (sortState.direction === null) {
          sortState.direction = 'asc';
        } else if (sortState.direction === 'asc') {
          sortState.direction = 'desc';
        } else {
          // 원래 순서로 복원
          sortState.column = null;
          sortState.direction = null;
        }
      } else {
        sortState.column = column;
        sortState.direction = 'asc';
      }
      
      // 테이블 재렌더링
      renderOrdersTable();
      // 이벤트 리스너 재설정
      setupEventListeners();
    });
  });
  
  // Select all checkbox
  document.getElementById('select-all')?.addEventListener('change', (e) => {
    document.querySelectorAll('.order-checkbox').forEach(cb => {
      cb.checked = e.target.checked;
      if (e.target.checked) {
        selectedOrderIds.add(cb.value);
      } else {
        selectedOrderIds.delete(cb.value);
      }
    });
    updateDeleteButton();
  });
  
  // Individual checkboxes
  document.querySelectorAll('.order-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedOrderIds.add(e.target.value);
      } else {
        selectedOrderIds.delete(e.target.value);
      }
      updateDeleteButton();
    });
  });
  
  // Editable fields - 변경 감지 및 자동 저장 준비
  document.querySelectorAll('.editable-field').forEach(field => {
    // Country 변경 시 Supplier와 Route 업데이트
    if (field.classList.contains('country-select')) {
      field.addEventListener('change', (e) => {
        handleCountryChange(e.target);
        markAsChanged(e.target.dataset.orderId);
      });
    } 
    // Supplier 변경 시 일정 재계산 (리드타임 반영)
    else if (field.classList.contains('supplier-select')) {
      field.addEventListener('change', async (e) => {
        const orderId = e.target.dataset.orderId;
        const newSupplier = e.target.value;
        console.log('🏭 생산업체 변경 시작:', { orderId, newSupplier });
        await handleSupplierChange(orderId, newSupplier);
      });
    }
    // Route 변경 시 일정 재계산
    else if (field.classList.contains('route-select')) {
      field.addEventListener('change', (e) => {
        handleRouteChangeInline(e.target);
      });
    }
    // 스타일 필드 - 10자리 검증
    else if (field.classList.contains('style-input')) {
      field.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value.length > 10) {
          e.target.value = value.substring(0, 10);
        }
      });
      
      field.addEventListener('blur', (e) => {
        const value = e.target.value;
        if (value.length > 0 && value.length !== 10) {
          e.target.classList.add('border-red-500', 'bg-red-50');
          UIUtils.showAlert('스타일은 정확히 10자리여야 합니다.', 'error');
          e.target.focus();
        } else {
          e.target.classList.remove('border-red-500', 'bg-red-50');
          if (value.length === 10) {
            markAsChanged(e.target.dataset.orderId);
          }
        }
      });
    }
    // 발주일 변경 시 공정 일정 재계산
    else if (field.classList.contains('order-date-input')) {
      console.log('🎯 발주일 필드 이벤트 리스너 등록:', field.dataset.orderId);
      
      // 날짜 형식 유효성 검사
      field.addEventListener('blur', (e) => {
        const value = e.target.value;
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          e.target.classList.add('border-red-500', 'bg-red-50');
          UIUtils.showAlert('날짜 형식은 YYYY-MM-DD 이어야 합니다.', 'error');
        } else {
          e.target.classList.remove('border-red-500', 'bg-red-50');
        }
      });
      
      field.addEventListener('change', async (e) => {
        console.log('🔔 발주일 change 이벤트 발생');
        const orderId = e.target.dataset.orderId;
        const newOrderDate = e.target.value;
        console.log('📝 입력된 발주일:', newOrderDate);
        
        if (newOrderDate && /^\d{4}-\d{2}-\d{2}$/.test(newOrderDate)) {
          console.log('✅ 날짜 형식 검증 통과, handleOrderDateChange 호출');
          await handleOrderDateChange(orderId, newOrderDate);
        } else {
          console.warn('⚠️ 날짜 형식 오류:', newOrderDate);
        }
      });
    }
    // 입고요구일 변경 (일정 재계산 안함)
    else if (field.classList.contains('required-delivery-input')) {
      // 날짜 형식 유효성 검사
      field.addEventListener('blur', (e) => {
        const value = e.target.value;
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          e.target.classList.add('border-red-500', 'bg-red-50');
          UIUtils.showAlert('날짜 형식은 YYYY-MM-DD 이어야 합니다.', 'error');
        } else {
          e.target.classList.remove('border-red-500', 'bg-red-50');
        }
      });
      
      field.addEventListener('change', (e) => {
        const orderId = e.target.dataset.orderId;
        const newDate = e.target.value;
        if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
          const order = orders.find(o => o.id === orderId);
          if (order) {
            order.requiredDelivery = newDate;
            markAsChanged(orderId);
          }
        }
      });
    }
    // 공정별 날짜 직접 수정
    else if (field.classList.contains('process-date-input')) {
      // 날짜 형식 유효성 검사
      field.addEventListener('blur', (e) => {
        const value = e.target.value;
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          e.target.classList.add('border-red-500', 'bg-red-50');
        } else {
          e.target.classList.remove('border-red-500', 'bg-red-50');
        }
      });
      
      field.addEventListener('change', (e) => {
        const orderId = e.target.dataset.orderId;
        const category = e.target.dataset.processCategory;
        const processKey = e.target.dataset.processKey;
        const newDate = e.target.value;
        if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
          handleProcessDateChange(orderId, category, processKey, newDate);
        }
      });
    }
    // 일반 필드 변경
    else {
      field.addEventListener('change', (e) => {
        markAsChanged(e.target.dataset.orderId);
      });
    }
  });
  
  // 입고요구월 필터
  const requiredMonthFilter = document.getElementById('required-month-filter');
  requiredMonthFilter?.addEventListener('change', (e) => {
    handleRequiredMonthChange(e.target.value);
  });
  
  // 페이지당 항목 수 변경
  const itemsPerPageSelect = document.getElementById('items-per-page');
  itemsPerPageSelect?.addEventListener('change', (e) => {
    paginationState.itemsPerPage = parseInt(e.target.value);
    paginationState.currentPage = 1; // 첫 페이지로 이동
    renderOrdersTable();
    setupEventListeners();
  });
  
  // Excel 다운로드 버튼
  document.getElementById('download-month-excel-btn')?.addEventListener('click', downloadMonthExcel);
  document.getElementById('download-all-excel-btn')?.addEventListener('click', downloadAllExcel);
  
  // 생산업체 필터
  const supplierFilterInput = document.getElementById('supplier-filter-input');
  const supplierFilterApply = document.getElementById('supplier-filter-apply');
  const supplierFilterClear = document.getElementById('supplier-filter-clear');
  
  supplierFilterInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterState.supplier = supplierFilterInput.value;
      applyFilters();
      renderOrdersTable();
      setupEventListeners();
    }
  });
  
  supplierFilterApply?.addEventListener('click', () => {
    filterState.supplier = supplierFilterInput.value;
    applyFilters();
    renderOrdersTable();
    setupEventListeners();
  });
  
  supplierFilterClear?.addEventListener('click', () => {
    filterState.supplier = '';
    supplierFilterInput.value = '';
    applyFilters();
    renderOrdersTable();
    setupEventListeners();
  });
  
  // 연도시즌+차수 필터
  const seasonFilterInput = document.getElementById('season-filter-input');
  const seasonFilterApply = document.getElementById('season-filter-apply');
  const seasonFilterClear = document.getElementById('season-filter-clear');
  
  seasonFilterInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterState.seasonOrder = seasonFilterInput.value;
      applyFilters();
      renderOrdersTable();
      setupEventListeners();
    }
  });
  
  seasonFilterApply?.addEventListener('click', () => {
    filterState.seasonOrder = seasonFilterInput.value;
    applyFilters();
    renderOrdersTable();
    setupEventListeners();
  });
  
  seasonFilterClear?.addEventListener('click', () => {
    filterState.seasonOrder = '';
    seasonFilterInput.value = '';
    applyFilters();
    renderOrdersTable();
    setupEventListeners();
  });
  
  // Buttons
  document.getElementById('template-btn')?.addEventListener('click', downloadTemplate);
  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('excel-uploader').click();
  });
  document.getElementById('download-excel-btn')?.addEventListener('click', downloadCurrentDataAsExcel);
  document.getElementById('add-row-btn')?.addEventListener('click', addNewRow);
  document.getElementById('save-btn')?.addEventListener('click', saveAllChanges);
  document.getElementById('delete-btn')?.addEventListener('click', deleteSelectedOrders);
  
  // Excel uploader
  document.getElementById('excel-uploader')?.addEventListener('change', handleExcelUpload);
  
  // 스타일 이미지 확대 팝업
  document.querySelectorAll('.style-image-thumb').forEach(img => {
    img.addEventListener('click', (e) => {
      const imageUrl = e.target.dataset.imageUrl;
      const popup = document.getElementById('image-popup');
      const popupImage = document.getElementById('popup-image');
      popupImage.src = imageUrl;
      popup.style.display = 'flex';
      popup.classList.remove('hidden');
    });
  });
  
  // 팝업 닫기
  document.getElementById('close-popup')?.addEventListener('click', () => {
    const popup = document.getElementById('image-popup');
    popup.style.display = 'none';
    popup.classList.add('hidden');
  });
  
  // 팝업 배경 클릭 시 닫기
  document.getElementById('image-popup')?.addEventListener('click', (e) => {
    if (e.target.id === 'image-popup') {
      e.target.style.display = 'none';
      e.target.classList.add('hidden');
    }
  });
  
  // 이미지 업로드 버튼 클릭
  document.querySelectorAll('.upload-image-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // 이미지 확대 팝업 방지
      const orderId = e.currentTarget.dataset.orderId;
      openImageUploadModal(orderId);
    });
  });
  
  // 이미지 업로드 모달 - 파일 선택
  document.getElementById('style-image-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageFileSelected(file);
    }
  });
  
  // 이미지 붙여넣기 영역 - 클릭하면 포커스
  document.getElementById('paste-area')?.addEventListener('click', (e) => {
    e.currentTarget.focus();
  });
  
  // 이미지 붙여넣기 - Ctrl+V / Cmd+V
  document.getElementById('paste-area')?.addEventListener('paste', (e) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            console.log('📋 클립보드에서 이미지 감지:', blob);
            handleImageFileSelected(blob);
            UIUtils.showAlert('이미지가 붙여넣기 되었습니다!', 'success');
            return;
          }
        }
      }
    }
    
    UIUtils.showAlert('클립보드에 이미지가 없습니다.', 'warning');
  });
  
  // 모달이 열릴 때 붙여넣기 영역에 자동 포커스
  const imageModal = document.getElementById('image-upload-modal');
  const pasteArea = document.getElementById('paste-area');
  if (imageModal && pasteArea) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          if (!imageModal.classList.contains('hidden')) {
            setTimeout(() => pasteArea.focus(), 100);
          }
        }
      });
    });
    observer.observe(imageModal, { attributes: true });
  }
  
  // 이미지 업로드 모달 - 취소
  document.getElementById('image-upload-cancel-btn')?.addEventListener('click', () => {
    closeImageUploadModal();
  });
  
  // 이미지 업로드 모달 - 저장
  document.getElementById('image-upload-save-btn')?.addEventListener('click', async () => {
    await handleImageUpload();
  });
  
  // 인포메이션 툴팁 기능
  setupOrderInfoTooltip();
}

// 인포메이션 툴팁 기능 설정
function setupOrderInfoTooltip() {
  const icon = document.getElementById('order-management-info-icon');
  const tooltip = document.getElementById('order-management-info-tooltip');
  const closeBtn = document.getElementById('close-order-info-tooltip');
  
  if (!icon || !tooltip) return;
  
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

function handleCountryChange(countrySelect) {
  const orderId = countrySelect.dataset.orderId;
  const newCountry = countrySelect.value;
  const row = countrySelect.closest('tr');
  
  console.log('🌏 국가 변경 시작:', { orderId, newCountry });
  
  // order 객체에 새 국가 저장
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.country = newCountry;
    console.log('💾 order 객체에 국가 저장:', newCountry);
  }
  
  // 해당 행의 supplier select 업데이트
  const supplierSelect = row.querySelector('.supplier-select');
  if (supplierSelect) {
    const suppliers = dynamicSuppliersByCountry[newCountry] || [];
    supplierSelect.innerHTML = '<option value="">선택하세요</option>' + 
      suppliers.map(sup => `<option value="${sup}">${sup}</option>`).join('');
    supplierSelect.dataset.country = newCountry;
    
    // 생산업체 초기화
    if (order) {
      order.supplier = '';
      order.route = '';
      console.log('🔄 생산업체 및 선적항 초기화');
    }
  }
  
  // 해당 행의 route select 업데이트
  const routeSelect = row.querySelector('.route-select');
  if (routeSelect) {
    const routes = ROUTES_BY_COUNTRY[newCountry] || [];
    routeSelect.innerHTML = '<option value="">선택하세요</option>' + 
      routes.map(route => `<option value="${route}">${route}</option>`).join('');
    routeSelect.dataset.country = newCountry;
  }
  
  // 임시 행이면 변경 표시
  if (orderId.startsWith('new_')) {
    markAsChanged(orderId);
  }
  
  console.log('✅ 국가 변경 완료:', { orderId, newCountry });
}

async function handleRouteChangeInline(routeSelect) {
  const orderId = routeSelect.dataset.orderId;
  const newRoute = routeSelect.value;
  
  console.log('🚢 선적경로 변경 시작:', { orderId, newRoute });
  
  try {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      console.error('❌ 발주을 찾을 수 없음:', orderId);
      return;
    }
    
    console.log('📦 기존 발주:', order);
    
    // 생산업체 정보 조회하여 리드타임 적용
    const supplier = await getSupplierByName(order.supplier);
    console.log('🏭 생산업체 정보:', supplier);
    
    // 새로운 일정 재계산 (선적경로 및 생산업체 리드타임 반영)
    const newSchedule = calculateProcessSchedule(order.orderDate, supplier?.leadTimes, newRoute, supplier);
    console.log('📊 새로 계산된 일정:', newSchedule);
    
    // 기존 processes 보존하면서 새 일정 적용 (내장 구조)
    const updatedProcesses = {
      production: newSchedule.production.map((newProc, index) => {
        const existing = order.processes?.production?.[index] || {};
        return {
          ...newProc,
          // 기존 실적 데이터 보존
          completedDate: existing.completedDate || null,
          actualDate: existing.actualDate || null,
          delayDays: existing.delayDays || null,
          delayReason: existing.delayReason || null,
          evidenceUrl: existing.evidenceUrl || null,
          evidenceId: existing.evidenceId || null,
          order: index
        };
      }),
      shipping: newSchedule.shipping.map((newProc, index) => {
        const existing = order.processes?.shipping?.[index] || {};
        return {
          ...newProc,
          // 기존 실적 데이터 보존
          completedDate: existing.completedDate || null,
          actualDate: existing.actualDate || null,
          delayDays: existing.delayDays || null,
          delayReason: existing.delayReason || null,
          evidenceUrl: existing.evidenceUrl || null,
          evidenceId: existing.evidenceId || null,
          order: index
        };
      })
    };
    
    // 발주 업데이트 (processes 포함)
    await updateOrder(orderId, {
      route: newRoute,
      processes: updatedProcesses
    });
    console.log('✅ 발주 및 공정 업데이트 완료 (내장 구조)');
    
    // 테이블 새로고침
    orders = await getOrdersWithProcesses();
    allOrders = [...orders]; // 전체 데이터 업데이트
    console.log('🔄 발주 목록 새로고침 완료');
    
    applyFilters(); // 필터 재적용
    renderOrdersTable();
    setupEventListeners();
    console.log('🎨 테이블 렌더링 완료');
    
    UIUtils.showAlert('선적경로가 변경되고 일정이 재계산되었습니다.', 'success');
  } catch (error) {
    console.error('❌ Route change error:', error);
    UIUtils.showAlert('선적경로 변경 실패: ' + error.message, 'error');
  }
}

async function handleSupplierChange(orderId, newSupplier) {
  console.log('🏭 생산업체 변경 시작:', { orderId, newSupplier });
  
  try {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      console.error('❌ 발주을 찾을 수 없음:', orderId);
      return;
    }
    
    console.log('📦 기존 발주:', order);
    console.log('🚢 경로:', order.route);
    console.log('📅 발주일:', order.orderDate);
    
    // 임시 행 (아직 저장 안됨) 처리
    if (orderId.startsWith('new_')) {
      console.log('🆕 임시 행: 로컬에서만 생산업체 업데이트');
      order.supplier = newSupplier;
      
      // 생산업체 정보 가져오기
      let supplier = null;
      try {
        supplier = await getSupplierByName(newSupplier);
        if (supplier?.shippingRoute) {
          order.route = supplier.shippingRoute;
          console.log('✅ 선적항-도착항 업데이트:', supplier.shippingRoute);
          
          // UI의 route 드롭다운도 업데이트
          const routeSelect = document.querySelector(`select.route-select[data-order-id="${orderId}"]`);
          if (routeSelect) {
            routeSelect.value = supplier.shippingRoute;
            console.log('✅ UI 선적항-도착항 드롭다운 업데이트:', supplier.shippingRoute);
          }
        }
      } catch (error) {
        console.warn('⚠️ 생산업체 정보 가져오기 실패:', error);
      }
      
      // 발주일이 있으면 공정 일정 계산
      console.log('🔍 공정 일정 계산 조건 체크:', {
        hasOrderDate: !!order.orderDate,
        orderDate: order.orderDate,
        hasSupplier: !!supplier,
        supplier: supplier
      });
      
      if (order.orderDate && supplier) {
        console.log('📅 발주일 있음, 공정 일정 계산 시작');
        const newSchedule = calculateProcessSchedule(
          order.orderDate, 
          supplier.leadTimes, 
          order.route, 
          supplier
        );
        order.processes = newSchedule;
        console.log('✅ 공정 일정 계산 완료:', newSchedule);
        
        // 재렌더링 전 현재 입력값들 저장
        const oldRow = document.querySelector(`tr[data-order-id="${orderId}"]`);
        if (oldRow) {
          // 채널, 국가, 생산업체 등 입력값 수집
          const channelSelect = oldRow.querySelector('select[data-field="channel"]');
          const countrySelect = oldRow.querySelector('select.country-select');
          const supplierSelect = oldRow.querySelector('select.supplier-select');
          const seasonInput = oldRow.querySelector('input[data-field="seasonOrder"]');
          const styleInput = oldRow.querySelector('input[data-field="style"]');
          const colorInput = oldRow.querySelector('input[data-field="color"]');
          const qtyInput = oldRow.querySelector('input[data-field="qty"]');
          const requiredDeliveryInput = oldRow.querySelector('input[data-field="requiredDelivery"]');
          
          // order 객체에 저장
          if (channelSelect) order.channel = channelSelect.value;
          if (countrySelect) order.country = countrySelect.value;
          if (supplierSelect) order.supplier = supplierSelect.value;
          if (seasonInput) order.seasonOrder = seasonInput.value;
          if (styleInput) order.style = styleInput.value;
          if (colorInput) order.color = colorInput.value;
          if (qtyInput) order.qty = parseInt(qtyInput.value) || 0;
          if (requiredDeliveryInput) order.requiredDelivery = requiredDeliveryInput.value;
          
          console.log('💾 재렌더링 전 입력값 저장:', {
            channel: order.channel,
            country: order.country,
            supplier: order.supplier,
            seasonOrder: order.seasonOrder
          });
        }
        
        // UI 재렌더링하여 공정 일정 표시
        const headers = createProcessTableHeaders();
        const rowNum = orders.findIndex(o => o.id === orderId) + 1;
        const newRowHtml = renderOrderRow(order, rowNum, headers);
        if (oldRow) {
          oldRow.outerHTML = newRowHtml;
          setupEventListeners();
        }
      }
      
      // UI 재렌더링 없이 변경사항 표시
      markAsChanged(orderId);
      UIUtils.showAlert('생산업체가 변경되었습니다. 발주일을 입력하면 공정 일정이 계산됩니다.', 'success');
      return;
    }
    
    if (!order.orderDate) {
      // 발주일이 없으면 생산업체만 업데이트
      await updateOrder(orderId, {
        supplier: newSupplier
      });
      console.log('✅ 생산업체만 업데이트 완료 (발주일 없음)');
      
      // 테이블 새로고침
      orders = await getOrdersWithProcesses();
      allOrders = [...orders];
      applyFilters();
      renderOrdersTable();
      setupEventListeners();
      
      UIUtils.showAlert('생산업체가 변경되었습니다.', 'success');
      return;
    }
    
    // 새 생산업체 정보 가져오기 (리드타임 + 선적항 포함)
    let supplierLeadTimes = null;
    let supplier = null;
    let newRoute = order.route; // 기본값: 기존 route 유지
    
    try {
      supplier = await getSupplierByName(newSupplier);
      if (supplier && supplier.leadTimes) {
        supplierLeadTimes = supplier.leadTimes;
        console.log('✅ 새 생산업체 리드타임 로드:', supplierLeadTimes);
        console.log('✅ 새 생산업체 선적항:', supplier.shippingRoute);
        
        // 새 생산업체의 선적항-도착항 반영
        if (supplier.shippingRoute) {
          newRoute = supplier.shippingRoute;
          console.log('✅ 선적항-도착항 업데이트:', order.route, '→', newRoute);
        }
      } else {
        console.warn('⚠️ 생산업체 리드타임 없음, 기본값 사용');
      }
    } catch (error) {
      console.warn('⚠️ 생산업체 정보 가져오기 실패, 기본 리드타임 사용:', error);
    }
    
    // 생산업체 변경 시 전체 공정 일정 재계산 (새 생산업체 리드타임 + 선적항 반영)
    const newSchedule = calculateProcessSchedule(order.orderDate, supplierLeadTimes, newRoute, supplier);
    console.log('📊 새로 계산된 일정:', newSchedule);
    
    // 기존 processes 보존하면서 새 일정 적용
    const updatedProcesses = {
      production: newSchedule.production.map((newProc, index) => {
        const existing = order.processes?.production?.[index] || {};
        return {
          ...newProc,
          // 기존 실적 데이터 보존
          completedDate: existing.completedDate || null,
          actualDate: existing.actualDate || null,
          delayDays: existing.delayDays || null,
          delayReason: existing.delayReason || null,
          evidenceUrl: existing.evidenceUrl || null,
          evidenceId: existing.evidenceId || null,
          order: index
        };
      }),
      shipping: newSchedule.shipping.map((newProc, index) => {
        const existing = order.processes?.shipping?.[index] || {};
        return {
          ...newProc,
          // 기존 실적 데이터 보존
          completedDate: existing.completedDate || null,
          actualDate: existing.actualDate || null,
          delayDays: existing.delayDays || null,
          delayReason: existing.delayReason || null,
          evidenceUrl: existing.evidenceUrl || null,
          evidenceId: existing.evidenceId || null,
          order: index
        };
      })
    };
    
    // 발주 업데이트 (생산업체 + 선적항 + processes 포함)
    await updateOrder(orderId, {
      supplier: newSupplier,
      route: newRoute,
      processes: updatedProcesses
    });
    console.log('✅ 생산업체, 선적항-도착항 및 공정 업데이트 완료');
    
    // 로컬 orders 배열 업데이트 (Firebase 재로드 대신)
    order.supplier = newSupplier;
    order.route = newRoute;
    order.processes = updatedProcesses;
    order.schedule = updatedProcesses; // 호환성
    console.log('💾 로컬 orders 배열 업데이트 완료');
    
    // 해당 행만 재렌더링
    const headers = createProcessTableHeaders();
    const rowNum = orders.findIndex(o => o.id === orderId) + 1;
    const newRowHtml = renderOrderRow(order, rowNum, headers);
    const oldRow = document.querySelector(`tr[data-order-id="${orderId}"]`);
    if (oldRow) {
      oldRow.outerHTML = newRowHtml;
      setupEventListeners();
      console.log('🎨 행 재렌더링 완료');
    }
    
    UIUtils.showAlert('생산업체, 선적항-도착항이 변경되고 전체 일정이 재계산되었습니다.', 'success');
  } catch (error) {
    console.error('❌ Supplier change error:', error);
    UIUtils.showAlert('생산업체 변경 실패: ' + error.message, 'error');
  }
}

async function handleOrderDateChange(orderId, newOrderDate) {
  console.log('📅 발주일 변경 시작:', { orderId, newOrderDate });
  
  try {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      console.error('❌ 발주을 찾을 수 없음:', orderId);
      return;
    }
    
    console.log('📦 기존 발주:', order);
    console.log('🚢 경로:', order.route);
    console.log('🏭 생산업체:', order.supplier);
    
    // 임시 행 (아직 저장 안됨) 처리
    if (orderId.startsWith('new_')) {
      console.log('🆕 임시 행: 로컬에서만 발주일 업데이트');
      order.orderDate = newOrderDate;
      
      // 생산업체가 있으면 공정 일정 계산
      console.log('🔍 공정 일정 계산 조건 체크:', {
        hasSupplier: !!order.supplier,
        supplier: order.supplier,
        route: order.route
      });
      
      if (order.supplier) {
        console.log('🏭 생산업체 있음, 공정 일정 계산 시작');
        try {
          const supplier = await getSupplierByName(order.supplier);
          console.log('✅ 생산업체 정보 조회 결과:', supplier);
          
          if (supplier) {
            const newSchedule = calculateProcessSchedule(
              newOrderDate, 
              supplier.leadTimes, 
              order.route, 
              supplier
            );
            order.processes = newSchedule;
            console.log('✅ 공정 일정 계산 완료:', newSchedule);
            
            // 재렌더링 전 현재 입력값들 저장
            const oldRow = document.querySelector(`tr[data-order-id="${orderId}"]`);
            if (oldRow) {
              // 채널, 국가, 생산업체 등 입력값 수집
              const channelSelect = oldRow.querySelector('select[data-field="channel"]');
              const countrySelect = oldRow.querySelector('select.country-select');
              const supplierSelect = oldRow.querySelector('select.supplier-select');
              const seasonInput = oldRow.querySelector('input[data-field="seasonOrder"]');
              const styleInput = oldRow.querySelector('input[data-field="style"]');
              const colorInput = oldRow.querySelector('input[data-field="color"]');
              const qtyInput = oldRow.querySelector('input[data-field="qty"]');
              const requiredDeliveryInput = oldRow.querySelector('input[data-field="requiredDelivery"]');
              
              // order 객체에 저장
              if (channelSelect) order.channel = channelSelect.value;
              if (countrySelect) order.country = countrySelect.value;
              if (supplierSelect) order.supplier = supplierSelect.value;
              if (seasonInput) order.seasonOrder = seasonInput.value;
              if (styleInput) order.style = styleInput.value;
              if (colorInput) order.color = colorInput.value;
              if (qtyInput) order.qty = parseInt(qtyInput.value) || 0;
              if (requiredDeliveryInput) order.requiredDelivery = requiredDeliveryInput.value;
              
              console.log('💾 재렌더링 전 입력값 저장:', {
                channel: order.channel,
                country: order.country,
                supplier: order.supplier,
                seasonOrder: order.seasonOrder
              });
            }
            
            // UI 재렌더링하여 공정 일정 표시
            const headers = createProcessTableHeaders();
            const rowNum = orders.findIndex(o => o.id === orderId) + 1;
            const newRowHtml = renderOrderRow(order, rowNum, headers);
            if (oldRow) {
              oldRow.outerHTML = newRowHtml;
              setupEventListeners();
            }
          }
        } catch (error) {
          console.warn('⚠️ 공정 일정 계산 실패:', error);
        }
      }
      
      markAsChanged(orderId);
      UIUtils.showAlert('발주일이 변경되었습니다. 저장 버튼을 눌러주세요.', 'success');
      return;
    }
    
    // 생산업체 정보 가져오기 (리드타임 포함)
    let supplierLeadTimes = null;
    let supplier = null;
    if (order.supplier) {
      try {
        supplier = await getSupplierByName(order.supplier);
        if (supplier && supplier.leadTimes) {
          supplierLeadTimes = supplier.leadTimes;
          console.log('✅ 생산업체 리드타임 로드:', supplierLeadTimes);
          console.log('✅ 생산업체 선적항:', supplier.shippingRoute);
        } else {
          console.warn('⚠️ 생산업체 리드타임 없음, 기본값 사용');
        }
      } catch (error) {
        console.warn('⚠️ 생산업체 정보 가져오기 실패, 기본 리드타임 사용:', error);
      }
    }
    
    // 발주일 변경 시 전체 공정 일정 재계산 (생산업체 리드타임 및 선적항 반영)
    const newSchedule = calculateProcessSchedule(newOrderDate, supplierLeadTimes, order.route, supplier);
    console.log('📊 새로 계산된 일정:', newSchedule);
    
    // 기존 processes 보존하면서 새 일정 적용 (내장 구조)
    const updatedProcesses = {
      production: newSchedule.production.map((newProc, index) => {
        const existing = order.processes?.production?.[index] || {};
        return {
          ...newProc,
          // 기존 실적 데이터 보존
          completedDate: existing.completedDate || null,
          actualDate: existing.actualDate || null,
          delayDays: existing.delayDays || null,
          delayReason: existing.delayReason || null,
          evidenceUrl: existing.evidenceUrl || null,
          evidenceId: existing.evidenceId || null,
          order: index
        };
      }),
      shipping: newSchedule.shipping.map((newProc, index) => {
        const existing = order.processes?.shipping?.[index] || {};
        return {
          ...newProc,
          // 기존 실적 데이터 보존
          completedDate: existing.completedDate || null,
          actualDate: existing.actualDate || null,
          delayDays: existing.delayDays || null,
          delayReason: existing.delayReason || null,
          evidenceUrl: existing.evidenceUrl || null,
          evidenceId: existing.evidenceId || null,
          order: index
        };
      })
    };
    
    // 발주 업데이트 (processes 포함)
    await updateOrder(orderId, {
      orderDate: newOrderDate,
      processes: updatedProcesses
    });
    console.log('✅ 발주 및 공정 업데이트 완료 (내장 구조)');
    
    // 테이블 새로고침
    orders = await getOrdersWithProcesses();
    allOrders = [...orders]; // 전체 데이터 업데이트
    console.log('🔄 발주 목록 새로고침 완료');
    
    applyFilters(); // 필터 재적용
    renderOrdersTable();
    setupEventListeners();
    console.log('🎨 테이블 렌더링 완료');
    
    UIUtils.showAlert('발주일이 변경되고 전체 일정이 재계산되었습니다.', 'success');
  } catch (error) {
    console.error('❌ Order date change error:', error);
    UIUtils.showAlert('발주일 변경 실패: ' + error.message, 'error');
  }
}

async function handleProcessDateChange(orderId, category, processKey, newDate) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
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
  
  // 해당 공정의 날짜 수정
  const processArray = category === 'production' ? order.processes.production : order.processes.shipping;
  const processIndex = processArray.findIndex(p => p.processKey === processKey);
  
  if (processIndex === -1) return;
  
  // 수정된 공정의 날짜 업데이트
  processArray[processIndex].targetDate = newDate;
  
  // 🔥 이후 공정들을 리드타임 기준으로 재계산
  let currentDate = new Date(newDate);
  
  // 같은 카테고리 내의 이후 공정들 재계산
  for (let i = processIndex + 1; i < processArray.length; i++) {
    const nextProcess = processArray[i];
    const leadTime = supplierLeadTimes ? (supplierLeadTimes[nextProcess.processKey] || nextProcess.leadTime || 0) : (nextProcess.leadTime || 0);
    
    currentDate.setDate(currentDate.getDate() + leadTime);
    nextProcess.targetDate = currentDate.toISOString().split('T')[0];
  }
  
  // 생산 공정을 수정한 경우, 운송 공정도 재계산
  if (category === 'production' && order.processes.shipping && order.processes.shipping.length > 0) {
    // 마지막 생산 공정의 날짜부터 운송 공정 시작
    const lastProductionDate = processArray[processArray.length - 1].targetDate;
    currentDate = new Date(lastProductionDate);
    
    for (let i = 0; i < order.processes.shipping.length; i++) {
      const shippingProcess = order.processes.shipping[i];
      let leadTime = supplierLeadTimes ? (supplierLeadTimes[shippingProcess.processKey] || shippingProcess.leadTime || 0) : (shippingProcess.leadTime || 0);
      
      // 입항 공정은 경로에 따라 리드타임 조정
      if (shippingProcess.processKey === 'arrival') {
        if (order.route === '항공') {
          leadTime = 3;
        } else if (order.route === '해상') {
          leadTime = 21;
        }
      }
      
      currentDate.setDate(currentDate.getDate() + leadTime);
      shippingProcess.targetDate = currentDate.toISOString().split('T')[0];
    }
  }
  
  // 테이블 다시 렌더링하여 변경된 날짜 표시
  renderOrdersTable();
  setupEventListeners();
  
  markAsChanged(orderId);
}

function markAsChanged(orderId) {
  hasUnsavedChanges = true;
  updateSaveButton(true);
}

function updateDeleteButton() {
  const deleteBtn = document.getElementById('delete-btn');
  if (deleteBtn) {
    const hasSelected = selectedOrderIds.size > 0;
    deleteBtn.disabled = !hasSelected;
    
    // 색상 변경: 체크 있으면 빨강, 없으면 회색
    if (hasSelected) {
      deleteBtn.classList.remove('bg-gray-400', 'hover:bg-gray-500');
      deleteBtn.classList.add('bg-red-600', 'hover:bg-red-700');
    } else {
      deleteBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
      deleteBtn.classList.add('bg-gray-400', 'hover:bg-gray-500');
    }
  }
}

function updateSaveButton(hasChanges) {
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.disabled = !hasChanges;
    
    // 색상 변경: 변경사항 있으면 파랑, 없으면 회색
    if (hasChanges) {
      saveBtn.classList.remove('bg-gray-400', 'hover:bg-gray-500');
      saveBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    } else {
      saveBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      saveBtn.classList.add('bg-gray-400', 'hover:bg-gray-500');
    }
  }
  hasUnsavedChanges = hasChanges;
}

function addNewRow() {
  console.log('🔵 행 추가 시작');
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) {
    console.error('❌ tbody 요소를 찾을 수 없습니다.');
    return;
  }
  
  const headers = createProcessTableHeaders();
  const newRowNum = orders.length + 1;
  
  // 임시 ID 생성
  const tempId = 'new_' + Date.now();
  console.log('🆔 새 행 ID:', tempId);
  
  // 빈 발주 객체 생성 (디폴트 값 없이 사용자 직접 입력)
  const newOrder = {
    id: tempId,
    channel: '',           // 빈 값
    orderType: '',         // 오더기준 추가
    seasonOrder: '',
    style: '',
    styleImage: '',
    color: '',
    qty: 0,
    country: '',           // 빈 값
    supplier: '',          // 빈 값
    orderDate: '',         // 빈 값
    requiredDelivery: '',  // 빈 값
    route: null,           // 생산업체 선택 시 자동 반영
    processes: { production: [], shipping: [] },
    notes: ''
  };
  
  console.log('📝 새 발주 객체:', newOrder);
  
  // 테이블에 새 행 추가
  const newRowHtml = renderOrderRow(newOrder, newRowNum, headers);
  tbody.insertAdjacentHTML('beforeend', newRowHtml);
  console.log('✅ 테이블에 행 추가 완료');
  
  // 로컬 orders 배열에도 추가
  orders.push(newOrder);
  console.log('✅ orders 배열에 추가 완료. 총 개수:', orders.length);
  
  // 이벤트 리스너 재설정
  setupEventListeners();
  
  // 저장 버튼 활성화
  markAsChanged(tempId);
  
  // 새로 추가된 행으로 스크롤
  const newRow = tbody.querySelector(`tr[data-order-id="${tempId}"]`);
  if (newRow) {
    newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    newRow.classList.add('bg-yellow-50');
    setTimeout(() => newRow.classList.remove('bg-yellow-50'), 2000);
  }
  
  UIUtils.showAlert('새 행이 추가되었습니다. 정보를 입력하고 저장 버튼을 누르세요.', 'info');
  console.log('🟢 행 추가 완료');
}

async function saveAllChanges() {
  if (!hasUnsavedChanges) return;
  
  try {
    UIUtils.showLoading();
    
    let savedCount = 0;
    let errorCount = 0;
    
    for (const order of orders) {
      try {
        // 페이지의 입력값 수집
        const row = document.querySelector(`tr[data-order-id="${order.id}"]`);
        if (!row) continue;
        
        // 🔥 공정 날짜 수집 (화면에서 입력된 값)
        const updatedSchedule = {
          production: [],
          shipping: []
        };
        
        // 생산 공정 날짜 수집
        if (order.processes && order.processes.production) {
          updatedSchedule.production = order.processes.production.map((process, index) => {
            const input = row.querySelector(`[data-process-key="${process.key}"][data-process-category="production"]`);
            return {
              ...process,
              targetDate: input?.value || process.targetDate
            };
          });
        }
        
        // 운송 공정 날짜 수집
        if (order.processes && order.processes.shipping) {
          updatedSchedule.shipping = order.processes.shipping.map((process, index) => {
            const input = row.querySelector(`[data-process-key="${process.key}"][data-process-category="shipping"]`);
            return {
              ...process,
              targetDate: input?.value || process.targetDate
            };
          });
        }
        
        const updatedData = {
          channel: row.querySelector('[data-field="channel"]')?.value || order.channel || '',
          orderType: row.querySelector('[data-field="orderType"]')?.value || order.orderType || '',
          seasonOrder: row.querySelector('[data-field="seasonOrder"]')?.value || order.seasonOrder || '',
          style: row.querySelector('[data-field="style"]')?.value || order.style || '',
          color: row.querySelector('[data-field="color"]')?.value || order.color || '',
          qty: parseInt(row.querySelector('[data-field="qty"]')?.value) || order.qty || 0,
          country: row.querySelector('[data-field="country"]')?.value || order.country || '',
          supplier: row.querySelector('[data-field="supplier"]')?.value || order.supplier || '',
          route: row.querySelector('[data-field="route"]')?.value || order.route || '',
          notes: row.querySelector('[data-field="notes"]')?.value || order.notes || '',
          orderDate: order.orderDate || '',
          requiredDelivery: order.requiredDelivery || '',
          schedule: updatedSchedule,
          processes: updatedSchedule  // 새 구조에서는 processes 필드 사용
        };
        
        // 새로운 행인 경우 (ID가 new_로 시작)
        if (order.id.startsWith('new_')) {
          await addOrder(updatedData);
        } else {
          // 기존 데이터와 비교하여 변경된 경우에만 업데이트
          const originalData = originalOrders[order.id];
          if (originalData !== JSON.stringify(updatedData)) {
            // 새 구조에서는 processes가 내장되어 있으므로 updateOrder만 호출
            await updateOrder(order.id, updatedData);
            console.log(`✅ 발주 및 공정 저장 완료 (내장 구조): ${order.id}`);
          }
        }
        
        savedCount++;
      } catch (error) {
        console.error(`Save error for order ${order.id}:`, error);
        errorCount++;
      }
    }
    
    // 데이터 새로고침
    orders = await getOrdersWithProcesses();
    allOrders = [...orders]; // 전체 데이터 업데이트
    orders.forEach(order => {
      originalOrders[order.id] = JSON.stringify(order);
    });
    
    applyFilters(); // 필터 재적용
    renderOrdersTable();
    setupEventListeners();
    
    updateSaveButton(false);
    UIUtils.hideLoading();
    
    if (errorCount === 0) {
      UIUtils.showAlert(`${savedCount}건의 변경사항이 저장되었습니다.`, 'success');
    } else {
      UIUtils.showAlert(`저장 완료: ${savedCount}건, 실패: ${errorCount}건`, 'warning');
    }
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Save all changes error:', error);
    UIUtils.showAlert('저장 중 오류가 발생했습니다.', 'error');
  }
}

function downloadTemplate() {
  // 기본 필수 컬럼만 포함 (공정 날짜와 선적경로는 자동 계산되므로 제외)
  // 선적경로는 생산업체 정보에서 자동으로 가져옴 (사용자 입력 불필요)
  const basicColumns = [
    '채널', '연도시즌+차수', '스타일', '스타일이미지', '색상', '수량',
    '국가', '생산업체', '발주일', '입고요구일'
  ];
  
  ExcelUtils.downloadTemplate(basicColumns, 'elcanto_order_template.xlsx');
  UIUtils.showAlert('템플릿 다운로드 완료! 생산업체 선택 시 선적경로가 자동 반영됩니다.', 'success');
}

function downloadCurrentDataAsExcel() {
  try {
    if (orders.length === 0) {
      UIUtils.showAlert('다운로드할 데이터가 없습니다.', 'warning');
      return;
    }
    
    // 헤더 생성
    const headers = createProcessTableHeaders();
    const excelHeaders = [
      '채널', '연도시즌+차수', '스타일', '스타일이미지', '색상', '수량',
      '국가', '생산업체', '발주일', '입고요구일'
    ];
    
    // 생산 공정 헤더 추가
    headers.production.forEach(h => {
      excelHeaders.push(h.name);
    });
    
    // 운송 헤더 추가
    excelHeaders.push('선적', '선적경로', '입항', '물류입고', '입고기준 예상차이', '비고');
    
    // 데이터 변환
    const excelData = orders.map(order => {
      const row = {
        '채널': order.channel || '',
        '오더기준': order.orderType || '',
        '연도시즌+차수': order.seasonOrder || '',
        '스타일': order.style || '',
        '스타일이미지': order.styleImage || '',
        '색상': order.color || '',
        '수량': order.qty || 0,
        '국가': order.country || '',
        '생산업체': order.supplier || '',
        '발주일': order.orderDate || '',
        '입고요구일': order.requiredDelivery || ''
      };
      
      // 생산 공정 데이터 추가
      headers.production.forEach(h => {
        const process = order.processes.production.find(p => p.key === h.key || p.processKey === h.key);
        row[h.name] = process?.targetDate || '';
      });
      
      // 운송 데이터 추가
      const shippingProcess = order.processes.shipping.find(p => p.key === 'shipping');
      const arrivalProcess = order.processes.shipping.find(p => p.key === 'arrival');
      
      row['선적'] = shippingProcess?.targetDate || '';
      row['선적경로'] = order.route || '';  // 정보 표시용 (업로드 시 무시됨, 생산업체 정보에서 자동 반영)
      row['입항'] = arrivalProcess?.targetDate || '';
      
      // 물류입고일 계산
      const logisticsArrival = arrivalProcess?.targetDate 
        ? DateUtils.addDays(arrivalProcess.targetDate, 2)
        : '';
      row['물류입고'] = logisticsArrival;
      
      // 입고기준 예상차이 계산
      if (order.requiredDelivery && logisticsArrival) {
        const diff = DateUtils.diffInDays(order.requiredDelivery, logisticsArrival);
        if (diff !== null) {
          row['입고기준 예상차이'] = diff > 0 ? `+${diff}일` : `${diff}일`;
        } else {
          row['입고기준 예상차이'] = '';
        }
      } else {
        row['입고기준 예상차이'] = '';
      }
      
      row['비고'] = order.notes || '';
      
      return row;
    });
    
    // 엑셀 다운로드
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    ExcelUtils.downloadExcel(excelData, `생산목표일정_${timestamp}.xlsx`);
    UIUtils.showAlert('엑셀 다운로드 완료!', 'success');
  } catch (error) {
    console.error('Excel download error:', error);
    UIUtils.showAlert(`엑셀 다운로드 실패: ${error.message}`, 'error');
  }
}

// 이미지 업로드 모달 열기
let currentUploadOrderId = null;
let currentImageFile = null;

// 이미지 파일 선택 처리 (파일 업로드 또는 붙여넣기 공통)
function handleImageFileSelected(file) {
  if (!file || !file.type.startsWith('image/')) {
    UIUtils.showAlert('이미지 파일만 업로드 가능합니다.', 'error');
    return;
  }
  
  currentImageFile = file;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    const pasteArea = document.getElementById('paste-area');
    
    preview.src = e.target.result;
    previewContainer.classList.remove('hidden');
    document.getElementById('image-upload-save-btn').disabled = false;
    
    // 붙여넣기 영역 스타일 업데이트
    if (pasteArea) {
      pasteArea.classList.add('border-green-500', 'bg-green-50');
      pasteArea.innerHTML = `
        <i class="fas fa-check-circle text-4xl text-green-500 mb-2"></i>
        <p class="text-sm text-green-600 font-semibold">이미지가 준비되었습니다!</p>
        <p class="text-xs text-gray-500 mt-1">아래 미리보기를 확인하고 저장 버튼을 눌러주세요</p>
      `;
    }
  };
  reader.readAsDataURL(file);
}

function openImageUploadModal(orderId) {
  // orderId 유효성 검사
  if (!orderId || orderId.trim() === '' || orderId === 'undefined' || orderId === 'null') {
    console.error('❌ 유효하지 않은 orderId로 모달 열기 시도:', orderId);
    UIUtils.showAlert('유효하지 않은 발주 정보입니다.', 'error');
    return;
  }
  
  console.log('📋 이미지 업로드 모달 열기 - orderId:', orderId);
  
  currentUploadOrderId = orderId;
  currentImageFile = null;
  
  const modal = document.getElementById('image-upload-modal');
  const input = document.getElementById('style-image-input');
  const preview = document.getElementById('image-preview');
  const previewContainer = document.getElementById('image-preview-container');
  const saveBtn = document.getElementById('image-upload-save-btn');
  const pasteArea = document.getElementById('paste-area');
  
  // 초기화
  input.value = '';
  preview.src = '';
  previewContainer.classList.add('hidden');
  saveBtn.disabled = true;
  
  // 붙여넣기 영역 초기화
  if (pasteArea) {
    pasteArea.classList.remove('border-green-500', 'bg-green-50');
    pasteArea.classList.add('border-gray-300');
    pasteArea.innerHTML = `
      <i class="fas fa-clipboard text-4xl text-gray-400 mb-2"></i>
      <p class="text-sm text-gray-600">이미지를 복사한 후 여기를 클릭하고<br><strong>Ctrl+V (Windows) 또는 Cmd+V (Mac)</strong>를 눌러주세요</p>
      <p class="text-xs text-gray-500 mt-2">또는 아래에서 파일을 선택하세요</p>
    `;
  }
  
  modal.classList.remove('hidden');
}

function closeImageUploadModal() {
  const modal = document.getElementById('image-upload-modal');
  modal.classList.add('hidden');
  currentUploadOrderId = null;
  currentImageFile = null;
}

async function handleImageUpload() {
  if (!currentUploadOrderId) {
    console.error('❌ currentUploadOrderId가 없습니다.');
    UIUtils.showAlert('발주 정보를 찾을 수 없습니다.', 'error');
    return;
  }
  
  // orderId 유효성 검사
  if (!currentUploadOrderId.trim() || currentUploadOrderId === 'undefined' || currentUploadOrderId === 'null') {
    console.error('❌ 유효하지 않은 orderId:', currentUploadOrderId);
    UIUtils.showAlert('유효하지 않은 발주 정보입니다.', 'error');
    return;
  }
  
  // 붙여넣기나 파일 선택으로 저장된 파일 사용
  const file = currentImageFile;
  
  if (!file) {
    UIUtils.showAlert('이미지를 선택하거나 붙여넣기 해주세요.', 'error');
    return;
  }
  
  try {
    UIUtils.showLoading();
    
    console.log(`📋 현재 orderId: ${currentUploadOrderId}`);
    console.log(`📋 전체 발주 수: ${orders.length}`);
    
    // 해당 발주 건 찾기
    const order = orders.find(o => o.id === currentUploadOrderId);
    if (!order) {
      console.error('❌ 발주를 찾을 수 없습니다. orderId:', currentUploadOrderId);
      console.error('📋 사용 가능한 order IDs:', orders.map(o => o.id).join(', '));
      throw new Error('발주 건을 찾을 수 없습니다.');
    }
    
    // 스타일명 검증
    if (!order.style || order.style.trim() === '') {
      console.error('❌ 스타일명이 비어있습니다:', order);
      throw new Error('스타일명이 비어있습니다.');
    }
    
    console.log(`📤 이미지 업로드 시작: ${order.style}${order.color ? `_${order.color}` : ''}`);
    
    // 이미지 업로드 (색상 정보 포함)
    const imageUrl = await uploadStyleImage(order.style, file, order.color);
    console.log(`✅ 이미지 업로드 완료: ${imageUrl}`);
    
    // 발주 데이터 업데이트
    order.styleImage = imageUrl;
    await updateOrder(currentUploadOrderId, { styleImage: imageUrl });
    
    // 테이블 다시 렌더링
    renderOrdersTable();
    setupEventListeners();
    
    closeImageUploadModal();
    UIUtils.showAlert('이미지가 업로드되었습니다.', 'success');
    UIUtils.hideLoading();
    
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    UIUtils.showAlert('이미지 업로드 중 오류가 발생했습니다: ' + error.message, 'error');
    UIUtils.hideLoading();
  }
}

async function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  console.log('📤 엑셀 업로드 시작:', file.name);
  
  try {
    UIUtils.showLoading();
    
    // 엑셀 데이터와 이미지를 함께 읽기
    const { data, images } = await ExcelUtils.readExcelWithImages(file);
    
    console.log('📊 읽어온 데이터:', data);
    console.log('📊 데이터 행 수:', data?.length);
    console.log('🖼️ 추출된 이미지 수:', images?.length);
    
    if (!data || data.length === 0) {
      throw new Error('엑셀 파일이 비어있습니다.');
    }
    
    // 이미지가 있으면 먼저 업로드하고 URL 맵 생성 (병렬 처리 + 셀 위치 기반 매칭!)
    const imageUrlMap = {};
    if (images && images.length > 0) {
      console.log(`🖼️ 이미지 업로드 시작... (총 ${images.length}개)`);
      console.log(`📊 데이터 행 수: ${data.length}`);
      console.log(`⚡ 병렬 처리 모드: 10개씩 동시 업로드`);
      
      // 이미지 행 위치 로깅
      console.log('\n📍 이미지 위치 매핑:');
      images.forEach((img, idx) => {
        const dataIndex = img.rowIndex !== null ? img.rowIndex - 1 : idx; // rowIndex는 1-based (헤더 포함), data는 0-based (헤더 제외)
        const style = data[dataIndex]?.['스타일'] || '?';
        console.log(`  ${idx + 1}. ${img.name} → 엑셀 행 ${img.rowIndex !== null ? img.rowIndex + 1 : '?'} → 데이터[${dataIndex}] → 스타일: ${style}`);
      });
      
      // 배치 크기 설정 (동시에 처리할 이미지 수)
      const BATCH_SIZE = 10;
      const batches = [];
      
      // 이미지를 배치로 나누기
      for (let i = 0; i < images.length; i += BATCH_SIZE) {
        batches.push(images.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`\n📦 총 ${batches.length}개 배치로 나누어 처리 (배치당 최대 ${BATCH_SIZE}개)`);
      
      // 각 배치를 병렬로 처리
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        console.log(`\n📦 배치 ${batchIndex + 1}/${batches.length} 처리 중... (${batch.length}개 이미지)`);
        
        // 배치 내의 모든 이미지를 동시에 업로드
        const uploadPromises = batch.map(async (image) => {
          // rowIndex 기반으로 데이터 행 찾기
          // rowIndex는 엑셀 행 번호 (0-based, 헤더 포함)
          // data 배열은 헤더 제외 (0-based)
          const dataIndex = image.rowIndex !== null ? image.rowIndex - 1 : null;
          
          // ✅ 안전성 검사 1: dataIndex 유효성 확인
          if (dataIndex === null || dataIndex < 0 || dataIndex >= data.length) {
            console.warn(`  ⚠️ ${image.name} - 유효하지 않은 행 위치 (rowIndex: ${image.rowIndex}, 데이터 길이: ${data.length})`);
            return { dataIndex: null, url: null, success: false, error: '유효하지 않은 행 위치', skipped: true };
          }
          
          // ✅ 안전성 검사 2: 데이터 행 존재 확인
          const row = data[dataIndex];
          if (!row || typeof row !== 'object') {
            console.warn(`  ⚠️ ${image.name} - 데이터가 없음 (dataIndex: ${dataIndex})`);
            return { dataIndex: null, url: null, success: false, error: '데이터 행이 없음', skipped: true };
          }
          
          // ✅ 안전성 검사 3: 스타일명 유효성 확인
          const style = row['스타일'];
          if (!style || typeof style !== 'string' || style.trim() === '') {
            console.warn(`  ⚠️ ${image.name} - 스타일명이 비어있음 (dataIndex: ${dataIndex})`);
            return { dataIndex: null, url: null, success: false, error: '스타일명이 비어있음', skipped: true };
          }
          
          const trimmedStyle = style.trim();
          const color = row['색상'] || ''; // 색상 정보 추가
          
          try {
            console.log(`  📤 [데이터 ${dataIndex + 1}] ${trimmedStyle}${color ? `_${color}` : ''} 업로드 시작... (${image.name})`);
            const imageUrl = await uploadStyleImage(trimmedStyle, image.file, color); // 색상 정보 전달
            console.log(`  ✅ [데이터 ${dataIndex + 1}] ${trimmedStyle}${color ? `_${color}` : ''} 완료`);
            return { dataIndex: dataIndex, url: imageUrl, success: true };
          } catch (error) {
            console.error(`  ❌ [데이터 ${dataIndex + 1}] ${trimmedStyle} 실패:`, error.message);
            return { dataIndex: dataIndex, error: error.message, success: false };
          }
        });
        
        // 배치의 모든 업로드가 완료될 때까지 대기
        const results = await Promise.all(uploadPromises);
        
        // 결과를 imageUrlMap에 저장 (dataIndex 기준)
        results.forEach(result => {
          if (result.success && result.dataIndex !== null) {
            imageUrlMap[result.dataIndex] = result.url;
          }
        });
        
        const successCount = results.filter(r => r.success).length;
        const skippedCount = results.filter(r => r.skipped).length;
        const failedCount = results.filter(r => !r.success && !r.skipped).length;
        
        console.log(`  ✅ 배치 ${batchIndex + 1} 완료: 성공 ${successCount}개, 건너뜀 ${skippedCount}개, 실패 ${failedCount}개`);
      }
      
      console.log(`\n🎉 전체 이미지 업로드 완료! 매핑된 이미지: ${Object.keys(imageUrlMap).length}/${images.length}개`);
      console.log('📊 최종 매핑 결과:');
      Object.entries(imageUrlMap).forEach(([dataIndex, url]) => {
        const style = data[dataIndex]?.['스타일'] || '?';
        console.log(`  데이터[${dataIndex}] ${style} → ${url.substring(0, 50)}...`);
      });
    } else {
      console.log('ℹ️ 업로드할 이미지가 없습니다.');
    }
    
    // 주문 데이터 저장 (병렬 배치 처리로 속도 개선!)
    console.log(`\n💾 주문 데이터 저장 시작... (총 ${data.length}건)`);
    console.log(`⚡ 병렬 처리 모드: 20개씩 동시 저장`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // 배치 크기 설정 (동시에 처리할 주문 수)
    const ORDER_BATCH_SIZE = 20;
    const orderBatches = [];
    
    // 주문을 배치로 나누기
    for (let i = 0; i < data.length; i += ORDER_BATCH_SIZE) {
      orderBatches.push(data.slice(i, i + ORDER_BATCH_SIZE));
    }
    
    console.log(`📦 총 ${orderBatches.length}개 배치로 나누어 처리 (배치당 최대 ${ORDER_BATCH_SIZE}건)`);
    
    // 각 배치를 병렬로 처리
    for (let batchIndex = 0; batchIndex < orderBatches.length; batchIndex++) {
      const batch = orderBatches[batchIndex];
      const startIndex = batchIndex * ORDER_BATCH_SIZE;
      
      console.log(`\n📦 배치 ${batchIndex + 1}/${orderBatches.length} 처리 중... (${batch.length}건)`);
      
      // 배치 내의 모든 주문을 동시에 저장
      const savePromises = batch.map(async (row, localIndex) => {
        const globalIndex = startIndex + localIndex;
        const rowNumber = globalIndex + 2;
        
        try {
          // 필수 필드 검증
          if (!row['오더기준']) {
            throw new Error('오더기준은 필수입니다.');
          }
          if (!row['발주일'] || !row['입고요구일']) {
            throw new Error('발주일과 입고요구일은 필수입니다.');
          }
          
          // 오더기준 값 검증
          const validOrderTypes = ['정기오더', 'QR'];
          if (!validOrderTypes.includes(row['오더기준'])) {
            throw new Error(`오더기준은 '정기오더' 또는 'QR'만 가능합니다. (입력값: ${row['오더기준']})`);
          }
          
          // 선적경로는 생산업체 정보에서 자동으로 가져옴 (Excel 입력 무시)
          // 이유: 사용자 오타 방지 및 데이터 일관성 유지
          // addOrder 함수에서 supplier.shippingRoute를 자동으로 사용함
          const route = null;  // 항상 null로 설정하여 생산업체 shippingRoute 사용
          
          // schedule은 addOrder 내부에서 생산업체 정보를 조회하여 계산됨
          // 여기서는 기본 구조만 전달 (addOrder가 supplier 기반으로 재계산)
          const schedule = calculateProcessSchedule(
            DateUtils.excelDateToString(row['발주일']),
            null,  // addOrder에서 supplier 정보 조회 후 재계산
            route   // null → addOrder에서 supplier.shippingRoute 사용
          );
          
          // 스타일이미지: URL이 제공되면 사용, 없으면 업로드된 이미지 URL 사용
          let styleImageUrl = row['스타일이미지'] || '';
          if (!styleImageUrl && imageUrlMap[globalIndex]) {
            styleImageUrl = imageUrlMap[globalIndex];
          }
          
          const orderData = {
            channel: row['채널'] || '',
            orderType: row['오더기준'],  // 필수 필드
            seasonOrder: row['연도시즌+차수'] || '',
            style: row['스타일'] || '',
            styleImage: styleImageUrl,
            color: row['색상'] || '',
            qty: row['수량'] || 0,
            country: row['국가'] || '',
            supplier: row['생산업체'] || '',
            orderDate: DateUtils.excelDateToString(row['발주일']),
            requiredDelivery: DateUtils.excelDateToString(row['입고요구일']),
            route: route,
            schedule: schedule,
            notes: '',
            uploadOrder: globalIndex,  // 업로드 순서 저장 (정렬용)
            createdAt: new Date().toISOString()
          };
          
          await addOrder(orderData);
          console.log(`  ✅ [${rowNumber}행] ${orderData.style} 저장 완료`);
          return { rowNumber, success: true };
        } catch (error) {
          console.error(`  ❌ [${rowNumber}행] 저장 실패:`, error.message);
          return { rowNumber, error: error.message, success: false };
        }
      });
      
      // 배치의 모든 저장이 완료될 때까지 대기
      const results = await Promise.all(savePromises);
      
      // 결과 집계
      results.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`행 ${result.rowNumber}: ${result.error}`);
        }
      });
      
      const batchSuccessCount = results.filter(r => r.success).length;
      console.log(`  ✅ 배치 ${batchIndex + 1} 완료: ${batchSuccessCount}/${batch.length}건 성공`);
    }
    
    console.log(`\n🎉 전체 주문 저장 완료! 성공: ${successCount}건, 실패: ${errorCount}건`);
    
    if (errorCount === 0) {
      UIUtils.showAlert(`${successCount}건의 발주가 성공적으로 등록되었습니다!${images.length > 0 ? ` (이미지 ${images.length}개 업로드)` : ''}`, 'success');
    } else {
      const message = `성공: ${successCount}건, 실패: ${errorCount}건\n\n실패 내역:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`;
      UIUtils.showAlert(message, 'warning');
    }
    
    orders = await getOrdersWithProcesses();
    allOrders = [...orders]; // 전체 데이터 업데이트
    orders.forEach(order => {
      originalOrders[order.id] = JSON.stringify(order);
    });
    applyFilters(); // 필터 재적용
    renderOrdersTable();
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

async function deleteSelectedOrders() {
  if (selectedOrderIds.size === 0) return;
  
  const confirmed = await UIUtils.confirm(`선택한 ${selectedOrderIds.size}건을 삭제하시겠습니까?`);
  if (!confirmed) return;
  
  try {
    UIUtils.showLoading();
    
    for (const orderId of selectedOrderIds) {
      // 새로 추가된 행(아직 저장 안 됨)은 로컬에서만 삭제
      if (orderId.startsWith('new_')) {
        orders = orders.filter(o => o.id !== orderId);
      } else {
        await deleteOrder(orderId);
      }
    }
    
    selectedOrderIds.clear();
    orders = await getOrdersWithProcesses();
    allOrders = [...orders]; // 전체 데이터 업데이트
    orders.forEach(order => {
      originalOrders[order.id] = JSON.stringify(order);
    });
    applyFilters(); // 필터 재적용
    renderOrdersTable();
    setupEventListeners();
    
    UIUtils.hideLoading();
    UIUtils.showAlert('삭제 완료', 'success');
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Delete error:', error);
    UIUtils.showAlert('삭제 실패', 'error');
  }
}

// ============ 페이지네이션 및 입고요구월 필터 ============

// 입고요구월 드롭다운 초기화
function initializeRequiredMonthFilter() {
  const select = document.getElementById('required-month-filter');
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

// 페이지네이션 적용하여 테이블 렌더링
function renderOrdersTable() {
  const tableContainer = document.getElementById('orders-table');
  const headers = createProcessTableHeaders();
  
  // 정렬 적용
  sortOrders();
  
  // 페이지네이션 적용
  paginationState.totalItems = orders.length;
  paginationState.totalPages = Math.ceil(orders.length / paginationState.itemsPerPage);
  
  // 현재 페이지 데이터 추출
  const startIndex = (paginationState.currentPage - 1) * paginationState.itemsPerPage;
  const endIndex = startIndex + paginationState.itemsPerPage;
  const pageOrders = orders.slice(startIndex, endIndex);
  
  tableContainer.innerHTML = `
    <table class="text-xs border-collapse" style="width: auto; white-space: nowrap;">
      <thead class="bg-gray-50 text-xs uppercase sticky top-0 z-10">
          <tr>
            <th rowspan="2" class="px-2 py-2 border"><input type="checkbox" id="select-all"></th>
            <th rowspan="2" class="px-2 py-2 border">번호</th>
            <th colspan="11" class="px-2 py-2 border bg-blue-100">발주 정보</th>
            <th colspan="${headers.production.length}" class="px-2 py-2 border bg-green-100">생산 목표일정</th>
            <th colspan="3" class="px-2 py-2 border bg-yellow-100">운송 목표일정</th>
            <th rowspan="2" class="px-2 py-2 border" style="min-width: 100px;">물류입고<br>예정일</th>
            <th rowspan="2" class="px-2 py-2 border" style="min-width: 70px;">입고기준<br>예상차이</th>
            <th rowspan="2" class="px-2 py-2 border" style="min-width: 100px;">비고</th>
          </tr>
          <tr>
            <th class="px-2 py-2 border cursor-pointer hover:bg-blue-50 ${sortState.column === 'channel' ? 'bg-blue-100' : ''}" data-sort="channel">
              채널 ${getSortIcon('channel')}
            </th>
            <th class="px-2 py-2 border cursor-pointer hover:bg-blue-50 ${sortState.column === 'orderType' ? 'bg-blue-100' : ''}" data-sort="orderType">
              오더기준 ${getSortIcon('orderType')}
            </th>
            <th class="px-2 py-2 border cursor-pointer hover:bg-blue-50 ${sortState.column === 'seasonOrder' ? 'bg-blue-100' : ''}" data-sort="seasonOrder">
              연도시즌+차수 ${getSortIcon('seasonOrder')}
            </th>
            <th class="px-2 py-2 border">스타일</th>
            <th class="px-2 py-2 border">이미지</th>
            <th class="px-2 py-2 border">색상</th>
            <th class="px-2 py-2 border">수량</th>
            <th class="px-2 py-2 border cursor-pointer hover:bg-blue-50 ${sortState.column === 'country' ? 'bg-blue-100' : ''}" data-sort="country">
              국가 ${getSortIcon('country')}
            </th>
            <th class="px-2 py-2 border cursor-pointer hover:bg-blue-50 ${sortState.column === 'supplier' ? 'bg-blue-100' : ''}" data-sort="supplier">
              생산업체 ${getSortIcon('supplier')}
            </th>
            <th class="px-2 py-2 border cursor-pointer hover:bg-blue-50 ${sortState.column === 'orderDate' ? 'bg-blue-100' : ''}" data-sort="orderDate">
              발주일 ${getSortIcon('orderDate')}
            </th>
            <th class="px-2 py-2 border cursor-pointer hover:bg-blue-50 ${sortState.column === 'requiredDelivery' ? 'bg-blue-100' : ''}" data-sort="requiredDelivery">
              입고요구일 ${getSortIcon('requiredDelivery')}
            </th>
            ${headers.production.map(h => `<th class="px-2 py-2 border">${h.name}</th>`).join('')}
            <th class="px-2 py-2 border">선적</th>
            <th class="px-2 py-2 border">선적항-도착항</th>
            <th class="px-2 py-2 border">입항</th>
          </tr>
        </thead>
        <tbody id="orders-tbody">
          ${pageOrders.length === 0 ? `
            <tr>
              <td colspan="100" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-inbox text-4xl mb-2"></i>
                <p>발주 데이터가 없습니다. 엑셀 파일을 업로드하거나 "행 추가" 버튼을 클릭하세요.</p>
              </td>
            </tr>
          ` : pageOrders.map((order, index) => renderOrderRow(order, startIndex + index + 1, headers)).join('')}
        </tbody>
      </table>
  `;
  
  renderPagination();
  updateTotalCount();
}

// 페이지네이션 UI 렌더링
function renderPagination() {
  const container = document.getElementById('pagination-container');
  if (!container) return;
  
  const { currentPage, totalPages } = paginationState;
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let pages = [];
  
  // 항상 첫 페이지 표시
  pages.push(1);
  
  // 현재 페이지 주변 표시
  const startPage = Math.max(2, currentPage - 2);
  const endPage = Math.min(totalPages - 1, currentPage + 2);
  
  if (startPage > 2) {
    pages.push('...');
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  if (endPage < totalPages - 1) {
    pages.push('...');
  }
  
  // 항상 마지막 페이지 표시
  if (totalPages > 1) {
    pages.push(totalPages);
  }
  
  container.innerHTML = `
    <button id="prev-page" 
            class="px-3 py-1 border rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
            ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
    ${pages.map(page => {
      if (page === '...') {
        return '<span class="px-3 py-1">...</span>';
      }
      return `
        <button class="page-btn px-3 py-1 border rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}" 
                data-page="${page}">
          ${page}
        </button>
      `;
    }).join('')}
    <button id="next-page" 
            class="px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}"
            ${currentPage === totalPages ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  
  // 페이지네이션 이벤트 리스너
  document.getElementById('prev-page')?.addEventListener('click', () => {
    if (paginationState.currentPage > 1) {
      paginationState.currentPage--;
      renderOrdersTable();
      setupEventListeners();
    }
  });
  
  document.getElementById('next-page')?.addEventListener('click', () => {
    if (paginationState.currentPage < paginationState.totalPages) {
      paginationState.currentPage++;
      renderOrdersTable();
      setupEventListeners();
    }
  });
  
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = parseInt(e.target.dataset.page);
      paginationState.currentPage = page;
      renderOrdersTable();
      setupEventListeners();
    });
  });
}

// 총 건수 업데이트
function updateTotalCount() {
  const countEl = document.getElementById('total-count');
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
    
    // 원본 데이터 저장
    orders.forEach(order => {
      originalOrders[order.id] = JSON.stringify(order);
    });
    
    // 생산업체/연도시즌 필터 재적용
    applyFilters();
    
    // 페이지네이션 초기화
    paginationState.currentPage = 1;
    
    renderOrdersTable();
    setupEventListeners();
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('입고요구월 필터 오류:', error);
    UIUtils.showAlert('데이터 로드 실패', 'error');
  }
}

// 캐시에서 전체 데이터 가져오기 (1시간 캐시)
async function getCachedAllData() {
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

// 현재월 Excel 다운로드
async function downloadMonthExcel() {
  try {
    if (orders.length === 0) {
      UIUtils.showAlert('다운로드할 데이터가 없습니다.', 'warning');
      return;
    }
    
    const monthFilter = document.getElementById('required-month-filter');
    const selectedMonth = monthFilter?.options[monthFilter.selectedIndex]?.text || '현재월';
    
    const confirmed = await UIUtils.confirm(
      `${selectedMonth} 데이터 ${orders.length}건을 Excel로 다운로드하시겠습니까?`
    );
    
    if (!confirmed) return;
    
    UIUtils.showLoading();
    UIUtils.showAlert(`${orders.length}건의 데이터를 Excel로 변환 중...`, 'info');
    
    // 현재 화면에 표시된 데이터를 Excel로 변환
    const excelData = generateExcelData(orders);
    
    // Excel 다운로드
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = filterState.requiredMonth 
      ? `생산목표일정_${filterState.requiredMonth.replace('-', '')}_${timestamp}.xlsx`
      : `생산목표일정_${timestamp}.xlsx`;
    
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
async function downloadAllExcel() {
  try {
    const confirmed = await UIUtils.confirm(
      '전체 데이터를 Excel로 다운로드하시겠습니까?\n(현재 필터와 관계없이 모든 데이터가 다운로드됩니다)'
    );
    
    if (!confirmed) return;
    
    UIUtils.showLoading();
    
    // 캐시에서 데이터 가져오기 (캐싱 적용)
    const allData = await getCachedAllData();
    
    if (allData.length === 0) {
      UIUtils.hideLoading();
      UIUtils.showAlert('다운로드할 데이터가 없습니다.', 'warning');
      return;
    }
    
    UIUtils.showAlert(`${allData.length}건의 데이터를 Excel로 변환 중...`, 'info');
    
    // Excel 데이터 생성
    const excelData = generateExcelData(allData);
    
    // Excel 다운로드
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    ExcelUtils.downloadExcel(excelData, `생산목표일정_전체데이터_${timestamp}.xlsx`);
    
    UIUtils.hideLoading();
    UIUtils.showAlert(`전체 ${allData.length}건 데이터를 Excel로 다운로드했습니다.`, 'success');
  } catch (error) {
    UIUtils.hideLoading();
    console.error('전체 Excel 다운로드 오류:', error);
    UIUtils.showAlert(`Excel 다운로드 실패: ${error.message}`, 'error');
  }
}

// Excel 데이터 생성 (공통 함수)
function generateExcelData(ordersData) {
  // 헤더 생성
  const headers = createProcessTableHeaders();
  const excelHeaders = [
    '채널', '연도시즌+차수', '스타일', '스타일이미지', '색상', '수량',
    '국가', '생산업체', '발주일', '입고요구일'
  ];
  
  // 생산 공정 헤더 추가
  headers.production.forEach(h => {
    excelHeaders.push(h.name);
  });
  
  // 운송 헤더 추가
  excelHeaders.push('선적', '선적경로', '입항', '물류입고', '입고기준 예상차이', '비고');
  
  // 데이터 변환
  const excelData = ordersData.map(order => {
    const row = {
      '채널': order.channel || '',
      '연도시즌+차수': order.seasonOrder || '',
      '스타일': order.style || '',
      '스타일이미지': order.styleImage || '',
      '색상': order.color || '',
      '수량': order.qty || 0,
      '국가': order.country || '',
      '생산업체': order.supplier || '',
      '발주일': order.orderDate || '',
      '입고요구일': order.requiredDelivery || ''
    };
    
    // 생산 공정 데이터 추가
    headers.production.forEach(h => {
      const process = order.processes.production.find(p => p.key === h.key || p.processKey === h.key);
      row[h.name] = process?.targetDate || '';
    });
    
    // 운송 데이터 추가
    const shippingProcess = order.processes.shipping.find(p => p.key === 'shipping');
    const arrivalProcess = order.processes.shipping.find(p => p.key === 'arrival');
    
    row['선적'] = shippingProcess?.targetDate || '';
    row['선적경로'] = order.route || '';
    row['입항'] = arrivalProcess?.targetDate || '';
    
    // 물류입고일 계산
    const logisticsArrival = arrivalProcess?.targetDate 
      ? DateUtils.addDays(arrivalProcess.targetDate, 2)
      : '';
    row['물류입고'] = logisticsArrival;
    
    // 입고기준 예상차이 계산
    if (order.requiredDelivery && logisticsArrival) {
      const diff = DateUtils.diffInDays(order.requiredDelivery, logisticsArrival);
      if (diff !== null) {
        row['입고기준 예상차이'] = diff > 0 ? `+${diff}일` : `${diff}일`;
      } else {
        row['입고기준 예상차이'] = '';
      }
    } else {
      row['입고기준 예상차이'] = '';
    }
    
    row['비고'] = order.notes || '';
    
    return row;
  });
  
  return excelData;
}

// 필터 적용 (생산업체 + 연도시즌)
function applyFilters() {
  let filtered = [...allOrders];
  
  // 생산업체 필터
  if (filterState.supplier) {
    const searchTerm = filterState.supplier.toLowerCase().trim();
    filtered = filtered.filter(order => 
      (order.supplier || '').toLowerCase().includes(searchTerm)
    );
  }
  
  // 연도시즌+차수 필터
  if (filterState.seasonOrder) {
    const searchTerm = filterState.seasonOrder.toLowerCase().trim();
    filtered = filtered.filter(order => 
      (order.seasonOrder || '').toLowerCase().includes(searchTerm)
    );
  }
  
  orders = filtered;
  paginationState.currentPage = 1; // 필터 변경 시 첫 페이지로
}

export default { renderOrderManagement };
