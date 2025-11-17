// UI 컴포넌트 생성 함수들
import { UIUtils, DateUtils, FormatUtils } from './utils.js';
import { getAllProcesses } from './process-config.js';

// 사이드바 렌더링
export function renderSidebar(role) {
  const sidebar = document.getElementById('sidebar-container');
  
  const menuItems = role === 'admin' ? [
    { id: 'dashboard', icon: 'fa-chart-line', text: '종합 현황' },
    { id: 'order-management', icon: 'fa-clipboard-list', text: '생산 목표일정 수립' },
    { id: 'analytics', icon: 'fa-chart-bar', text: '공정 입고진척 현황' },
    { id: 'weekly-report', icon: 'fa-calendar-week', text: '주간 리포트' },
    { id: 'manufacturer-management', icon: 'fa-industry', text: '생산업체 관리' },
    { id: 'user-management', icon: 'fa-users', text: '사용자 관리' }
  ] : [
    { id: 'supplier-dashboard', icon: 'fa-tachometer-alt', text: '내 대시보드' },
    { id: 'supplier-orders', icon: 'fa-tasks', text: '실적 입력' }
  ];
  
  sidebar.innerHTML = `
    <div class="space-y-2">
      ${menuItems.map(item => `
        <div class="sidebar-btn" data-view="${item.id}">
          <i class="fas ${item.icon} w-5"></i>
          <span>${item.text}</span>
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
  
  // 생산 공정과 운송 공정을 명확히 구분
  const productionKeys = ['material_upper', 'material_sole', 'hando_cfm', 'cutting', 'upper_making', 'assembly', 'self_inspection', 'factory_shipment'];
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
  renderStatCard
};
