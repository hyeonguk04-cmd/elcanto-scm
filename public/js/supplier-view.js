// 생산업체 뷰
import { getOrdersBySupplier, updateProcess, uploadEvidence } from './firestore-service.js';
import { getCurrentUser } from './auth.js';
import { renderEmptyState } from './ui-components.js';
import { UIUtils, DateUtils } from './utils.js';

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
    const orders = await getOrdersBySupplier(user.supplierName || user.name);
    
    container.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-800">${user.name} 대시보드</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-xl shadow-lg p-6">
            <p class="text-sm text-gray-500">진행중인 발주</p>
            <p class="text-3xl font-bold text-blue-600 mt-2">${orders.length}</p>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <p class="text-sm text-gray-500">총 발주 수량</p>
            <p class="text-3xl font-bold text-purple-600 mt-2">${orders.reduce((sum, o) => sum + (o.qty || 0), 0)}</p>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <p class="text-sm text-gray-500">완료율</p>
            <p class="text-3xl font-bold text-green-600 mt-2">0%</p>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-bold mb-4">최근 발주 현황</h3>
          <div id="recent-orders"></div>
        </div>
      </div>
    `;
    
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Supplier dashboard error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

async function renderSupplierOrders(container, user) {
  try {
    UIUtils.showLoading();
    const orders = await getOrdersBySupplier(user.supplierName || user.name);
    
    container.innerHTML = `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-800">실적 입력</h2>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div id="orders-list"></div>
        </div>
      </div>
    `;
    
    renderOrdersList(orders);
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Supplier orders error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

function renderOrdersList(orders) {
  const container = document.getElementById('orders-list');
  
  if (orders.length === 0) {
    container.innerHTML = renderEmptyState('할당된 발주가 없습니다.');
    return;
  }
  
  container.innerHTML = `
    <div class="space-y-4">
      ${orders.map(order => `
        <div class="border rounded-lg p-4 hover:bg-gray-50">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-bold text-lg">${order.style}</h4>
              <p class="text-sm text-gray-500">채널: ${order.channel} | 수량: ${order.qty}개</p>
              <p class="text-sm text-gray-500">발주일: ${order.orderDate} | 입고요구일: ${order.requiredDelivery}</p>
            </div>
            <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    onclick="alert('공정 입력 기능 개발 중')">
              공정 입력
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export default { renderSupplierView };
