// 생산업체 관리
import { getAllSuppliers } from './firestore-service.js';
import { renderEmptyState } from './ui-components.js';
import { UIUtils } from './utils.js';

export async function renderSupplierManagement(container) {
  try {
    UIUtils.showLoading();
    const suppliers = await getAllSuppliers();
    
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">생산업체 관리</h2>
          <button id="add-supplier-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i>업체 추가
          </button>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div id="suppliers-table"></div>
        </div>
      </div>
    `;
    
    renderSuppliersTable(suppliers);
    UIUtils.hideLoading();
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Supplier management error:', error);
    container.innerHTML = renderEmptyState('데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

function renderSuppliersTable(suppliers) {
  const container = document.getElementById('suppliers-table');
  
  if (suppliers.length === 0) {
    container.innerHTML = renderEmptyState('등록된 생산업체가 없습니다.');
    return;
  }
  
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs uppercase">
          <tr>
            <th class="px-4 py-3">업체명</th>
            <th class="px-4 py-3">국가</th>
            <th class="px-4 py-3">담당자</th>
            <th class="px-4 py-3">이메일</th>
            <th class="px-4 py-3">연락처</th>
            <th class="px-4 py-3">상태</th>
          </tr>
        </thead>
        <tbody>
          ${suppliers.map(supplier => `
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">${supplier.name}</td>
              <td class="px-4 py-3">${supplier.country}</td>
              <td class="px-4 py-3">${supplier.contact || '-'}</td>
              <td class="px-4 py-3">${supplier.email || '-'}</td>
              <td class="px-4 py-3">${supplier.phone || '-'}</td>
              <td class="px-4 py-3">
                <span class="badge badge-success">${supplier.status || '활성'}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export default { renderSupplierManagement };
