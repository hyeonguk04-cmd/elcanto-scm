// 공정별 완료일 등록
import { getOrdersWithProcesses, updateProcess } from './firestore-service.js';
import { renderEmptyState, createProcessTableHeaders } from './ui-components.js';
import { UIUtils, ExcelUtils, DateUtils } from './utils.js';

let orders = [];
let allOrders = [];
let filterState = {
  supplier: '',
  seasonOrder: ''
};

export async function renderProcessCompletion(container) {
  try {
    UIUtils.showLoading();
    
    orders = await getOrdersWithProcesses();
    allOrders = [...orders];
    
    container.innerHTML = `
      <div class="space-y-3">
        <!-- 모바일 최적화 레이아웃 -->
        <div class="flex flex-col gap-3">
          <!-- 제목 (첫 번째 줄) -->
          <div class="flex items-center" style="display: flex !important; flex-wrap: nowrap !important; align-items: center !important; gap: 0.5rem !important; width: auto !important;">
            <h2 class="text-xl font-bold text-gray-800" style="margin: 0 !important; white-space: nowrap !important;">공정별 완료일 등록</h2>
            <i id="process-completion-info-icon" 
               class="fas fa-lightbulb cursor-pointer" 
               style="font-size: 19px; color: #f59e0b; margin-left: 8px !important; vertical-align: middle; transition: color 0.2s; flex-shrink: 0 !important; position: static !important;"
               tabindex="0"
               role="button"
               aria-label="안내사항 보기"
               onmouseover="this.style.color='#d97706'"
               onmouseout="this.style.color='#f59e0b'"></i>
          </div>
          
          <!-- 버튼 그룹 (두 번째 줄, 오른쪽 정렬) -->
          <div class="flex flex-wrap gap-2 justify-end items-center">
            <!-- 생산업체 검색 -->
            <div class="relative">
              <input type="text" 
                     id="supplier-filter-input-completion" 
                     placeholder="생산업체 검색" 
                     class="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     style="padding-right: 60px;">
              <div class="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button id="supplier-filter-apply-completion" 
                        class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        title="검색">
                  <i class="fas fa-search"></i>
                </button>
                <button id="supplier-filter-clear-completion" 
                        class="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                        title="초기화">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <!-- 연도시즌+차수 검색 -->
            <div class="relative">
              <input type="text" 
                     id="season-filter-input-completion" 
                     placeholder="연도시즌+차수 검색" 
                     class="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     style="padding-right: 60px;">
              <div class="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button id="season-filter-apply-completion" 
                        class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        title="검색">
                  <i class="fas fa-search"></i>
                </button>
                <button id="season-filter-clear-completion" 
                        class="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                        title="초기화">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <button id="template-completion-btn" class="bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-600 text-sm">
              <i class="fas fa-file-download mr-1"></i>템플릿 다운로드
            </button>
            <button id="upload-completion-btn" class="bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700 text-sm">
              <i class="fas fa-file-excel mr-1"></i>엑셀 업로드
            </button>
            <input type="file" id="excel-completion-uploader" accept=".xlsx,.xls" class="hidden">
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-3">
          <div id="completion-table" class="overflow-auto" style="max-height: calc(100vh - 190px);"></div>
        </div>
        
        <!-- 인포메이션 툴팁 -->
        <div id="process-completion-info-tooltip" class="hidden fixed bg-white rounded-lg z-[1001]" 
             style="width: 420px; padding: 20px; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center">
              <span style="font-size: 16px; margin-right: 8px;">💡</span>
              <h3 class="font-bold text-gray-800" style="font-size: 15px;">안내사항</h3>
            </div>
            <button id="close-completion-info-tooltip" class="text-gray-400 hover:text-gray-600 text-xl leading-none" style="margin-top: -4px;">&times;</button>
          </div>
          <div style="font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0;">• 생산업체에서 직접 완료일을 등록할 수 없는 경우, 엘칸토 관리자가 대신 공정별 완료일정을 등록하는 메뉴입니다.</p>
          </div>
          <div class="flex items-start mb-2">
            <span style="font-size: 16px; margin-right: 8px;">📌</span>
            <h3 class="font-bold text-gray-800" style="font-size: 15px;">사용 프로세스</h3>
          </div>
          <div style="font-size: 14px; color: #333; line-height: 1.7;">
            <p style="margin: 0 0 6px 0;">1. 템플릿 다운로드: 생산업체에 전달할 엑셀 템플릿 다운로드</p>
            <p style="margin: 0 0 6px 0;">2. 생산업체 작성: 발주 스타일별 공정별 완료일 기재</p>
            <p style="margin: 0 0 6px 0;">3. 엑셀 업로드: 생산업체가 작성한 완료일정 엑셀 업로드</p>
            <p style="margin: 0;">4. 진척 현황 반영: 공정 입고진척 현황에서 완료일 확인 가능</p>
          </div>
          <div class="absolute" style="top: -8px; left: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid white;"></div>
          <div class="absolute" style="top: -9px; left: 20px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid #ddd;"></div>
        </div>
      </div>
    `;
    
    renderCompletionTable();
    setupEventListeners();
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Process completion render error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.', 'fa-exclamation-circle');
  }
}

function applyFilters() {
  const supplierValue = filterState.supplier.trim().toLowerCase();
  const seasonValue = filterState.seasonOrder.trim().toLowerCase();
  
  if (!supplierValue && !seasonValue) {
    orders = [...allOrders];
  } else {
    orders = allOrders.filter(order => {
      const supplierMatch = !supplierValue || (order.supplier || '').toLowerCase().includes(supplierValue);
      const seasonMatch = !seasonValue || (order.seasonOrder || '').toLowerCase().includes(seasonValue);
      return supplierMatch && seasonMatch;
    });
  }
  
  console.log(`🔍 필터: 생산업체="${supplierValue}", 연도시즌+차수="${seasonValue}" → ${orders.length}/${allOrders.length}건 표시`);
}

function getRegisteredBy(processes) {
  // 완료일이 등록된 프로세스 찾기
  const completedProcesses = processes.filter(p => p.completedDate);
  
  if (completedProcesses.length === 0) {
    return '-';
  }
  
  // updatedBy 필드로 판별
  // updatedBy가 있으면 생산업체가 직접 등록한 것
  // updatedBy가 없으면 관리자가 템플릿으로 업로드한 것
  const hasSupplierUpdate = completedProcesses.some(p => p.updatedBy);
  
  if (hasSupplierUpdate) {
    return '<span class="text-blue-600 font-semibold">생산업체</span>';
  } else {
    return '<span class="text-purple-600 font-semibold">관리자</span>';
  }
}

function renderCompletionTable() {
  const tableContainer = document.getElementById('completion-table');
  const headers = createProcessTableHeaders();
  
  tableContainer.innerHTML = `
    <table class="text-xs border-collapse" style="width: auto; white-space: nowrap;">
      <thead class="bg-gray-50 text-xs uppercase sticky top-0 z-10">
        <tr>
          <th rowspan="2" class="px-2 py-2 border">번호</th>
          <th colspan="7" class="px-2 py-2 border bg-blue-100">발주 정보</th>
          <th colspan="${headers.production.length}" class="px-2 py-2 border bg-green-100">생산 공정 완료일</th>
          <th colspan="2" class="px-2 py-2 border bg-yellow-100">운송 공정 완료일</th>
          <th rowspan="2" class="px-2 py-2 border bg-purple-100">등록자</th>
        </tr>
        <tr>
          <th class="px-2 py-2 border">채널</th>
          <th class="px-2 py-2 border">연도시즌+차수</th>
          <th class="px-2 py-2 border">스타일</th>
          <th class="px-2 py-2 border">색상</th>
          <th class="px-2 py-2 border">국가</th>
          <th class="px-2 py-2 border">생산업체</th>
          <th class="px-2 py-2 border">발주일</th>
          ${headers.production.map(h => `<th class="px-2 py-2 border">${h.name}</th>`).join('')}
          <th class="px-2 py-2 border">선적</th>
          <th class="px-2 py-2 border">입항</th>
        </tr>
      </thead>
      <tbody id="completion-tbody">
        ${orders.length === 0 ? `
          <tr>
            <td colspan="${10 + headers.production.length}" class="text-center py-8 text-gray-500">
              <i class="fas fa-inbox text-4xl mb-2"></i>
              <p>등록된 발주 정보가 없습니다.</p>
            </td>
          </tr>
        ` : orders.map((order, index) => {
          // processes 구조 우선, schedule 호환성 유지
          const productionProcesses = order.processes?.production || order.schedule?.production || [];
          const shippingProcesses = order.processes?.shipping || order.schedule?.shipping || [];
          const shippingProcess = shippingProcesses.find(p => p.key === 'shipping' || p.processKey === 'shipping');
          const arrivalProcess = shippingProcesses.find(p => p.key === 'arrival' || p.processKey === 'arrival');
          
          return `
            <tr data-order-id="${order.id}" class="hover:bg-blue-50">
              <td class="px-2 py-2 border text-center">${index + 1}</td>
              <td class="px-2 py-2 border">${order.channel || ''}</td>
              <td class="px-2 py-2 border">${order.seasonOrder || ''}</td>
              <td class="px-2 py-2 border">${order.style || ''}</td>
              <td class="px-2 py-2 border text-center">${order.color || ''}</td>
              <td class="px-2 py-2 border">${order.country || ''}</td>
              <td class="px-2 py-2 border">${order.supplier || ''}</td>
              <td class="px-2 py-2 border text-center">${order.orderDate || ''}</td>
              ${headers.production.map(header => {
                const process = productionProcesses.find(p => p.key === header.key || p.processKey === header.key);
                const completedDate = process?.completedDate || '';
                const targetDate = process?.targetDate || '';
                const isCompleted = !!completedDate;
                const isDelayed = completedDate && targetDate && new Date(completedDate) > new Date(targetDate);
                
                return `
                  <td class="px-2 py-2 border text-center ${isCompleted ? (isDelayed ? 'bg-red-50' : 'bg-green-50') : ''}">
                    ${completedDate || '-'}
                  </td>
                `;
              }).join('')}
              <td class="px-2 py-2 border text-center ${shippingProcess?.completedDate ? 'bg-green-50' : ''}">
                ${shippingProcess?.completedDate || '-'}
              </td>
              <td class="px-2 py-2 border text-center ${arrivalProcess?.completedDate ? 'bg-green-50' : ''}">
                ${arrivalProcess?.completedDate || '-'}
              </td>
              <td class="px-2 py-2 border text-center">
                ${getRegisteredBy(productionProcesses.concat(shippingProcesses))}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function setupEventListeners() {
  // Supplier Filter
  const supplierFilterInput = document.getElementById('supplier-filter-input-completion');
  const supplierFilterApply = document.getElementById('supplier-filter-apply-completion');
  const supplierFilterClear = document.getElementById('supplier-filter-clear-completion');
  
  supplierFilterInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterState.supplier = supplierFilterInput.value;
      applyFilters();
      renderCompletionTable();
      setupEventListeners();
    }
  });
  
  supplierFilterApply?.addEventListener('click', () => {
    filterState.supplier = supplierFilterInput.value;
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  supplierFilterClear?.addEventListener('click', () => {
    filterState.supplier = '';
    supplierFilterInput.value = '';
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  // Season Filter
  const seasonFilterInput = document.getElementById('season-filter-input-completion');
  const seasonFilterApply = document.getElementById('season-filter-apply-completion');
  const seasonFilterClear = document.getElementById('season-filter-clear-completion');
  
  seasonFilterInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterState.seasonOrder = seasonFilterInput.value;
      applyFilters();
      renderCompletionTable();
      setupEventListeners();
    }
  });
  
  seasonFilterApply?.addEventListener('click', () => {
    filterState.seasonOrder = seasonFilterInput.value;
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  seasonFilterClear?.addEventListener('click', () => {
    filterState.seasonOrder = '';
    seasonFilterInput.value = '';
    applyFilters();
    renderCompletionTable();
    setupEventListeners();
  });
  
  // Buttons
  document.getElementById('template-completion-btn')?.addEventListener('click', downloadTemplate);
  document.getElementById('upload-completion-btn')?.addEventListener('click', () => {
    document.getElementById('excel-completion-uploader').click();
  });
  document.getElementById('excel-completion-uploader')?.addEventListener('change', handleExcelUpload);
  
  // Info tooltip
  const infoIcon = document.getElementById('process-completion-info-icon');
  const tooltip = document.getElementById('process-completion-info-tooltip');
  const closeTooltip = document.getElementById('close-completion-info-tooltip');
  
  infoIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    const iconRect = infoIcon.getBoundingClientRect();
    tooltip.style.top = `${iconRect.bottom + 10}px`;
    tooltip.style.left = `${Math.min(iconRect.left, window.innerWidth - 440)}px`;
    tooltip.classList.remove('hidden');
  });
  
  closeTooltip?.addEventListener('click', () => {
    tooltip.classList.add('hidden');
  });
  
  document.addEventListener('click', (e) => {
    if (!tooltip.contains(e.target) && e.target !== infoIcon) {
      tooltip.classList.add('hidden');
    }
  });
}

function downloadTemplate() {
  const headers = createProcessTableHeaders();
  
  const excelData = orders.map(order => {
    const row = {
      '채널': order.channel || '',
      '연도시즌+차수': order.seasonOrder || '',
      '스타일': order.style || '',
      '색상': order.color || '',
      '국가': order.country || '',
      '생산업체': order.supplier || '',
      '발주일': order.orderDate || '',
    };
    
    // 생산 공정 완료일
    const productionProcesses = order.schedule?.production || [];
    headers.production.forEach(header => {
      const process = productionProcesses.find(p => p.processKey === header.key);
      row[`${header.name}_완료일`] = process?.completedDate || '';
    });
    
    // 운송 공정 완료일
    const shippingProcesses = order.schedule?.shipping || [];
    const shippingProcess = shippingProcesses.find(p => p.processKey === 'shipping');
    const arrivalProcess = shippingProcesses.find(p => p.processKey === 'arrival');
    
    row['선적_완료일'] = shippingProcess?.completedDate || '';
    row['입항_완료일'] = arrivalProcess?.completedDate || '';
    
    return row;
  });
  
  ExcelUtils.downloadExcel(excelData, '생산공정_완료일_템플릿.xlsx');
  UIUtils.showAlert('템플릿이 다운로드되었습니다.', 'success');
}

async function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  console.log('📤 엑셀 업로드 시작:', file.name);
  
  try {
    UIUtils.showLoading();
    
    const data = await ExcelUtils.readExcel(file);
    
    console.log('📊 읽어온 데이터:', data);
    console.log('📊 데이터 행 수:', data?.length);
    
    if (!data || data.length === 0) {
      throw new Error('엑셀 파일이 비어있습니다.');
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const row of data) {
      try {
        // 발주 찾기
        const order = allOrders.find(o => 
          o.channel === row['채널'] &&
          o.seasonOrder === row['연도시즌+차수'] &&
          o.style === row['스타일'] &&
          o.color === row['색상']
        );
        
        if (!order) {
          throw new Error(`발주를 찾을 수 없습니다: ${row['스타일']}_${row['색상']}`);
        }
        
        // 생산 공정 완료일 업데이트 (processes 구조 사용)
        const productionProcesses = order.processes?.production || order.schedule?.production || [];
        console.log(`📦 ${order.style}_${order.color} 생산공정:`, productionProcesses);
        
        for (let i = 0; i < productionProcesses.length; i++) {
          const process = productionProcesses[i];
          const completedDateKey = `${process.name}_완료일`;
          const completedDate = row[completedDateKey];
          
          console.log(`  🔍 ${process.name}: 완료일 = ${completedDate || '없음'}`);
          
          if (completedDate) {
            const formattedDate = DateUtils.excelDateToString(completedDate);
            console.log(`  ✅ ${process.name} 완료일 업데이트: ${formattedDate}`);
            await updateProcess(order.id, 'production', i, {
              completedDate: formattedDate
            });
          }
        }
        
        // 운송 공정 완료일 업데이트 (processes 구조 사용)
        const shippingProcesses = order.processes?.shipping || order.schedule?.shipping || [];
        console.log(`🚢 ${order.style}_${order.color} 운송공정:`, shippingProcesses);
        
        const shippingIndex = shippingProcesses.findIndex(p => p.key === 'shipping' || p.processKey === 'shipping');
        const arrivalIndex = shippingProcesses.findIndex(p => p.key === 'arrival' || p.processKey === 'arrival');
        
        if (shippingIndex >= 0 && row['선적_완료일']) {
          const formattedDate = DateUtils.excelDateToString(row['선적_완료일']);
          console.log(`  ✅ 선적 완료일 업데이트: ${formattedDate}`);
          await updateProcess(order.id, 'shipping', shippingIndex, {
            completedDate: formattedDate
          });
        }
        
        if (arrivalIndex >= 0 && row['입항_완료일']) {
          const formattedDate = DateUtils.excelDateToString(row['입항_완료일']);
          console.log(`  ✅ 입항 완료일 업데이트: ${formattedDate}`);
          await updateProcess(order.id, 'shipping', arrivalIndex, {
            completedDate: formattedDate
          });
        }
        
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`${row['스타일']}_${row['색상']}: ${error.message}`);
        console.error('업데이트 실패:', error);
      }
    }
    
    if (errorCount === 0) {
      UIUtils.showAlert(`${successCount}건의 공정 완료일이 성공적으로 등록되었습니다!`, 'success');
    } else {
      const message = `성공: ${successCount}건, 실패: ${errorCount}건\n\n실패 내역:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`;
      UIUtils.showAlert(message, 'warning');
    }
    
    // 데이터 새로고침
    orders = await getOrdersWithProcesses();
    allOrders = [...orders];
    applyFilters();
    renderCompletionTable();
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

export default { renderProcessCompletion };
