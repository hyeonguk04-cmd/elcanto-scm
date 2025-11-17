// 생산업체 관리 페이지
import { UIUtils } from './utils.js';
import { 
  getAllManufacturers, 
  addManufacturer, 
  updateManufacturer,
  deleteManufacturer 
} from './firestore-service.js';

let manufacturers = [];
let currentEditId = null;

// 메인 렌더링 함수
export async function renderManufacturerManagement(container) {
  container.innerHTML = `
    <div class="manufacturer-management">
      <!-- 헤더 -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">생산업체 관리</h2>
          <p class="text-sm text-gray-500 mt-1">생산업체 정보를 등록하고 관리합니다</p>
        </div>
        <button id="add-manufacturer-btn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200">
          <i class="fas fa-plus mr-2"></i>업체 추가
        </button>
      </div>

      <!-- 테이블 -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NO.</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">업체명</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">연락처</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">담당자명</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">국가</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">주소</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">이메일</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">세금번호</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">인증조항</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">공정방법</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">주요 제품</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">관리</th>
              </tr>
            </thead>
            <tbody id="manufacturers-table-body">
              <tr>
                <td colspan="12" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
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
      <div class="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 id="modal-title" class="text-xl font-bold mb-6">생산업체 정보 편집</h3>
        
        <form id="manufacturer-form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 업체명 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">업체명 <span class="text-red-500">*</span></label>
              <input type="text" id="name" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- 담당자명 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">담당자명 <span class="text-red-500">*</span></label>
              <input type="text" id="manager" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- 연락처 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">연락처 <span class="text-red-500">*</span></label>
              <input type="tel" id="contact" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- 이메일 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>

            <!-- 국가 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">국가 <span class="text-red-500">*</span></label>
              <select id="country" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">선택하세요</option>
                <option value="베트남">베트남</option>
                <option value="중국">중국</option>
                <option value="인도네시아">인도네시아</option>
                <option value="한국">한국</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <!-- 세금번호 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">세금번호</label>
              <input type="text" id="taxNumber" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
          </div>

          <!-- 주소 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">주소</label>
            <textarea id="address" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
          </div>

          <!-- 인증조항 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">인증조항</label>
            <input type="text" id="certification" placeholder="예: ISO9001, FOB" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <!-- 공정방법 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">공정방법</label>
            <input type="text" id="processMethod" placeholder="예: 사출, 봉제" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <!-- 주요 제품 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">주요 제품</label>
            <input type="text" id="mainProducts" placeholder="예: 운동화, 샌들" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <!-- 버튼 -->
          <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
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
  await loadManufacturers();
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
    await saveManufacturer();
  });

  // 삭제 버튼
  document.getElementById('delete-btn').addEventListener('click', async () => {
    await deleteCurrentManufacturer();
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
async function loadManufacturers() {
  try {
    manufacturers = await getAllManufacturers();
    renderManufacturersTable();
  } catch (error) {
    console.error('생산업체 로드 실패:', error);
    UIUtils.showAlert('생산업체 목록을 불러오는데 실패했습니다.', 'error');
    document.getElementById('manufacturers-table-body').innerHTML = `
      <tr>
        <td colspan="12" class="px-4 py-8 text-center text-red-500">
          <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>데이터를 불러오는데 실패했습니다.</p>
        </td>
      </tr>
    `;
  }
}

// 테이블 렌더링
function renderManufacturersTable() {
  const tbody = document.getElementById('manufacturers-table-body');

  if (manufacturers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="px-4 py-8 text-center text-gray-500">
          <i class="fas fa-inbox text-4xl mb-4"></i>
          <p class="text-lg">등록된 생산업체가 없습니다.</p>
          <p class="text-sm mt-2">업체 추가 버튼을 눌러 새로운 생산업체를 등록하세요.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = manufacturers.map((manufacturer, index) => `
    <tr class="border-b hover:bg-gray-50">
      <td class="px-4 py-3 text-sm text-gray-700">${index + 1}</td>
      <td class="px-4 py-3 text-sm font-medium text-gray-900">${manufacturer.name || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${manufacturer.contact || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${manufacturer.manager || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${manufacturer.country || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title="${manufacturer.address || '-'}">${manufacturer.address || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${manufacturer.email || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${manufacturer.taxNumber || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${manufacturer.certification || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${manufacturer.processMethod || '-'}</td>
      <td class="px-4 py-3 text-sm text-gray-700">${manufacturer.mainProducts || '-'}</td>
      <td class="px-4 py-3 text-sm">
        <button class="edit-manufacturer-btn text-blue-600 hover:text-blue-800 text-xl" data-id="${manufacturer.id}" title="정보 수정">
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

    const manufacturer = manufacturers.find(m => m.id === id);
    if (manufacturer) {
      document.getElementById('name').value = manufacturer.name || '';
      document.getElementById('manager').value = manufacturer.manager || '';
      document.getElementById('contact').value = manufacturer.contact || '';
      document.getElementById('email').value = manufacturer.email || '';
      document.getElementById('country').value = manufacturer.country || '';
      document.getElementById('taxNumber').value = manufacturer.taxNumber || '';
      document.getElementById('address').value = manufacturer.address || '';
      document.getElementById('certification').value = manufacturer.certification || '';
      document.getElementById('processMethod').value = manufacturer.processMethod || '';
      document.getElementById('mainProducts').value = manufacturer.mainProducts || '';
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
async function saveManufacturer() {
  try {
    const manufacturerData = {
      name: document.getElementById('name').value.trim(),
      manager: document.getElementById('manager').value.trim(),
      contact: document.getElementById('contact').value.trim(),
      email: document.getElementById('email').value.trim(),
      country: document.getElementById('country').value,
      taxNumber: document.getElementById('taxNumber').value.trim(),
      address: document.getElementById('address').value.trim(),
      certification: document.getElementById('certification').value.trim(),
      processMethod: document.getElementById('processMethod').value.trim(),
      mainProducts: document.getElementById('mainProducts').value.trim()
    };

    // 필수 필드 검증
    if (!manufacturerData.name || !manufacturerData.manager || !manufacturerData.contact || !manufacturerData.country) {
      UIUtils.showAlert('필수 항목을 모두 입력해주세요.', 'warning');
      return;
    }

    UIUtils.showLoading();

    if (currentEditId) {
      // 수정
      await updateManufacturer(currentEditId, manufacturerData);
      UIUtils.showAlert('생산업체 정보가 수정되었습니다.', 'success');
    } else {
      // 추가
      await addManufacturer(manufacturerData);
      UIUtils.showAlert('생산업체가 추가되었습니다.', 'success');
    }

    closeModal();
    await loadManufacturers();
  } catch (error) {
    console.error('생산업체 저장 실패:', error);
    UIUtils.showAlert('저장에 실패했습니다.', 'error');
  } finally {
    UIUtils.hideLoading();
  }
}

// 생산업체 삭제
async function deleteCurrentManufacturer() {
  if (!currentEditId) return;

  try {
    const confirmed = await UIUtils.confirm('이 생산업체를 삭제하시겠습니까?');
    if (!confirmed) return;

    UIUtils.showLoading();
    await deleteManufacturer(currentEditId);
    UIUtils.showAlert('생산업체가 삭제되었습니다.', 'success');

    closeModal();
    await loadManufacturers();
  } catch (error) {
    console.error('생산업체 삭제 실패:', error);
    UIUtils.showAlert('삭제에 실패했습니다.', 'error');
  } finally {
    UIUtils.hideLoading();
  }
}

export default { renderManufacturerManagement };
