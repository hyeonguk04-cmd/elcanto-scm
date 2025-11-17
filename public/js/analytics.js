// 공정 입고진척 현황 - 완전 재설계
import { getOrdersWithProcesses } from './firestore-service.js';
import { renderEmptyState } from './ui-components.js';
import { UIUtils, DateUtils, FormatUtils } from './utils.js';
import { PROCESS_CONFIG } from './process-config.js';

let allOrders = [];

export async function renderAnalytics(container) {
  try {
    UIUtils.showLoading();
    allOrders = await getOrdersWithProcesses();
    
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">공정 입고진척 현황</h2>
          <div class="flex space-x-2">
            <select id="analytics-channel-filter" class="px-3 py-2 border rounded-lg text-sm">
              <option value="전체">전체 채널</option>
              <option value="IM">IM</option>
              <option value="ELCANTO">ELCANTO</option>
            </select>
            <select id="analytics-status-filter" class="px-3 py-2 border rounded-lg text-sm">
              <option value="전체">전체 상태</option>
              <option value="진행중">진행중</option>
              <option value="지연">지연 발생</option>
              <option value="완료">입고완료</option>
            </select>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div id="analytics-table-container" class="overflow-x-auto"></div>
        </div>
      </div>
      
      <!-- 공정 상세 정보 모달 -->
      <div id="process-detail-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h3 class="text-xl font-bold text-gray-800" id="modal-title">공정 상세 정보</h3>
            <button onclick="closeProcessDetailModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div id="modal-content" class="p-6">
            <!-- 동적으로 채워짐 -->
          </div>
        </div>
      </div>
    `;
    
    renderAnalyticsTable(allOrders);
    setupEventListeners();
    
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Analytics render error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

function setupEventListeners() {
  // 채널 필터
  document.getElementById('analytics-channel-filter')?.addEventListener('change', filterOrders);
  
  // 상태 필터
  document.getElementById('analytics-status-filter')?.addEventListener('change', filterOrders);
}

function filterOrders() {
  const channelFilter = document.getElementById('analytics-channel-filter').value;
  const statusFilter = document.getElementById('analytics-status-filter').value;
  
  let filtered = allOrders;
  
  // 채널 필터링
  if (channelFilter !== '전체') {
    filtered = filtered.filter(o => o.channel === channelFilter);
  }
  
  // 상태 필터링
  if (statusFilter !== '전체') {
    filtered = filtered.filter(o => {
      const hasDelay = checkIfDelayed(o);
      const allCompleted = checkIfAllCompleted(o);
      
      if (statusFilter === '지연') return hasDelay;
      if (statusFilter === '완료') return allCompleted;
      if (statusFilter === '진행중') return !allCompleted;
      return true;
    });
  }
  
  renderAnalyticsTable(filtered);
}

function checkIfDelayed(order) {
  const allProcesses = [...(order.schedule?.production || []), ...(order.schedule?.shipping || [])];
  return allProcesses.some(p => {
    if (!p.actualDate || !p.targetDate) return false;
    return new Date(p.actualDate) > new Date(p.targetDate);
  });
}

function checkIfAllCompleted(order) {
  const allProcesses = [...(order.schedule?.production || []), ...(order.schedule?.shipping || [])];
  return allProcesses.length > 0 && allProcesses.every(p => p.actualDate);
}

function renderAnalyticsTable(orders) {
  const container = document.getElementById('analytics-table-container');
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-gray-500">
        <i class="fas fa-inbox text-4xl mb-2"></i>
        <p>데이터가 없습니다.</p>
      </div>
    `;
    return;
  }
  
  // 생산 공정 헤더
  const productionHeaders = PROCESS_CONFIG.production.map(p => p.name);
  
  // 운송 공정 헤더
  const shippingHeaders = PROCESS_CONFIG.shipping.map(p => p.name);
  
  container.innerHTML = `
    <div class="overflow-auto" style="max-height: 70vh;">
      <table class="w-full text-xs">
        <thead class="bg-gray-100 sticky top-0 z-10">
        <!-- 메인 헤더 -->
        <tr class="border-b-2 border-gray-300">
          <th rowspan="2" class="px-2 py-2 border-r text-center" style="min-width: 40px;">NO.</th>
          <th colspan="8" class="px-2 py-2 border-r bg-blue-50 text-center">발주 정보</th>
          <th colspan="${productionHeaders.length}" class="px-2 py-2 border-r bg-green-50 text-center">생산 공정 (일)</th>
          <th colspan="${shippingHeaders.length}" class="px-2 py-2 border-r bg-yellow-50 text-center">운송 상황 (일)</th>
          <th colspan="2" class="px-2 py-2 bg-purple-50 text-center">최종 현황</th>
        </tr>
        
        <!-- 서브 헤더 -->
        <tr class="border-b-2 border-gray-300">
          <!-- 발주 정보 -->
          <th class="px-2 py-2 border-r bg-blue-50" style="min-width: 60px;">채널</th>
          <th class="px-2 py-2 border-r bg-blue-50" style="min-width: 80px;">생산업체</th>
          <th class="px-2 py-2 border-r bg-blue-50" style="min-width: 100px;">스타일</th>
          <th class="px-2 py-2 border-r bg-blue-50" style="min-width: 50px;">색상</th>
          <th class="px-2 py-2 border-r bg-blue-50" style="min-width: 50px;">사이즈</th>
          <th class="px-2 py-2 border-r bg-blue-50" style="min-width: 60px;">수량</th>
          <th class="px-2 py-2 border-r bg-blue-50" style="min-width: 90px;">발주일</th>
          <th class="px-2 py-2 border-r bg-blue-50" style="min-width: 90px;">입고요구일</th>
          
          <!-- 생산 공정 -->
          ${productionHeaders.map(name => `
            <th class="px-2 py-2 border-r bg-green-50 text-center" style="min-width: 70px;">${name}</th>
          `).join('')}
          
          <!-- 운송 상황 -->
          ${shippingHeaders.map(name => `
            <th class="px-2 py-2 border-r bg-yellow-50 text-center" style="min-width: 70px;">${name}</th>
          `).join('')}
          
          <!-- 최종 현황 -->
          <th class="px-2 py-2 border-r bg-purple-50 text-center" style="min-width: 80px;">최종<br>지연일수</th>
          <th class="px-2 py-2 bg-purple-50 text-center" style="min-width: 90px;">물류입고<br>예정일</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map((order, index) => renderOrderRow(order, index + 1)).join('')}
      </tbody>
      </table>
    </div>
  `;
}

function renderOrderRow(order, rowNum) {
  const productionProcesses = order.schedule?.production || [];
  const shippingProcesses = order.schedule?.shipping || [];
  
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
      finalDelayClass = 'bg-red-100 text-red-700 font-bold';
    } else if (diff < 0) {
      finalDelayDays = `${diff}`;
      finalDelayClass = 'bg-blue-100 text-blue-700 font-bold';
    } else {
      finalDelayDays = '0';
      finalDelayClass = 'bg-green-100 text-green-700 font-bold';
    }
  }
  
  return `
    <tr class="border-b hover:bg-gray-50">
      <td class="px-2 py-2 text-center border-r">${rowNum}</td>
      
      <!-- 발주 정보 -->
      <td class="px-2 py-2 border-r">${order.channel || '-'}</td>
      <td class="px-2 py-2 border-r">${order.supplier || '-'}</td>
      <td class="px-2 py-2 border-r font-medium">${order.style || '-'}</td>
      <td class="px-2 py-2 border-r">${order.color || '-'}</td>
      <td class="px-2 py-2 border-r">${order.size || '-'}</td>
      <td class="px-2 py-2 border-r text-right">${order.qty || 0}</td>
      <td class="px-2 py-2 border-r">${order.orderDate || '-'}</td>
      <td class="px-2 py-2 border-r">${order.requiredDelivery || '-'}</td>
      
      <!-- 생산 공정 지연일수 -->
      ${PROCESS_CONFIG.production.map(processConfig => {
        const process = productionProcesses.find(p => p.processKey === processConfig.key);
        return renderProcessCell(order, process, processConfig, 'production');
      }).join('')}
      
      <!-- 운송 공정 지연일수 -->
      ${PROCESS_CONFIG.shipping.map(processConfig => {
        const process = shippingProcesses.find(p => p.processKey === processConfig.key);
        return renderProcessCell(order, process, processConfig, 'shipping');
      }).join('')}
      
      <!-- 최종 현황 -->
      <td class="px-2 py-2 border-r text-center ${finalDelayClass}">${finalDelayDays}</td>
      <td class="px-2 py-2 text-center">${expectedArrivalInfo.date || '-'}</td>
    </tr>
  `;
}

// 물류입고 예정일 계산 함수
function calculateExpectedArrival(order, productionProcesses, shippingProcesses) {
  // 모든 공정을 순서대로 배열
  const allProcesses = [
    ...PROCESS_CONFIG.production.map(config => ({
      config,
      process: productionProcesses.find(p => p.processKey === config.key)
    })),
    ...PROCESS_CONFIG.shipping.map(config => ({
      config,
      process: shippingProcesses.find(p => p.processKey === config.key)
    }))
  ];
  
  let currentDate = null;
  let lastCompletedIndex = -1;
  
  // 완료된 마지막 공정 찾기
  for (let i = allProcesses.length - 1; i >= 0; i--) {
    if (allProcesses[i].process?.actualDate) {
      currentDate = new Date(allProcesses[i].process.actualDate);
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
    return `<td class="px-2 py-2 border-r text-center">-</td>`;
  }
  
  // 지연일수 계산
  let delayDays = null;
  let cellClass = '';
  let cellContent = '-';
  let isClickable = false;
  
  if (process.targetDate && process.actualDate) {
    const targetDate = new Date(process.targetDate);
    const actualDate = new Date(process.actualDate);
    const diff = Math.floor((actualDate - targetDate) / (1000 * 60 * 60 * 24));
    
    delayDays = diff;
    isClickable = true;
    
    if (diff > 0) {
      cellContent = `+${diff}`;
      cellClass = 'bg-red-100 text-red-700 font-bold cursor-pointer hover:bg-red-200';
    } else if (diff < 0) {
      cellContent = `${diff}`;
      cellClass = 'bg-blue-100 text-blue-700 font-bold cursor-pointer hover:bg-blue-200';
    } else {
      cellContent = '0';
      cellClass = 'bg-green-100 text-green-700 font-bold cursor-pointer hover:bg-green-200';
    }
  } else if (process.actualDate) {
    // 목표일은 없지만 완료일은 있는 경우
    cellContent = '✓';
    cellClass = 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200';
    isClickable = true;
  } else if (process.targetDate) {
    // 목표일만 있고 완료일이 없는 경우 - 대기중
    cellContent = '⋯';
    cellClass = 'text-gray-400';
  }
  
  const clickHandler = isClickable 
    ? `onclick="showProcessDetail('${order.id}', '${process.id}', '${processConfig.key}', '${category}')"` 
    : '';
  
  return `
    <td class="px-2 py-2 border-r text-center ${cellClass}" ${clickHandler}>
      ${cellContent}
    </td>
  `;
}

// 공정 상세 정보 표시
window.showProcessDetail = async function(orderId, processId, processKey, category) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  
  const processes = category === 'production' ? order.schedule.production : order.schedule.shipping;
  const process = processes.find(p => p.id === processId);
  if (!process) return;
  
  // 공정 정보 가져오기
  const processConfig = PROCESS_CONFIG[category].find(p => p.key === processKey);
  const processName = processConfig ? processConfig.name : processKey;
  
  // 차이일수 계산
  let diffDays = '-';
  let diffClass = '';
  if (process.targetDate && process.actualDate) {
    const targetDate = new Date(process.targetDate);
    const actualDate = new Date(process.actualDate);
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
      <div class="bg-blue-50 rounded-lg p-4">
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
            <span class="text-gray-600">사이즈:</span>
            <span class="font-medium ml-2">${order.size || '-'}</span>
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
            <span class="font-bold text-gray-800">${process.actualDate || '-'}</span>
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
  document.getElementById('process-detail-modal').classList.remove('hidden');
};

// 모달 닫기
window.closeProcessDetailModal = function() {
  document.getElementById('process-detail-modal').classList.add('hidden');
};

export default { renderAnalytics };
