// 관리자 종합 대시보드
import { getOrdersWithProcesses } from './firestore-service.js';
import { renderEmptyState } from './ui-components.js';
import { UIUtils, DateUtils, DataUtils, FormatUtils } from './utils.js';
import { PROCESS_CONFIG } from './process-config.js';

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
      <div class="space-y-3">
        <!-- 헤더 -->
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-800">종합현황</h2>
          <div class="flex space-x-2">
            <select id="dashboard-channel-filter" class="px-2 py-1.5 border rounded-lg text-sm">
              <option value="전체">채널 전체</option>
              <option value="IM">IM</option>
              <option value="ELCANTO">ELCANTO</option>
            </select>
            <select id="dashboard-supplier-filter" class="px-2 py-1.5 border rounded-lg text-sm">
              <option value="전체">생산업체 전체</option>
              ${suppliers.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <input type="date" id="dashboard-start-date" value="${currentStartDate}" class="px-2 py-1.5 border rounded-lg text-sm">
            <span class="self-center text-sm">~</span>
            <input type="date" id="dashboard-end-date" value="${currentEndDate}" class="px-2 py-1.5 border rounded-lg text-sm">
          </div>
        </div>
        
        <!-- KPI 카드 (주간리포트와 동일한 크기) -->
        <div id="kpi-cards" class="grid grid-cols-4 gap-3">
          <!-- 동적으로 생성 -->
        </div>
        
        <!-- 전체 발주 대비 공정 현황 -->
        <div class="bg-white rounded-xl shadow-lg p-3">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-base font-bold text-gray-800">📊 공정 진행 현황</h3>
            <div class="text-xs text-gray-500">
              날짜 범위: ${currentStartDate} ~ ${currentEndDate}
            </div>
          </div>
          <div id="delivery-status-chart" class="min-h-[280px]">
            <!-- 차트 영역 -->
          </div>
        </div>
        
        <!-- 지연 위험 주문 -->
        <div class="bg-white rounded-xl shadow-lg p-3">
          <h3 class="text-base font-bold text-gray-800 mb-3">⚠️ 지연 위험 주문</h3>
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
    
    document.getElementById('dashboard-start-date')?.addEventListener('change', (e) => {
      currentStartDate = e.target.value;
      updateDashboard();
    });
    
    document.getElementById('dashboard-end-date')?.addEventListener('change', (e) => {
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
  
  // 지연 위험 주문 즉시 표시
  renderPendingOrdersTable(dashboardData.delayedOrders);
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
  
  // 지연된 주문 (입고요구일 기준으로 판단)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const delayedOrders = pendingOrders.filter(order => {
    if (!order.requiredDelivery) return false;
    const requiredDate = new Date(order.requiredDelivery);
    requiredDate.setHours(0, 0, 0, 0);
    // 입고요구일이 지났는데 아직 미입고
    return today > requiredDate;
  });
  
  // KPI 계산
  const totalOrders = orders.length;
  const totalQty = DataUtils.sumBy(orders, 'qty');
  const completedQty = DataUtils.sumBy(completedOrders, 'qty');
  const pendingQty = DataUtils.sumBy(pendingOrders, 'qty');
  const delayedQty = DataUtils.sumBy(delayedOrders, 'qty');
  
  // 정시 입고 주문 (입고요구일 vs 실제입고일 비교)
  const onTimeOrders = completedOrders.filter(order => {
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    if (!order.requiredDelivery || !arrivalProcess?.actualDate) return false;
    
    const requiredDate = new Date(order.requiredDelivery);
    const actualDate = new Date(arrivalProcess.actualDate);
    // 입고요구일 이전 또는 당일에 입고 완료
    return actualDate <= requiredDate;
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
    // 전체 주문 대비 정시 입고율
    onTimeRate: totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 100) : 0,
    progressRate: totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0,
    onTimeOrders: onTimeOrders
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
    <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-3 cursor-pointer hover:shadow-lg transition-shadow"
         title="전체 주문 대비 입고요구일 내 입고 완료">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-green-600 font-medium mb-0.5">납기 준수율</p>
          <p class="text-xl font-bold text-green-700">${kpi.onTimeRate}%</p>
          <p class="text-xxs text-green-600 mt-1">정시: ${kpi.onTimeOrders}건 / 전체: ${kpi.totalOrders}건</p>
        </div>
        <div class="bg-green-200 rounded-full p-1.5">
          <i class="fas fa-check-circle text-base text-green-600"></i>
        </div>
      </div>
    </div>
    
    <!-- 입고 진행률 -->
    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-3 cursor-pointer hover:shadow-lg transition-shadow"
         title="총 발주량 대비 입고 완료량">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-blue-600 font-medium mb-0.5">입고 진행률</p>
          <p class="text-xl font-bold text-blue-700">${kpi.progressRate}%</p>
          <p class="text-xxs text-blue-600 mt-1">완료: ${kpi.completedQty.toLocaleString()}개 / 총: ${kpi.totalQty.toLocaleString()}개</p>
        </div>
        <div class="bg-blue-200 rounded-full p-1.5">
          <i class="fas fa-truck text-base text-blue-600"></i>
        </div>
      </div>
    </div>
    
    <!-- 지연 물량 -->
    <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-3 cursor-pointer hover:shadow-lg transition-shadow"
         title="입고요구일이 지난 미입고 물량">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-red-600 font-medium mb-0.5">지연 물량</p>
          <p class="text-xl font-bold text-red-700">${kpi.delayedQty.toLocaleString()}개</p>
          <p class="text-xxs text-red-600 mt-1">지연: ${kpi.delayedOrders}건</p>
        </div>
        <div class="bg-red-200 rounded-full p-1.5">
          <i class="fas fa-exclamation-triangle text-base text-red-600"></i>
        </div>
      </div>
    </div>
    
    <!-- 총 발주량 -->
    <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-3 cursor-pointer hover:shadow-lg transition-shadow"
         title="필터 적용된 전체 발주량">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-purple-600 font-medium mb-0.5">총 발주량</p>
          <p class="text-xl font-bold text-purple-700">${kpi.totalQty.toLocaleString()}개</p>
          <p class="text-xxs text-purple-600 mt-1">총: ${kpi.totalOrders}건</p>
        </div>
        <div class="bg-purple-200 rounded-full p-1.5">
          <i class="fas fa-boxes text-base text-purple-600"></i>
        </div>
      </div>
    </div>
  `;
}

// 공정률 계산 함수 (가중치 기반)
function calculateProcessRate(order) {
  const productionProcesses = order.schedule?.production || [];
  const shippingProcesses = order.schedule?.shipping || [];
  
  // 각 공정 설정과 실제 데이터 매칭
  const allProcessConfigs = [
    ...PROCESS_CONFIG.production.map(config => ({
      config,
      actual: productionProcesses.find(p => p.processKey === config.key)
    })),
    ...PROCESS_CONFIG.shipping.map(config => ({
      config,
      actual: shippingProcesses.find(p => p.processKey === config.key)
    }))
  ];
  
  // 리드타임 기반 가중치 계산
  let totalWeight = 0;
  let completedWeight = 0;
  
  allProcessConfigs.forEach(({ config, actual }) => {
    const weight = config.defaultLeadTime || 1; // 리드타임을 가중치로 사용
    totalWeight += weight;
    
    if (actual?.actualDate) {
      completedWeight += weight;
    }
  });
  
  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

// 발주/공정 현황 차트 렌더링 (세로형 누적 막대)
function renderDeliveryStatusChart() {
  const container = document.getElementById('delivery-status-chart');
  
  // 날짜 범위 내의 주문 필터링 (입고요구일 기준)
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
        completedQty: 0,
        inProgressQty: 0,
        pendingOrders: [],
        orders: []
      };
    }
    
    const qty = parseInt(order.qty) || 0;
    ordersByDate[date].totalQty += qty;
    ordersByDate[date].orders.push(order);
    
    // 공정 완료 여부 확인 (모든 공정 완료)
    const allProcesses = [...(order.schedule?.production || []), ...(order.schedule?.shipping || [])];
    const totalProcessCount = PROCESS_CONFIG.production.length + PROCESS_CONFIG.shipping.length;
    const isCompleted = allProcesses.filter(p => p.actualDate).length === totalProcessCount;
    
    if (isCompleted) {
      ordersByDate[date].completedQty += qty;
    } else {
      ordersByDate[date].inProgressQty += qty;
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
  
  // 최대 수량 계산
  const maxQty = Math.max(...sortedData.map(d => d.totalQty));
  const chartHeight = 300;
  
  // 세로형 누적 막대 차트 HTML 생성
  container.innerHTML = `
    <div class="relative">
      <!-- 범례 -->
      <div class="flex justify-center mb-4 space-x-4">
        <div class="flex items-center">
          <div class="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span class="text-xs text-gray-600">공정완료</span>
        </div>
        <div class="flex items-center">
          <div class="w-4 h-4 bg-gray-300 rounded mr-2"></div>
          <span class="text-xs text-gray-600">미완료</span>
        </div>
      </div>
      
      <!-- 차트 영역 -->
      <div class="flex items-end justify-around px-4" style="height: ${chartHeight}px;">
        ${sortedData.map(data => {
          // 평균 공정률 계산
          const avgProcessRate = data.orders.length > 0 
            ? Math.round(data.orders.reduce((sum, order) => sum + calculateProcessRate(order), 0) / data.orders.length)
            : 0;
          
          const completedHeight = maxQty > 0 ? (data.completedQty / maxQty) * (chartHeight - 40) : 0;
          const inProgressHeight = maxQty > 0 ? (data.inProgressQty / maxQty) * (chartHeight - 40) : 0;
          const totalHeight = completedHeight + inProgressHeight;
          
          return `
            <div class="flex flex-col items-center relative bar-container" style="width: ${100 / sortedData.length}%; max-width: 80px;">
              <!-- 툴팁 (호버 시 표시) -->
              <div class="tooltip absolute bottom-full mb-2 hidden bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg z-10 whitespace-nowrap"
                   style="left: 50%; transform: translateX(-50%);">
                <div class="font-bold mb-2 border-b border-gray-600 pb-1">${data.date}</div>
                <div class="space-y-1">
                  <div>✅ 공정완료: <span class="font-bold">${data.completedQty.toLocaleString()}개</span></div>
                  <div>⏳ 미완료: <span class="font-bold">${data.inProgressQty.toLocaleString()}개</span></div>
                  <div>📊 총 발주량: <span class="font-bold">${data.totalQty.toLocaleString()}개</span></div>
                  <div>🔧 공정률: <span class="font-bold text-green-400">${avgProcessRate}%</span></div>
                </div>
              </div>
              
              <!-- 누적 막대 -->
              <div class="flex flex-col w-full cursor-pointer hover:opacity-90 bar"
                   onclick="showPendingDetails('${data.date}')"
                   style="height: ${totalHeight}px;">
                <!-- 미완료 (위) -->
                <div class="bg-gray-300 w-full rounded-t transition-all"
                     style="height: ${inProgressHeight}px;">
                </div>
                <!-- 공정완료 (아래) -->
                <div class="bg-green-500 w-full rounded-b transition-all"
                     style="height: ${completedHeight}px;">
                </div>
              </div>
              
              <!-- 공정률 표시 -->
              <div class="text-xs font-bold mt-1 ${avgProcessRate === 100 ? 'text-green-600' : avgProcessRate === 0 ? 'text-gray-400' : 'text-blue-600'}">
                ${avgProcessRate}%
              </div>
              
              <!-- 날짜 레이블 -->
              <div class="text-xs text-gray-600 mt-1 text-center" style="writing-mode: horizontal-tb; transform: rotate(-45deg); transform-origin: center; white-space: nowrap; margin-top: 20px;">
                ${data.date}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <!-- 안내 메시지 -->
      <div class="text-center text-xs text-gray-500 mt-6">
        💡 막대를 클릭하면 해당 일자의 미입고 상세 내역을 볼 수 있습니다.
      </div>
    </div>
    
    <style>
      .bar-container:hover .tooltip {
        display: block !important;
      }
      .bar-container .bar:hover {
        opacity: 0.85;
      }
    </style>
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

// 물류입고 예정일 계산 함수
function calculateExpectedArrival(order) {
  const productionProcesses = order.schedule?.production || [];
  const shippingProcesses = order.schedule?.shipping || [];
  
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
  
  for (let i = allProcesses.length - 1; i >= 0; i--) {
    if (allProcesses[i].process?.actualDate) {
      currentDate = new Date(allProcesses[i].process.actualDate);
      lastCompletedIndex = i;
      break;
    }
  }
  
  if (!currentDate && order.orderDate) {
    currentDate = new Date(order.orderDate);
  }
  
  if (currentDate) {
    for (let i = lastCompletedIndex + 1; i < allProcesses.length; i++) {
      const { config, process } = allProcesses[i];
      if (process?.targetDate) {
        currentDate = new Date(process.targetDate);
      } else {
        const leadTime = process?.leadTime || config.defaultLeadTime || 0;
        currentDate.setDate(currentDate.getDate() + leadTime);
      }
    }
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return '-';
}

function renderPendingOrdersTable(orders, selectedDate = null) {
  const container = document.getElementById('pending-orders-table');
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-check-circle text-3xl mb-2 text-green-500"></i>
        <p class="font-medium">현재 지연 위험 주문이 없습니다.</p>
        <p class="text-xs mt-1">차트의 막대를 클릭하면 해당 일자의 미완료 주문을 볼 수 있습니다.</p>
      </div>
    `;
    return;
  }
  
  const title = selectedDate ? `${selectedDate} 미완료 상세` : `지연 위험 주문 (총 ${orders.length}건)`;
  
  container.innerHTML = `
    <div class="mb-3 flex justify-between items-center">
      <p class="text-sm font-bold text-gray-700">${title}</p>
      ${orders.length > 0 ? `<p class="text-xs text-gray-500">총 물량: ${orders.reduce((sum, o) => sum + (parseInt(o.qty) || 0), 0).toLocaleString()}개</p>` : ''}
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-xs border-collapse">
        <thead class="bg-gray-50 text-xs uppercase sticky top-0">
          <tr>
            <th class="px-2 py-2 border">채널</th>
            <th class="px-2 py-2 border">스타일</th>
            <th class="px-2 py-2 border">생산지</th>
            <th class="px-2 py-2 border">컬러</th>
            <th class="px-2 py-2 border">사이즈</th>
            <th class="px-2 py-2 border">수량</th>
            <th class="px-2 py-2 border">지연일수</th>
            <th class="px-2 py-2 border">입고요구일</th>
            <th class="px-2 py-2 border">예상입고일</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => {
            const expectedArrival = calculateExpectedArrival(order);
            
            // 차이일수 계산 (물류입고 예정일 - 입고요구일)
            let diffDays = '-';
            let diffClass = '';
            if (expectedArrival !== '-' && order.requiredDelivery) {
              const expectedDate = new Date(expectedArrival);
              const requiredDate = new Date(order.requiredDelivery);
              const diff = Math.floor((expectedDate - requiredDate) / (1000 * 60 * 60 * 24));
              
              if (diff > 0) {
                diffDays = `+${diff}`;
                diffClass = 'text-red-600 font-bold';
              } else if (diff < 0) {
                diffDays = `${diff}`;
                diffClass = 'text-blue-600 font-bold';
              } else {
                diffDays = '0';
                diffClass = 'text-green-600 font-bold';
              }
            }
            
            return `
              <tr class="border-b hover:bg-gray-50">
                <td class="px-2 py-2 border">${order.channel || '-'}</td>
                <td class="px-2 py-2 border font-medium">${order.style || '-'}</td>
                <td class="px-2 py-2 border">${order.supplier || '-'}</td>
                <td class="px-2 py-2 border">${order.color || '-'}</td>
                <td class="px-2 py-2 border">${order.size || '-'}</td>
                <td class="px-2 py-2 border text-right">${(order.qty || 0).toLocaleString()}</td>
                <td class="px-2 py-2 border text-center ${diffClass}">${diffDays}</td>
                <td class="px-2 py-2 border">${order.requiredDelivery || '-'}</td>
                <td class="px-2 py-2 border">${expectedArrival}</td>
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
