// 생산업체 관리 페이지 (Suppliers 컬렉션 사용)
import { UIUtils } from './utils.js';
import { 
  getAllSuppliers, 
  addSupplier, 
  updateSupplier
} from './firestore-service.js';

let suppliers = [];
let currentEditId = null;

// 메인 렌더링 함수
export async function renderManufacturerManagement(container) {
  container.innerHTML = `
    <div class="manufacturer-management">
      <!-- 헤더 -->
      <div class="flex justify-between items-center mb-3">
        <div>
          <h2 class="text-xl font-bold text-gray-800">생산업체 관리</h2>
          <p class="text-xs text-gray-500 mt-0.5">생산업체 정보를 등록하고 관리합니다</p>
        </div>
        <button id="add-manufacturer-btn" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition duration-200 text-sm">
          <i class="fas fa-plus mr-1"></i>업체 추가
        </button>
      </div>

      <!-- 테이블 -->
      <div class="bg-white rounded-xl shadow-lg p-3">
        <div class="overflow-auto" style="max-height: calc(100vh - 110px);">
          <table class="w-full text-xs border-collapse" style="white-space: nowrap;">
            <thead class="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 40px;">NO.</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 120px;">업체명</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 80px;">국가</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 80px;">담당자</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 140px;">이메일</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 100px;">연락처</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 80px;">인도조건</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 100px;">포워딩업체</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 100px;">주요채널</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 100px;">주요품목</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 100px;">결제조건</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 60px;">상태</th>
                <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 50px;">관리</th>
              </tr>
            </thead>
            <tbody id="manufacturers-table-body">
              <tr>
                <td colspan="13" class="px-2 py-4 border text-center text-gray-500 text-xs">
                  <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
                  <p>데이터를 불러오는 중...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 생산업체 정보 모달 -->
    <div id="manufacturer-modal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center hidden z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 id="modal-title" class="text-xl font-bold mb-6">생산업체 정보 편집</h3>
        
        <form id="manufacturer-form" class="space-y-6">
          <!-- 기본 정보 -->
          <div class="border-b pb-4">
            <h4 class="text-md font-semibold text-gray-700 mb-4">기본 정보</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 업체명 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">업체명 <span class="text-red-500">*</span></label>
                <input type="text" id="name" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <!-- 국가 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">국가 <span class="text-red-500">*</span></label>
                <select id="location" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">선택하세요</option>
                  <option value="베트남">베트남</option>
                  <option value="중국">중국</option>
                  <option value="인도네시아">인도네시아</option>
                  <option value="한국">한국</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <!-- 담당자 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">담당자명 <span class="text-red-500">*</span></label>
                <input type="text" id="contact" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <!-- 이메일 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <!-- 연락처 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                <input type="tel" id="phone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <!-- 상태 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select id="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="활성">활성</option>
                  <option value="비활성">비활성</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 거래 정보 -->
          <div class="border-b pb-4">
            <h4 class="text-md font-semibold text-gray-700 mb-4">거래 정보</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 인도조건 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">인도조건</label>
                <input type="text" id="deliveryTerms" placeholder="예: FOB, CIF, EXW" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <!-- 포워딩업체 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">포워딩업체</label>
                <input type="text" id="forwarder" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <!-- 주요채널 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">주요채널</label>
                <input type="text" id="mainChannel" placeholder="예: 온라인, 오프라인, 수출" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <!-- 주요품목 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">주요품목</label>
                <input type="text" id="mainItem" placeholder="예: 운동화, 샌들, 부츠" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <!-- 결제조건 -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">결제조건</label>
                <input type="text" id="paymentTerms" placeholder="예: NET 30, NET 60, 선불" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
            </div>
          </div>

          <!-- 공정 리드타임 (일수) -->
          <div class="border-b pb-4">
            <h4 class="text-md font-semibold text-gray-700 mb-4">공정별 리드타임 (일수)</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">원단 어퍼</label>
                <input type="number" id="leadTime_material_upper" min="0" placeholder="일" class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">원단 솔</label>
                <input type="number" id="leadTime_material_sole" min="0" placeholder="일" class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">핸도컨펌</label>
                <input type="number" id="leadTime_hando_cfm" min="0" placeholder="일" class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">단절</label>
                <input type="number" id="leadTime_cutting" min="0" placeholder="일" class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">갑피제작</label>
                <input type="number" id="leadTime_upper_making" min="0" placeholder="일" class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">조립</label>
                <input type="number" id="leadTime_assembly" min="0" placeholder="일" class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">자체검수</label>
                <input type="number" id="leadTime_self_inspection" min="0" placeholder="일" class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">공장출고</label>
                <input type="number" id="leadTime_factory_shipment" min="0" placeholder="일" class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">선적</label>
                <input type="number" id="leadTime_shipping" min="0" placeholder="일" class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">입고</label>
                <input type="number" id="leadTime_arrival" min="0" placeholder="일" class="w-full px-2 py-1 text-sm border border-gray-300 rounded-md">
              </div>
            </div>
          </div>

          <!-- 버튼 -->
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" id="cancel-btn" class="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium">
              취소
            </button>
            <button type="button" id="delete-btn" class="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-medium hidden">
              <i class="fas fa-trash mr-2"></i>삭제
            </button>
            <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium">
              <i class="fas fa-save mr-2"></i>저장
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // 이벤트 리스너 등록
  attachEventListeners();

  // 데이터 로드
  await loadSuppliers();
}

// 이벤트 리스너 등록
function attachEventListeners() {
  // 업체 추가 버튼
  document.getElementById('add-manufacturer-btn').addEventListener('click', () => {
    openModal();
  });

  // 모달 닫기
  document.getElementById('cancel-btn').addEventListener('click', () => {
    closeModal();
  });

  // 폼 제출
  document.getElementById('manufacturer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSupplier();
  });

  // 삭제 버튼
  document.getElementById('delete-btn').addEventListener('click', async () => {
    await deleteCurrentSupplier();
  });

  // 테이블 클릭 이벤트 (이벤트 위임)
  document.getElementById('manufacturers-table-body').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-manufacturer-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      openModal(id);
    }
  });
}

// 생산업체 목록 로드
async function loadSuppliers() {
  try {
    console.log('생산업체 목록 로드 시작...');
    suppliers = await getAllSuppliers();
    console.log('생산업체 목록 로드 성공:', suppliers.length, '개');
    renderSuppliersTable();
  } catch (error) {
    console.error('생산업체 로드 실패:', error);
    console.error('오류 상세:', error.message);
    UIUtils.showAlert(`생산업체 목록을 불러오는데 실패했습니다: ${error.message}`, 'error');
    document.getElementById('manufacturers-table-body').innerHTML = `
      <tr>
        <td colspan="13" class="px-2 py-6 border text-center text-red-500 text-xs">
          <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
          <p class="text-sm font-medium">데이터를 불러오는데 실패했습니다.</p>
          <p class="text-xs mt-1">${error.message}</p>
        </td>
      </tr>
    `;
  }
}

// 테이블 렌더링
function renderSuppliersTable() {
  const tbody = document.getElementById('manufacturers-table-body');

  if (suppliers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="13" class="px-2 py-6 border text-center text-gray-500 text-xs">
          <i class="fas fa-inbox text-3xl mb-3"></i>
          <p class="text-sm font-medium">등록된 생산업체가 없습니다.</p>
          <p class="text-xs mt-1">업체 추가 버튼을 눌러 새로운 생산업체를 등록하세요.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = suppliers.map((supplier, index) => `
    <tr class="border hover:bg-gray-50">
      <td class="px-2 py-2 border text-xs text-gray-700">${index + 1}</td>
      <td class="px-2 py-2 border text-xs font-medium text-gray-900">${supplier.name || '-'}</td>
      <td class="px-2 py-2 border text-xs text-gray-700">${supplier.location || supplier.country || '-'}</td>
      <td class="px-2 py-2 border text-xs text-gray-700">${supplier.contact || '-'}</td>
      <td class="px-2 py-2 border text-xs text-gray-700" style="font-size: 10px;">${supplier.email || '-'}</td>
      <td class="px-2 py-2 border text-xs text-gray-700">${supplier.phone || '-'}</td>
      <td class="px-2 py-2 border text-xs text-gray-700">${supplier.deliveryTerms || '-'}</td>
      <td class="px-2 py-2 border text-xs text-gray-700">${supplier.forwarder || '-'}</td>
      <td class="px-2 py-2 border text-xs text-gray-700">${supplier.mainChannel || '-'}</td>
      <td class="px-2 py-2 border text-xs text-gray-700">${supplier.mainItem || '-'}</td>
      <td class="px-2 py-2 border text-xs text-gray-700">${supplier.paymentTerms || '-'}</td>
      <td class="px-2 py-2 border text-xs text-center">
        <span class="px-2 py-0.5 text-xs rounded-full ${supplier.status === '활성' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
          ${supplier.status || '활성'}
        </span>
      </td>
      <td class="px-2 py-2 border text-xs text-center">
        <button class="edit-manufacturer-btn text-blue-600 hover:text-blue-800 text-lg" data-id="${supplier.id}" title="정보 수정">
          📝
        </button>
      </td>
    </tr>
  `).join('');
}

// 모달 열기
function openModal(id = null) {
  currentEditId = id;
  const modal = document.getElementById('manufacturer-modal');
  const modalTitle = document.getElementById('modal-title');
  const deleteBtn = document.getElementById('delete-btn');
  const form = document.getElementById('manufacturer-form');

  // 폼 초기화
  form.reset();

  if (id) {
    // 수정 모드
    modalTitle.textContent = '생산업체 정보 편집';
    deleteBtn.classList.remove('hidden');

    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      document.getElementById('name').value = supplier.name || '';
      document.getElementById('location').value = supplier.location || supplier.country || '';
      document.getElementById('contact').value = supplier.contact || '';
      document.getElementById('email').value = supplier.email || '';
      document.getElementById('phone').value = supplier.phone || '';
      document.getElementById('status').value = supplier.status || '활성';
      
      // 거래 정보
      document.getElementById('deliveryTerms').value = supplier.deliveryTerms || '';
      document.getElementById('forwarder').value = supplier.forwarder || '';
      document.getElementById('mainChannel').value = supplier.mainChannel || '';
      document.getElementById('mainItem').value = supplier.mainItem || '';
      document.getElementById('paymentTerms').value = supplier.paymentTerms || '';

      // 리드타임 값 설정
      if (supplier.leadTimes) {
        document.getElementById('leadTime_material_upper').value = supplier.leadTimes.material_upper || '';
        document.getElementById('leadTime_material_sole').value = supplier.leadTimes.material_sole || '';
        document.getElementById('leadTime_hando_cfm').value = supplier.leadTimes.hando_cfm || '';
        document.getElementById('leadTime_cutting').value = supplier.leadTimes.cutting || '';
        document.getElementById('leadTime_upper_making').value = supplier.leadTimes.upper_making || '';
        document.getElementById('leadTime_assembly').value = supplier.leadTimes.assembly || '';
        document.getElementById('leadTime_self_inspection').value = supplier.leadTimes.self_inspection || '';
        document.getElementById('leadTime_factory_shipment').value = supplier.leadTimes.factory_shipment || '';
        document.getElementById('leadTime_shipping').value = supplier.leadTimes.shipping || '';
        document.getElementById('leadTime_arrival').value = supplier.leadTimes.arrival || '';
      }
    }
  } else {
    // 추가 모드
    modalTitle.textContent = '새 생산업체 등록';
    deleteBtn.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

// 모달 닫기
function closeModal() {
  const modal = document.getElementById('manufacturer-modal');
  modal.classList.add('hidden');
  currentEditId = null;
}

// 생산업체 저장
async function saveSupplier() {
  try {
    const supplierData = {
      name: document.getElementById('name').value.trim(),
      location: document.getElementById('location').value,
      contact: document.getElementById('contact').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      status: document.getElementById('status').value || '활성',
      deliveryTerms: document.getElementById('deliveryTerms').value.trim(),
      forwarder: document.getElementById('forwarder').value.trim(),
      mainChannel: document.getElementById('mainChannel').value.trim(),
      mainItem: document.getElementById('mainItem').value.trim(),
      paymentTerms: document.getElementById('paymentTerms').value.trim(),
      leadTimes: {
        material_upper: parseInt(document.getElementById('leadTime_material_upper').value) || 0,
        material_sole: parseInt(document.getElementById('leadTime_material_sole').value) || 0,
        hando_cfm: parseInt(document.getElementById('leadTime_hando_cfm').value) || 0,
        cutting: parseInt(document.getElementById('leadTime_cutting').value) || 0,
        upper_making: parseInt(document.getElementById('leadTime_upper_making').value) || 0,
        assembly: parseInt(document.getElementById('leadTime_assembly').value) || 0,
        self_inspection: parseInt(document.getElementById('leadTime_self_inspection').value) || 0,
        factory_shipment: parseInt(document.getElementById('leadTime_factory_shipment').value) || 0,
        shipping: parseInt(document.getElementById('leadTime_shipping').value) || 0,
        arrival: parseInt(document.getElementById('leadTime_arrival').value) || 0
      }
    };

    // 필수 필드 검증
    if (!supplierData.name || !supplierData.location || !supplierData.contact) {
      UIUtils.showAlert('필수 항목을 모두 입력해주세요.', 'warning');
      return;
    }

    UIUtils.showLoading();

    if (currentEditId) {
      // 수정
      await updateSupplier(currentEditId, supplierData);
      UIUtils.showAlert('생산업체 정보가 수정되었습니다.', 'success');
    } else {
      // 추가
      await addSupplier(supplierData);
      UIUtils.showAlert('생산업체가 추가되었습니다.', 'success');
    }

    closeModal();
    await loadSuppliers();
  } catch (error) {
    console.error('생산업체 저장 실패:', error);
    UIUtils.showAlert('저장에 실패했습니다.', 'error');
  } finally {
    UIUtils.hideLoading();
  }
}

// 생산업체 삭제
async function deleteCurrentSupplier() {
  if (!currentEditId) return;

  try {
    const confirmed = await UIUtils.confirm('이 생산업체를 삭제하시겠습니까?');
    if (!confirmed) return;

    UIUtils.showLoading();
    
    // suppliers 컬렉션에서 삭제
    await window.db.collection('suppliers').doc(currentEditId).delete();
    
    UIUtils.showAlert('생산업체가 삭제되었습니다.', 'success');

    closeModal();
    await loadSuppliers();
  } catch (error) {
    console.error('생산업체 삭제 실패:', error);
    UIUtils.showAlert('삭제에 실패했습니다.', 'error');
  } finally {
    UIUtils.hideLoading();
  }
}

export default { renderManufacturerManagement };
