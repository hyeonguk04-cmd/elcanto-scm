// 생산 목표일정 수립 (발주 관리) - 완전 개선 버전
import { getOrdersWithProcesses, addOrder, updateOrder, deleteOrder } from './firestore-service.js';
import { renderEmptyState, createProcessTableHeaders } from './ui-components.js';
import { UIUtils, ExcelUtils, DateUtils } from './utils.js';
import { SUPPLIERS_BY_COUNTRY, ROUTES_BY_COUNTRY, calculateProcessSchedule, SHIPPING_LEAD_TIMES } from './process-config.js';

// 드롭다운 기준 데이터 (향후 Firestore로 이관 가능)
const MASTER_DATA = {
  channels: ['온라인몰', '백화점', '면세점', '할인점', '전문점', '기타']
};

let orders = [];
let selectedOrderIds = new Set();
let originalOrders = {}; // 원본 데이터 저장 (변경 감지용)
let hasUnsavedChanges = false;

export async function renderOrderManagement(container) {
  try {
    UIUtils.showLoading();
    orders = await getOrdersWithProcesses();
    
    // 원본 데이터 저장
    orders.forEach(order => {
      originalOrders[order.id] = JSON.stringify(order);
    });
    
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center flex-wrap gap-4">
          <h2 class="text-2xl font-bold text-gray-800">생산 목표일정 수립</h2>
          <div class="space-x-2">
            <button id="template-btn" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
              <i class="fas fa-file-download mr-2"></i>템플릿 다운로드
            </button>
            <button id="upload-btn" class="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700">
              <i class="fas fa-file-excel mr-2"></i>엑셀 업로드
            </button>
            <input type="file" id="excel-uploader" accept=".xlsx,.xls" class="hidden">
            <button id="add-row-btn" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              <i class="fas fa-plus mr-2"></i>행 추가
            </button>
            <button id="save-btn" class="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 disabled:opacity-50" disabled>
              <i class="fas fa-save mr-2"></i>저장
            </button>
            <button id="delete-btn" class="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 disabled:opacity-50" disabled>
              <i class="fas fa-trash mr-2"></i>삭제
            </button>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div id="orders-table"></div>
        </div>
      </div>
    `;
    
    renderOrdersTable();
    setupEventListeners();
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Order management render error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.', 'fa-exclamation-circle');
  }
}

function renderOrdersTable() {
  const tableContainer = document.getElementById('orders-table');
  const headers = createProcessTableHeaders();
  
  if (orders.length === 0) {
    tableContainer.innerHTML = renderEmptyState('발주 데이터가 없습니다. 엑셀 파일을 업로드하거나 직접 추가하세요.', 'fa-clipboard-list');
    return;
  }
  
  tableContainer.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-xs border-collapse">
        <thead class="bg-gray-50 text-xs uppercase sticky top-0">
          <tr>
            <th rowspan="2" class="px-2 py-2 border"><input type="checkbox" id="select-all"></th>
            <th rowspan="2" class="px-2 py-2 border">번호</th>
            <th colspan="9" class="px-2 py-2 border bg-blue-100">발주 정보</th>
            <th colspan="${headers.production.length}" class="px-2 py-2 border bg-green-100">생산 목표일정</th>
            <th colspan="${headers.shipping.length + 2}" class="px-2 py-2 border bg-yellow-100">운송 목표일정</th>
            <th rowspan="2" class="px-2 py-2 border">입고기준<br>예상차이</th>
            <th rowspan="2" class="px-2 py-2 border">비고</th>
          </tr>
          <tr>
            <th class="px-2 py-2 border">채널</th>
            <th class="px-2 py-2 border">스타일</th>
            <th class="px-2 py-2 border">색상</th>
            <th class="px-2 py-2 border">사이즈</th>
            <th class="px-2 py-2 border">수량</th>
            <th class="px-2 py-2 border">국가</th>
            <th class="px-2 py-2 border">생산업체</th>
            <th class="px-2 py-2 border">발주일</th>
            <th class="px-2 py-2 border">입고요구일</th>
            ${headers.production.map(h => `<th class="px-2 py-2 border">${h.name}</th>`).join('')}
            <th class="px-2 py-2 border">선적-도착항</th>
            ${headers.shipping.map(h => `<th class="px-2 py-2 border">${h.name}</th>`).join('')}
            <th class="px-2 py-2 border">물류입고<br>예정일</th>
          </tr>
        </thead>
        <tbody id="orders-tbody">
          ${orders.map((order, index) => renderOrderRow(order, index + 1, headers)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderOrderRow(order, rowNum, headers) {
  // 물류입고 예정일 (마지막 공정의 목표일)
  const logisticsArrival = order.schedule.shipping[order.schedule.shipping.length - 1]?.targetDate || '-';
  
  // 입고기준 예상차이 계산 (양수면 빨강 - 지연)
  const delayDays = logisticsArrival !== '-' ? DateUtils.diffInDays(order.requiredDelivery, logisticsArrival) : null;
  const delayClass = delayDays > 0 ? 'bg-red-600 text-white font-bold' : '';
  const delayText = delayDays !== null ? (delayDays > 0 ? `+${delayDays}` : delayDays) : '-';
  
  return `
    <tr class="border-b hover:bg-gray-50" data-order-id="${order.id}">
      <td class="px-2 py-2 border text-center">
        <input type="checkbox" class="order-checkbox" value="${order.id}">
      </td>
      <td class="px-2 py-2 border text-center">${rowNum}</td>
      
      <!-- 채널 (드롭다운) -->
      <td class="px-2 py-2 border">
        <select class="editable-field w-full px-1 py-1 border border-gray-300 rounded" 
                data-order-id="${order.id}" data-field="channel">
          ${MASTER_DATA.channels.map(ch => 
            `<option value="${ch}" ${order.channel === ch ? 'selected' : ''}>${ch}</option>`
          ).join('')}
        </select>
      </td>
      
      <!-- 스타일 (직접입력 - 정확히 10자리) -->
      <td class="px-2 py-2 border" style="min-width: 120px;">
        <input type="text" class="editable-field style-input w-full px-1 py-1 border border-gray-300 rounded text-xs" 
               data-order-id="${order.id}" data-field="style" value="${order.style || ''}" 
               maxlength="10" minlength="10" pattern=".{10}" 
               placeholder="10자리">
      </td>
      
      <!-- 색상 (직접입력) -->
      <td class="px-2 py-2 border" style="min-width: 80px;">
        <input type="text" class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-xs" 
               data-order-id="${order.id}" data-field="color" value="${order.color || ''}" 
               placeholder="색상">
      </td>
      
      <!-- 사이즈 (직접입력) -->
      <td class="px-2 py-2 border" style="min-width: 70px;">
        <input type="text" class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-xs" 
               data-order-id="${order.id}" data-field="size" value="${order.size || ''}" 
               placeholder="사이즈">
      </td>
      
      <!-- 수량 (직접입력) -->
      <td class="px-2 py-2 border" style="min-width: 80px;">
        <input type="number" class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-right text-xs" 
               data-order-id="${order.id}" data-field="qty" value="${order.qty || 0}">
      </td>
      
      <!-- 국가 (드롭다운) -->
      <td class="px-2 py-2 border" style="min-width: 80px;">
        <select class="editable-field country-select w-full px-1 py-1 border border-gray-300 rounded text-xs" 
                data-order-id="${order.id}" data-field="country">
          ${Object.keys(SUPPLIERS_BY_COUNTRY).map(country => 
            `<option value="${country}" ${order.country === country ? 'selected' : ''}>${country}</option>`
          ).join('')}
        </select>
      </td>
      
      <!-- 생산업체 (드롭다운) -->
      <td class="px-2 py-2 border" style="min-width: 100px;">
        <select class="editable-field supplier-select w-full px-1 py-1 border border-gray-300 rounded text-xs" 
                data-order-id="${order.id}" data-field="supplier" data-country="${order.country}">
          ${(SUPPLIERS_BY_COUNTRY[order.country] || []).map(sup => 
            `<option value="${sup}" ${order.supplier === sup ? 'selected' : ''}>${sup}</option>`
          ).join('')}
        </select>
      </td>
      
      <!-- 발주일 (날짜 편집 가능) -->
      <td class="px-2 py-2 border" style="min-width: 110px;">
        <input type="date" class="editable-field date-input w-full px-1 py-1 border border-gray-300 rounded text-xs" 
               data-order-id="${order.id}" data-field="orderDate" value="${order.orderDate}">
      </td>
      
      <!-- 입고요구일 (날짜 편집 가능) -->
      <td class="px-2 py-2 border" style="min-width: 110px;">
        <input type="date" class="editable-field w-full px-1 py-1 border border-gray-300 rounded text-xs" 
               data-order-id="${order.id}" data-field="requiredDelivery" value="${order.requiredDelivery}">
      </td>
      
      <!-- 생산 공정 목표일 (날짜 편집 가능) -->
      ${headers.production.map(h => {
        const process = order.schedule.production.find(p => p.processKey === h.key);
        const processDate = process?.targetDate || '';
        return `<td class="px-2 py-2 border" style="min-width: 110px;">
          <input type="date" class="editable-field process-date-input w-full px-1 py-1 border border-gray-300 rounded text-xs" 
                 data-order-id="${order.id}" 
                 data-process-category="production" 
                 data-process-key="${h.key}" 
                 value="${processDate}">
        </td>`;
      }).join('')}
      
      <!-- 선적-도착항 (드롭다운) -->
      <td class="px-2 py-2 border" style="min-width: 120px;">
        <select class="editable-field route-select w-full px-1 py-1 border border-gray-300 rounded text-xs" 
                data-order-id="${order.id}" data-field="route" data-country="${order.country}">
          ${(ROUTES_BY_COUNTRY[order.country] || []).map(route => 
            `<option value="${route}" ${order.route === route ? 'selected' : ''}>${route}</option>`
          ).join('')}
        </select>
      </td>
      
      <!-- 운송 공정 목표일 (날짜 편집 가능) -->
      ${headers.shipping.map(h => {
        const process = order.schedule.shipping.find(p => p.processKey === h.key);
        const processDate = process?.targetDate || '';
        return `<td class="px-2 py-2 border" style="min-width: 110px;">
          <input type="date" class="editable-field process-date-input w-full px-1 py-1 border border-gray-300 rounded text-xs" 
                 data-order-id="${order.id}" 
                 data-process-category="shipping" 
                 data-process-key="${h.key}" 
                 value="${processDate}">
        </td>`;
      }).join('')}
      
      <!-- 물류입고 예정일 (자동 계산) -->
      <td class="px-2 py-2 border text-center text-xs font-bold" style="min-width: 110px;">${logisticsArrival}</td>
      
      <!-- 입고기준 예상차이 -->
      <td class="px-2 py-2 border text-center ${delayClass}">${delayText}</td>
      
      <!-- 비고 -->
      <td class="px-2 py-2 border">
        <input type="text" class="editable-field w-full px-1 py-1 border-0 bg-transparent" 
               data-order-id="${order.id}" data-field="notes" value="${order.notes || ''}" 
               placeholder="비고 입력">
      </td>
    </tr>
  `;
}

function setupEventListeners() {
  // Select all checkbox
  document.getElementById('select-all')?.addEventListener('change', (e) => {
    document.querySelectorAll('.order-checkbox').forEach(cb => {
      cb.checked = e.target.checked;
      if (e.target.checked) {
        selectedOrderIds.add(cb.value);
      } else {
        selectedOrderIds.delete(cb.value);
      }
    });
    updateDeleteButton();
  });
  
  // Individual checkboxes
  document.querySelectorAll('.order-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedOrderIds.add(e.target.value);
      } else {
        selectedOrderIds.delete(e.target.value);
      }
      updateDeleteButton();
    });
  });
  
  // Editable fields - 변경 감지 및 자동 저장 준비
  document.querySelectorAll('.editable-field').forEach(field => {
    // Country 변경 시 Supplier와 Route 업데이트
    if (field.classList.contains('country-select')) {
      field.addEventListener('change', (e) => {
        handleCountryChange(e.target);
        markAsChanged(e.target.dataset.orderId);
      });
    } 
    // Route 변경 시 일정 재계산
    else if (field.classList.contains('route-select')) {
      field.addEventListener('change', (e) => {
        handleRouteChangeInline(e.target);
      });
    }
    // 스타일 필드 - 10자리 검증
    else if (field.classList.contains('style-input')) {
      field.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value.length > 10) {
          e.target.value = value.substring(0, 10);
        }
      });
      
      field.addEventListener('blur', (e) => {
        const value = e.target.value;
        if (value.length > 0 && value.length !== 10) {
          e.target.classList.add('border-red-500', 'bg-red-50');
          UIUtils.showAlert('스타일은 정확히 10자리여야 합니다.', 'error');
          e.target.focus();
        } else {
          e.target.classList.remove('border-red-500', 'bg-red-50');
          if (value.length === 10) {
            markAsChanged(e.target.dataset.orderId);
          }
        }
      });
    }
    // 발주일 변경 시 공정 일정 재계산
    else if (field.classList.contains('date-input')) {
      field.addEventListener('change', async (e) => {
        const orderId = e.target.dataset.orderId;
        const newOrderDate = e.target.value;
        await handleOrderDateChange(orderId, newOrderDate);
      });
    }
    // 공정별 날짜 직접 수정
    else if (field.classList.contains('process-date-input')) {
      field.addEventListener('change', (e) => {
        const orderId = e.target.dataset.orderId;
        const category = e.target.dataset.processCategory;
        const processKey = e.target.dataset.processKey;
        const newDate = e.target.value;
        handleProcessDateChange(orderId, category, processKey, newDate);
      });
    }
    // 일반 필드 변경
    else {
      field.addEventListener('change', (e) => {
        markAsChanged(e.target.dataset.orderId);
      });
    }
  });
  
  // Buttons
  document.getElementById('template-btn')?.addEventListener('click', downloadTemplate);
  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('excel-uploader').click();
  });
  document.getElementById('add-row-btn')?.addEventListener('click', addNewRow);
  document.getElementById('save-btn')?.addEventListener('click', saveAllChanges);
  document.getElementById('delete-btn')?.addEventListener('click', deleteSelectedOrders);
  
  // Excel uploader
  document.getElementById('excel-uploader')?.addEventListener('change', handleExcelUpload);
}

function handleCountryChange(countrySelect) {
  const orderId = countrySelect.dataset.orderId;
  const newCountry = countrySelect.value;
  const row = countrySelect.closest('tr');
  
  // 해당 행의 supplier select 업데이트
  const supplierSelect = row.querySelector('.supplier-select');
  if (supplierSelect) {
    const suppliers = SUPPLIERS_BY_COUNTRY[newCountry] || [];
    supplierSelect.innerHTML = suppliers.map(sup => 
      `<option value="${sup}">${sup}</option>`
    ).join('');
    supplierSelect.dataset.country = newCountry;
  }
  
  // 해당 행의 route select 업데이트
  const routeSelect = row.querySelector('.route-select');
  if (routeSelect) {
    const routes = ROUTES_BY_COUNTRY[newCountry] || [];
    routeSelect.innerHTML = routes.map(route => 
      `<option value="${route}">${route}</option>`
    ).join('');
    routeSelect.dataset.country = newCountry;
  }
}

async function handleRouteChangeInline(routeSelect) {
  const orderId = routeSelect.dataset.orderId;
  const newRoute = routeSelect.value;
  
  try {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // 새로운 일정 재계산
    const newSchedule = calculateProcessSchedule(order.orderDate, null, newRoute);
    
    // 주문 업데이트
    await updateOrder(orderId, {
      route: newRoute,
      schedule: newSchedule
    });
    
    // 테이블 새로고침
    orders = await getOrdersWithProcesses();
    renderOrdersTable();
    setupEventListeners();
    
    UIUtils.showAlert('선적경로가 변경되고 일정이 재계산되었습니다.', 'success');
  } catch (error) {
    console.error('Route change error:', error);
    UIUtils.showAlert('선적경로 변경 실패', 'error');
  }
}

async function handleOrderDateChange(orderId, newOrderDate) {
  try {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // 발주일 변경 시 전체 공정 일정 재계산
    const newSchedule = calculateProcessSchedule(newOrderDate, null, order.route);
    
    // 주문 업데이트
    await updateOrder(orderId, {
      orderDate: newOrderDate,
      schedule: newSchedule
    });
    
    // 테이블 새로고침
    orders = await getOrdersWithProcesses();
    renderOrdersTable();
    setupEventListeners();
    
    UIUtils.showAlert('발주일이 변경되고 전체 일정이 재계산되었습니다.', 'success');
  } catch (error) {
    console.error('Order date change error:', error);
    UIUtils.showAlert('발주일 변경 실패', 'error');
  }
}

function handleProcessDateChange(orderId, category, processKey, newDate) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  // 해당 공정의 날짜만 수정
  const processArray = category === 'production' ? order.schedule.production : order.schedule.shipping;
  const process = processArray.find(p => p.processKey === processKey);
  
  if (process) {
    process.targetDate = newDate;
    markAsChanged(orderId);
  }
}

function markAsChanged(orderId) {
  hasUnsavedChanges = true;
  updateSaveButton(true);
}

function updateDeleteButton() {
  const deleteBtn = document.getElementById('delete-btn');
  if (deleteBtn) {
    const hasSelected = selectedOrderIds.size > 0;
    deleteBtn.disabled = !hasSelected;
    
    // 색상 변경: 체크 있으면 빨강, 없으면 회색
    if (hasSelected) {
      deleteBtn.classList.remove('bg-gray-400', 'hover:bg-gray-500');
      deleteBtn.classList.add('bg-red-600', 'hover:bg-red-700');
    } else {
      deleteBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
      deleteBtn.classList.add('bg-gray-400', 'hover:bg-gray-500');
    }
  }
}

function updateSaveButton(hasChanges) {
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.disabled = !hasChanges;
    
    // 색상 변경: 변경사항 있으면 파랑, 없으면 회색
    if (hasChanges) {
      saveBtn.classList.remove('bg-gray-400', 'hover:bg-gray-500');
      saveBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    } else {
      saveBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      saveBtn.classList.add('bg-gray-400', 'hover:bg-gray-500');
    }
  }
  hasUnsavedChanges = hasChanges;
}

function addNewRow() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  
  const headers = createProcessTableHeaders();
  const newRowNum = orders.length + 1;
  
  // 임시 ID 생성
  const tempId = 'new_' + Date.now();
  
  // 빈 주문 객체 생성
  const newOrder = {
    id: tempId,
    channel: MASTER_DATA.channels[0],
    style: '',
    color: '',
    size: '',
    qty: 0,
    country: Object.keys(SUPPLIERS_BY_COUNTRY)[0],
    supplier: SUPPLIERS_BY_COUNTRY[Object.keys(SUPPLIERS_BY_COUNTRY)[0]][0],
    orderDate: DateUtils.formatDate(new Date()),
    requiredDelivery: DateUtils.formatDate(new Date()),
    route: ROUTES_BY_COUNTRY[Object.keys(SUPPLIERS_BY_COUNTRY)[0]][0],
    schedule: { production: [], shipping: [] },
    notes: ''
  };
  
  // 기본 일정 계산
  newOrder.schedule = calculateProcessSchedule(newOrder.orderDate, null, newOrder.route);
  
  // 테이블에 새 행 추가
  const newRowHtml = renderOrderRow(newOrder, newRowNum, headers);
  tbody.insertAdjacentHTML('beforeend', newRowHtml);
  
  // 로컬 orders 배열에도 추가
  orders.push(newOrder);
  
  // 이벤트 리스너 재설정
  setupEventListeners();
  
  // 저장 버튼 활성화
  markAsChanged(tempId);
  
  // 새로 추가된 행으로 스크롤
  const newRow = tbody.querySelector(`tr[data-order-id="${tempId}"]`);
  if (newRow) {
    newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    newRow.classList.add('bg-yellow-50');
    setTimeout(() => newRow.classList.remove('bg-yellow-50'), 2000);
  }
  
  UIUtils.showAlert('새 행이 추가되었습니다. 정보를 입력하고 저장 버튼을 누르세요.', 'info');
}

async function saveAllChanges() {
  if (!hasUnsavedChanges) return;
  
  try {
    UIUtils.showLoading();
    
    let savedCount = 0;
    let errorCount = 0;
    
    for (const order of orders) {
      try {
        // 페이지의 입력값 수집
        const row = document.querySelector(`tr[data-order-id="${order.id}"]`);
        if (!row) continue;
        
        const updatedData = {
          channel: row.querySelector('[data-field="channel"]')?.value || order.channel,
          style: row.querySelector('[data-field="style"]')?.value || order.style,
          color: row.querySelector('[data-field="color"]')?.value || order.color,
          size: row.querySelector('[data-field="size"]')?.value || order.size,
          qty: parseInt(row.querySelector('[data-field="qty"]')?.value) || order.qty,
          country: row.querySelector('[data-field="country"]')?.value || order.country,
          supplier: row.querySelector('[data-field="supplier"]')?.value || order.supplier,
          route: row.querySelector('[data-field="route"]')?.value || order.route,
          notes: row.querySelector('[data-field="notes"]')?.value || '',
          orderDate: order.orderDate,
          requiredDelivery: order.requiredDelivery,
          schedule: order.schedule
        };
        
        // 새로운 행인 경우 (ID가 new_로 시작)
        if (order.id.startsWith('new_')) {
          await addOrder(updatedData);
        } else {
          // 기존 데이터와 비교하여 변경된 경우에만 업데이트
          const originalData = originalOrders[order.id];
          if (originalData !== JSON.stringify(updatedData)) {
            await updateOrder(order.id, updatedData);
          }
        }
        
        savedCount++;
      } catch (error) {
        console.error(`Save error for order ${order.id}:`, error);
        errorCount++;
      }
    }
    
    // 데이터 새로고침
    orders = await getOrdersWithProcesses();
    orders.forEach(order => {
      originalOrders[order.id] = JSON.stringify(order);
    });
    
    renderOrdersTable();
    setupEventListeners();
    
    updateSaveButton(false);
    UIUtils.hideLoading();
    
    if (errorCount === 0) {
      UIUtils.showAlert(`${savedCount}건의 변경사항이 저장되었습니다.`, 'success');
    } else {
      UIUtils.showAlert(`저장 완료: ${savedCount}건, 실패: ${errorCount}건`, 'warning');
    }
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Save all changes error:', error);
    UIUtils.showAlert('저장 중 오류가 발생했습니다.', 'error');
  }
}

function downloadTemplate() {
  const headers = createProcessTableHeaders();
  const basicColumns = [
    '채널', '스타일', '색상코드', '사이즈', '수량',
    '국가', '생산업체', '발주일', '입고요구일', '선적경로'
  ];
  const productionColumns = headers.production.map(h => h.name);
  const shippingColumns = headers.shipping.map(h => h.name);
  const allColumns = [...basicColumns, ...productionColumns, ...shippingColumns];
  
  ExcelUtils.downloadTemplate(allColumns, 'elcanto_order_template.xlsx');
  UIUtils.showAlert('템플릿 다운로드 완료! 발주일을 입력하면 공정별 목표일자가 자동 계산됩니다.', 'success');
}

async function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    UIUtils.showLoading();
    const data = await ExcelUtils.readExcel(file);
    
    if (!data || data.length === 0) {
      throw new Error('엑셀 파일이 비어있습니다.');
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row['발주일'] || !row['입고요구일']) {
          throw new Error('발주일과 입고요구일은 필수입니다.');
        }
        
        const route = row['선적경로'] || null;
        const schedule = calculateProcessSchedule(
          DateUtils.excelDateToString(row['발주일']),
          null,
          route
        );
        
        const orderData = {
          channel: row['채널'] || '',
          style: row['스타일'] || '',
          color: row['색상코드'] || '',
          size: row['사이즈'] || '',
          qty: row['수량'] || 0,
          country: row['국가'] || '',
          supplier: row['생산업체'] || '',
          orderDate: DateUtils.excelDateToString(row['발주일']),
          requiredDelivery: DateUtils.excelDateToString(row['입고요구일']),
          route: route,
          schedule: schedule,
          notes: '',
          createdAt: new Date().toISOString()
        };
        
        await addOrder(orderData);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`행 ${i + 2}: ${error.message}`);
        console.error(`Row ${i + 2} error:`, error);
      }
    }
    
    if (errorCount === 0) {
      UIUtils.showAlert(`${successCount}건의 발주가 성공적으로 등록되었습니다!`, 'success');
    } else {
      const message = `성공: ${successCount}건, 실패: ${errorCount}건\n\n실패 내역:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`;
      UIUtils.showAlert(message, 'warning');
    }
    
    orders = await getOrdersWithProcesses();
    orders.forEach(order => {
      originalOrders[order.id] = JSON.stringify(order);
    });
    renderOrdersTable();
    setupEventListeners();
    
    UIUtils.hideLoading();
    e.target.value = '';
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Excel upload error:', error);
    UIUtils.showAlert(`엑셀 업로드 실패: ${error.message}`, 'error');
    e.target.value = '';
  }
}

async function deleteSelectedOrders() {
  if (selectedOrderIds.size === 0) return;
  
  const confirmed = await UIUtils.confirm(`선택한 ${selectedOrderIds.size}건을 삭제하시겠습니까?`);
  if (!confirmed) return;
  
  try {
    UIUtils.showLoading();
    
    for (const orderId of selectedOrderIds) {
      // 새로 추가된 행(아직 저장 안 됨)은 로컬에서만 삭제
      if (orderId.startsWith('new_')) {
        orders = orders.filter(o => o.id !== orderId);
      } else {
        await deleteOrder(orderId);
      }
    }
    
    selectedOrderIds.clear();
    orders = await getOrdersWithProcesses();
    orders.forEach(order => {
      originalOrders[order.id] = JSON.stringify(order);
    });
    renderOrdersTable();
    setupEventListeners();
    
    UIUtils.hideLoading();
    UIUtils.showAlert('삭제 완료', 'success');
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Delete error:', error);
    UIUtils.showAlert('삭제 실패', 'error');
  }
}

export default { renderOrderManagement };
