// 공정 입고진척 현황
import { getOrdersWithProcesses } from './firestore-service.js';
import { renderEmptyState } from './ui-components.js';
import { UIUtils, DateUtils, FormatUtils } from './utils.js';

export async function renderAnalytics(container) {
  try {
    UIUtils.showLoading();
    const orders = await getOrdersWithProcesses();
    
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">공정 입고진척 현황</h2>
          <div class="flex space-x-2">
            <select id="analytics-channel-filter" class="px-3 py-2 border rounded-lg">
              <option value="전체">전체 채널</option>
              <option value="IM">IM</option>
              <option value="ELCANTO">ELCANTO</option>
            </select>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div id="analytics-table"></div>
        </div>
      </div>
    `;
    
    renderAnalyticsTable(orders, '전체');
    
    document.getElementById('analytics-channel-filter').addEventListener('change', (e) => {
      const filtered = e.target.value === '전체' 
        ? orders 
        : orders.filter(o => o.channel === e.target.value);
      renderAnalyticsTable(filtered, e.target.value);
    });
    
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Analytics render error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

function renderAnalyticsTable(orders, channelFilter) {
  const container = document.getElementById('analytics-table');
  
  if (orders.length === 0) {
    container.innerHTML = renderEmptyState('데이터가 없습니다.');
    return;
  }
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs uppercase">
          <tr>
            <th class="px-4 py-3">No</th>
            <th class="px-4 py-3">채널</th>
            <th class="px-4 py-3">스타일</th>
            <th class="px-4 py-3">생산업체</th>
            <th class="px-4 py-3">수량</th>
            <th class="px-4 py-3">발주일</th>
            <th class="px-4 py-3">입고요구일</th>
            <th class="px-4 py-3">상태</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((order, index) => {
            const arrivalProcess = order.schedule.shipping.find(p => p.processKey === 'arrival');
            const status = arrivalProcess?.actualDate ? '입고완료' : '진행중';
            const statusClass = status === '입고완료' ? 'text-green-600' : 'text-blue-600';
            
            return `
              <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3">${index + 1}</td>
                <td class="px-4 py-3">${order.channel}</td>
                <td class="px-4 py-3 font-medium">${order.style}</td>
                <td class="px-4 py-3">${order.supplier}</td>
                <td class="px-4 py-3">${FormatUtils.formatNumber(order.qty)}</td>
                <td class="px-4 py-3">${order.orderDate}</td>
                <td class="px-4 py-3">${order.requiredDelivery}</td>
                <td class="px-4 py-3 ${statusClass} font-bold">${status}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export default { renderAnalytics };
