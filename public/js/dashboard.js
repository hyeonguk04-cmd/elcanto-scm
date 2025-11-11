// 관리자 종합 대시보드
import { getOrdersWithProcesses } from './firestore-service.js';
import { renderKPICard, createChart, renderEmptyState } from './ui-components.js';
import { UIUtils, DateUtils, DataUtils, FormatUtils } from './utils.js';
import { SHIPPING_LEAD_TIMES } from './process-config.js';

let dashboardData = null;
let charts = {};

export async function renderDashboard(container) {
  try {
    UIUtils.showLoading();
    
    // 데이터 로드
    const orders = await getOrdersWithProcesses();
    dashboardData = processData(orders);
    
    container.innerHTML = `
      <div class="space-y-6">
        <!-- 헤더 -->
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">종합 현황판</h2>
          <button id="refresh-dashboard" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            <i class="fas fa-sync-alt mr-2"></i>새로고침
          </button>
        </div>
        
        <!-- KPI 요약 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${renderKPICard(
            '납기 준수율',
            `${dashboardData.kpi.onTimeRate}%`,
            `총 ${dashboardData.kpi.totalOrders}건`,
            'fa-check-circle',
            'green'
          )}
          ${renderKPICard(
            '입고 진행률',
            `${dashboardData.kpi.progressRate}%`,
            `입고완료 ${dashboardData.kpi.completedOrders}건`,
            'fa-truck',
            'blue'
          )}
          ${renderKPICard(
            '지연 물량',
            FormatUtils.formatNumber(dashboardData.kpi.delayedQty),
            `${dashboardData.kpi.delayedOrders}건 지연`,
            'fa-exclamation-triangle',
            'red'
          )}
          ${renderKPICard(
            '총 발주량',
            FormatUtils.formatNumber(dashboardData.kpi.totalQty),
            `평균 ${Math.round(dashboardData.kpi.avgQty)}개/건`,
            'fa-boxes',
            'purple'
          )}
        </div>
        
        <!-- 차트 영역 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 채널별 발주/입고 현황 -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">채널별 발주/입고 현황</h3>
            <div class="chart-container">
              <canvas id="channel-chart"></canvas>
            </div>
          </div>
          
          <!-- 지연 현황 -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">공정별 지연 현황</h3>
            <div class="chart-container">
              <canvas id="delay-chart"></canvas>
            </div>
          </div>
        </div>
        
        <!-- 국가별 현황 -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">국가별 생산 현황</h3>
          <div class="chart-container" style="height: 250px;">
            <canvas id="country-chart"></canvas>
          </div>
        </div>
        
        <!-- 미입고 상세 현황 -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">미입고 상세 현황</h3>
          <div class="flex space-x-4 mb-4">
            <select id="pending-channel-filter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="전체">전체 채널</option>
              <option value="IM">IM</option>
              <option value="ELCANTO">ELCANTO</option>
            </select>
          </div>
          <div id="pending-orders-table"></div>
        </div>
      </div>
    `;
    
    // 차트 렌더링
    renderCharts();
    
    // 미입고 테이블 렌더링
    renderPendingOrdersTable('전체');
    
    // 이벤트 리스너
    document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
      renderDashboard(container);
    });
    
    document.getElementById('pending-channel-filter')?.addEventListener('change', (e) => {
      renderPendingOrdersTable(e.target.value);
    });
    
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Dashboard render error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.', 'fa-exclamation-circle');
  }
}

function processData(orders) {
  // 미입고 주문 (입항이 완료되지 않은 주문)
  const pendingOrders = orders.filter(order => {
    const arrivalProcess = order.schedule.shipping.find(p => p.processKey === 'arrival');
    return !arrivalProcess?.actualDate;
  });
  
  // 완료된 주문
  const completedOrders = orders.filter(order => {
    const arrivalProcess = order.schedule.shipping.find(p => p.processKey === 'arrival');
    return arrivalProcess?.actualDate;
  });
  
  // 지연된 주문
  const delayedOrders = pendingOrders.filter(order => {
    const arrivalProcess = order.schedule.shipping.find(p => p.processKey === 'arrival');
    if (!arrivalProcess) return false;
    
    const targetDate = arrivalProcess.targetDate;
    const today = DateUtils.today();
    return DateUtils.isAfter(today, targetDate);
  });
  
  // KPI 계산
  const totalOrders = orders.length;
  const totalQty = DataUtils.sumBy(orders, 'qty');
  const delayedQty = DataUtils.sumBy(delayedOrders, 'qty');
  const onTimeOrders = completedOrders.filter(order => {
    const arrivalProcess = order.schedule.shipping.find(p => p.processKey === 'arrival');
    const delayDays = DateUtils.diffInDays(arrivalProcess.targetDate, arrivalProcess.actualDate);
    return delayDays <= 0;
  }).length;
  
  const kpi = {
    totalOrders,
    totalQty,
    avgQty: totalOrders > 0 ? totalQty / totalOrders : 0,
    completedOrders: completedOrders.length,
    delayedOrders: delayedOrders.length,
    delayedQty,
    onTimeRate: completedOrders.length > 0 ? Math.round((onTimeOrders / completedOrders.length) * 100) : 0,
    progressRate: totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0
  };
  
  // 채널별 데이터
  const channelData = DataUtils.groupBy(orders, 'channel');
  const channelStats = Object.entries(channelData).map(([channel, orders]) => ({
    channel,
    total: orders.length,
    totalQty: DataUtils.sumBy(orders, 'qty'),
    completed: orders.filter(o => {
      const arrival = o.schedule.shipping.find(p => p.processKey === 'arrival');
      return arrival?.actualDate;
    }).length
  }));
  
  // 국가별 데이터
  const countryData = DataUtils.groupBy(orders, 'country');
  const countryStats = Object.entries(countryData).map(([country, orders]) => ({
    country,
    total: orders.length,
    totalQty: DataUtils.sumBy(orders, 'qty')
  }));
  
  // 공정별 지연 데이터
  const delayByProcess = {};
  orders.forEach(order => {
    [...order.schedule.production, ...order.schedule.shipping].forEach(process => {
      if (process.actualDate) {
        const delayDays = DateUtils.diffInDays(process.targetDate, process.actualDate);
        if (delayDays > 0) {
          if (!delayByProcess[process.processName]) {
            delayByProcess[process.processName] = 0;
          }
          delayByProcess[process.processName]++;
        }
      }
    });
  });
  
  return {
    kpi,
    orders,
    pendingOrders,
    completedOrders,
    delayedOrders,
    channelStats,
    countryStats,
    delayByProcess
  };
}

function renderCharts() {
  // 채널별 차트
  const channelLabels = dashboardData.channelStats.map(s => s.channel);
  const channelTotals = dashboardData.channelStats.map(s => s.total);
  const channelCompleted = dashboardData.channelStats.map(s => s.completed);
  
  charts.channel = createChart('channel-chart', 'bar', {
    labels: channelLabels,
    datasets: [
      {
        label: '전체 발주',
        data: channelTotals,
        backgroundColor: '#3b82f6'
      },
      {
        label: '입고 완료',
        data: channelCompleted,
        backgroundColor: '#10b981'
      }
    ]
  });
  
  // 지연 현황 차트
  const delayLabels = Object.keys(dashboardData.delayByProcess);
  const delayValues = Object.values(dashboardData.delayByProcess);
  
  charts.delay = createChart('delay-chart', 'doughnut', {
    labels: delayLabels,
    datasets: [{
      data: delayValues,
      backgroundColor: [
        '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
      ]
    }]
  });
  
  // 국가별 차트
  const countryLabels = dashboardData.countryStats.map(s => s.country);
  const countryQty = dashboardData.countryStats.map(s => s.totalQty);
  
  charts.country = createChart('country-chart', 'bar', {
    labels: countryLabels,
    datasets: [{
      label: '발주 수량',
      data: countryQty,
      backgroundColor: '#8b5cf6'
    }]
  }, {
    indexAxis: 'y'
  });
}

function renderPendingOrdersTable(channelFilter) {
  const container = document.getElementById('pending-orders-table');
  
  let filteredOrders = dashboardData.pendingOrders;
  if (channelFilter !== '전체') {
    filteredOrders = filteredOrders.filter(o => o.channel === channelFilter);
  }
  
  if (filteredOrders.length === 0) {
    container.innerHTML = renderEmptyState('미입고 주문이 없습니다.', 'fa-check-circle');
    return;
  }
  
  // 지연일 계산 및 정렬
  const ordersWithDelay = filteredOrders.map(order => {
    const arrivalProcess = order.schedule.shipping.find(p => p.processKey === 'arrival');
    const delayDays = DateUtils.diffInDays(arrivalProcess.targetDate, DateUtils.today());
    return { ...order, delayDays, arrivalProcess };
  }).sort((a, b) => b.delayDays - a.delayDays);
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            <th class="px-4 py-3 text-left">채널</th>
            <th class="px-4 py-3 text-left">스타일</th>
            <th class="px-4 py-3 text-left">생산업체</th>
            <th class="px-4 py-3 text-left">국가</th>
            <th class="px-4 py-3 text-right">수량</th>
            <th class="px-4 py-3 text-center">입항예정일</th>
            <th class="px-4 py-3 text-center">지연일</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${ordersWithDelay.map(order => `
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3">${order.channel}</td>
              <td class="px-4 py-3 font-medium">${order.style}</td>
              <td class="px-4 py-3">${order.supplier}</td>
              <td class="px-4 py-3">${order.country}</td>
              <td class="px-4 py-3 text-right">${FormatUtils.formatNumber(order.qty)}</td>
              <td class="px-4 py-3 text-center">${order.arrivalProcess.targetDate}</td>
              <td class="px-4 py-3 text-center">
                ${UIUtils.renderDelay(order.delayDays)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export default { renderDashboard };
