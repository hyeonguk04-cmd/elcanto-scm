// 관리자 종합 대시보드
import { getOrdersWithProcesses } from './firestore-service.js';
import { renderEmptyState } from './ui-components.js';
import { UIUtils, DateUtils, DataUtils, FormatUtils } from './utils.js';

let allOrders = [];
let dashboardData = null;
let currentChannelFilter = '전체';
let currentSupplierFilter = '전체';
let currentStartDate = null;
let currentEndDate = null;

export async function renderDashboard(container) {
  try {
    UIUtils.showLoading();
    
    // 데이터 로드
    allOrders = await getOrdersWithProcesses();
    
    // 기본 날짜 범위 설정 (최근 3개월)
    const today = new Date();
    currentEndDate = formatDate(today);
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    currentStartDate = formatDate(threeMonthsAgo);
    
    // 생산업체 목록 추출
    const suppliers = [...new Set(allOrders.map(o => o.supplier).filter(s => s))].sort();
    
    container.innerHTML = `
      <div class="space-y-6">
        <!-- 헤더 -->
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">KPI 요약</h2>
          <div class="flex space-x-2">
            <select id="dashboard-channel-filter" class="px-3 py-2 border rounded-lg text-sm">
              <option value="전체">채널 전체</option>
              <option value="IM">IM</option>
              <option value="ELCANTO">ELCANTO</option>
            </select>
            <select id="dashboard-supplier-filter" class="px-3 py-2 border rounded-lg text-sm">
              <option value="전체">생산업체 전체</option>
              ${suppliers.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
        </div>
        
        <!-- KPI 카드 (주간리포트와 동일한 크기) -->
        <div id="kpi-cards" class="grid grid-cols-4 gap-4">
          <!-- 동적으로 생성 -->
        </div>
        
        <!-- 전체 발주량 대비 입고 현황 -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-800">전체 발주량 대비 입고 현황</h3>
            <div class="flex space-x-2">
              <input type="date" id="status-start-date" value="${currentStartDate}" class="px-3 py-2 border rounded-lg text-sm">
              <span class="self-center">~</span>
              <input type="date" id="status-end-date" value="${currentEndDate}" class="px-3 py-2 border rounded-lg text-sm">
            </div>
          </div>
          <div id="delivery-status-chart" class="min-h-[300px]">
            <!-- 차트 영역 -->
          </div>
        </div>
        
        <!-- 미입고 상세 현황 -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">미입고 상세 현황</h3>
          <div id="pending-orders-table"></div>
        </div>
      </div>
    `;
    
    // 데이터 처리 및 렌더링
    updateDashboard();
    
    // 이벤트 리스너
    document.getElementById('dashboard-channel-filter')?.addEventListener('change', (e) => {
      currentChannelFilter = e.target.value;
      updateDashboard();
    });
    
    document.getElementById('dashboard-supplier-filter')?.addEventListener('change', (e) => {
      currentSupplierFilter = e.target.value;
      updateDashboard();
    });
    
    document.getElementById('status-start-date')?.addEventListener('change', (e) => {
      currentStartDate = e.target.value;
      updateDashboard();
    });
    
    document.getElementById('status-end-date')?.addEventListener('change', (e) => {
      currentEndDate = e.target.value;
      updateDashboard();
    });
    
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Dashboard render error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.', 'fa-exclamation-circle');
  }
}

function updateDashboard() {
  // 필터 적용
  let filteredOrders = allOrders;
  
  if (currentChannelFilter !== '전체') {
    filteredOrders = filteredOrders.filter(o => o.channel === currentChannelFilter);
  }
  
  if (currentSupplierFilter !== '전체') {
    filteredOrders = filteredOrders.filter(o => o.supplier === currentSupplierFilter);
  }
  
  // 데이터 처리
  dashboardData = processData(filteredOrders);
  
  // KPI 카드 렌더링
  renderKPICards();
  
  // 발주/입고 현황 차트 렌더링
  renderDeliveryStatusChart();
  
  // 미입고 테이블 렌더링 (초기에는 빈 상태)
  renderPendingOrdersTable([]);
}

function processData(orders) {
  // 미입고 주문 (입항이 완료되지 않은 주문)
  const pendingOrders = orders.filter(order => {
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    return !arrivalProcess?.actualDate;
  });
  
  // 완료된 주문
  const completedOrders = orders.filter(order => {
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    return arrivalProcess?.actualDate;
  });
  
  // 지연된 주문
  const delayedOrders = pendingOrders.filter(order => {
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    if (!arrivalProcess) return false;
    
    const targetDate = arrivalProcess.targetDate;
    const today = DateUtils.today();
    return DateUtils.isAfter(today, targetDate);
  });
  
  // KPI 계산
  const totalOrders = orders.length;
  const totalQty = DataUtils.sumBy(orders, 'qty');
  const completedQty = DataUtils.sumBy(completedOrders, 'qty');
  const pendingQty = DataUtils.sumBy(pendingOrders, 'qty');
  const delayedQty = DataUtils.sumBy(delayedOrders, 'qty');
  
  const onTimeOrders = completedOrders.filter(order => {
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    if (!arrivalProcess?.targetDate || !arrivalProcess?.actualDate) return false;
    const delayDays = DateUtils.diffInDays(arrivalProcess.targetDate, arrivalProcess.actualDate);
    return delayDays <= 0;
  }).length;
  
  const kpi = {
    totalOrders,
    totalQty,
    completedQty,
    pendingQty,
    delayedQty,
    completedOrders: completedOrders.length,
    pendingOrders: pendingOrders.length,
    delayedOrders: delayedOrders.length,
    onTimeRate: completedOrders.length > 0 ? Math.round((onTimeOrders / completedOrders.length) * 100) : 0,
    progressRate: totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0
  };
  
  return {
    kpi,
    orders,
    pendingOrders,
    completedOrders,
    delayedOrders
  };
}

// KPI 카드 렌더링 (주간리포트와 동일한 스타일)
function renderKPICards() {
  const container = document.getElementById('kpi-cards');
  const kpi = dashboardData.kpi;
  
  container.innerHTML = `
    <!-- 납기 준수율 -->
    <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-green-600 font-medium mb-1">납기 준수율</p>
          <p class="text-2xl font-bold text-green-700">${kpi.onTimeRate}%</p>
        </div>
        <div class="bg-green-200 rounded-full p-2">
          <i class="fas fa-check-circle text-lg text-green-600"></i>
        </div>
      </div>
    </div>
    
    <!-- 입고 진행률 -->
    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-blue-600 font-medium mb-1">입고 진행률</p>
          <p class="text-2xl font-bold text-blue-700">${kpi.progressRate}%</p>
        </div>
        <div class="bg-blue-200 rounded-full p-2">
          <i class="fas fa-truck text-lg text-blue-600"></i>
        </div>
      </div>
    </div>
    
    <!-- 지연 물량 -->
    <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-red-600 font-medium mb-1">지연 물량</p>
          <p class="text-2xl font-bold text-red-700">${kpi.delayedQty.toLocaleString()}개</p>
        </div>
        <div class="bg-red-200 rounded-full p-2">
          <i class="fas fa-exclamation-triangle text-lg text-red-600"></i>
        </div>
      </div>
    </div>
    
    <!-- 총 발주량 -->
    <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-purple-600 font-medium mb-1">총 발주량</p>
          <p class="text-2xl font-bold text-purple-700">${kpi.totalQty.toLocaleString()}개</p>
        </div>
        <div class="bg-purple-200 rounded-full p-2">
          <i class="fas fa-boxes text-lg text-purple-600"></i>
        </div>
      </div>
    </div>
  `;
}

// 발주/입고 현황 차트 렌더링
function renderDeliveryStatusChart() {
  const container = document.getElementById('delivery-status-chart');
  
  // 날짜 범위 내의 주문 필터링
  const filteredOrders = dashboardData.orders.filter(order => {
    if (!order.requiredDelivery) return false;
    return order.requiredDelivery >= currentStartDate && order.requiredDelivery <= currentEndDate;
  });
  
  // 입고요구일별로 그룹화
  const ordersByDate = {};
  filteredOrders.forEach(order => {
    const date = order.requiredDelivery;
    if (!ordersByDate[date]) {
      ordersByDate[date] = {
        date,
        totalQty: 0,
        receivedQty: 0,
        pendingQty: 0,
        pendingOrders: []
      };
    }
    
    const qty = parseInt(order.qty) || 0;
    ordersByDate[date].totalQty += qty;
    
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    if (arrivalProcess?.actualDate) {
      ordersByDate[date].receivedQty += qty;
    } else {
      ordersByDate[date].pendingQty += qty;
      ordersByDate[date].pendingOrders.push(order);
    }
  });
  
  // 날짜순 정렬
  const sortedData = Object.values(ordersByDate).sort((a, b) => a.date.localeCompare(b.date));
  
  if (sortedData.length === 0) {
    container.innerHTML = `
      <div class="flex items-center justify-center h-64 text-gray-500">
        <div class="text-center">
          <i class="fas fa-inbox text-4xl mb-2"></i>
          <p>선택한 기간에 데이터가 없습니다.</p>
        </div>
      </div>
    `;
    return;
  }
  
  // 막대 차트 HTML 생성
  const maxQty = Math.max(...sortedData.map(d => d.totalQty));
  
  container.innerHTML = `
    <div class="space-y-4">
      ${sortedData.map(data => {
        const receivedPercent = data.totalQty > 0 ? (data.receivedQty / data.totalQty) * 100 : 0;
        const pendingPercent = data.totalQty > 0 ? (data.pendingQty / data.totalQty) * 100 : 0;
        
        return `
          <div class="relative">
            <div class="flex items-center mb-1">
              <span class="text-xs text-gray-600 w-24">${data.date}</span>
              <span class="text-xs text-gray-500 ml-2">${Math.round(receivedPercent)}%</span>
            </div>
            <div class="flex items-center">
              <div class="w-full bg-gray-200 rounded-full h-8 overflow-hidden relative cursor-pointer hover:opacity-90"
                   onclick="showPendingDetails('${data.date}')">
                <div class="h-full flex">
                  <div class="bg-green-500 h-full flex items-center justify-center text-white text-xs font-bold"
                       style="width: ${receivedPercent}%"
                       title="입고완료: ${data.receivedQty.toLocaleString()}개">
                    ${receivedPercent > 10 ? data.receivedQty.toLocaleString() : ''}
                  </div>
                  <div class="bg-gray-300 h-full flex items-center justify-center text-gray-600 text-xs font-bold"
                       style="width: ${pendingPercent}%"
                       title="미입고: ${data.pendingQty.toLocaleString()}개">
                    ${pendingPercent > 10 ? data.pendingQty.toLocaleString() : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  // 전역 함수로 등록
  window.showPendingDetails = (date) => {
    const data = ordersByDate[date];
    if (data && data.pendingOrders.length > 0) {
      renderPendingOrdersTable(data.pendingOrders, date);
      // 미입고 상세 현황으로 스크롤
      document.querySelector('#pending-orders-table').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
}

function renderPendingOrdersTable(orders, selectedDate = null) {
  const container = document.getElementById('pending-orders-table');
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-mouse-pointer text-3xl mb-2"></i>
        <p>미입고 수량을 클릭하면 상세 내역이 표시됩니다.</p>
      </div>
    `;
    return;
  }
  
  const title = selectedDate ? `${selectedDate} 미입고 상세` : '미입고 상세';
  
  container.innerHTML = `
    <div class="mb-3">
      <p class="text-sm font-bold text-gray-700">${title} (${orders.length}건)</p>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead class="bg-gray-100 sticky top-0">
          <tr class="border-b-2 border-gray-300">
            <th class="px-2 py-2 text-center border-r">채널</th>
            <th class="px-2 py-2 text-center border-r">스타일</th>
            <th class="px-2 py-2 text-center border-r">생산지</th>
            <th class="px-2 py-2 text-center border-r">컬러</th>
            <th class="px-2 py-2 text-center border-r">수량</th>
            <th class="px-2 py-2 text-center border-r">지역번호</th>
            <th class="px-2 py-2 text-center">입고일</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => {
            const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
            return `
              <tr class="border-b hover:bg-gray-50">
                <td class="px-2 py-2 text-center border-r">${order.channel || '-'}</td>
                <td class="px-2 py-2 text-center border-r font-medium">${order.style || '-'}</td>
                <td class="px-2 py-2 text-center border-r">${order.supplier || '-'}</td>
                <td class="px-2 py-2 text-center border-r">${order.color || '-'}</td>
                <td class="px-2 py-2 text-right border-r">${(order.qty || 0).toLocaleString()}</td>
                <td class="px-2 py-2 text-center border-r">${order.size || '-'}</td>
                <td class="px-2 py-2 text-center">${order.requiredDelivery || '-'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default { renderDashboard };
