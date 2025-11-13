// 생산 목표일정 수립 (발주 관리) - 완전 개선 버전
import { getOrdersWithProcesses, addOrder, updateOrder, deleteOrder } from './firestore-service.js';
import { renderEmptyState, createProcessTableHeaders } from './ui-components.js';
import { UIUtils, ExcelUtils, DateUtils } from './utils.js';
import { SUPPLIERS_BY_COUNTRY, ROUTES_BY_COUNTRY, calculateProcessSchedule, SHIPPING_LEAD_TIMES } from './process-config.js';

let orders = [];
let selectedOrderIds = new Set();
let editingOrderId = null;
let hasUnsavedChanges = false;

export async function renderOrderManagement(container) {
  try {
    UIUtils.showLoading();
    orders = await getOrdersWithProcesses();
    
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
            <button id="save-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50" disabled>
              <i class="fas fa-save mr-2"></i>저장
            </button>
            <button id="delete-btn" class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50" disabled>
              <i class="fas fa-trash mr-2"></i>삭제
            </button>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div id="orders-table"></div>
        </div>
      </div>

      <!-- 행 추가 모달 -->
      <div id="add-order-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">발주 정보 입력</h3>
            <button id="close-modal-btn" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <form id="add-order-form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">채널 *</label>
                <input type="text" name="channel" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">스타일 *</label>
                <input type="text" name="style" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">색상코드 *</label>
                <input type="text" name="color" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">수량 *</label>
                <input type="number" name="qty" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">국가 *</label>
                <select name="country" required class="w-full px-3 py-2 border border-gray-300 rounded-md" id="country-select">
                  <option value="">선택하세요</option>
                  <option value="중국">중국</option>
                  <option value="베트남">베트남</option>
                  <option value="인도">인도</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">생산업체 *</label>
                <select name="supplier" required class="w-full px-3 py-2 border border-gray-300 rounded-md" id="supplier-select">
                  <option value="">선택하세요</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">발주일 *</label>
                <input type="date" name="orderDate" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">입고요구일 *</label>
                <input type="date" name="requiredDelivery" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">선적경로 *</label>
                <select name="route" required class="w-full px-3 py-2 border border-gray-300 rounded-md" id="route-select">
                  <option value="">선택하세요</option>
                </select>
              </div>
            </div>
            
            <div class="flex justify-end space-x-2 mt-6">
              <button type="button" id="cancel-modal-btn" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                취소
              </button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                저장
              </button>
            </div>
          </form>
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
            <th rowspan="3" class="px-2 py-2 border"><input type="checkbox" id="select-all"></th>
            <th rowspan="3" class="px-2 py-2 border">번호</th>
            <th colspan="8" class="px-2 py-2 border bg-blue-100">발주 정보</th>
            <th colspan="${headers.production.length}" class="px-2 py-2 border bg-green-100">생산 목표일정 일정</th>
            <th colspan="${headers.shipping.length + 2}" class="px-2 py-2 border bg-yellow-100">운송 목표일정 일정</th>
            <th rowspan="3" class="px-2 py-2 border">입고기준<br>예상차이</th>
            <th rowspan="3" class="px-2 py-2 border">비고</th>
            <th rowspan="3" class="px-2 py-2 border">수정</th>
            <th rowspan="3" class="px-2 py-2 border">삭제</th>
          </tr>
          <tr>
            <th class="px-2 py-2 border">채널</th>
            <th class="px-2 py-2 border">스타일</th>
            <th class="px-2 py-2 border">색상</th>
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
          <tr>
            <th class="px-1 py-1 border text-[10px]">Channel</th>
            <th class="px-1 py-1 border text-[10px]">Style</th>
            <th class="px-1 py-1 border text-[10px]">Color</th>
            <th class="px-1 py-1 border text-[10px]">Qty</th>
            <th class="px-1 py-1 border text-[10px]">Country</th>
            <th class="px-1 py-1 border text-[10px]">Supplier</th>
            <th class="px-1 py-1 border text-[10px]">Order Date</th>
            <th class="px-1 py-1 border text-[10px]">Required Delivery</th>
            ${headers.production.map(h => `<th class="px-1 py-1 border text-[10px]">${h.name_en}</th>`).join('')}
            <th class="px-1 py-1 border text-[10px]">Route</th>
            ${headers.shipping.map(h => `<th class="px-1 py-1 border text-[10px]">${h.name_en}</th>`).join('')}
            <th class="px-1 py-1 border text-[10px]">Logistics Arrival</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((order, index) => renderOrderRow(order, index + 1, headers)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderOrderRow(order, rowNum, headers) {
  // 물류입고 예정일 (마지막 공정의 목표일)
  const logisticsArrival = order.schedule.shipping[order.schedule.shipping.length - 1]?.targetDate || '-';
  
  // 입고기준 예상차이 계산
  const delayDays = logisticsArrival !== '-' ? DateUtils.diffInDays(order.requiredDelivery, logisticsArrival) : null;
  const delayClass = delayDays < 0 ? 'bg-red-600 text-white font-bold' : '';
  const delayText = delayDays !== null ? (delayDays > 0 ? `+${delayDays}` : delayDays) : '-';
  
  return `
    <tr class="border-b hover:bg-gray-50" data-order-id="${order.id}">
      <td class="px-2 py-2 border text-center"><input type="checkbox" class="order-checkbox" value="${order.id}"></td>
      <td class="px-2 py-2 border text-center">${rowNum}</td>
      <td class="px-2 py-2 border">${order.channel}</td>
      <td class="px-2 py-2 border">${order.style}</td>
      <td class="px-2 py-2 border">${order.color}</td>
      <td class="px-2 py-2 border text-right">${order.qty?.toLocaleString()}</td>
      <td class="px-2 py-2 border">${order.country}</td>
      <td class="px-2 py-2 border">${order.supplier}</td>
      <td class="px-2 py-2 border">${order.orderDate}</td>
      <td class="px-2 py-2 border">${order.requiredDelivery}</td>
      ${headers.production.map(h => {
        const process = order.schedule.production.find(p => p.processKey === h.key);
        return `<td class="px-2 py-2 border">${process?.targetDate || '-'}</td>`;
      }).join('')}
      <td class="px-2 py-2 border">
        <select class="route-select w-full px-1 py-1 border-0 bg-transparent" data-order-id="${order.id}">
          ${(ROUTES_BY_COUNTRY[order.country] || []).map(route => 
            `<option value="${route}" ${order.route === route ? 'selected' : ''}>${route}</option>`
          ).join('')}
        </select>
      </td>
      ${headers.shipping.map(h => {
        const process = order.schedule.shipping.find(p => p.processKey === h.key);
        return `<td class="px-2 py-2 border">${process?.targetDate || '-'}</td>`;
      }).join('')}
      <td class="px-2 py-2 border">${logisticsArrival}</td>
      <td class="px-2 py-2 border text-center ${delayClass}">${delayText}</td>
      <td class="px-2 py-2 border"></td>
      <td class="px-2 py-2 border text-center">
        <button class="edit-order-btn text-blue-600 hover:text-blue-800" data-order-id="${order.id}">
          <i class="fas fa-edit"></i>
        </button>
      </td>
      <td class="px-2 py-2 border text-center">
        <button class="delete-order-btn text-red-600 hover:text-red-800" data-order-id="${order.id}">
          <i class="fas fa-trash"></i>
        </button>
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
  
  // Route dropdowns
  document.querySelectorAll('.route-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const orderId = e.target.dataset.orderId;
      const newRoute = e.target.value;
      await handleRouteChange(orderId, newRoute);
    });
  });
  
  // Edit buttons
  document.querySelectorAll('.edit-order-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderId = e.currentTarget.dataset.orderId;
      editOrder(orderId);
    });
  });
  
  // Delete buttons (individual)
  document.querySelectorAll('.delete-order-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const orderId = e.currentTarget.dataset.orderId;
      await deleteSingleOrder(orderId);
    });
  });
  
  // Buttons
  document.getElementById('template-btn')?.addEventListener('click', downloadTemplate);
  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('excel-uploader').click();
  });
  document.getElementById('add-row-btn')?.addEventListener('click', showAddOrderModal);
  document.getElementById('save-btn')?.addEventListener('click', saveAllChanges);
  document.getElementById('delete-btn')?.addEventListener('click', deleteSelectedOrders);
  
  // Modal buttons
  document.getElementById('close-modal-btn')?.addEventListener('click', hideAddOrderModal);
  document.getElementById('cancel-modal-btn')?.addEventListener('click', hideAddOrderModal);
  document.getElementById('add-order-form')?.addEventListener('submit', handleAddOrderSubmit);
  
  // Country change -> update suppliers and routes
  document.getElementById('country-select')?.addEventListener('change', (e) => {
    updateSupplierOptions(e.target.value);
    updateRouteOptions(e.target.value);
  });
  
  // Excel uploader
  document.getElementById('excel-uploader')?.addEventListener('change', handleExcelUpload);
}

function updateDeleteButton() {
  const deleteBtn = document.getElementById('delete-btn');
  if (deleteBtn) {
    deleteBtn.disabled = selectedOrderIds.size === 0;
  }
}

function updateSaveButton(enabled) {
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.disabled = !enabled;
    hasUnsavedChanges = enabled;
  }
}

async function handleRouteChange(orderId, newRoute) {
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
    
    UIUtils.showAlert('선적경로가 변경되었습니다.', 'success');
  } catch (error) {
    console.error('Route change error:', error);
    UIUtils.showAlert('선적경로 변경 실패', 'error');
  }
}

function showAddOrderModal() {
  document.getElementById('add-order-modal').classList.remove('hidden');
  document.getElementById('add-order-form').reset();
}

function hideAddOrderModal() {
  document.getElementById('add-order-modal').classList.add('hidden');
  document.getElementById('add-order-form').reset();
}

function updateSupplierOptions(country) {
  const supplierSelect = document.getElementById('supplier-select');
  if (!supplierSelect || !country) return;
  
  const suppliers = SUPPLIERS_BY_COUNTRY[country] || [];
  supplierSelect.innerHTML = '<option value="">선택하세요</option>' + 
    suppliers.map(s => `<option value="${s}">${s}</option>`).join('');
}

function updateRouteOptions(country) {
  const routeSelect = document.getElementById('route-select');
  if (!routeSelect || !country) return;
  
  const routes = ROUTES_BY_COUNTRY[country] || [];
  routeSelect.innerHTML = '<option value="">선택하세요</option>' + 
    routes.map(r => `<option value="${r}">${r}</option>`).join('');
}

async function handleAddOrderSubmit(e) {
  e.preventDefault();
  
  try {
    UIUtils.showLoading();
    
    const formData = new FormData(e.target);
    const orderDate = formData.get('orderDate');
    const route = formData.get('route');
    
    // 공정 일정 자동 계산
    const schedule = calculateProcessSchedule(orderDate, null, route);
    
    const orderData = {
      channel: formData.get('channel'),
      style: formData.get('style'),
      color: formData.get('color'),
      qty: parseInt(formData.get('qty')),
      country: formData.get('country'),
      supplier: formData.get('supplier'),
      orderDate: orderDate,
      requiredDelivery: formData.get('requiredDelivery'),
      route: route,
      schedule: schedule,
      createdAt: new Date().toISOString()
    };
    
    await addOrder(orderData);
    
    // 테이블 새로고침
    orders = await getOrdersWithProcesses();
    renderOrdersTable();
    setupEventListeners();
    
    hideAddOrderModal();
    UIUtils.hideLoading();
    UIUtils.showAlert('발주가 추가되었습니다.', 'success');
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Add order error:', error);
    UIUtils.showAlert('발주 추가 실패: ' + error.message, 'error');
  }
}

function editOrder(orderId) {
  // TODO: 편집 모달 표시
  UIUtils.showAlert('편집 기능은 개발 중입니다. 선적경로는 드롭다운으로 변경 가능합니다.', 'info');
}

async function deleteSingleOrder(orderId) {
  const confirmed = await UIUtils.confirm('이 발주를 삭제하시겠습니까?');
  if (!confirmed) return;
  
  try {
    UIUtils.showLoading();
    await deleteOrder(orderId);
    
    orders = await getOrdersWithProcesses();
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

function saveAllChanges() {
  UIUtils.showAlert('모든 변경사항이 자동으로 저장되었습니다.', 'success');
  updateSaveButton(false);
}

function downloadTemplate() {
  const headers = createProcessTableHeaders();
  const basicColumns = [
    '채널', '스타일', '색상코드', '수량',
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
          qty: row['수량'] || 0,
          country: row['국가'] || '',
          supplier: row['생산업체'] || '',
          orderDate: DateUtils.excelDateToString(row['발주일']),
          requiredDelivery: DateUtils.excelDateToString(row['입고요구일']),
          route: route,
          schedule: schedule,
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
      await deleteOrder(orderId);
    }
    
    selectedOrderIds.clear();
    orders = await getOrdersWithProcesses();
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
