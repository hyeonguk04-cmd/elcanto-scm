// UI 컴포넌트 생성 함수들
import { UIUtils, DateUtils } from './utils.js';
import { getAllProcesses } from './process-config.js';
import { t } from './i18n.js';

// 로컬 숫자 포맷 함수
const formatNumber = (num) => num?.toLocaleString() || '0';

// 사이드바 렌더링
export function renderSidebar(role) {
  const sidebar = document.getElementById('sidebar-container');
  
  let menuItems;
  
  if (role === 'admin') {
    // 관리자: 모든 메뉴 접근 가능
    menuItems = [
      { id: 'dashboard', emoji: '📊', textKey: 'dashboard' },
      { id: 'order-management', emoji: '📋', textKey: 'orderManagement' },
      { id: 'process-completion', emoji: '✅', textKey: 'processCompletion' },
      { id: 'analytics', emoji: '📈', textKey: 'analytics' },
      { id: 'weekly-report', emoji: '📅', textKey: 'weeklyReport' },
      { id: 'manufacturer-management', emoji: '🏭', textKey: 'manufacturerManagement' },
      { id: 'user-management', emoji: '👥', textKey: 'userManagement' },
      { id: 'user-manual', emoji: '📖', textKey: 'userManual' }
    ];
  } else if (role === 'viewer') {
    // 조회자: 조회 전용 메뉴만 접근 가능
    menuItems = [
      { id: 'dashboard', emoji: '📊', textKey: 'dashboard' },
      { id: 'analytics', emoji: '📈', textKey: 'analytics' },
      { id: 'weekly-report', emoji: '📅', textKey: 'weeklyReport' },
      { id: 'user-manual', emoji: '📖', textKey: 'userManual' }
    ];
  } else {
    // 생산업체: 실적 입력 메뉴만 접근 가능
    menuItems = [
      { id: 'supplier-dashboard', emoji: '📊', textKey: 'supplierDashboard' },
      { id: 'supplier-orders', emoji: '✅', textKey: 'supplierOrders' }
    ];
  }
  
  sidebar.innerHTML = `
    <div class="space-y-2">
      ${menuItems.map(item => `
        <div class="sidebar-btn" data-view="${item.id}">
          <span class="text-xl mr-2">${item.emoji}</span>
          <span data-i18n="${item.textKey}">${t(item.textKey)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// KPI 카드 렌더링
export function renderKPICard(title, value, subtitle, icon, color = 'blue') {
  return `
    <div class="kpi-card bg-white rounded-xl shadow-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 font-medium">${title}</p>
          <p class="text-3xl font-bold text-gray-800 mt-2">${value}</p>
          ${subtitle ? `<p class="text-xs text-gray-400 mt-1">${subtitle}</p>` : ''}
        </div>
        <div class="bg-${color}-100 p-4 rounded-full">
          <i class="fas ${icon} text-2xl text-${color}-600"></i>
        </div>
      </div>
    </div>
  `;
}

// 차트 생성
export function createChart(canvasId, type, data, options = {}) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...options
    }
  });
}

// 테이블 행 렌더링
export function renderTableRow(data, columns, actions = []) {
  return `
    <tr class="bg-white border-b hover:bg-gray-50">
      ${columns.map(col => {
        const value = typeof col.render === 'function' 
          ? col.render(data[col.key], data) 
          : data[col.key] || '-';
        return `<td class="px-4 py-3 ${col.className || ''}">${value}</td>`;
      }).join('')}
      ${actions.length > 0 ? `
        <td class="px-4 py-3">
          <div class="flex space-x-2">
            ${actions.map(action => `
              <button class="${action.className}" data-id="${data.id}" data-action="${action.key}">
                <i class="fas ${action.icon}"></i>
              </button>
            `).join('')}
          </div>
        </td>
      ` : ''}
    </tr>
  `;
}

// 공정 테이블 헤더 생성
export function createProcessTableHeaders() {
  const processes = getAllProcesses();
  
  // 새로운 공정 구조에 맞게 업데이트
  const productionKeys = ['material', 'hando_cfm', 'cutting_upper', 'factory_shipment'];
  const shippingKeys = ['shipping', 'arrival'];
  
  const production = processes.filter(p => productionKeys.includes(p.key));
  const shipping = processes.filter(p => shippingKeys.includes(p.key));
  
  return {
    production: production.map(p => ({ key: p.key, name: p.name, nameEn: p.name_en })),
    shipping: shipping.map(p => ({ key: p.key, name: p.name, nameEn: p.name_en }))
  };
}

// 지연 상태 배지
export function renderDelayBadge(delayDays) {
  if (delayDays === null) return '<span class="badge badge-info">-</span>';
  if (delayDays > 0) return `<span class="badge badge-danger">+${delayDays}일</span>`;
  if (delayDays < 0) return `<span class="badge badge-success">${delayDays}일</span>`;
  return '<span class="badge badge-info">정상</span>';
}

// 상태 점 렌더링
export function renderStatusDot(status) {
  const statusMap = {
    'active': { class: 'active', text: '진행중' },
    'pending': { class: 'pending', text: '대기' },
    'delayed': { class: 'delayed', text: '지연' },
    'completed': { class: 'completed', text: '완료' }
  };
  
  const s = statusMap[status] || statusMap['pending'];
  return `<span class="status-dot ${s.class}"></span>${s.text}`;
}

// 빈 상태 메시지
export function renderEmptyState(message, icon = 'fa-inbox') {
  return `
    <div class="empty-state">
      <i class="fas ${icon}"></i>
      <p class="text-lg font-medium mt-4">${message}</p>
    </div>
  `;
}

// 로딩 스켈레톤
export function renderLoadingSkeleton(rows = 5) {
  return `
    <div class="animate-pulse space-y-4">
      ${Array(rows).fill(0).map(() => `
        <div class="h-12 bg-gray-200 rounded"></div>
      `).join('')}
    </div>
  `;
}

// 페이지네이션
export function renderPagination(currentPage, totalPages, onPageChange) {
  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return `
    <div class="flex items-center justify-center space-x-2 mt-6">
      <button class="px-3 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-100'}" 
              ${currentPage === 1 ? 'disabled' : ''} 
              onclick="(${onPageChange})(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
      </button>
      
      ${pages.map(page => `
        <button class="px-4 py-2 rounded-md ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}"
                onclick="(${onPageChange})(${page})">
          ${page}
        </button>
      `).join('')}
      
      <button class="px-3 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-100'}"
              ${currentPage === totalPages ? 'disabled' : ''}
              onclick="(${onPageChange})(${currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;
}

// 필터 드롭다운
export function renderFilterDropdown(id, label, options, value = '전체') {
  return `
    <div class="flex items-center space-x-2">
      <label class="text-sm text-gray-600">${label}:</label>
      <select id="${id}" class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        ${options.map(opt => `
          <option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>
        `).join('')}
      </select>
    </div>
  `;
}

// 검색 입력
export function renderSearchInput(id, placeholder = '검색...') {
  return `
    <div class="relative">
      <input type="text" id="${id}" 
             class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             placeholder="${placeholder}">
      <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
    </div>
  `;
}

// 진행률 바
export function renderProgressBar(percentage, showLabel = true) {
  const color = percentage >= 80 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
  return `
    <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      <div class="bg-${color}-500 h-full flex items-center justify-center text-xs text-white font-bold transition-all duration-300"
           style="width: ${percentage}%">
        ${showLabel && percentage > 10 ? `${percentage}%` : ''}
      </div>
    </div>
    ${showLabel && percentage <= 10 ? `<span class="text-xs text-gray-600 mt-1">${percentage}%</span>` : ''}
  `;
}

// 타임라인 아이템
export function renderTimelineItem(title, date, status, icon = 'fa-circle') {
  return `
    <div class="flex items-start space-x-4 relative">
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <i class="fas ${icon} text-blue-600 text-sm"></i>
      </div>
      <div class="flex-1">
        <h4 class="font-medium text-gray-800">${title}</h4>
        <p class="text-sm text-gray-500">${date || '-'}</p>
        ${status ? `<span class="text-xs ${status.className}">${status.text}</span>` : ''}
      </div>
    </div>
  `;
}

// 통계 카드
export function renderStatCard(label, value, change, changeType = 'increase') {
  const changeColor = changeType === 'increase' ? 'green' : 'red';
  const changeIcon = changeType === 'increase' ? 'fa-arrow-up' : 'fa-arrow-down';
  
  return `
    <div class="bg-white rounded-lg shadow p-4">
      <p class="text-sm text-gray-500">${label}</p>
      <div class="flex items-end justify-between mt-2">
        <p class="text-2xl font-bold text-gray-800">${value}</p>
        ${change ? `
          <span class="text-${changeColor}-600 text-sm font-medium">
            <i class="fas ${changeIcon}"></i> ${Math.abs(change)}%
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

// ============ 입고 관리 모달 ============

/**
 * 입고 등록 모달 표시
 * @param {Object} order - 발주 정보
 * @param {Function} onSubmit - 등록 완료 콜백
 */
export function showArrivalRegistrationModal(order, onSubmit) {
  const { addArrival } = require('./firestore-service.js');
  
  // 기존 입고 정보
  const arrivalSummary = order.arrivalSummary || {
    totalReceived: 0,
    progress: 0,
    count: 0,
    status: 'pending'
  };
  
  const remaining = (order.quantity || 0) - arrivalSummary.totalReceived;
  
  // 모달 HTML
  const modalHTML = `
    <div id="arrival-registration-modal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-[9999]" 
         onclick="if(event.target === this) closeArrivalRegistrationModal();">
      <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-lg" onclick="event.stopPropagation();">
        <!-- 헤더 -->
        <div class="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h3 class="text-xl font-bold">📦 입고 등록</h3>
          <button onclick="closeArrivalRegistrationModal()" class="text-white hover:text-gray-200">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <!-- 발주 정보 -->
        <div class="px-6 py-4 bg-gray-50 border-b">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500">스타일:</span>
              <span class="font-semibold ml-2">${order.style || '-'}</span>
            </div>
            <div>
              <span class="text-gray-500">색상:</span>
              <span class="font-semibold ml-2">${order.color || '-'}</span>
            </div>
            <div>
              <span class="text-gray-500">발주수량:</span>
              <span class="font-semibold ml-2">${FormatUtils.number(order.quantity || 0)}개</span>
            </div>
            <div>
              <span class="text-gray-500">미입고:</span>
              <span class="font-semibold ml-2 ${remaining > 0 ? 'text-red-600' : 'text-green-600'}">
                ${FormatUtils.number(remaining)}개
              </span>
            </div>
          </div>
          
          <!-- 현재 입고 현황 -->
          <div class="mt-3 p-3 bg-white rounded border">
            <div class="text-sm font-semibold text-gray-700 mb-2">현재 입고 현황</div>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-gray-500 text-xs">누적 입고:</span>
                <span class="font-bold ml-1">${FormatUtils.number(arrivalSummary.totalReceived)} / ${FormatUtils.number(order.quantity || 0)}</span>
              </div>
              <div>
                <span class="text-gray-500 text-xs">진행률:</span>
                <span class="font-bold ml-1 ${arrivalSummary.progress >= 100 ? 'text-green-600' : arrivalSummary.progress > 0 ? 'text-yellow-600' : 'text-red-600'}">
                  ${arrivalSummary.progress}%
                </span>
              </div>
              <div>
                <span class="text-gray-500 text-xs">입고 횟수:</span>
                <span class="font-bold ml-1">${arrivalSummary.count}회</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 입력 폼 -->
        <div class="px-6 py-4">
          <form id="arrival-registration-form">
            <div class="space-y-4">
              <!-- 입고일 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  입고일 <span class="text-red-500">*</span>
                </label>
                <input type="date" id="arrival-date" required
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       value="${new Date().toISOString().split('T')[0]}">
              </div>
              
              <!-- 입고수량 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  입고수량 <span class="text-red-500">*</span>
                </label>
                <input type="number" id="arrival-quantity" required min="1"
                       class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="입고 수량 입력">
                <p class="text-xs text-gray-500 mt-1">미입고 수량: ${FormatUtils.number(remaining)}개</p>
              </div>
              
              <!-- 비고 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  비고 (선택)
                </label>
                <textarea id="arrival-note" rows="2"
                          class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="특이사항 입력 (예: 1차 입고, 추가 입고 등)"></textarea>
              </div>
              
              <!-- 실시간 계산 미리보기 -->
              <div id="arrival-preview" class="p-3 bg-blue-50 rounded border border-blue-200 hidden">
                <div class="text-sm font-semibold text-blue-800 mb-2">📊 입고 후 예상 현황</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span class="text-gray-600">누적 입고:</span>
                    <span class="font-bold ml-1" id="preview-total">-</span>
                  </div>
                  <div>
                    <span class="text-gray-600">진행률:</span>
                    <span class="font-bold ml-1" id="preview-progress">-</span>
                  </div>
                  <div>
                    <span class="text-gray-600">미입고:</span>
                    <span class="font-bold ml-1" id="preview-remaining">-</span>
                  </div>
                  <div>
                    <span class="text-gray-600">상태:</span>
                    <span class="font-bold ml-1" id="preview-status">-</span>
                  </div>
                </div>
              </div>
              
              <!-- 초과 입고 경고 -->
              <div id="arrival-warning" class="p-3 bg-yellow-50 rounded border border-yellow-200 hidden">
                <div class="flex items-start">
                  <i class="fas fa-exclamation-triangle text-yellow-600 mt-0.5 mr-2"></i>
                  <div class="text-sm text-yellow-800">
                    <span class="font-semibold">초과 입고 경고:</span>
                    <span id="warning-message"></span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <!-- 푸터 -->
        <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
          <button type="button" onclick="closeArrivalRegistrationModal()"
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
            취소
          </button>
          <button type="button" id="submit-arrival-btn"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i class="fas fa-check mr-1"></i> 등록
          </button>
        </div>
      </div>
    </div>
  `;
  
  // 모달 삽입
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // 실시간 계산 미리보기
  const quantityInput = document.getElementById('arrival-quantity');
  quantityInput.addEventListener('input', () => {
    const qty = parseInt(quantityInput.value) || 0;
    if (qty > 0) {
      const newTotal = arrivalSummary.totalReceived + qty;
      const newProgress = Math.round((newTotal / (order.quantity || 1)) * 100);
      const newRemaining = (order.quantity || 0) - newTotal;
      
      let statusText = '미입고';
      let statusColor = 'text-red-600';
      if (newProgress >= 101) {
        statusText = '초과입고';
        statusColor = 'text-blue-600';
      } else if (newProgress === 100) {
        statusText = '입고완료';
        statusColor = 'text-green-600';
      } else if (newProgress > 0) {
        statusText = '파셜입고';
        statusColor = 'text-yellow-600';
      }
      
      document.getElementById('arrival-preview').classList.remove('hidden');
      document.getElementById('preview-total').textContent = `${FormatUtils.number(newTotal)} / ${FormatUtils.number(order.quantity || 0)}`;
      document.getElementById('preview-progress').textContent = `${newProgress}%`;
      document.getElementById('preview-progress').className = `font-bold ml-1 ${statusColor}`;
      document.getElementById('preview-remaining').textContent = `${FormatUtils.number(Math.max(0, newRemaining))}개`;
      document.getElementById('preview-status').textContent = statusText;
      document.getElementById('preview-status').className = `font-bold ml-1 ${statusColor}`;
      
      // 초과 입고 경고
      if (newTotal > (order.quantity || 0)) {
        document.getElementById('arrival-warning').classList.remove('hidden');
        document.getElementById('warning-message').textContent = 
          `입고수량이 발주수량을 ${FormatUtils.number(newTotal - (order.quantity || 0))}개 초과합니다. 그래도 등록하시겠습니까?`;
      } else {
        document.getElementById('arrival-warning').classList.add('hidden');
      }
    } else {
      document.getElementById('arrival-preview').classList.add('hidden');
      document.getElementById('arrival-warning').classList.add('hidden');
    }
  });
  
  // 등록 버튼
  document.getElementById('submit-arrival-btn').addEventListener('click', async () => {
    const date = document.getElementById('arrival-date').value;
    const quantity = parseInt(document.getElementById('arrival-quantity').value);
    const note = document.getElementById('arrival-note').value;
    
    if (!date) {
      UIUtils.showToast('입고일을 선택해주세요.', 'error');
      return;
    }
    
    if (!quantity || quantity <= 0) {
      UIUtils.showToast('입고수량을 입력해주세요.', 'error');
      return;
    }
    
    try {
      UIUtils.showLoading();
      
      await addArrival(order.id, {
        date: date,
        quantity: quantity,
        note: note
      });
      
      UIUtils.hideLoading();
      UIUtils.showToast('입고 등록이 완료되었습니다.', 'success');
      
      closeArrivalRegistrationModal();
      
      if (onSubmit) onSubmit();
      
    } catch (error) {
      UIUtils.hideLoading();
      console.error('입고 등록 실패:', error);
      UIUtils.showToast('입고 등록에 실패했습니다: ' + error.message, 'error');
    }
  });
}

/**
 * 입고 이력 모달 표시
 * @param {Object} order - 발주 정보
 * @param {Function} onUpdate - 이력 업데이트 콜백
 */
export async function showArrivalHistoryModal(order, onUpdate) {
  const { getArrivals, updateArrival, deleteLastArrival } = require('./firestore-service.js');
  
  try {
    UIUtils.showLoading();
    
    // 입고 이력 조회
    const arrivals = await getArrivals(order.id);
    const arrivalSummary = order.arrivalSummary || {
      totalReceived: 0,
      progress: 0,
      count: 0,
      status: 'pending'
    };
    
    UIUtils.hideLoading();
    
    // 모달 HTML
    const modalHTML = `
      <div id="arrival-history-modal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-[9999]"
           onclick="if(event.target === this) closeArrivalHistoryModal();">
        <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[90vh] flex flex-col" onclick="event.stopPropagation();">
          <!-- 헤더 -->
          <div class="bg-green-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center flex-shrink-0">
            <h3 class="text-xl font-bold">📋 입고 이력</h3>
            <button onclick="closeArrivalHistoryModal()" class="text-white hover:text-gray-200">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- 발주 정보 & 요약 -->
          <div class="px-6 py-4 bg-gray-50 border-b flex-shrink-0">
            <div class="grid grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <span class="text-gray-500">스타일:</span>
                <span class="font-semibold ml-2">${order.style || '-'}_${order.color || '-'}</span>
              </div>
              <div>
                <span class="text-gray-500">발주수량:</span>
                <span class="font-semibold ml-2">${FormatUtils.number(order.quantity || 0)}개</span>
              </div>
              <div>
                <span class="text-gray-500">생산업체:</span>
                <span class="font-semibold ml-2">${order.supplier || '-'}</span>
              </div>
            </div>
            
            <!-- 입고 요약 -->
            <div class="grid grid-cols-4 gap-3">
              <div class="p-3 bg-white rounded border">
                <div class="text-xs text-gray-500">누적 입고</div>
                <div class="text-lg font-bold">${FormatUtils.number(arrivalSummary.totalReceived)}개</div>
              </div>
              <div class="p-3 bg-white rounded border">
                <div class="text-xs text-gray-500">진행률</div>
                <div class="text-lg font-bold ${arrivalSummary.progress >= 100 ? 'text-green-600' : arrivalSummary.progress > 0 ? 'text-yellow-600' : 'text-red-600'}">
                  ${arrivalSummary.progress}%
                </div>
              </div>
              <div class="p-3 bg-white rounded border">
                <div class="text-xs text-gray-500">입고 횟수</div>
                <div class="text-lg font-bold">${arrivalSummary.count}회</div>
              </div>
              <div class="p-3 bg-white rounded border">
                <div class="text-xs text-gray-500">미입고</div>
                <div class="text-lg font-bold ${(order.quantity || 0) - arrivalSummary.totalReceived > 0 ? 'text-red-600' : 'text-green-600'}">
                  ${FormatUtils.number(Math.max(0, (order.quantity || 0) - arrivalSummary.totalReceived))}개
                </div>
              </div>
            </div>
          </div>
          
          <!-- 이력 목록 -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            ${arrivals.length === 0 ? `
              <div class="text-center py-12 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-3"></i>
                <p>입고 이력이 없습니다.</p>
              </div>
            ` : `
              <div class="space-y-3">
                ${arrivals.map((arrival, index) => {
                  const isLast = index === arrivals.length - 1;
                  return `
                    <div class="p-4 border rounded-lg ${isLast ? 'bg-blue-50 border-blue-300' : 'bg-white'} hover:shadow-md transition-shadow">
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <span class="text-lg font-bold text-gray-800">${index + 1}차 입고</span>
                          ${isLast ? '<span class="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">최근</span>' : ''}
                        </div>
                        <div class="flex space-x-2">
                          <button onclick="editArrival(${index})" class="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600">
                            <i class="fas fa-edit mr-1"></i>수정
                          </button>
                          ${isLast ? `
                            <button onclick="deleteArrival()" class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">
                              <i class="fas fa-trash mr-1"></i>삭제
                            </button>
                          ` : ''}
                        </div>
                      </div>
                      
                      <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span class="text-gray-500">입고일:</span>
                          <span class="font-semibold ml-2">${arrival.date || '-'}</span>
                        </div>
                        <div>
                          <span class="text-gray-500">입고수량:</span>
                          <span class="font-semibold ml-2">${FormatUtils.number(arrival.quantity || 0)}개</span>
                        </div>
                        <div>
                          <span class="text-gray-500">누적수량:</span>
                          <span class="font-semibold ml-2">${FormatUtils.number(arrival.cumulative || 0)}개</span>
                        </div>
                        <div>
                          <span class="text-gray-500">진행률:</span>
                          <span class="font-semibold ml-2">${Math.round((arrival.cumulative / (order.quantity || 1)) * 100)}%</span>
                        </div>
                      </div>
                      
                      ${arrival.note ? `
                        <div class="mt-2 pt-2 border-t">
                          <span class="text-gray-500 text-sm">비고:</span>
                          <span class="ml-2 text-sm">${arrival.note}</span>
                        </div>
                      ` : ''}
                      
                      <div class="mt-2 text-xs text-gray-400">
                        등록일시: ${arrival.createdAt ? new Date(arrival.createdAt.seconds * 1000).toLocaleString('ko-KR') : '-'}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
          
          <!-- 푸터 -->
          <div class="px-6 py-4 bg-gray-50 rounded-b-lg border-t flex justify-between items-center flex-shrink-0">
            <button type="button" onclick="openNewArrivalRegistration()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <i class="fas fa-plus mr-1"></i> 새 입고 등록
            </button>
            <button type="button" onclick="closeArrivalHistoryModal()"
                    class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
              닫기
            </button>
          </div>
        </div>
      </div>
    `;
    
    // 모달 삽입
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 전역 함수로 등록 (onclick에서 사용)
    window.editArrival = async (index) => {
      const arrival = arrivals[index];
      
      const newDate = prompt('입고일 수정 (YYYY-MM-DD):', arrival.date);
      if (newDate === null) return;
      
      const newQuantity = prompt('입고수량 수정:', arrival.quantity);
      if (newQuantity === null) return;
      
      const newNote = prompt('비고 수정:', arrival.note || '');
      if (newNote === null) return;
      
      try {
        UIUtils.showLoading();
        
        await updateArrival(order.id, index, {
          date: newDate,
          quantity: parseInt(newQuantity),
          note: newNote
        });
        
        UIUtils.hideLoading();
        UIUtils.showToast('입고 정보가 수정되었습니다.', 'success');
        
        closeArrivalHistoryModal();
        if (onUpdate) onUpdate();
        
      } catch (error) {
        UIUtils.hideLoading();
        console.error('입고 수정 실패:', error);
        UIUtils.showToast('입고 수정에 실패했습니다: ' + error.message, 'error');
      }
    };
    
    window.deleteArrival = async () => {
      if (!confirm('최근 입고 기록을 삭제하시겠습니까?')) return;
      
      try {
        UIUtils.showLoading();
        
        await deleteLastArrival(order.id);
        
        UIUtils.hideLoading();
        UIUtils.showToast('입고 기록이 삭제되었습니다.', 'success');
        
        closeArrivalHistoryModal();
        if (onUpdate) onUpdate();
        
      } catch (error) {
        UIUtils.hideLoading();
        console.error('입고 삭제 실패:', error);
        UIUtils.showToast('입고 삭제에 실패했습니다: ' + error.message, 'error');
      }
    };
    
    window.openNewArrivalRegistration = () => {
      closeArrivalHistoryModal();
      showArrivalRegistrationModal(order, onUpdate);
    };
    
  } catch (error) {
    UIUtils.hideLoading();
    console.error('입고 이력 조회 실패:', error);
    UIUtils.showToast('입고 이력을 불러오는데 실패했습니다: ' + error.message, 'error');
  }
}

// 모달 닫기 함수
window.closeArrivalRegistrationModal = function() {
  const modal = document.getElementById('arrival-registration-modal');
  if (modal) modal.remove();
};

window.closeArrivalHistoryModal = function() {
  const modal = document.getElementById('arrival-history-modal');
  if (modal) modal.remove();
  
  // 전역 함수 정리
  delete window.editArrival;
  delete window.deleteArrival;
  delete window.openNewArrivalRegistration;
};

export default {
  renderSidebar,
  renderKPICard,
  createChart,
  renderTableRow,
  createProcessTableHeaders,
  renderDelayBadge,
  renderStatusDot,
  renderEmptyState,
  renderLoadingSkeleton,
  renderPagination,
  renderFilterDropdown,
  renderSearchInput,
  renderProgressBar,
  renderTimelineItem,
  renderStatCard,
  // 입고 관리 모달
  showArrivalRegistrationModal,
  showArrivalHistoryModal
};
