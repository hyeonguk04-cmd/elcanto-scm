// 관리자 종합 대시보드 - 인터랙티브 버전
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
let selectedKPI = null; // 선택된 KPI 추적
let charts = {}; // Chart.js 인스턴스 저장

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
        
        <!-- KPI 카드 (클릭 가능) -->
        <div id="kpi-cards" class="grid grid-cols-4 gap-3">
          <!-- 동적으로 생성 -->
        </div>
        
        <!-- 상세 분석 영역 (KPI 클릭 시 표시) -->
        <div id="detail-analysis" class="hidden">
          <!-- 동적으로 생성 -->
        </div>
        
        <!-- 지연 위험 발주 (항상 표시) -->
        <div class="bg-white rounded-xl shadow-lg p-3">
          <h3 class="text-base font-bold text-gray-800 mb-3">🚨 모니터링 (미입고 상세 현황)</h3>
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
  
  // 선택된 KPI가 있으면 상세 분석 다시 렌더링
  if (selectedKPI) {
    renderDetailAnalysis(selectedKPI);
  }
  
  // 지연 위험 발주 테이블
  renderPendingOrdersTable(dashboardData.delayedOrders);
}

function processData(orders) {
  // 미입고 발주 (입항이 완료되지 않은 발주)
  const pendingOrders = orders.filter(order => {
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    return !arrivalProcess?.actualDate;
  });
  
  // 완료된 발주
  const completedOrders = orders.filter(order => {
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    return arrivalProcess?.actualDate;
  });
  
  // 지연된 발주
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const delayedOrders = pendingOrders.filter(order => {
    if (!order.requiredDelivery) return false;
    const requiredDate = new Date(order.requiredDelivery);
    requiredDate.setHours(0, 0, 0, 0);
    return today > requiredDate;
  });
  
  // KPI 계산
  const totalOrders = orders.length;
  const totalQty = DataUtils.sumBy(orders, 'qty');
  const completedQty = DataUtils.sumBy(completedOrders, 'qty');
  const pendingQty = DataUtils.sumBy(pendingOrders, 'qty');
  const delayedQty = DataUtils.sumBy(delayedOrders, 'qty');
  
  // 정시 입고 발주
  const onTimeOrders = completedOrders.filter(order => {
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    if (!order.requiredDelivery || !arrivalProcess?.actualDate) return false;
    
    const requiredDate = new Date(order.requiredDelivery);
    const actualDate = new Date(arrivalProcess.actualDate);
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

// KPI 카드 렌더링
function renderKPICards() {
  const container = document.getElementById('kpi-cards');
  const kpi = dashboardData.kpi;
  
  const kpiCards = [
    {
      id: 'ontime',
      title: '납기 준수율',
      value: `${kpi.onTimeRate}%`,
      subtitle: `정시: ${kpi.onTimeOrders}건 / 전체: ${kpi.totalOrders}건`,
      color: 'green',
      icon: 'fa-check-circle',
      tooltip: '전체 발주 대비 입고요구일 내 입고 완료'
    },
    {
      id: 'progress',
      title: '입고 진행률',
      value: `${kpi.progressRate}%`,
      subtitle: `완료: ${kpi.completedQty.toLocaleString()}개 / 총: ${kpi.totalQty.toLocaleString()}개`,
      color: 'blue',
      icon: 'fa-truck',
      tooltip: '총 발주량 대비 입고 완료량'
    },
    {
      id: 'delayed',
      title: '지연 물량',
      value: `${kpi.delayedQty.toLocaleString()}개`,
      subtitle: `지연: ${kpi.delayedOrders}건`,
      color: 'red',
      icon: 'fa-exclamation-triangle',
      tooltip: '입고요구일이 지난 미입고 물량'
    },
    {
      id: 'total',
      title: '총 발주량',
      value: `${kpi.totalQty.toLocaleString()}개`,
      subtitle: `총: ${kpi.totalOrders}건`,
      color: 'purple',
      icon: 'fa-boxes',
      tooltip: '필터 적용된 전체 발주량'
    }
  ];
  
  container.innerHTML = kpiCards.map(card => `
    <div class="kpi-card bg-gradient-to-br from-${card.color}-50 to-${card.color}-100 rounded-lg shadow p-3 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${selectedKPI === card.id ? 'ring-4 ring-' + card.color + '-400 shadow-xl' : ''}"
         data-kpi="${card.id}"
         title="${card.tooltip}">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-${card.color}-600 font-medium mb-0.5">${card.title}</p>
          <p class="text-xl font-bold text-${card.color}-700">${card.value}</p>
          <p class="text-xxs text-${card.color}-600 mt-1">${card.subtitle}</p>
        </div>
        <div class="bg-${card.color}-200 rounded-full p-1.5">
          <i class="fas ${card.icon} text-base text-${card.color}-600"></i>
        </div>
      </div>
    </div>
  `).join('');
  
  // KPI 카드 클릭 이벤트
  document.querySelectorAll('.kpi-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const kpiId = e.currentTarget.dataset.kpi;
      
      // 같은 카드 클릭 시 토글
      if (selectedKPI === kpiId) {
        selectedKPI = null;
        document.getElementById('detail-analysis').classList.add('hidden');
        document.querySelectorAll('.kpi-card').forEach(c => {
          c.classList.remove('ring-4', 'ring-green-400', 'ring-blue-400', 'ring-red-400', 'ring-purple-400', 'shadow-xl');
        });
      } else {
        selectedKPI = kpiId;
        renderDetailAnalysis(kpiId);
        
        // 선택 상태 업데이트
        document.querySelectorAll('.kpi-card').forEach(c => {
          c.classList.remove('ring-4', 'ring-green-400', 'ring-blue-400', 'ring-red-400', 'ring-purple-400', 'shadow-xl');
        });
        e.currentTarget.classList.add('ring-4', 'shadow-xl');
        const color = e.currentTarget.dataset.kpi === 'ontime' ? 'green' : 
                      e.currentTarget.dataset.kpi === 'progress' ? 'blue' :
                      e.currentTarget.dataset.kpi === 'delayed' ? 'red' : 'purple';
        e.currentTarget.classList.add(`ring-${color}-400`);
      }
    });
  });
}

// 상세 분석 렌더링
function renderDetailAnalysis(kpiId) {
  const container = document.getElementById('detail-analysis');
  container.classList.remove('hidden');
  
  // 기존 차트 destroy
  Object.values(charts).forEach(chart => chart?.destroy());
  charts = {};
  
  let content = '';
  
  switch(kpiId) {
    case 'ontime':
      content = renderOntimeAnalysis();
      break;
    case 'progress':
      content = renderProgressAnalysis();
      break;
    case 'delayed':
      content = renderDelayedAnalysis();
      break;
    case 'total':
      content = renderTotalAnalysis();
      break;
  }
  
  container.innerHTML = content;
  
  // 닫기 버튼 이벤트 리스너 추가
  const closeBtn = container.querySelector('.close-detail-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      selectedKPI = null;
      document.getElementById('detail-analysis').classList.add('hidden');
      document.querySelectorAll('.kpi-card').forEach(c => {
        c.classList.remove('ring-4', 'ring-green-400', 'ring-blue-400', 'ring-red-400', 'ring-purple-400', 'shadow-xl');
      });
    });
  }
  
  // 차트 렌더링
  setTimeout(() => {
    switch(kpiId) {
      case 'ontime':
        createOntimeCharts();
        break;
      case 'progress':
        createProgressCharts();
        break;
      case 'delayed':
        createDelayedCharts();
        break;
      case 'total':
        createTotalCharts();
        break;
    }
  }, 100);
}

// 1. 납기 준수율 상세 분석
function renderOntimeAnalysis() {
  const { orders, completedOrders } = dashboardData;
  
  // 생산업체별 납기 준수율 계산
  const supplierStats = {};
  const suppliers = [...new Set(orders.map(o => o.supplier).filter(s => s))];
  
  suppliers.forEach(supplier => {
    const supplierOrders = completedOrders.filter(o => o.supplier === supplier);
    const onTimeCount = supplierOrders.filter(order => {
      const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
      if (!order.requiredDelivery || !arrivalProcess?.actualDate) return false;
      return new Date(arrivalProcess.actualDate) <= new Date(order.requiredDelivery);
    }).length;
    
    supplierStats[supplier] = {
      total: supplierOrders.length,
      onTime: onTimeCount,
      rate: supplierOrders.length > 0 ? Math.round((onTimeCount / supplierOrders.length) * 100) : 0
    };
  });
  
  // 정시/지연 입고 건수
  const onTimeCount = dashboardData.kpi.onTimeOrders;
  const lateCount = completedOrders.length - onTimeCount;
  
  return `
    <div class="bg-white rounded-xl shadow-lg p-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800">📊 납기 준수율 상세 분석</h3>
        <button class="close-detail-btn text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <!-- 정시 vs 지연 비율 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-bold text-gray-700 mb-3">정시 vs 지연 입고</h4>
          <canvas id="ontime-pie-chart" style="max-height: 250px;"></canvas>
        </div>
        
        <!-- 생산업체별 납기 준수율 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-bold text-gray-700 mb-3">생산업체별 납기 준수율</h4>
          <canvas id="supplier-ontime-chart" style="max-height: 250px;"></canvas>
        </div>
      </div>
      
      <!-- 인사이트 -->
      <div class="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3">
        <h4 class="text-sm font-bold text-blue-900 mb-2">💡 주요 인사이트</h4>
        <ul class="text-sm text-blue-800 space-y-1">
          ${generateOntimeInsights(supplierStats)}
        </ul>
      </div>
    </div>
  `;
}

function generateOntimeInsights(supplierStats) {
  const insights = [];
  const sorted = Object.entries(supplierStats).sort((a, b) => b[1].rate - a[1].rate);
  
  if (sorted.length > 0) {
    const best = sorted[0];
    if (best[1].rate >= 90) {
      insights.push(`<li>✅ <strong>${best[0]}</strong>의 납기 준수율이 ${best[1].rate}%로 우수합니다.</li>`);
    }
    
    const worst = sorted[sorted.length - 1];
    if (worst[1].rate < 70) {
      insights.push(`<li>⚠️ <strong>${worst[0]}</strong>의 납기 준수율이 ${worst[1].rate}%로 개선이 필요합니다.</li>`);
    }
  }
  
  if (insights.length === 0) {
    insights.push('<li>전반적으로 양호한 납기 준수율을 유지하고 있습니다.</li>');
  }
  
  return insights.join('');
}

function createOntimeCharts() {
  const { completedOrders, kpi } = dashboardData;
  const onTimeCount = kpi.onTimeOrders;
  const lateCount = completedOrders.length - onTimeCount;
  
  // Pie Chart
  const pieCtx = document.getElementById('ontime-pie-chart');
  if (pieCtx) {
    charts.onTimePie = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: ['정시 입고', '지연 입고'],
        datasets: [{
          data: [onTimeCount, lateCount],
          backgroundColor: ['#10B981', '#EF4444'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = onTimeCount + lateCount;
                const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                return `${context.label}: ${context.parsed}건 (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  // 생산업체별 Bar Chart
  const { orders, completedOrders: completed } = dashboardData;
  const suppliers = [...new Set(orders.map(o => o.supplier).filter(s => s))];
  const supplierRates = suppliers.map(supplier => {
    const supplierOrders = completed.filter(o => o.supplier === supplier);
    const onTime = supplierOrders.filter(order => {
      const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
      if (!order.requiredDelivery || !arrivalProcess?.actualDate) return false;
      return new Date(arrivalProcess.actualDate) <= new Date(order.requiredDelivery);
    }).length;
    return supplierOrders.length > 0 ? Math.round((onTime / supplierOrders.length) * 100) : 0;
  });
  
  const barCtx = document.getElementById('supplier-ontime-chart');
  if (barCtx) {
    charts.supplierBar = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: suppliers,
        datasets: [{
          label: '납기 준수율 (%)',
          data: supplierRates,
          backgroundColor: supplierRates.map(rate => 
            rate >= 90 ? '#10B981' : rate >= 70 ? '#F59E0B' : '#EF4444'
          ),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `납기 준수율: ${context.parsed.y}%`;
              }
            }
          }
        }
      }
    });
  }
}

// 2. 입고 진행률 상세 분석
function renderProgressAnalysis() {
  const { orders } = dashboardData;
  
  // 공정별 완료율 계산
  const processStats = PROCESS_CONFIG.production.map(process => {
    const completed = orders.filter(order => {
      const p = order.schedule?.production?.find(pr => pr.processKey === process.key);
      return p?.actualDate;
    }).length;
    return {
      name: process.name,
      total: orders.length,
      completed: completed,
      rate: orders.length > 0 ? Math.round((completed / orders.length) * 100) : 0,
      pending: orders.length - completed
    };
  });
  
  // 선적 공정 추가
  PROCESS_CONFIG.shipping.forEach(process => {
    const completed = orders.filter(order => {
      const p = order.schedule?.shipping?.find(pr => pr.processKey === process.key);
      return p?.actualDate;
    }).length;
    processStats.push({
      name: process.name,
      total: orders.length,
      completed: completed,
      rate: orders.length > 0 ? Math.round((completed / orders.length) * 100) : 0,
      pending: orders.length - completed
    });
  });
  
  // 병목 구간 찾기
  const bottleneck = processStats.reduce((min, current) => 
    current.rate < min.rate ? current : min
  );
  
  return `
    <div class="bg-white rounded-xl shadow-lg p-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800">📦 입고 진행률 상세 분석</h3>
        <button class="close-detail-btn text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <!-- Funnel Chart (공정 단계별) -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-bold text-gray-700 mb-3">공정 단계별 완료 현황</h4>
          <div class="space-y-2">
            ${processStats.map(stat => `
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="font-medium ${stat.name === bottleneck.name ? 'text-red-600' : 'text-gray-700'}">
                    ${stat.name}
                    ${stat.name === bottleneck.name ? '⚠️' : ''}
                  </span>
                  <span class="text-gray-600">${stat.rate}% (${stat.completed}/${stat.total})</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500 ${stat.rate >= 90 ? 'bg-green-500' : stat.rate >= 70 ? 'bg-blue-500' : 'bg-red-500'}" 
                       style="width: ${stat.rate}%"></div>
                  ${stat.pending > 0 ? `
                    <div class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                      ${stat.pending}개 대기
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- 채널별 진행률 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-bold text-gray-700 mb-3">채널별 입고 진행률</h4>
          <canvas id="channel-progress-chart" style="max-height: 280px;"></canvas>
        </div>
      </div>
      
      <!-- 인사이트 -->
      <div class="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3">
        <h4 class="text-sm font-bold text-blue-900 mb-2">💡 주요 인사이트</h4>
        <ul class="text-sm text-blue-800 space-y-1">
          <li>⚠️ <strong>${bottleneck.name}</strong> 단계에서 ${bottleneck.pending}개 물량이 대기 중입니다.</li>
          ${bottleneck.rate < 80 ? `<li>💡 ${bottleneck.name} 공정에 리소스 집중이 필요합니다.</li>` : ''}
        </ul>
      </div>
    </div>
  `;
}

function createProgressCharts() {
  const { orders } = dashboardData;
  const channels = ['IM', 'ELCANTO'];
  
  const channelData = channels.map(channel => {
    const channelOrders = orders.filter(o => o.channel === channel);
    const completed = channelOrders.filter(order => {
      const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
      return arrivalProcess?.actualDate;
    });
    const completedQty = DataUtils.sumBy(completed, 'qty');
    const totalQty = DataUtils.sumBy(channelOrders, 'qty');
    return totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0;
  });
  
  const ctx = document.getElementById('channel-progress-chart');
  if (ctx) {
    charts.channelProgress = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: channels,
        datasets: [{
          label: '입고 진행률 (%)',
          data: channelData,
          backgroundColor: ['#3B82F6', '#8B5CF6'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
}

// 3. 지연 물량 상세 분석
function renderDelayedAnalysis() {
  const { delayedOrders } = dashboardData;
  
  // 지연 원인 집계
  const delayReasons = {};
  delayedOrders.forEach(order => {
    const processes = [...(order.schedule?.production || []), ...(order.schedule?.shipping || [])];
    processes.forEach(process => {
      if (process.delayReason && process.delayReason.trim()) {
        const reason = process.delayReason.trim();
        delayReasons[reason] = (delayReasons[reason] || 0) + 1;
      }
    });
  });
  
  // 지연 심각도 분포
  const today = new Date();
  const severityGroups = {
    '1-3일': 0,
    '4-7일': 0,
    '8-14일': 0,
    '15일+': 0
  };
  
  delayedOrders.forEach(order => {
    if (!order.requiredDelivery) return;
    const requiredDate = new Date(order.requiredDelivery);
    const diffDays = Math.floor((today - requiredDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 1 && diffDays <= 3) severityGroups['1-3일']++;
    else if (diffDays >= 4 && diffDays <= 7) severityGroups['4-7일']++;
    else if (diffDays >= 8 && diffDays <= 14) severityGroups['8-14일']++;
    else if (diffDays >= 15) severityGroups['15일+']++;
  });
  
  // 업체별 지연 물량
  const supplierDelays = {};
  delayedOrders.forEach(order => {
    if (order.supplier) {
      supplierDelays[order.supplier] = (supplierDelays[order.supplier] || 0) + (order.qty || 0);
    }
  });
  
  return `
    <div class="bg-white rounded-xl shadow-lg p-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800">🚨 지연 물량 상세 분석</h3>
        <button class="close-detail-btn text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <div class="grid grid-cols-3 gap-4">
        <!-- 지연 심각도 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-bold text-gray-700 mb-3">지연 심각도 분포</h4>
          <canvas id="severity-chart"></canvas>
        </div>
        
        <!-- 지연 원인 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-bold text-gray-700 mb-3">지연 원인 분석</h4>
          ${Object.keys(delayReasons).length > 0 ? `
            <canvas id="reason-chart"></canvas>
          ` : '<p class="text-sm text-gray-500 text-center py-8">지연 사유 데이터가 없습니다.</p>'}
        </div>
        
        <!-- 생산업체별 지연 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-bold text-gray-700 mb-3">생산업체별 지연 물량</h4>
          <canvas id="supplier-delay-chart"></canvas>
        </div>
      </div>
      
      <!-- 인사이트 -->
      <div class="mt-4 bg-red-50 border-l-4 border-red-500 p-3">
        <h4 class="text-sm font-bold text-red-900 mb-2">💡 주요 인사이트</h4>
        <ul class="text-sm text-red-800 space-y-1">
          ${generateDelayInsights(delayReasons, supplierDelays, severityGroups)}
        </ul>
      </div>
    </div>
  `;
}

function generateDelayInsights(delayReasons, supplierDelays, severityGroups) {
  const insights = [];
  
  // 가장 많은 지연 원인
  const topReason = Object.entries(delayReasons).sort((a, b) => b[1] - a[1])[0];
  if (topReason) {
    insights.push(`<li>⚠️ 주요 지연 원인: <strong>${topReason[0]}</strong> (${topReason[1]}건)</li>`);
  }
  
  // 가장 많은 지연 물량 업체
  const topSupplier = Object.entries(supplierDelays).sort((a, b) => b[1] - a[1])[0];
  if (topSupplier) {
    insights.push(`<li>🔴 <strong>${topSupplier[0]}</strong>의 지연 물량이 ${topSupplier[1].toLocaleString()}개로 가장 많습니다.</li>`);
  }
  
  // 긴급 대응 필요
  if (severityGroups['15일+'] > 0) {
    insights.push(`<li>🚨 15일 이상 지연 건이 <strong>${severityGroups['15일+']}건</strong> 있습니다. 긴급 조치 필요!</li>`);
  }
  
  if (insights.length === 0) {
    insights.push('<li>현재 심각한 지연 건은 없습니다.</li>');
  }
  
  return insights.join('');
}

function createDelayedCharts() {
  const { delayedOrders } = dashboardData;
  
  // 지연 심각도
  const today = new Date();
  const severityGroups = {
    '1-3일': 0,
    '4-7일': 0,
    '8-14일': 0,
    '15일+': 0
  };
  
  delayedOrders.forEach(order => {
    if (!order.requiredDelivery) return;
    const requiredDate = new Date(order.requiredDelivery);
    const diffDays = Math.floor((today - requiredDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 1 && diffDays <= 3) severityGroups['1-3일']++;
    else if (diffDays >= 4 && diffDays <= 7) severityGroups['4-7일']++;
    else if (diffDays >= 8 && diffDays <= 14) severityGroups['8-14일']++;
    else if (diffDays >= 15) severityGroups['15일+']++;
  });
  
  const severityCtx = document.getElementById('severity-chart');
  if (severityCtx) {
    charts.severity = new Chart(severityCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(severityGroups),
        datasets: [{
          label: '건수',
          data: Object.values(severityGroups),
          backgroundColor: ['#FCD34D', '#FB923C', '#F87171', '#DC2626'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
  
  // 지연 원인
  const delayReasons = {};
  delayedOrders.forEach(order => {
    const processes = [...(order.schedule?.production || []), ...(order.schedule?.shipping || [])];
    processes.forEach(process => {
      if (process.delayReason && process.delayReason.trim()) {
        const reason = process.delayReason.trim();
        delayReasons[reason] = (delayReasons[reason] || 0) + 1;
      }
    });
  });
  
  const reasonCtx = document.getElementById('reason-chart');
  if (reasonCtx && Object.keys(delayReasons).length > 0) {
    charts.reason = new Chart(reasonCtx, {
      type: 'pie',
      data: {
        labels: Object.keys(delayReasons),
        datasets: [{
          data: Object.values(delayReasons),
          backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 10
              }
            }
          }
        }
      }
    });
  }
  
  // 업체별 지연
  const supplierDelays = {};
  delayedOrders.forEach(order => {
    if (order.supplier) {
      supplierDelays[order.supplier] = (supplierDelays[order.supplier] || 0) + (order.qty || 0);
    }
  });
  
  const supplierCtx = document.getElementById('supplier-delay-chart');
  if (supplierCtx) {
    charts.supplierDelay = new Chart(supplierCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(supplierDelays),
        datasets: [{
          label: '지연 물량 (개)',
          data: Object.values(supplierDelays),
          backgroundColor: '#EF4444',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
}

// 4. 총 발주량 상세 분석
function renderTotalAnalysis() {
  const { orders } = dashboardData;
  
  // 채널별 발주 비율
  const channelStats = {};
  ['IM', 'ELCANTO'].forEach(channel => {
    const channelOrders = orders.filter(o => o.channel === channel);
    channelStats[channel] = {
      count: channelOrders.length,
      qty: DataUtils.sumBy(channelOrders, 'qty')
    };
  });
  
  // 업체별 물량 분포
  const supplierStats = {};
  orders.forEach(order => {
    if (order.supplier) {
      supplierStats[order.supplier] = (supplierStats[order.supplier] || 0) + (order.qty || 0);
    }
  });
  
  return `
    <div class="bg-white rounded-xl shadow-lg p-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800">📈 발주 현황 종합 분석</h3>
        <button class="close-detail-btn text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <!-- 채널별 발주 비율 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-bold text-gray-700 mb-3">채널별 발주 비율</h4>
          <canvas id="channel-distribution-chart"></canvas>
          <div class="mt-3 space-y-1">
            ${Object.entries(channelStats).map(([channel, stat]) => `
              <div class="flex justify-between text-xs">
                <span class="font-medium">${channel}</span>
                <span class="text-gray-600">${stat.qty.toLocaleString()}개 (${stat.count}건)</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- 생산업체별 물량 분포 -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-bold text-gray-700 mb-3">생산업체별 물량 분포</h4>
          <canvas id="supplier-distribution-chart"></canvas>
        </div>
      </div>
      
      <!-- 인사이트 -->
      <div class="mt-4 bg-purple-50 border-l-4 border-purple-500 p-3">
        <h4 class="text-sm font-bold text-purple-900 mb-2">💡 주요 인사이트</h4>
        <ul class="text-sm text-purple-800 space-y-1">
          ${generateTotalInsights(channelStats, supplierStats)}
        </ul>
      </div>
    </div>
  `;
}

function generateTotalInsights(channelStats, supplierStats) {
  const insights = [];
  
  // 채널별 비율
  const totalQty = Object.values(channelStats).reduce((sum, stat) => sum + stat.qty, 0);
  Object.entries(channelStats).forEach(([channel, stat]) => {
    const percentage = totalQty > 0 ? Math.round((stat.qty / totalQty) * 100) : 0;
    insights.push(`<li><strong>${channel}</strong> 채널이 전체 물량의 ${percentage}%를 차지합니다.</li>`);
  });
  
  // 최대 물량 업체
  const topSupplier = Object.entries(supplierStats).sort((a, b) => b[1] - a[1])[0];
  if (topSupplier) {
    insights.push(`<li>💼 <strong>${topSupplier[0]}</strong>이(가) ${topSupplier[1].toLocaleString()}개로 최대 물량을 담당하고 있습니다.</li>`);
  }
  
  return insights.join('');
}

function createTotalCharts() {
  const { orders } = dashboardData;
  
  // 채널별 발주
  const channelStats = {};
  ['IM', 'ELCANTO'].forEach(channel => {
    const channelOrders = orders.filter(o => o.channel === channel);
    channelStats[channel] = DataUtils.sumBy(channelOrders, 'qty');
  });
  
  const channelCtx = document.getElementById('channel-distribution-chart');
  if (channelCtx) {
    charts.channelDist = new Chart(channelCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(channelStats),
        datasets: [{
          data: Object.values(channelStats),
          backgroundColor: ['#3B82F6', '#8B5CF6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
  
  // 업체별 물량
  const supplierStats = {};
  orders.forEach(order => {
    if (order.supplier) {
      supplierStats[order.supplier] = (supplierStats[order.supplier] || 0) + (order.qty || 0);
    }
  });
  
  const supplierCtx = document.getElementById('supplier-distribution-chart');
  if (supplierCtx) {
    charts.supplierDist = new Chart(supplierCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(supplierStats),
        datasets: [{
          label: '발주 물량 (개)',
          data: Object.values(supplierStats),
          backgroundColor: '#8B5CF6',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
}

// 지연 위험 발주 테이블
function renderPendingOrdersTable(delayedOrders) {
  const container = document.getElementById('pending-orders-table');
  
  if (!delayedOrders || delayedOrders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-check-circle text-4xl mb-2 text-green-500"></i>
        <p>지연 위험 발주가 없습니다.</p>
      </div>
    `;
    return;
  }
  
  const today = new Date();
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full text-xs">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left font-semibold text-gray-700">스타일</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-700">생산업체</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-700">수량</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-700">입고요구일</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-700">지연 일수</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-700">현재 공정</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${delayedOrders.slice(0, 10).map(order => {
            const diffDays = order.requiredDelivery 
              ? Math.floor((today - new Date(order.requiredDelivery)) / (1000 * 60 * 60 * 24))
              : 0;
            
            // 현재 공정 찾기
            const allProcesses = [...(order.schedule?.production || []), ...(order.schedule?.shipping || [])];
            const lastCompleted = allProcesses.filter(p => p.actualDate).pop();
            const currentProcess = lastCompleted ? lastCompleted.name : '미착수';
            
            const severityColor = diffDays >= 15 ? 'bg-red-50' : diffDays >= 8 ? 'bg-orange-50' : 'bg-yellow-50';
            
            return `
              <tr class="${severityColor}">
                <td class="px-3 py-2 font-medium">${order.style || '-'}</td>
                <td class="px-3 py-2">${order.supplier || '-'}</td>
                <td class="px-3 py-2">${(order.qty || 0).toLocaleString()}개</td>
                <td class="px-3 py-2">${order.requiredDelivery || '-'}</td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    diffDays >= 15 ? 'bg-red-100 text-red-800' :
                    diffDays >= 8 ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }">
                    ${diffDays}일 ${diffDays >= 15 ? '🔴' : ''}
                  </span>
                </td>
                <td class="px-3 py-2">${currentProcess}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      ${delayedOrders.length > 10 ? `
        <div class="text-center py-2 text-xs text-gray-500">
          ${delayedOrders.length - 10}건 더 있음 (총 ${delayedOrders.length}건)
        </div>
      ` : ''}
    </div>
  `;
}

// 유틸리티 함수
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
