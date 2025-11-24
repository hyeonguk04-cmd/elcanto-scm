// 주간 KPI 요약 리포트
import { getOrdersWithProcesses } from './firestore-service.js';
import { renderEmptyState } from './ui-components.js';
import { UIUtils, DateUtils, FormatUtils } from './utils.js';
import { PROCESS_CONFIG } from './process-config.js';

let allOrders = [];
let currentWeekStart = null;
let currentWeekEnd = null;

export async function renderWeeklyReport(container) {
  try {
    UIUtils.showLoading();
    allOrders = await getOrdersWithProcesses();
    
    // 현재 주의 시작일과 종료일 계산 (월요일 ~ 일요일)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0(일요일) ~ 6(토요일)
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일로 이동
    
    currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + diff);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    container.innerHTML = `
      <div class="space-y-3">
        <!-- 헤더 -->
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-800">주간 KPI 요약 (${formatDate(currentWeekStart)} ~ ${formatDate(currentWeekEnd)})</h2>
          <div class="flex space-x-2">
            <select id="weekly-country-filter" class="px-2 py-1.5 border rounded-lg text-sm">
              <option value="전체">생산국 전체</option>
              <option value="중국">중국</option>
              <option value="베트남">베트남</option>
              <option value="인도">인도</option>
            </select>
            <select id="weekly-channel-filter" class="px-2 py-1.5 border rounded-lg text-sm">
              <option value="전체">채널 전체</option>
              <option value="IM">IM</option>
              <option value="ELCANTO">ELCANTO</option>
            </select>
          </div>
        </div>
        
        <!-- KPI 카드 -->
        <div id="kpi-cards" class="grid grid-cols-3 gap-3">
          <!-- 동적으로 생성 -->
        </div>
        
        <!-- 주간 생산별 및 업고실적 현황 -->
        <div class="bg-white rounded-xl shadow-lg p-3">
          <div class="px-4 py-2 border-b -mx-3 -mt-3 mb-3">
            <h3 class="text-base font-bold text-gray-800">주간 생산별 및 입고실적 현황</h3>
          </div>
          <div id="weekly-table-container" class="overflow-auto" style="max-height: calc(100vh - 300px);">
            <!-- 동적으로 생성 -->
          </div>
        </div>
      </div>
    `;
    
    renderKPICards(allOrders);
    renderWeeklyTable(allOrders);
    setupEventListeners();
    
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Weekly report error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

function setupEventListeners() {
  document.getElementById('weekly-country-filter')?.addEventListener('change', filterOrders);
  document.getElementById('weekly-channel-filter')?.addEventListener('change', filterOrders);
}

function filterOrders() {
  const countryFilter = document.getElementById('weekly-country-filter').value;
  const channelFilter = document.getElementById('weekly-channel-filter').value;
  
  let filtered = allOrders;
  
  if (countryFilter !== '전체') {
    filtered = filtered.filter(o => o.country === countryFilter);
  }
  
  if (channelFilter !== '전체') {
    filtered = filtered.filter(o => o.channel === channelFilter);
  }
  
  renderKPICards(filtered);
  renderWeeklyTable(filtered);
}

// KPI 카드 렌더링 (크기 축소)
function renderKPICards(orders) {
  const weeklyOrderQty = calculateWeeklyOrderQty(orders);
  const weeklyReceivedQty = calculateWeeklyReceivedQty(orders);
  const weeklyDelayedQty = calculateWeeklyDelayedQty(orders);
  
  const container = document.getElementById('kpi-cards');
  container.innerHTML = `
    <!-- 주간 발주량 -->
    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-blue-600 font-medium mb-0.5">주간 발주량</p>
          <p class="text-xl font-bold text-blue-700">${weeklyOrderQty.toLocaleString()}개</p>
        </div>
        <div class="bg-blue-200 rounded-full p-1.5">
          <i class="fas fa-shopping-cart text-base text-blue-600"></i>
        </div>
      </div>
    </div>
    
    <!-- 주간 입고량 -->
    <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-green-600 font-medium mb-0.5">주간 입고량</p>
          <p class="text-xl font-bold text-green-700">${weeklyReceivedQty.toLocaleString()}개</p>
        </div>
        <div class="bg-green-200 rounded-full p-1.5">
          <i class="fas fa-box-open text-base text-green-600"></i>
        </div>
      </div>
    </div>
    
    <!-- 주간 지연건수 -->
    <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-red-600 font-medium mb-0.5">주간 지연건수</p>
          <p class="text-xl font-bold text-red-700">${weeklyDelayedQty.toLocaleString()}개</p>
        </div>
        <div class="bg-red-200 rounded-full p-1.5">
          <i class="fas fa-exclamation-triangle text-base text-red-600"></i>
        </div>
      </div>
    </div>
  `;
}

// 주간 발주량 계산 (이번 주에 발주된 수량)
function calculateWeeklyOrderQty(orders) {
  return orders.filter(order => {
    if (!order.orderDate) return false;
    const orderDate = new Date(order.orderDate);
    return orderDate >= currentWeekStart && orderDate <= currentWeekEnd;
  }).reduce((sum, order) => sum + (parseInt(order.qty) || 0), 0);
}

// 주간 입고량 계산 (이번 주에 입항 완료된 수량)
function calculateWeeklyReceivedQty(orders) {
  return orders.filter(order => {
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    if (!arrivalProcess?.actualDate) return false;
    const actualDate = new Date(arrivalProcess.actualDate);
    return actualDate >= currentWeekStart && actualDate <= currentWeekEnd;
  }).reduce((sum, order) => sum + (parseInt(order.qty) || 0), 0);
}

// 주간 지연건수 계산 (이번 주에 지연 발생한 발주 건수)
function calculateWeeklyDelayedQty(orders) {
  return orders.filter(order => {
    const allProcesses = [...(order.schedule?.production || []), ...(order.schedule?.shipping || [])];
    return allProcesses.some(process => {
      if (!process.actualDate || !process.targetDate) return false;
      const actualDate = new Date(process.actualDate);
      const targetDate = new Date(process.targetDate);
      // 이번 주에 완료되었고, 지연된 경우
      return actualDate >= currentWeekStart && actualDate <= currentWeekEnd && actualDate > targetDate;
    });
  }).length;
}

// 주간 테이블 렌더링 (analytics.js 스타일 통일)
function renderWeeklyTable(orders) {
  const container = document.getElementById('weekly-table-container');
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-gray-500">
        <i class="fas fa-inbox text-4xl mb-2"></i>
        <p>데이터가 없습니다.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <table class="w-full text-xs">
      <thead class="bg-gray-100 sticky top-0 z-10">
        <tr class="border-b-2 border-gray-300">
          <th class="px-2 py-2 text-center border-r" style="min-width: 40px;">NO.</th>
          <th class="px-2 py-2 text-center border-r" style="min-width: 60px;">채널</th>
          <th class="px-2 py-2 text-center border-r" style="min-width: 70px;">생산국</th>
          <th class="px-2 py-2 text-center border-r" style="min-width: 70px;">업체명</th>
          <th class="px-2 py-2 text-center border-r" style="min-width: 80px;">스타일코드</th>
          <th class="px-2 py-2 text-center border-r" style="min-width: 70px;">발주수량</th>
          <th class="px-2 py-2 text-center border-r" style="min-width: 90px;">입고요구일</th>
          <th class="px-2 py-2 text-center border-r" style="min-width: 120px;">공정률</th>
          <th class="px-2 py-2 text-center border-r" style="min-width: 65px;">누적입고</th>
          <th class="px-2 py-2 text-center border-r" style="min-width: 65px;">주입고량</th>
          <th class="px-2 py-2 text-center border-r" style="min-width: 90px;">물류입고<br>예정일</th>
          <th class="px-2 py-2 text-center" style="min-width: 80px;">입고 구분</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map((order, index) => renderOrderRow(order, index + 1)).join('')}
      </tbody>
    </table>
  `;
}

function renderOrderRow(order, rowNum) {
  const productionProcesses = order.schedule?.production || [];
  const shippingProcesses = order.schedule?.shipping || [];
  
  // 공정률 계산 (완료된 공정 / 전체 공정 * 100)
  const allProcesses = [...productionProcesses, ...shippingProcesses];
  const totalProcesses = PROCESS_CONFIG.production.length + PROCESS_CONFIG.shipping.length;
  const completedProcesses = allProcesses.filter(p => p.actualDate).length;
  const processRate = totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0;
  
  // 입항 완료 여부
  const arrivalProcess = shippingProcesses.find(p => p.processKey === 'arrival');
  const isReceived = !!arrivalProcess?.actualDate;
  
  // 누적입고 (완료된 경우 전체 수량, 미완료는 0)
  const cumulativeReceipt = isReceived ? (parseInt(order.qty) || 0) : 0;
  
  // 주입고량 (이번 주에 입항 완료된 경우)
  let weeklyReceipt = 0;
  if (isReceived && arrivalProcess.actualDate) {
    const actualDate = new Date(arrivalProcess.actualDate);
    if (actualDate >= currentWeekStart && actualDate <= currentWeekEnd) {
      weeklyReceipt = parseInt(order.qty) || 0;
    }
  }
  
  // 물류입고 예정일 계산
  const expectedArrivalInfo = calculateExpectedArrival(order, productionProcesses, shippingProcesses);
  
  // 입고 구분 (신호등 표시)
  let trafficLight = '⚪'; // 미입고
  let statusText = '미입고';
  let statusClass = 'text-gray-500';
  
  if (isReceived) {
    // 입고요구일과 물류입고 예정일 비교
    const requiredDelivery = order.requiredDelivery ? new Date(order.requiredDelivery) : null;
    const expectedDate = expectedArrivalInfo.date ? new Date(expectedArrivalInfo.date) : null;
    
    if (requiredDelivery && expectedDate) {
      // 예정일이 요구일보다 늦으면 지연
      if (expectedDate > requiredDelivery) {
        trafficLight = '🔴';
        statusText = '지연입고';
        statusClass = 'text-red-600 font-bold';
      } else {
        // 예정일이 요구일과 같거나 빠르면 정상
        trafficLight = '🟢';
        statusText = '정상입고';
        statusClass = 'text-green-600 font-bold';
      }
    } else {
      // 날짜 정보가 없으면 기본적으로 정시입고로 표시
      trafficLight = '🟢';
      statusText = '정상입고';
      statusClass = 'text-green-600 font-bold';
    }
  }
  
  return `
    <tr class="border-b hover:bg-gray-50">
      <td class="px-2 py-2 text-center border-r">${rowNum}</td>
      <td class="px-2 py-2 text-center border-r">${order.channel || '-'}</td>
      <td class="px-2 py-2 text-center border-r">${order.country || '-'}</td>
      <td class="px-2 py-2 text-center border-r">${order.supplier || '-'}</td>
      <td class="px-2 py-2 text-center border-r font-medium">${order.style || '-'}</td>
      <td class="px-2 py-2 text-right border-r">${(order.qty || 0).toLocaleString()}</td>
      <td class="px-2 py-2 text-center border-r">${order.requiredDelivery || '-'}</td>
      <td class="px-2 py-2 border-r">
        <div class="flex items-center space-x-2">
          <div class="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
            <div class="h-full ${processRate === 100 ? 'bg-orange-400' : processRate > 0 ? 'bg-blue-400' : 'bg-gray-300'} flex items-center justify-center transition-all" 
                 style="width: ${processRate}%">
              <span class="text-xs font-bold ${processRate > 0 ? 'text-white' : 'text-gray-600'}">${processRate}%</span>
            </div>
          </div>
        </div>
      </td>
      <td class="px-2 py-2 text-right border-r">${cumulativeReceipt.toLocaleString()}</td>
      <td class="px-2 py-2 text-right border-r">${weeklyReceipt.toLocaleString()}</td>
      <td class="px-2 py-2 text-center border-r">${expectedArrivalInfo.date || '-'}</td>
      <td class="px-2 py-2 text-center ${statusClass}">${trafficLight} ${statusText}</td>
    </tr>
  `;
}

// 물류입고 예정일 계산 함수 (analytics.js와 동일)
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

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default { renderWeeklyReport };
