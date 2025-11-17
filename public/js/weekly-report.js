// 주간 KPI 요약 리포트
import { getOrdersWithProcesses } from './firestore-service.js';
import { renderEmptyState } from './ui-components.js';
import { UIUtils, DateUtils, FormatUtils } from './utils.js';

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
      <div class="space-y-6">
        <!-- 헤더 -->
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">주간 KPI 요약 (${formatDate(currentWeekStart)} ~ ${formatDate(currentWeekEnd)})</h2>
          <div class="flex space-x-2">
            <select id="weekly-country-filter" class="px-3 py-2 border rounded-lg text-sm">
              <option value="전체">생산국 전체</option>
              <option value="중국">중국</option>
              <option value="베트남">베트남</option>
              <option value="인도">인도</option>
            </select>
            <select id="weekly-channel-filter" class="px-3 py-2 border rounded-lg text-sm">
              <option value="전체">채널 전체</option>
              <option value="IM">IM</option>
              <option value="ELCANTO">ELCANTO</option>
            </select>
          </div>
        </div>
        
        <!-- KPI 카드 -->
        <div id="kpi-cards" class="grid grid-cols-3 gap-4">
          <!-- 동적으로 생성 -->
        </div>
        
        <!-- 주간 생산별 및 업고실적 현황 -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h3 class="text-lg font-bold text-gray-800">주간 생산별 및 입고실적 현황</h3>
          </div>
          <div id="weekly-table-container" class="overflow-x-auto">
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

// KPI 카드 렌더링
function renderKPICards(orders) {
  const weeklyOrderQty = calculateWeeklyOrderQty(orders);
  const weeklyReceivedQty = calculateWeeklyReceivedQty(orders);
  const weeklyDelayedQty = calculateWeeklyDelayedQty(orders);
  
  const container = document.getElementById('kpi-cards');
  container.innerHTML = `
    <!-- 주간 발주량 -->
    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-blue-600 font-medium mb-1">주간 발주량</p>
          <p class="text-3xl font-bold text-blue-700">${weeklyOrderQty.toLocaleString()}개</p>
        </div>
        <div class="bg-blue-200 rounded-full p-3">
          <i class="fas fa-shopping-cart text-2xl text-blue-600"></i>
        </div>
      </div>
    </div>
    
    <!-- 주간 입고량 -->
    <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-green-600 font-medium mb-1">주간 입고량</p>
          <p class="text-3xl font-bold text-green-700">${weeklyReceivedQty.toLocaleString()}개</p>
        </div>
        <div class="bg-green-200 rounded-full p-3">
          <i class="fas fa-box-open text-2xl text-green-600"></i>
        </div>
      </div>
    </div>
    
    <!-- 주간 지연건수 -->
    <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-red-600 font-medium mb-1">주간 지연건수</p>
          <p class="text-3xl font-bold text-red-700">${weeklyDelayedQty.toLocaleString()}개</p>
        </div>
        <div class="bg-red-200 rounded-full p-3">
          <i class="fas fa-exclamation-triangle text-2xl text-red-600"></i>
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

// 주간 테이블 렌더링
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
    <table class="w-full text-sm">
      <thead class="bg-gray-100 sticky top-0">
        <tr class="border-b-2 border-gray-300">
          <th class="px-4 py-3 text-center" style="min-width: 80px;">채널</th>
          <th class="px-4 py-3 text-center" style="min-width: 80px;">생산국</th>
          <th class="px-4 py-3 text-center" style="min-width: 100px;">업체명</th>
          <th class="px-4 py-3 text-center" style="min-width: 100px;">발주수량</th>
          <th class="px-4 py-3 text-center" style="min-width: 120px;">입고예정일</th>
          <th class="px-4 py-3 text-center" style="min-width: 150px;">입고율</th>
          <th class="px-4 py-3 text-center" style="min-width: 100px;">누적입고</th>
          <th class="px-4 py-3 text-center" style="min-width: 100px;">주입고량</th>
          <th class="px-4 py-3 text-center" style="min-width: 100px;">입고 구분</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(order => renderOrderRow(order)).join('')}
      </tbody>
    </table>
  `;
}

function renderOrderRow(order) {
  // 입고율 계산 (입항 완료 여부)
  const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
  const isReceived = !!arrivalProcess?.actualDate;
  const receiptRate = isReceived ? 100 : 0;
  
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
  
  // 입고 구분 (정시입고 / 지연입고)
  let receiptStatus = '미입고';
  let statusClass = 'text-gray-500';
  
  if (isReceived) {
    const targetDate = arrivalProcess.targetDate ? new Date(arrivalProcess.targetDate) : null;
    const actualDate = new Date(arrivalProcess.actualDate);
    
    if (targetDate && actualDate > targetDate) {
      receiptStatus = '지연입고';
      statusClass = 'text-red-600 font-bold';
    } else {
      receiptStatus = '정시입고';
      statusClass = 'text-green-600 font-bold';
    }
  }
  
  // 입고예정일 (입항 목표일 또는 입고요구일)
  const expectedDate = arrivalProcess?.targetDate || order.requiredDelivery || '-';
  
  return `
    <tr class="border-b hover:bg-gray-50">
      <td class="px-4 py-3 text-center">${order.channel || '-'}</td>
      <td class="px-4 py-3 text-center">${order.country || '-'}</td>
      <td class="px-4 py-3 text-center">${order.supplier || '-'}</td>
      <td class="px-4 py-3 text-right font-medium">${(order.qty || 0).toLocaleString()}</td>
      <td class="px-4 py-3 text-center">${expectedDate}</td>
      <td class="px-4 py-3">
        <div class="flex items-center space-x-2">
          <div class="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
            <div class="h-full ${receiptRate === 100 ? 'bg-orange-400' : 'bg-gray-300'} flex items-center justify-center transition-all" 
                 style="width: ${receiptRate}%">
              <span class="text-xs font-bold ${receiptRate === 100 ? 'text-white' : 'text-gray-600'}">${receiptRate}%</span>
            </div>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-right font-medium">${cumulativeReceipt.toLocaleString()}</td>
      <td class="px-4 py-3 text-right font-medium">${weeklyReceipt.toLocaleString()}</td>
      <td class="px-4 py-3 text-center ${statusClass}">${receiptStatus}</td>
    </tr>
  `;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default { renderWeeklyReport };
