// 생산 목표일정 수립 (발주 관리)
import { getOrdersWithProcesses, addOrder, updateOrder, deleteOrder } from './firestore-service.js';
import { renderEmptyState, createProcessTableHeaders } from './ui-components.js';
import { UIUtils, ExcelUtils, DateUtils } from './utils.js';
import { SUPPLIERS_BY_COUNTRY, ROUTES_BY_COUNTRY, calculateProcessSchedule } from './process-config.js';

let orders = [];
let selectedOrderIds = new Set();

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
            <button id="delete-btn" class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50" disabled>
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
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs uppercase sticky top-0">
          <tr>
            <th rowspan="2" class="px-2 py-2"><input type="checkbox" id="select-all"></th>
            <th colspan="8" class="px-2 py-2 border-r">발주 정보</th>
            <th colspan="${headers.production.length}" class="px-2 py-2 border-r">생산 목표일</th>
            <th colspan="${headers.shipping.length}" class="px-2 py-2">운송 목표일</th>
          </tr>
          <tr>
            <th class="px-2 py-2">채널</th>
            <th class="px-2 py-2">스타일</th>
            <th class="px-2 py-2">색상</th>
            <th class="px-2 py-2">수량</th>
            <th class="px-2 py-2">국가</th>
            <th class="px-2 py-2">생산업체</th>
            <th class="px-2 py-2">발주일</th>
            <th class="px-2 py-2 border-r">입고요구일</th>
            ${headers.production.map(h => `<th class="px-2 py-2">${h.name}</th>`).join('')}
            ${headers.shipping.map(h => `<th class="px-2 py-2">${h.name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => renderOrderRow(order, headers)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderOrderRow(order, headers) {
  return `
    <tr class="border-b hover:bg-gray-50" data-order-id="${order.id}">
      <td class="px-2 py-2"><input type="checkbox" class="order-checkbox" value="${order.id}"></td>
      <td class="px-2 py-2">${order.channel}</td>
      <td class="px-2 py-2">${order.style}</td>
      <td class="px-2 py-2">${order.color}</td>
      <td class="px-2 py-2">${order.qty}</td>
      <td class="px-2 py-2">${order.country}</td>
      <td class="px-2 py-2">${order.supplier}</td>
      <td class="px-2 py-2">${order.orderDate}</td>
      <td class="px-2 py-2 border-r">${order.requiredDelivery}</td>
      ${headers.production.map(h => {
        const process = order.schedule.production.find(p => p.processKey === h.key);
        return `<td class="px-2 py-2">${process?.targetDate || '-'}</td>`;
      }).join('')}
      ${headers.shipping.map(h => {
        const process = order.schedule.shipping.find(p => p.processKey === h.key);
        return `<td class="px-2 py-2">${process?.targetDate || '-'}</td>`;
      }).join('')}
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
  
  // Buttons
  document.getElementById('template-btn')?.addEventListener('click', downloadTemplate);
  document.getElementById('upload-btn')?.addEventListener('click', () => {
    document.getElementById('excel-uploader').click();
  });
  document.getElementById('add-row-btn')?.addEventListener('click', addNewRow);
  document.getElementById('delete-btn')?.addEventListener('click', deleteSelectedOrders);
  
  // Excel uploader
  document.getElementById('excel-uploader')?.addEventListener('change', handleExcelUpload);
}

function updateDeleteButton() {
  const deleteBtn = document.getElementById('delete-btn');
  if (deleteBtn) {
    deleteBtn.disabled = selectedOrderIds.size === 0;
  }
}

function downloadTemplate() {
  // 공정 헤더 가져오기
  const headers = createProcessTableHeaders();
  
  // 기본 정보 컬럼
  const basicColumns = [
    '채널', '스타일', '색상코드', '수량',
    '국가', '생산업체', '발주일', '입고요구일', '선적경로'
  ];
  
  // 생산 공정 컬럼
  const productionColumns = headers.production.map(h => h.name);
  
  // 운송 공정 컬럼
  const shippingColumns = headers.shipping.map(h => h.name);
  
  // 전체 컬럼 결합
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
    console.log('Excel data:', data);
    
    if (!data || data.length === 0) {
      throw new Error('엑셀 파일이 비어있습니다.');
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // 각 행을 발주 데이터로 변환 및 저장
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // 필수 필드 검증
        if (!row['발주일'] || !row['입고요구일']) {
          throw new Error('발주일과 입고요구일은 필수입니다.');
        }
        
        // 선적 경로 가져오기
        const route = row['선적경로'] || null;
        
        // 공정 일정 자동 계산
        const schedule = calculateProcessSchedule(
          DateUtils.excelDateToString(row['발주일']),
          null, // 표준 리드타임 사용
          route
        );
        
        // 발주 데이터 생성
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
        
        // Firestore에 저장
        await addOrder(orderData);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`행 ${i + 2}: ${error.message}`);
        console.error(`Row ${i + 2} error:`, error);
      }
    }
    
    // 결과 표시
    if (errorCount === 0) {
      UIUtils.showAlert(`${successCount}건의 발주가 성공적으로 등록되었습니다!`, 'success');
    } else {
      const message = `성공: ${successCount}건, 실패: ${errorCount}건\n\n실패 내역:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`;
      UIUtils.showAlert(message, 'warning');
    }
    
    // 테이블 새로고침
    orders = await getOrdersWithProcesses();
    renderOrdersTable();
    setupEventListeners();
    
    UIUtils.hideLoading();
    e.target.value = ''; // Reset input
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Excel upload error:', error);
    UIUtils.showAlert(`엑셀 업로드 실패: ${error.message}`, 'error');
    e.target.value = '';
  }
}

function addNewRow() {
  // TODO: 새 행 추가 모달 표시
  UIUtils.showAlert('기능 개발 중입니다.', 'info');
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
