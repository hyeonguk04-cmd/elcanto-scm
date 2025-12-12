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
          <div class="flex items-center">
            <h2 class="text-lg font-bold text-gray-800">종합현황</h2>
            <i id="dashboard-info-icon" 
               class="fas fa-lightbulb cursor-pointer" 
               style="font-size: 19px; color: #f59e0b; margin-left: 8px; vertical-align: middle; transition: color 0.2s;"
               tabindex="0"
               role="button"
               aria-label="안내사항 보기"
               onmouseover="this.style.color='#d97706'"
               onmouseout="this.style.color='#f59e0b'"></i>
          </div>
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
      
      <!-- 인포메이션 툴팁 -->
      <div id="dashboard-info-tooltip" class="hidden fixed bg-white rounded-lg z-[1001]" 
           style="width: 420px; padding: 20px; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center">
            <span style="font-size: 16px; margin-right: 8px;">💡</span>
            <h3 class="font-bold text-gray-800" style="font-size: 15px;">안내사항</h3>
          </div>
          <button id="close-dashboard-info-tooltip" class="text-gray-400 hover:text-gray-600 text-xl leading-none" style="margin-top: -4px;">&times;</button>
        </div>
        <div style="font-size: 14px; color: #333; line-height: 1.7;">
          <p style="margin: 0;">• 전체 발주 및 공정 상황을 한눈에 파악하는 대시보드입니다. 주요 KPI 카드를 클릭하여 발주 진척사항을 확인해 주세요.</p>
        </div>
        <!-- 툴팁 화살표 -->
        <div class="absolute" style="top: -8px; left: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid white;"></div>
        <div class="absolute" style="top: -9px; left: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid #ddd;"></div>
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
    
    // 인포메이션 툴팁 기능
    setupDashboardInfoTooltip();
    
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Dashboard render error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.', 'fa-exclamation-circle');
  }
}

// 인포메이션 툴팁 기능 설정
function setupDashboardInfoTooltip() {
  const icon = document.getElementById('dashboard-info-icon');
  const tooltip = document.getElementById('dashboard-info-tooltip');
  const closeBtn = document.getElementById('close-dashboard-info-tooltip');
  
  if (!icon || !tooltip) return;
  
  let hoverTimeout = null;
  let hideTimeout = null;
  let isFixed = false;
  
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
  
  // 마우스 호버
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
  
  // 툴팁 위에 마우스
  tooltip.addEventListener('mouseenter', () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  });
  
  tooltip.addEventListener('mouseleave', () => {
    hideTooltip();
  });
  
  // 클릭 고정
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
  
  // 외부 클릭
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
  
  // ESC 키
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFixed) {
      isFixed = false;
      tooltip.classList.add('hidden');
    }
  });
  
  // 창 크기 변경
  window.addEventListener('resize', () => {
    if (!tooltip.classList.contains('hidden')) {
      positionTooltip();
    }
  });
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
  
  // 전역 변수에 저장 (차트 네비게이션용)
  window.currentDashboardData = dashboardData;
  window.currentChannelFilter = currentChannelFilter;
  
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
  
  // 지연된 발주 (입고요구일 초과 OR 공정 지연)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const delayedOrders = pendingOrders.filter(order => {
    // 조건 1: 입고요구일이 지났는지 확인
    let isOverdue = false;
    if (order.requiredDelivery) {
      const requiredDate = new Date(order.requiredDelivery);
      requiredDate.setHours(0, 0, 0, 0);
      isOverdue = today > requiredDate;
    }
    
    // 조건 2: 현재 진행 중인 공정이 목표일보다 지연되었는지 확인
    let hasDelayedProcess = false;
    const allProcesses = [
      ...(order.schedule?.production || []),
      ...(order.schedule?.shipping || [])
    ];
    
    for (const process of allProcesses) {
      // 실제 완료일이 없고 목표일이 있는 공정 (진행 중인 공정)
      if (!process.actualDate && process.targetDate) {
        const targetDate = new Date(process.targetDate);
        targetDate.setHours(0, 0, 0, 0);
        
        // 목표일이 오늘보다 과거면 지연
        if (today > targetDate) {
          hasDelayedProcess = true;
          console.log(`🔴 지연 발주 발견: ${order.style} - 공정 ${process.name} 목표일(${process.targetDate}) 초과`);
          break;
        }
      }
    }
    
    // 입고요구일 초과 또는 공정 지연 중 하나라도 해당되면 지연 발주로 판단
    const isDelayed = isOverdue || hasDelayedProcess;
    if (isDelayed) {
      console.log(`🚨 지연 발주: ${order.style} | 입고요구일초과: ${isOverdue}, 공정지연: ${hasDelayedProcess}`);
    }
    return isDelayed;
  });
  
  console.log(`📊 대시보드 데이터: 전체 ${orders.length}건, 미입고 ${pendingOrders.length}건, 지연 ${delayedOrders.length}건`);
  
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
        indexAxis: 'y', // 수평 막대 차트로 변경
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          x: {
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
                return `납기 준수율: ${context.parsed.x}%`;
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
      
      <!-- 국가별/채널별 발주 현황 -->
      <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 class="text-sm font-bold text-gray-700 mb-3">국가별/채널별 발주 현황</h4>
        <div id="channel-charts-container" class="grid grid-cols-4 gap-4">
          <!-- 동적으로 생성 -->
        </div>
      </div>
      
      <!-- 생산업체별 발주 대비 입고 현황 -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="text-sm font-bold text-gray-700 mb-3">생산업체별 발주 대비 입고 현황</h4>
        <div id="supplier-charts-container" class="grid grid-cols-5 gap-4">
          <!-- 동적으로 생성 -->
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
  
  // 필터 상태 확인
  const isAllChannels = currentChannelFilter === '전체';
  const isAllSuppliers = currentSupplierFilter === '전체';
  
  // 세련된 색상 팔레트 (포털 전체와 조화)
  const colors = {
    elcanto: '#8B5CF6',    // 세련된 보라 (Violet-500)
    im: '#3B82F6',         // 세련된 파랑 (Blue-500)
    suppliers: [
      '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
      '#06B6D4', '#F97316', '#6366F1', '#84CC16', '#D946EF'
    ]
  };
  
  // ===== 1. 채널별 그래프 영역 (상단) =====
  const channelContainer = document.getElementById('channel-charts-container');
  if (!channelContainer) return;
  
  if (isAllChannels) {
    // 전체 채널 선택 시: 4개 도넛 차트 표시
    renderAllChannelCharts(orders, colors, channelContainer);
  } else {
    // 특정 채널 선택 시: 3개 도넛 차트 표시
    renderSingleChannelCharts(orders, colors, channelContainer);
  }
  
  // ===== 2. 생산업체별 그래프 영역 (하단) =====
  const supplierContainer = document.getElementById('supplier-charts-container');
  if (!supplierContainer) return;
  
  if (isAllSuppliers) {
    // 전체 생산업체 선택 시: 모든 생산업체 도넛 차트 표시
    renderAllSupplierCharts(orders, colors, supplierContainer);
  } else {
    // 특정 생산업체 선택 시: 채널별 그래프만 필터링 (하단은 숨김)
    supplierContainer.innerHTML = `
      <div class="col-span-5 text-center text-sm text-gray-500 py-8">
        선택한 생산업체의 채널별 데이터는 상단 그래프에서 확인하세요.
      </div>
    `;
  }
}

// ===== 전체 채널 선택 시: 3개 차트 (2 도넛 + 1 막대) =====
function renderAllChannelCharts(orders, colors, container) {
  const channelStats = calculateChannelStats(orders);
  const countryData = calculateCountryData(orders);
  
  container.innerHTML = `
    <!-- 1. 국가별 도넛 차트 -->
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <h5 class="text-xs font-semibold text-gray-600 mb-3 text-center">국가별</h5>
      <canvas id="chart-country-donut" class="mx-auto" style="max-height: 180px;"></canvas>
    </div>
    
    <!-- 2. 채널별 도넛 차트 -->
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <h5 class="text-xs font-semibold text-gray-600 mb-3 text-center">채널별</h5>
      <canvas id="chart-channel-donut" class="mx-auto" style="max-height: 180px;"></canvas>
    </div>
    
    <!-- 3. 발주일별 입고현황 (너비 2배, 높이 동일) -->
    <div class="bg-white rounded-lg p-4 shadow-sm col-span-2">
      <h5 class="text-xs font-semibold text-gray-600 mb-3 text-center">발주일별 입고현황</h5>
      <div style="height: 180px;">
        <canvas id="chart-date-bar"></canvas>
      </div>
    </div>
  `;
  
  // 차트 생성
  setTimeout(() => {
    // 1. 국가별 도넛 차트 (베트남 vs 중국)
    const vietnamTotal = (countryData['베트남']?.ELCANTO || 0) + (countryData['베트남']?.IM || 0);
    const chinaTotal = (countryData['중국']?.ELCANTO || 0) + (countryData['중국']?.IM || 0);
    createDonutChart('chart-country-donut',
      ['베트남', '중국'],
      [vietnamTotal, chinaTotal],
      ['#8B5CF6', '#3B82F6'],  // 보라, 파랑
      '전체'
    );
    
    // 2. 채널별 도넛 차트
    createDonutChart('chart-channel-donut', 
      ['ELCANTO', 'IM'],
      [channelStats.ELCANTO.total, channelStats.IM.total],
      [colors.elcanto, colors.im],
      '전체'
    );
    
    // 3. 발주일별 입고현황 (세로 막대)
    createDateBarChart('chart-date-bar', orders, colors);
  }, 100);
}

// ===== 특정 채널 선택 시: 3개 차트 (2 도넛 + 1 막대) =====
function renderSingleChannelCharts(orders, colors, container) {
  const selectedChannel = currentChannelFilter;
  const channelOrders = orders.filter(o => o.channel === selectedChannel);
  const channelStats = calculateChannelStats(channelOrders);
  const countryData = calculateCountryData(channelOrders);
  
  container.innerHTML = `
    <!-- 1. 국가별 도넛 차트 (선택 채널 데이터) -->
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <h5 class="text-xs font-semibold text-gray-600 mb-3 text-center">국가별</h5>
      <canvas id="chart-country-single" class="mx-auto" style="max-height: 180px;"></canvas>
    </div>
    
    <!-- 2. 생산처별 발주현황 (선택 채널의 생산처별 도넛) -->
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <h5 class="text-xs font-semibold text-gray-600 mb-3 text-center">생산처별</h5>
      <canvas id="chart-supplier-single" class="mx-auto" style="max-height: 180px;"></canvas>
    </div>
    
    <!-- 3. 발주일별 입고현황 (선택 채널 데이터, 너비 2배, 높이 동일) -->
    <div class="bg-white rounded-lg p-4 shadow-sm col-span-2">
      <h5 class="text-xs font-semibold text-gray-600 mb-3 text-center">발주일별 입고현황</h5>
      <div style="height: 180px;">
        <canvas id="chart-date-single"></canvas>
      </div>
    </div>
  `;
  
  // 차트 생성
  setTimeout(() => {
    const channelColor = selectedChannel === 'ELCANTO' ? colors.elcanto : colors.im;
    
    // 1. 국가별 도넛 차트 (선택 채널의 국가별 데이터)
    const vietnamTotal = countryData['베트남']?.[selectedChannel] || 0;
    const chinaTotal = countryData['중국']?.[selectedChannel] || 0;
    createDonutChart('chart-country-single',
      ['베트남', '중국'],
      [vietnamTotal, chinaTotal],
      ['#8B5CF6', '#3B82F6'],  // 보라, 파랑
      selectedChannel  // 선택된 채널명 표시
    );
    
    // 2. 생산처별 발주현황 (선택 채널의 생산처별 도넛)
    createSupplierDonutChart('chart-supplier-single', channelOrders, colors);
    
    // 3. 발주일별 입고현황 (선택 채널 데이터만)
    createDateBarChart('chart-date-single', channelOrders, colors);
  }, 100);
}

// ===== 전체 생산업체 선택 시: 모든 생산업체 도넛 차트 =====
function renderAllSupplierCharts(orders, colors, container) {
  const supplierData = calculateSupplierData(orders);
  const suppliers = Object.keys(supplierData).slice(0, 10); // 최대 10개
  
  if (suppliers.length === 0) {
    container.innerHTML = '<div class="col-span-5 text-center text-gray-500 py-8">생산업체 데이터가 없습니다.</div>';
    return;
  }
  
  container.innerHTML = suppliers.map((supplier, idx) => {
    const data = supplierData[supplier];
    const colorIdx = idx % colors.suppliers.length;
    return `
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <h5 class="text-xs font-semibold text-gray-600 mb-3 text-center">${supplier}</h5>
        <canvas id="chart-supplier-${idx}" class="mx-auto" style="max-height: 140px;"></canvas>
      </div>
    `;
  }).join('');
  
  // 차트 생성
  setTimeout(() => {
    suppliers.forEach((supplier, idx) => {
      const data = supplierData[supplier];
      const colorIdx = idx % colors.suppliers.length;
      
      createProgressDonutChart(
        `chart-supplier-${idx}`,
        data.total,
        data.completed,
        colors.suppliers[colorIdx],
        supplier
      );
    });
  }, 100);
}

// ===== 유틸리티: 채널별 통계 계산 =====
function calculateChannelStats(orders) {
  const stats = { ELCANTO: { total: 0, completed: 0 }, IM: { total: 0, completed: 0 } };
  
  ['ELCANTO', 'IM'].forEach(channel => {
    const channelOrders = orders.filter(o => o.channel === channel);
    stats[channel].total = DataUtils.sumBy(channelOrders, 'qty');
    
    const completedOrders = channelOrders.filter(order => {
      const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
      return arrivalProcess?.actualDate;
    });
    stats[channel].completed = DataUtils.sumBy(completedOrders, 'qty');
  });
  
  return stats;
}

// ===== 유틸리티: 국가별 데이터 계산 =====
function calculateCountryData(orders) {
  const countryData = {};
  const countries = ['한국', '중국', '베트남'];
  
  countries.forEach(country => {
    countryData[country] = { ELCANTO: 0, IM: 0, ELCANTO_completed: 0, IM_completed: 0 };
    
    ['ELCANTO', 'IM'].forEach(channel => {
      const filtered = orders.filter(o => o.channel === channel && o.country === country);
      countryData[country][channel] = DataUtils.sumBy(filtered, 'qty');
      
      const completed = filtered.filter(order => {
        const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
        return arrivalProcess?.actualDate;
      });
      countryData[country][`${channel}_completed`] = DataUtils.sumBy(completed, 'qty');
    });
  });
  
  return countryData;
}

// ===== 유틸리티: 생산업체별 데이터 계산 =====
function calculateSupplierData(orders) {
  const supplierData = {};
  const suppliers = [...new Set(orders.map(o => o.supplier).filter(s => s))];
  
  suppliers.forEach(supplier => {
    const supplierOrders = orders.filter(o => o.supplier === supplier);
    const total = DataUtils.sumBy(supplierOrders, 'qty');
    
    const completedOrders = supplierOrders.filter(order => {
      const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
      return arrivalProcess?.actualDate;
    });
    const completed = DataUtils.sumBy(completedOrders, 'qty');
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    supplierData[supplier] = { total, completed, rate };
  });
  
  return supplierData;
}

// ===== 차트 생성: 생산처별 발주현황 도넛 차트 =====
function createSupplierDonutChart(canvasId, orders, colors) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  // 생산처별 발주량 집계
  const supplierData = {};
  orders.forEach(order => {
    const supplier = order.supplier || '미지정';
    if (!supplierData[supplier]) {
      supplierData[supplier] = 0;
    }
    supplierData[supplier] += order.qty || 0;
  });
  
  // 발주량 기준 내림차순 정렬
  const sortedSuppliers = Object.entries(supplierData)
    .sort((a, b) => b[1] - a[1]);
  
  // 상위 4개 + 기타
  const top4 = sortedSuppliers.slice(0, 4);
  const others = sortedSuppliers.slice(4);
  
  const labels = [];
  const data = [];
  const chartColors = [];
  
  // 색상 팔레트 (보라/파랑 계열)
  const colorPalette = [
    '#8B5CF6',  // 보라
    '#3B82F6',  // 파랑
    '#A78BFA',  // 밝은 보라
    '#60A5FA',  // 밝은 파랑
    '#CBD5E1'   // 회색 (기타)
  ];
  
  // 상위 4개 추가
  top4.forEach((item, index) => {
    labels.push(item[0]);
    data.push(item[1]);
    chartColors.push(colorPalette[index]);
  });
  
  // 기타 추가 (5개 이상인 경우)
  if (others.length > 0) {
    const othersTotal = others.reduce((sum, item) => sum + item[1], 0);
    labels.push('기타');
    data.push(othersTotal);
    chartColors.push(colorPalette[4]);
  }
  
  const total = data.reduce((sum, val) => sum + val, 0);
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: chartColors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 10, weight: '500' },
            boxWidth: 10,
            padding: 8,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: 10,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${context.label}: ${value.toLocaleString()}개 (${percentage}%)`;
            }
          }
        }
      }
    },
    plugins: [{
      id: 'centerText',
      afterDraw: function(chart) {
        const ctx = chart.ctx;
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
        
        ctx.save();
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('생산처별', centerX, centerY);
        ctx.restore();
      }
    }]
  });
}

// ===== 차트 생성: 기본 도넛 차트 =====
function createDonutChart(canvasId, labels, data, colors, centerText) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  const total = data.reduce((sum, val) => sum + val, 0);
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 10, weight: '500' },
            boxWidth: 10,
            padding: 8,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: 10,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${context.label}: ${value.toLocaleString()}개 (${percentage}%)`;
            }
          }
        }
      }
    },
    plugins: [{
      id: 'centerText',
      afterDraw: function(chart) {
        const ctx = chart.ctx;
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
        
        ctx.save();
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(centerText, centerX, centerY);
        ctx.restore();
      }
    }]
  });
}

// ===== 차트 생성: 진행률 도넛 차트 =====
function createProgressDonutChart(canvasId, total, completed, color, label) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['입고완료', '입고대기'],
      datasets: [{
        data: [completed, pending],
        backgroundColor: [color, '#E5E7EB'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 9, weight: '500' },
            boxWidth: 10,
            padding: 6,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: 10,
          titleFont: { size: 11, weight: 'bold' },
          bodyFont: { size: 10 },
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              return `${context.label}: ${value.toLocaleString()}개`;
            }
          }
        }
      }
    },
    plugins: [{
      id: 'centerText',
      afterDraw: function(chart) {
        const ctx = chart.ctx;
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
        
        ctx.save();
        ctx.textAlign = 'center';
        
        // 첫 번째 줄: "발주 XXX개"
        ctx.font = '500 11px sans-serif';
        ctx.fillStyle = '#6B7280';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`발주 ${total.toLocaleString()}개`, centerX, centerY - 2);
        
        // 두 번째 줄: "입고 XX%"
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.fillText(`입고 ${rate}%`, centerX, centerY + 2);
        
        ctx.restore();
      }
    }]
  });
}

// ===== 차트 생성: 국가별 발주대비 입고 (세로 막대) =====
function createCountryBarChart(canvasId, countryData, selectedChannel, colors) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  // 국가별 데이터 추출
  const countries = ['한국', '중국', '베트남'];
  const totalData = countries.map(country => countryData[country]?.[selectedChannel] || 0);
  const completedData = countries.map(country => countryData[country]?.[`${selectedChannel}_completed`] || 0);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: countries,
      datasets: [
        {
          label: '총 발주량',
          data: totalData,
          backgroundColor: '#8B5CF6',  // 보라
          borderRadius: 6,
          barPercentage: 0.65
        },
        {
          label: '입고량',
          data: completedData,
          backgroundColor: '#10B981',  // 초록
          borderRadius: 6,
          barPercentage: 0.65
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          grid: { display: false },
          ticks: { 
            font: { size: 11, weight: '500' },
            color: '#374151'
          }
        },
        y: {
          beginAtZero: true,
          grid: { 
            color: '#E5E7EB',
            drawBorder: false
          },
          ticks: {
            font: { size: 10, weight: '500' },
            color: '#6B7280',
            callback: function(value) {
              return value.toLocaleString();
            },
            padding: 6
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 11, weight: '500' },
            boxWidth: 12,
            padding: 10,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: 12,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          cornerRadius: 6,
          displayColors: true,
          boxPadding: 4,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}개`;
            }
          }
        }
      }
    }
  });
}

// ===== 차트 생성: 채널별 발주대비 입고 (세로 막대) =====
function createChannelBarChart(canvasId, channelStats, colors) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['ELCANTO', 'IM'],
      datasets: [
        {
          label: '총 발주량',
          data: [channelStats.ELCANTO.total, channelStats.IM.total],
          backgroundColor: '#3B82F6',  // 파랑
          borderRadius: 4,
          barPercentage: 0.7
        },
        {
          label: '입고량',
          data: [channelStats.ELCANTO.completed, channelStats.IM.completed],
          backgroundColor: '#F97316',  // 주황
          borderRadius: 4,
          barPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: '500' } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#E5E7EB' },
          ticks: {
            font: { size: 10 },
            callback: function(value) {
              return value.toLocaleString();
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 10, weight: '500' },
            boxWidth: 12,
            padding: 8,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: 10,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}개`;
            }
          }
        }
      }
    }
  });
}

// ===== 차트 생성: 발주일별 입고현황 (누적 세로 막대) =====
function createDateBarChart(canvasId, orders, colors) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  // 발주일별 데이터 집계
  const dateData = {};
  orders.forEach(order => {
    if (!order.orderDate) return;
    const date = order.orderDate;
    
    if (!dateData[date]) {
      dateData[date] = { total: 0, completed: 0 };
    }
    
    dateData[date].total += order.qty || 0;
    
    // 입고 완료 여부 확인
    const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
    if (arrivalProcess?.actualDate) {
      dateData[date].completed += order.qty || 0;
    }
  });
  
  // 날짜순 정렬 (모든 날짜)
  const allSortedDates = Object.keys(dateData).sort();
  
  // 스크롤 상태 저장 (전역 변수 사용)
  if (!window.chartScrollState) {
    window.chartScrollState = {};
  }
  if (!window.chartScrollState[canvasId]) {
    window.chartScrollState[canvasId] = { startIndex: Math.max(0, allSortedDates.length - 6) };
  }
  
  const startIndex = window.chartScrollState[canvasId].startIndex;
  const visibleCount = 6;
  const sortedDates = allSortedDates.slice(startIndex, startIndex + visibleCount);
  
  const completedData = sortedDates.map(date => dateData[date].completed);
  const pendingData = sortedDates.map(date => dateData[date].total - dateData[date].completed);
  
  // 최대값 계산 (Y축 자동 조정)
  const maxTotal = Math.max(...sortedDates.map(date => dateData[date].total));
  const suggestedMax = Math.ceil(maxTotal * 1.2 / 1000) * 1000; // 20% 여유 + 1000 단위 반올림
  const yAxisMax = Math.max(suggestedMax, 1000); // 최소 1000
  
  // 달성률 계산
  const achievementRates = sortedDates.map(date => {
    const total = dateData[date].total;
    const completed = dateData[date].completed;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });
  
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedDates,
      datasets: [
        {
          label: '입고수량',
          data: completedData,
          backgroundColor: '#10B981',  // 초록
          borderRadius: 4,
          barPercentage: 0.7
        },
        {
          label: '미입고수량',
          data: pendingData,
          backgroundColor: '#CBD5E1',  // 회색
          borderRadius: 4,
          barPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { 
            font: { size: 11, weight: '500' },
            color: '#374151'
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          max: yAxisMax,
          grid: { 
            color: '#E5E7EB',
            drawBorder: false
          },
          ticks: {
            font: { size: 10, weight: '500' },
            color: '#6B7280',
            callback: function(value) {
              return value.toLocaleString();
            },
            padding: 6,
            stepSize: Math.max(Math.ceil(yAxisMax / 10 / 100) * 100, 100)
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 11, weight: '500' },
            boxWidth: 12,
            padding: 10,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: 14,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 11 },
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 6,
          callbacks: {
            title: function(context) {
              return `발주일자: ${context[0].label}`;
            },
            afterTitle: function(context) {
              const index = context[0].dataIndex;
              return '';
            },
            label: function(context) {
              const index = context.dataIndex;
              const completed = completedData[index];
              const pending = pendingData[index];
              const total = completed + pending;
              const rate = achievementRates[index];
              
              // 입고수량과 미입고수량 모두 동일한 툴팁 표시
              return [
                `입고수량: ${completed.toLocaleString()}개`,
                `미입고수량: ${pending.toLocaleString()}개`,
                `총발주수량: ${total.toLocaleString()}개`,
                `달성률: ${rate}%`
              ];
            },
            footer: function(context) {
              return '';
            }
          }
        }
      },
      onClick: function(event, elements) {
        if (elements && elements.length > 0) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const index = element.index;
          const date = sortedDates[index];
          const pending = pendingData[index];
          
          // 미입고수량 영역 클릭 시 모니터링 탭으로 이동
          if (datasetIndex === 1 && pending > 0) {
            // 전역 변수에 선택된 날짜 저장
            window.selectedOrderDate = date;
            
            // 모니터링 KPI 카드 클릭 이벤트 트리거
            const monitoringCard = document.querySelector('[data-kpi="pending"]');
            if (monitoringCard) {
              monitoringCard.click();
              
              // 약간의 지연 후 해당 날짜로 스크롤
              setTimeout(() => {
                const pendingTable = document.getElementById('pending-orders-table');
                if (pendingTable) {
                  pendingTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 300);
            }
          }
        }
      }
    }
  });
  
  // 네비게이션 버튼 추가
  addChartNavigation(canvasId, allSortedDates, dateData, colors);
}

// 차트 네비게이션 버튼 추가
function addChartNavigation(canvasId, allDates, dateData, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const container = canvas.closest('.bg-white');
  if (!container) return;
  
  // 기존 네비게이션 제거
  const existingNav = container.querySelector('.chart-navigation');
  if (existingNav) {
    existingNav.remove();
  }
  
  // 네비게이션이 필요한지 확인 (6개 초과 시)
  if (allDates.length <= 6) return;
  
  const state = window.chartScrollState[canvasId];
  const canGoPrev = state.startIndex > 0;
  const canGoNext = state.startIndex + 6 < allDates.length;
  
  // 네비게이션 HTML 생성
  const navHtml = `
    <div class="chart-navigation flex items-center justify-between mt-2 px-2">
      <button 
        class="chart-nav-prev px-3 py-1 text-xs rounded ${canGoPrev ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}"
        ${!canGoPrev ? 'disabled' : ''}
      >
        <i class="fas fa-chevron-left mr-1"></i> 이전
      </button>
      <span class="text-xs text-gray-600">
        ${state.startIndex + 1}-${Math.min(state.startIndex + 6, allDates.length)} / ${allDates.length}
      </span>
      <button 
        class="chart-nav-next px-3 py-1 text-xs rounded ${canGoNext ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}"
        ${!canGoNext ? 'disabled' : ''}
      >
        다음 <i class="fas fa-chevron-right ml-1"></i>
      </button>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', navHtml);
  
  // 이벤트 리스너 추가
  const prevBtn = container.querySelector('.chart-nav-prev');
  const nextBtn = container.querySelector('.chart-nav-next');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.startIndex > 0) {
        state.startIndex = Math.max(0, state.startIndex - 6);
        
        // 차트 찾기 및 재생성
        const orders = window.currentDashboardData?.orders || [];
        const channelFilter = window.currentChannelFilter;
        const filteredOrders = channelFilter && channelFilter !== '전체' 
          ? orders.filter(o => o.channel === channelFilter)
          : orders;
        
        // 기존 차트 제거
        const existingChart = Chart.getChart(canvasId);
        if (existingChart) {
          existingChart.destroy();
        }
        
        createDateBarChart(canvasId, filteredOrders, colors);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.startIndex + 6 < allDates.length) {
        state.startIndex = Math.min(allDates.length - 6, state.startIndex + 6);
        
        // 차트 찾기 및 재생성
        const orders = window.currentDashboardData?.orders || [];
        const channelFilter = window.currentChannelFilter;
        const filteredOrders = channelFilter && channelFilter !== '전체' 
          ? orders.filter(o => o.channel === channelFilter)
          : orders;
        
        // 기존 차트 제거
        const existingChart = Chart.getChart(canvasId);
        if (existingChart) {
          existingChart.destroy();
        }
        
        createDateBarChart(canvasId, filteredOrders, colors);
      }
    });
  }
}

// 지연 위험 발주 테이블
function renderPendingOrdersTable(delayedOrders) {
  const container = document.getElementById('pending-orders-table');
  
  // 정렬 상태 초기화
  if (!window.pendingTableSort) {
    window.pendingTableSort = { column: null, direction: null };
  }
  
  // 선택된 발주일자가 있으면 필터링
  let filteredOrders = delayedOrders;
  let filterMessage = '';
  
  if (window.selectedOrderDate) {
    filteredOrders = delayedOrders.filter(order => order.orderDate === window.selectedOrderDate);
    filterMessage = `<div class="mb-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
      <span class="text-sm text-blue-700">
        <i class="fas fa-filter mr-2"></i>
        발주일자 <strong>${window.selectedOrderDate}</strong> 필터 적용 중
      </span>
      <button onclick="window.selectedOrderDate = null; updateDashboard();" class="text-xs text-blue-600 hover:text-blue-800 underline">
        필터 해제
      </button>
    </div>`;
  }
  
  if (!filteredOrders || filteredOrders.length === 0) {
    container.innerHTML = filterMessage + `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-check-circle text-4xl mb-2 text-green-500"></i>
        <p>${window.selectedOrderDate ? '해당 날짜의 지연 위험 발주가 없습니다.' : '지연 위험 발주가 없습니다.'}</p>
      </div>
    `;
    return;
  }
  
  const today = new Date();
  const sortState = window.pendingTableSort;
  
  // 정렬 적용
  if (sortState.column && sortState.direction) {
    filteredOrders = [...filteredOrders].sort((a, b) => {
      let aVal, bVal;
      
      switch(sortState.column) {
        case 'orderDate':
          aVal = a.orderDate ? new Date(a.orderDate).getTime() : 0;
          bVal = b.orderDate ? new Date(b.orderDate).getTime() : 0;
          break;
        case 'style':
          aVal = (a.style || '').toLowerCase();
          bVal = (b.style || '').toLowerCase();
          break;
        case 'supplier':
          aVal = a.supplier || '';
          bVal = b.supplier || '';
          break;
        case 'requiredDelivery':
          aVal = a.requiredDelivery ? new Date(a.requiredDelivery).getTime() : 0;
          bVal = b.requiredDelivery ? new Date(b.requiredDelivery).getTime() : 0;
          break;
        case 'delayDays':
          aVal = a.requiredDelivery ? Math.floor((today - new Date(a.requiredDelivery)) / (1000 * 60 * 60 * 24)) : 0;
          bVal = b.requiredDelivery ? Math.floor((today - new Date(b.requiredDelivery)) / (1000 * 60 * 60 * 24)) : 0;
          break;
        default:
          return 0;
      }
      
      // 빈 값 처리
      if (!aVal && bVal) return 1;
      if (aVal && !bVal) return -1;
      if (!aVal && !bVal) return 0;
      
      // 정렬
      if (typeof aVal === 'string') {
        const result = aVal.localeCompare(bVal, 'ko');
        return sortState.direction === 'asc' ? result : -result;
      } else {
        const result = aVal - bVal;
        return sortState.direction === 'asc' ? result : -result;
      }
    });
  }
  
  const getSortIcon = (column) => {
    if (sortState.column !== column) return '<i class="fas fa-sort text-gray-400 ml-1"></i>';
    return sortState.direction === 'asc' 
      ? '<i class="fas fa-sort-up text-blue-600 ml-1"></i>'
      : '<i class="fas fa-sort-down text-blue-600 ml-1"></i>';
  };
  
  const getHeaderClass = (column) => {
    return sortState.column === column
      ? 'px-3 py-2 text-left font-semibold bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200'
      : 'px-3 py-2 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100';
  };
  
  container.innerHTML = filterMessage + `
    <div class="overflow-x-auto">
      <table class="min-w-full text-xs">
        <thead class="bg-gray-50">
          <tr>
            <th class="${getHeaderClass('orderDate')}" data-pending-sort="orderDate">발주일 ${getSortIcon('orderDate')}</th>
            <th class="${getHeaderClass('style')}" data-pending-sort="style">스타일 ${getSortIcon('style')}</th>
            <th class="${getHeaderClass('supplier')}" data-pending-sort="supplier">생산업체 ${getSortIcon('supplier')}</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-700">수량</th>
            <th class="${getHeaderClass('requiredDelivery')}" data-pending-sort="requiredDelivery">입고요구일 ${getSortIcon('requiredDelivery')}</th>
            <th class="${getHeaderClass('delayDays')}" data-pending-sort="delayDays">지연 일수 ${getSortIcon('delayDays')}</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-700">물류 입고예정일</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-700">현재 공정</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${filteredOrders.slice(0, 20).map(order => {
            const diffDays = order.requiredDelivery 
              ? Math.floor((today - new Date(order.requiredDelivery)) / (1000 * 60 * 60 * 24))
              : 0;
            
            // 공정 데이터 가져오기
            const productionProcesses = order.schedule?.production || [];
            const shippingProcesses = order.schedule?.shipping || [];
            
            // 물류입고예정일 계산
            const expectedArrival = calculateExpectedArrival(order, productionProcesses, shippingProcesses);
            
            // 현재 공정 찾기
            let currentProcess = '미착수';
            const allProcesses = [...productionProcesses, ...shippingProcesses];
            
            // actualDate가 있는 공정 중 마지막 공정 찾기
            const completedProcesses = allProcesses.filter(p => p && p.actualDate);
            if (completedProcesses.length > 0) {
              const lastCompleted = completedProcesses[completedProcesses.length - 1];
              currentProcess = lastCompleted.name || lastCompleted.processName || '진행중';
            }
            
            const severityColor = diffDays >= 15 ? 'bg-red-50' : diffDays >= 8 ? 'bg-orange-50' : 'bg-yellow-50';
            
            return `
              <tr class="${severityColor}">
                <td class="px-3 py-2 font-medium">${order.orderDate || '-'}</td>
                <td class="px-3 py-2">${order.style || '-'}</td>
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
                <td class="px-3 py-2">${expectedArrival.date || '-'}</td>
                <td class="px-3 py-2 text-blue-600 hover:text-blue-800 cursor-pointer hover:underline" 
                    onclick="showDashboardProcessDetail('${order.id}')">
                  ${currentProcess}
                </td>
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
  
  // 정렬 이벤트 리스너 추가
  setTimeout(() => {
    document.querySelectorAll('[data-pending-sort]').forEach(header => {
      header.addEventListener('click', () => {
        const column = header.dataset.pendingSort;
        
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
        
        renderPendingOrdersTable(dashboardData.delayedOrders);
      });
    });
  }, 0);
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

// 공정 상세 모달 표시
window.showDashboardProcessDetail = function(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  
  const productionProcesses = order.schedule?.production || [];
  const shippingProcesses = order.schedule?.shipping || [];
  
  renderDashboardProcessDetailModal(order, productionProcesses, shippingProcesses);
};

// 공정 상세 모달 렌더링
function renderDashboardProcessDetailModal(order, productionProcesses, shippingProcesses) {
  // 모달이 없으면 생성
  let modal = document.getElementById('dashboard-process-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'dashboard-process-modal';
    modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 hidden';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-800" id="dashboard-modal-title">공정별 목표대비 실적 현황</h3>
          <button onclick="closeDashboardProcessModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div id="dashboard-modal-content" class="p-6 overflow-y-auto">
          <!-- 동적으로 채워짐 -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  // 모달 내용 생성
  const productionData = PROCESS_CONFIG.production.map(config => ({
    ...config,
    process: productionProcesses.find(p => p.processKey === config.key)
  }));
  
  const shippingData = PROCESS_CONFIG.shipping.map(config => ({
    ...config,
    process: shippingProcesses.find(p => p.processKey === config.key)
  }));
  
  const modalContent = document.getElementById('dashboard-modal-content');
  modalContent.innerHTML = `
    <!-- 주문 정보 -->
    <div class="bg-blue-50 rounded-lg p-4 mb-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-gray-600">채널:</span>
          <span class="font-medium ml-2">${order.channel || '-'}</span>
        </div>
        <div>
          <span class="text-gray-600">스타일:</span>
          <span class="font-medium ml-2">${order.style || '-'}</span>
        </div>
        <div>
          <span class="text-gray-600">생산업체:</span>
          <span class="font-medium ml-2">${order.supplier || '-'}</span>
        </div>
        <div>
          <span class="text-gray-600">입고요구일:</span>
          <span class="font-medium ml-2">${order.requiredDelivery || '-'}</span>
        </div>
      </div>
    </div>
    
    <!-- 공정 테이블 -->
    <div class="bg-white border rounded-lg overflow-hidden">
      <table class="w-full text-xs border-collapse">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 border text-center" style="min-width: 120px;">구분</th>
            ${productionData.map(p => `<th class="px-3 py-2 border text-center" style="min-width: 100px;">${p.name}</th>`).join('')}
            ${shippingData.map(p => `<th class="px-3 py-2 border text-center" style="min-width: 100px;">${p.name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <!-- 목표일 -->
          <tr class="bg-gray-50">
            <td class="px-3 py-2 border font-semibold text-center">목표일</td>
            ${productionData.map(({ process }) => `
              <td class="px-3 py-2 border text-center text-gray-600">
                ${process?.targetDate || '-'}
              </td>
            `).join('')}
            ${shippingData.map(({ process }) => `
              <td class="px-3 py-2 border text-center text-gray-600">
                ${process?.targetDate || '-'}
              </td>
            `).join('')}
          </tr>
          
          <!-- 실적일 -->
          <tr class="bg-blue-50">
            <td class="px-3 py-2 border font-semibold text-center">실적일</td>
            ${productionData.map(({ process }) => `
              <td class="px-3 py-2 border text-center text-blue-600 font-medium">
                ${process?.actualDate || '-'}
              </td>
            `).join('')}
            ${shippingData.map(({ process }) => `
              <td class="px-3 py-2 border text-center text-blue-600 font-medium">
                ${process?.actualDate || '-'}
              </td>
            `).join('')}
          </tr>
          
          <!-- 차이일수 -->
          <tr>
            <td class="px-3 py-2 border font-semibold text-center">차이일수</td>
            ${productionData.map(({ process }) => {
              if (!process?.targetDate || !process?.actualDate) {
                return `<td class="px-3 py-2 border text-center text-gray-400">-</td>`;
              }
              const target = new Date(process.targetDate);
              const actual = new Date(process.actualDate);
              const diff = Math.floor((actual - target) / (1000 * 60 * 60 * 24));
              
              let className = 'px-3 py-2 border text-center font-bold';
              let content = '';
              
              if (diff > 0) {
                className += ' text-red-600';
                content = `+${diff}일`;
              } else if (diff < 0) {
                className += ' text-blue-600';
                content = `${diff}일`;
              } else {
                className += ' text-green-600';
                content = '0일';
              }
              
              return `<td class="${className}">${content}</td>`;
            }).join('')}
            ${shippingData.map(({ process }) => {
              if (!process?.targetDate || !process?.actualDate) {
                return `<td class="px-3 py-2 border text-center text-gray-400">-</td>`;
              }
              const target = new Date(process.targetDate);
              const actual = new Date(process.actualDate);
              const diff = Math.floor((actual - target) / (1000 * 60 * 60 * 24));
              
              let className = 'px-3 py-2 border text-center font-bold';
              let content = '';
              
              if (diff > 0) {
                className += ' text-red-600';
                content = `+${diff}일`;
              } else if (diff < 0) {
                className += ' text-blue-600';
                content = `${diff}일`;
              } else {
                className += ' text-green-600';
                content = '0일';
              }
              
              return `<td class="${className}">${content}</td>`;
            }).join('')}
          </tr>
          
          <!-- 증빙사진 -->
          <tr class="bg-yellow-50">
            <td class="px-3 py-2 border font-semibold text-center">증빙사진</td>
            ${productionData.map(({ process }) => `
              <td class="px-3 py-2 border text-center">
                ${process?.evidenceUrl || process?.photo ? `
                  <img src="${process.evidenceUrl || process.photo}" 
                       alt="증빙" 
                       class="h-16 w-auto mx-auto cursor-pointer hover:opacity-80 rounded"
                       onclick="openPhotoModal('${process.evidenceUrl || process.photo}')">
                ` : `<span class="text-gray-400 text-xs">-</span>`}
              </td>
            `).join('')}
            ${shippingData.map(({ process }) => `
              <td class="px-3 py-2 border text-center">
                ${process?.evidenceUrl || process?.photo ? `
                  <img src="${process.evidenceUrl || process.photo}" 
                       alt="증빙" 
                       class="h-16 w-auto mx-auto cursor-pointer hover:opacity-80 rounded"
                       onclick="openPhotoModal('${process.evidenceUrl || process.photo}')">
                ` : `<span class="text-gray-400 text-xs">-</span>`}
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
  
  // 모달 표시
  modal.classList.remove('hidden');
  
  // 배경 스크롤 방지
  document.body.style.overflow = 'hidden';
}

// 모달 닫기
window.closeDashboardProcessModal = function() {
  const modal = document.getElementById('dashboard-process-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

// 사진 확대 모달
window.openPhotoModal = function(photoUrl) {
  let photoModal = document.getElementById('photo-modal');
  if (!photoModal) {
    photoModal = document.createElement('div');
    photoModal.id = 'photo-modal';
    photoModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] hidden';
    photoModal.innerHTML = `
      <button onclick="closePhotoModal()" class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300">
        <i class="fas fa-times"></i>
      </button>
      <img id="photo-modal-img" src="" alt="증빙사진" class="max-w-[90%] max-h-[90vh] rounded-lg">
    `;
    photoModal.onclick = function(e) {
      if (e.target === photoModal) {
        closePhotoModal();
      }
    };
    document.body.appendChild(photoModal);
  }
  
  document.getElementById('photo-modal-img').src = photoUrl;
  photoModal.classList.remove('hidden');
};

window.closePhotoModal = function() {
  const photoModal = document.getElementById('photo-modal');
  if (photoModal) {
    photoModal.classList.add('hidden');
  }
};

// 유틸리티 함수
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
