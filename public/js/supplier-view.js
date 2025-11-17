// 생산업체 뷰 - 실적 입력
import { getOrdersWithProcesses, updateProcess, uploadEvidence } from './firestore-service.js';
import { getCurrentUser } from './auth.js';
import { renderEmptyState } from './ui-components.js';
import { UIUtils, DateUtils } from './utils.js';
import { PROCESS_CONFIG } from './process-config.js';

let supplierOrders = [];

export async function renderSupplierView(container, view) {
  const user = getCurrentUser();
  
  if (view === 'dashboard') {
    renderSupplierDashboard(container, user);
  } else if (view === 'orders') {
    renderSupplierOrders(container, user);
  }
}

async function renderSupplierDashboard(container, user) {
  try {
    UIUtils.showLoading();
    
    // 모든 주문 가져와서 필터링
    const allOrders = await getOrdersWithProcesses();
    const orders = allOrders.filter(o => o.supplier === (user.supplierName || user.name));
    
    // 통계 계산
    const totalQty = orders.reduce((sum, o) => sum + (o.qty || 0), 0);
    
    // 완료율 계산 (모든 생산공정이 완료된 주문 비율)
    const completedOrders = orders.filter(order => {
      const productionProcesses = order.schedule?.production || [];
      return productionProcesses.every(p => p.actualDate);
    });
    const completionRate = orders.length > 0 
      ? Math.round((completedOrders.length / orders.length) * 100) 
      : 0;
    
    container.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-800">${user.name} 대시보드</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-xl shadow-lg p-6">
            <p class="text-sm text-gray-500 font-medium">진행중인 발주</p>
            <p class="text-3xl font-bold text-blue-600 mt-2">${orders.length}건</p>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <p class="text-sm text-gray-500 font-medium">총 발주 수량</p>
            <p class="text-3xl font-bold text-purple-600 mt-2">${totalQty.toLocaleString()}개</p>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <p class="text-sm text-gray-500 font-medium">완료율</p>
            <p class="text-3xl font-bold text-green-600 mt-2">${completionRate}%</p>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-bold mb-4">최근 발주 현황</h3>
          ${orders.length === 0 ? `
            <div class="text-center text-gray-500 py-8">
              <i class="fas fa-inbox text-4xl mb-2"></i>
              <p>할당된 발주가 없습니다.</p>
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">스타일</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">색상</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">수량</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">발주일</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">입고요구일</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">진행상태</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  ${orders.slice(0, 10).map(order => {
                    const completedCount = (order.schedule?.production || []).filter(p => p.actualDate).length;
                    const totalCount = (order.schedule?.production || []).length;
                    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                    
                    return `
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm">
                          <button class="text-blue-600 hover:text-blue-800 font-medium hover:underline dashboard-style-link"
                                  data-order-id="${order.id}"
                                  data-style="${order.style || '-'}">
                            ${order.style || '-'}
                          </button>
                        </td>
                        <td class="px-4 py-3 text-sm">${order.color || '-'}</td>
                        <td class="px-4 py-3 text-sm">${order.qty || 0}</td>
                        <td class="px-4 py-3 text-sm">${order.orderDate || '-'}</td>
                        <td class="px-4 py-3 text-sm">${order.requiredDelivery || '-'}</td>
                        <td class="px-4 py-3 text-sm">
                          <div class="flex items-center">
                            <div class="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div class="bg-blue-600 h-2 rounded-full" style="width: ${progress}%"></div>
                            </div>
                            <span class="text-xs text-gray-600">${progress}%</span>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
    
    // 스타일 클릭 이벤트 리스너 등록
    setupDashboardEventListeners();
    
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Supplier dashboard error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

// 대시보드 이벤트 리스너
function setupDashboardEventListeners() {
  document.querySelectorAll('.dashboard-style-link').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const orderId = e.currentTarget.dataset.orderId;
      const style = e.currentTarget.dataset.style;
      
      console.log(`📝 스타일 클릭: ${style} (Order ID: ${orderId})`);
      
      // 실적입력 페이지로 이동하면서 해당 주문 ID 저장
      window.selectedOrderId = orderId;
      
      // 실적입력 페이지��� 내비게이션 (app.js의 navigateTo 함수 사용)
      if (window.navigateTo) {
        window.navigateTo('supplier-orders');
      } else {
        // Fallback: 직접 렌더링
        const container = document.getElementById('main-content');
        const user = getCurrentUser();
        await renderSupplierOrders(container, user);
      }
    });
  });
}

async function renderSupplierOrders(container, user) {
  try {
    UIUtils.showLoading();
    
    // 모든 주문 가져와서 필터링
    const allOrders = await getOrdersWithProcesses();
    supplierOrders = allOrders.filter(o => o.supplier === (user.supplierName || user.name));
    
    container.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-800">실적 입력</h2>
        
        <div id="orders-accordion" class="space-y-4">
          ${supplierOrders.length === 0 ? `
            <div class="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
              <i class="fas fa-inbox text-4xl mb-2"></i>
              <p>할당된 발주가 없습니다.</p>
            </div>
          ` : supplierOrders.map((order, index) => renderOrderCard(order, index)).join('')}
        </div>
      </div>
      
      <!-- 이미지 업로드 모달 -->
      <div id="supplier-photo-modal" class="hidden fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-lg">
          <h3 class="text-xl font-bold mb-4">증빙 사진 업로드</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">공정: <span id="modal-process-name" class="font-bold"></span></label>
              <input type="file" id="supplier-photo-input" accept="image/*" 
                     class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
            </div>
            <div id="supplier-photo-preview" class="hidden">
              <p class="text-sm text-gray-500 mb-2">미리보기</p>
              <img id="supplier-photo-preview-img" src="" alt="Preview" class="w-full h-auto rounded-lg max-h-64 object-contain">
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button type="button" id="supplier-photo-cancel-btn" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
              취소
            </button>
            <button type="button" id="supplier-photo-upload-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              업로드
            </button>
          </div>
        </div>
      </div>
    `;
    
    setupEventListeners();
    
    // 대시보드에서 선택된 주문이 있으면 자동으로 펼치기
    if (window.selectedOrderId) {
      const selectedIndex = supplierOrders.findIndex(o => o.id === window.selectedOrderId);
      if (selectedIndex !== -1) {
        // 약간의 지연 후 펼치기 (DOM이 완전히 로드된 후)
        setTimeout(() => {
          toggleOrderDetail(selectedIndex);
          
          // 해당 요소로 스크롤
          const orderCard = document.querySelector(`#order-detail-${selectedIndex}`);
          if (orderCard) {
            orderCard.closest('.bg-white').scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
          
          // 선택 상태 초기화
          window.selectedOrderId = null;
        }, 300);
      }
    }
    
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Supplier orders error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

function renderOrderCard(order, index) {
  const productionProcesses = order.schedule?.production || [];
  const shippingProcesses = order.schedule?.shipping || [];
  
  // 공정 실적 등록 상태 계산
  const allProcesses = [...productionProcesses, ...shippingProcesses];
  const totalProcesses = allProcesses.length;
  const completedProcesses = allProcesses.filter(p => p.actualDate).length;
  
  let statusText = '';
  let statusColor = '';
  let statusIcon = '';
  let statusDetail = '';
  
  if (completedProcesses === 0) {
    statusText = '미등록';
    statusColor = 'text-red-600';
    statusIcon = '🔴'; // 빨간색 신호등
  } else if (completedProcesses === totalProcesses) {
    statusText = '등록완료';
    statusColor = 'text-green-600';
    statusIcon = '🟢'; // 녹색 신호등
  } else {
    // 등록중 - 마지막으로 완료된 공정 찾기
    statusText = '등록중';
    statusColor = 'text-yellow-600';
    statusIcon = '🟡'; // 노란색 신호등
    
    // 마지막으로 완료된 공정 찾기
    let lastCompletedProcess = null;
    for (let i = allProcesses.length - 1; i >= 0; i--) {
      if (allProcesses[i].actualDate) {
        lastCompletedProcess = allProcesses[i];
        break;
      }
    }
    
    if (lastCompletedProcess) {
      // 공정명 가져오기
      let processName = lastCompletedProcess.name;
      if (!processName && lastCompletedProcess.processKey) {
        const category = productionProcesses.includes(lastCompletedProcess) ? 'production' : 'shipping';
        const allConfigProcesses = PROCESS_CONFIG[category] || [];
        const foundProcess = allConfigProcesses.find(p => p.key === lastCompletedProcess.processKey);
        processName = foundProcess ? foundProcess.name : lastCompletedProcess.processKey;
      }
      statusDetail = ` (${processName} 완료)`;
    }
  }
  
  return `
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      <!-- 기본 정보 헤더 (토글 가능) -->
      <div class="bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100"
           onclick="toggleOrderDetail(${index})">
        <div class="flex justify-between items-center">
          <!-- 왼쪽: 스타일코드와 기본 정보 -->
          <div class="flex items-center space-x-6">
            <h3 class="text-lg font-bold text-gray-800 min-w-[120px]">${order.style || '-'}</h3>
            <div class="flex items-center space-x-4 text-sm text-gray-600">
              <span>색상: <strong>${order.color || '-'}</strong></span>
              <span>수량: <strong>${order.qty || 0}개</strong></span>
              <span>사이즈: <strong>${order.size || '-'}</strong></span>
              <span>발주일: <strong>${order.orderDate || '-'}</strong></span>
              <span>입고요구일: <strong>${order.requiredDelivery || '-'}</strong></span>
            </div>
          </div>
          
          <!-- 오른쪽: 등록 상태와 토글 아이콘 -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">${statusIcon}</span>
              <div class="text-right">
                <p class="${statusColor} font-bold text-sm">${statusText}${statusDetail}</p>
                <p class="text-xs text-gray-500">${completedProcesses}/${totalProcesses} 완료</p>
              </div>
            </div>
            <i class="fas fa-chevron-down transition-transform text-gray-400" id="toggle-icon-${index}"></i>
          </div>
        </div>
      </div>
      
      <!-- 상세 정보 (접혔다 펼쳐짐) -->
      <div id="order-detail-${index}" class="hidden">
        <!-- 생산 공정 실적 입력 섹션 -->
        <div class="px-6 py-4">
          <h4 class="text-sm font-bold text-gray-700 mb-3">🏭 생산 공정 실적</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600" style="width: 150px;">공정</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600" style="width: 120px;">목표일</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600" style="width: 120px;">실제 완료일</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600" style="width: 80px;">차이일수</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600" style="width: 100px;">증빙</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600">차이원인</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${productionProcesses.map(process => renderProcessRow(order, process, 'production')).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- 운송 공정 실적 입력 섹션 -->
        <div class="px-6 py-4 border-t bg-green-50">
          <h4 class="text-sm font-bold text-gray-700 mb-3">🚢 운송 공정 실적</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600" style="width: 150px;">공정</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600" style="width: 120px;">목표일</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600" style="width: 120px;">실제 완료일</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600" style="width: 80px;">차이일수</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600" style="width: 100px;">증빙</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600">차이원인</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${shippingProcesses.map(process => renderProcessRow(order, process, 'shipping')).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProcessRow(order, process, category) {
  const hasActualDate = !!process.actualDate;
  const hasPhoto = !!(process.photo || process.evidenceUrl);
  
  // 공정명 가져오기 (process.name이 없으면 processKey로 찾기)
  let processName = process.name;
  if (!processName && process.processKey) {
    const allProcesses = PROCESS_CONFIG[category] || [];
    const foundProcess = allProcesses.find(p => p.key === process.processKey);
    processName = foundProcess ? foundProcess.name : process.processKey;
  }
  if (!processName) {
    processName = 'undefined';
  }
  
  // 차이일수 계산 (실제 완료일 - 목표일)
  let diffDays = '-';
  let diffClass = '';
  if (process.targetDate && process.actualDate) {
    const targetDate = new Date(process.targetDate);
    const actualDate = new Date(process.actualDate);
    const diff = Math.floor((actualDate - targetDate) / (1000 * 60 * 60 * 24));
    
    if (diff > 0) {
      diffDays = `+${diff}`;
      diffClass = 'text-red-600 font-bold'; // 지연 (빨간색)
    } else if (diff < 0) {
      diffDays = `${diff}`;
      diffClass = 'text-blue-600 font-bold'; // 앞당김 (파란색)
    } else {
      diffDays = '0';
      diffClass = 'text-green-600 font-bold'; // 정시 (초록색)
    }
  }
  
  return `
    <tr class="${hasActualDate ? 'bg-green-50' : ''}">
      <td class="px-3 py-3 text-sm font-medium text-gray-800">
        ${processName}
      </td>
      <td class="px-3 py-3 text-sm text-gray-600">
        ${process.targetDate || '-'}
      </td>
      <td class="px-3 py-3">
        <input type="date" 
               class="actual-date-input w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               data-order-id="${order.id}"
               data-process-id="${process.id}"
               data-category="${category}"
               value="${process.actualDate || ''}">
      </td>
      <td class="px-3 py-3 text-sm text-center ${diffClass}">
        ${diffDays}
      </td>
      <td class="px-3 py-3">
        ${hasPhoto ? `
          <div class="flex items-center justify-center space-x-1">
            <button class="text-green-600 hover:text-green-800 view-photo-btn"
                    data-photo-url="${process.photo || process.evidenceUrl}">
              <i class="fas fa-camera text-lg"></i>
            </button>
            <span class="text-xs text-green-600 font-medium">등록</span>
          </div>
        ` : `
          <div class="flex items-center justify-center space-x-1">
            <button class="text-gray-400 hover:text-blue-600 upload-photo-btn"
                    data-order-id="${order.id}"
                    data-process-id="${process.id}"
                    data-process-name="${processName}"
                    ${!hasActualDate ? 'disabled title="실제 완료일을 먼저 입력하세요"' : ''}>
              <i class="fas fa-camera text-lg"></i>
            </button>
            <span class="text-xs text-gray-400">미등록</span>
          </div>
        `}
      </td>
      <td class="px-3 py-3">
        <input type="text"
               class="delay-reason-input w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               data-order-id="${order.id}"
               data-process-id="${process.id}"
               value="${process.delayReason || ''}"
               placeholder="차이원인 등 필요사항 기재">
      </td>
    </tr>
  `;
}

// 주문 상세 토글
window.toggleOrderDetail = function(index) {
  const detailDiv = document.getElementById(`order-detail-${index}`);
  const icon = document.getElementById(`toggle-icon-${index}`);
  
  if (detailDiv.classList.contains('hidden')) {
    detailDiv.classList.remove('hidden');
    icon.classList.add('rotate-180');
  } else {
    detailDiv.classList.add('hidden');
    icon.classList.remove('rotate-180');
  }
};

function setupEventListeners() {
  // 실제 완료일 입력
  document.querySelectorAll('.actual-date-input').forEach(input => {
    input.addEventListener('change', handleActualDateChange);
  });
  
  // 지연 사유 입력
  document.querySelectorAll('.delay-reason-input').forEach(input => {
    input.addEventListener('blur', handleDelayReasonChange);
  });
  
  // 사진 업로드 버튼
  document.querySelectorAll('.upload-photo-btn').forEach(btn => {
    btn.addEventListener('click', handlePhotoUploadClick);
  });
  
  // 사진 보기 버튼
  document.querySelectorAll('.view-photo-btn').forEach(btn => {
    btn.addEventListener('click', handleViewPhotoClick);
  });
  
  // 모달 관련
  const photoInput = document.getElementById('supplier-photo-input');
  const photoPreview = document.getElementById('supplier-photo-preview');
  const photoPreviewImg = document.getElementById('supplier-photo-preview-img');
  const uploadBtn = document.getElementById('supplier-photo-upload-btn');
  const cancelBtn = document.getElementById('supplier-photo-cancel-btn');
  
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreviewImg.src = e.target.result;
          photoPreview.classList.remove('hidden');
          uploadBtn.disabled = false;
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      document.getElementById('supplier-photo-modal').classList.add('hidden');
      if (photoInput) photoInput.value = '';
      photoPreview.classList.add('hidden');
      uploadBtn.disabled = true;
    });
  }
  
  if (uploadBtn) {
    uploadBtn.addEventListener('click', handlePhotoUpload);
  }
}

async function handleActualDateChange(e) {
  const orderId = e.target.dataset.orderId;
  const processId = e.target.dataset.processId;
  const newDate = e.target.value;
  
  if (!newDate) return;
  
  try {
    UIUtils.showLoading();
    
    await updateProcess(processId, {
      actualDate: newDate
    });
    
    // 페이지 새로고침
    const container = document.getElementById('main-content');
    const user = getCurrentUser();
    await renderSupplierOrders(container, user);
    
    UIUtils.showAlert('실제 완료일이 저장되었습니다.', 'success');
  } catch (error) {
    console.error('Actual date update error:', error);
    UIUtils.showAlert('실제 완료일 저장에 실패했습니다.', 'error');
  } finally {
    UIUtils.hideLoading();
  }
}

async function handleDelayReasonChange(e) {
  const processId = e.target.dataset.processId;
  const reason = e.target.value.trim();
  
  try {
    await updateProcess(processId, {
      delayReason: reason
    });
  } catch (error) {
    console.error('Delay reason update error:', error);
  }
}

let currentUploadProcessId = null;
let currentUploadOrderId = null;

function handlePhotoUploadClick(e) {
  const btn = e.currentTarget;
  currentUploadOrderId = btn.dataset.orderId;
  currentUploadProcessId = btn.dataset.processId;
  const processName = btn.dataset.processName;
  
  document.getElementById('modal-process-name').textContent = processName;
  document.getElementById('supplier-photo-modal').classList.remove('hidden');
}

function handleViewPhotoClick(e) {
  const photoUrl = e.currentTarget.dataset.photoUrl;
  window.open(photoUrl, '_blank');
}

async function handlePhotoUpload() {
  const photoInput = document.getElementById('supplier-photo-input');
  const file = photoInput.files[0];
  
  if (!file || !currentUploadProcessId || !currentUploadOrderId) return;
  
  try {
    UIUtils.showLoading();
    
    await uploadEvidence(currentUploadOrderId, currentUploadProcessId, file);
    
    // 모달 닫기
    document.getElementById('supplier-photo-modal').classList.add('hidden');
    photoInput.value = '';
    document.getElementById('supplier-photo-preview').classList.add('hidden');
    document.getElementById('supplier-photo-upload-btn').disabled = true;
    
    // 페이지 새로고침
    const container = document.getElementById('main-content');
    const user = getCurrentUser();
    await renderSupplierOrders(container, user);
    
    UIUtils.showAlert('증빙 사진이 업로드되었습니다.', 'success');
  } catch (error) {
    console.error('Photo upload error:', error);
    UIUtils.showAlert('사진 업로드에 실패했습니다.', 'error');
  } finally {
    UIUtils.hideLoading();
  }
}

export default {
  renderSupplierView
};
