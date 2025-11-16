// 사용자 관리 페이지
import { UIUtils } from './utils.js';

let users = [];

export async function renderUserManagement(container) {
  try {
    UIUtils.showLoading();
    
    // Firestore에서 사용자 목록 가져오기
    users = await getUsers();
    
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-800">사용자 관리</h2>
          <button id="add-user-btn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i>사용자 추가
          </button>
        </div>
        
        <!-- 사용자 목록 테이블 -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이디</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생산업체</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">국가</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 로그인</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${users.length === 0 ? `
                <tr>
                  <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-users text-4xl mb-2"></i>
                    <p>등록된 사용자가 없습니다.</p>
                  </td>
                </tr>
              ` : users.map(user => renderUserRow(user)).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 사용자 추가/수정 모달 -->
      <div id="user-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4" id="modal-title">사용자 추가</h3>
            <form id="user-form" class="space-y-4">
              <input type="hidden" id="user-id">
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">아이디 *</label>
                <input type="text" id="user-username" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input type="text" id="user-name" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                <input type="email" id="user-email" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div id="password-section">
                <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                <input type="password" id="user-password" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       minlength="6">
                <p class="text-xs text-gray-500 mt-1">최소 6자 이상</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">역할 *</label>
                <select id="user-role" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="admin">관리자</option>
                  <option value="supplier">생산업체</option>
                </select>
              </div>
              
              <div id="supplier-fields" class="hidden space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">생산업체명</label>
                  <input type="text" id="user-supplier-name" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">국가</label>
                  <select id="user-country" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">선택</option>
                    <option value="중국">중국</option>
                    <option value="베트남">베트남</option>
                    <option value="인도">인도</option>
                  </select>
                </div>
              </div>
              
              <div class="flex justify-end space-x-3 mt-6">
                <button type="button" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400" 
                        onclick="document.getElementById('user-modal').classList.add('hidden')">
                  취소
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- 비밀번호 재설정 모달 -->
      <div id="password-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">비밀번호 재설정</h3>
            <form id="password-form" class="space-y-4">
              <input type="hidden" id="password-user-id">
              
              <div>
                <p class="text-sm text-gray-600 mb-4">
                  사용자: <strong id="password-user-name"></strong>
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 *</label>
                <input type="password" id="new-password" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       minlength="6">
                <p class="text-xs text-gray-500 mt-1">최소 6자 이상</p>
              </div>
              
              <div class="flex justify-end space-x-3 mt-6">
                <button type="button" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400" 
                        onclick="document.getElementById('password-modal').classList.add('hidden')">
                  취소
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  재설정
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    setupEventListeners();
    UIUtils.hideLoading();
  } catch (error) {
    console.error('User management render error:', error);
    UIUtils.hideLoading();
    UIUtils.showAlert('사용자 관리 페이지를 불러오는데 실패했습니다.', 'error');
  }
}

function renderUserRow(user) {
  const roleText = user.role === 'admin' ? '관리자' : '생산업체';
  const roleBadge = user.role === 'admin' 
    ? 'bg-purple-100 text-purple-800' 
    : 'bg-green-100 text-green-800';
  
  const lastLogin = user.lastLogin 
    ? new Date(user.lastLogin.toDate()).toLocaleString('ko-KR') 
    : '-';
  
  const createdAt = user.createdAt 
    ? new Date(user.createdAt.toDate()).toLocaleString('ko-KR') 
    : '-';
  
  return `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${user.username}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${user.name}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-500">${user.email}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleBadge}">
          ${roleText}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${user.supplierName || '-'}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${user.country || '-'}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-500">${lastLogin}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-500">${createdAt}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 mr-3 edit-user-btn" data-user-id="${user.id}">
          <i class="fas fa-edit"></i> 수정
        </button>
        <button class="text-green-600 hover:text-green-900 mr-3 reset-password-btn" data-user-id="${user.id}">
          <i class="fas fa-key"></i> 비밀번호
        </button>
        <button class="text-red-600 hover:text-red-900 delete-user-btn" data-user-id="${user.id}">
          <i class="fas fa-trash"></i> 삭제
        </button>
      </td>
    </tr>
  `;
}

function setupEventListeners() {
  // 사용자 추가 버튼
  const addUserBtn = document.getElementById('add-user-btn');
  if (addUserBtn) {
    addUserBtn.addEventListener('click', () => {
      openUserModal();
    });
  }
  
  // 역할 선택 변경 시 생산업체 필드 표시/숨김
  const roleSelect = document.getElementById('user-role');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      const supplierFields = document.getElementById('supplier-fields');
      if (e.target.value === 'supplier') {
        supplierFields.classList.remove('hidden');
      } else {
        supplierFields.classList.add('hidden');
      }
    });
  }
  
  // 사용자 폼 제출
  const userForm = document.getElementById('user-form');
  if (userForm) {
    userForm.addEventListener('submit', handleUserFormSubmit);
  }
  
  // 비밀번호 폼 제출
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', handlePasswordFormSubmit);
  }
  
  // 수정 버튼들
  document.querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const userId = e.currentTarget.dataset.userId;
      openUserModal(userId);
    });
  });
  
  // 비밀번호 재설정 버튼들
  document.querySelectorAll('.reset-password-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const userId = e.currentTarget.dataset.userId;
      openPasswordModal(userId);
    });
  });
  
  // 삭제 버튼들
  document.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const userId = e.currentTarget.dataset.userId;
      handleDeleteUser(userId);
    });
  });
}

function openUserModal(userId = null) {
  const modal = document.getElementById('user-modal');
  const form = document.getElementById('user-form');
  const title = document.getElementById('modal-title');
  const passwordSection = document.getElementById('password-section');
  
  form.reset();
  
  if (userId) {
    // 수정 모드
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    title.textContent = '사용자 수정';
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-username').disabled = true; // 아이디는 수정 불가
    document.getElementById('user-name').value = user.name;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role;
    
    if (user.role === 'supplier') {
      document.getElementById('supplier-fields').classList.remove('hidden');
      document.getElementById('user-supplier-name').value = user.supplierName || '';
      document.getElementById('user-country').value = user.country || '';
    }
    
    // 수정 시에는 비밀번호 필드 숨김
    passwordSection.classList.add('hidden');
    document.getElementById('user-password').required = false;
  } else {
    // 추가 모드
    title.textContent = '사용자 추가';
    document.getElementById('user-username').disabled = false;
    passwordSection.classList.remove('hidden');
    document.getElementById('user-password').required = true;
  }
  
  modal.classList.remove('hidden');
}

function openPasswordModal(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  
  const modal = document.getElementById('password-modal');
  document.getElementById('password-user-id').value = user.id;
  document.getElementById('password-user-name').textContent = `${user.name} (${user.username})`;
  document.getElementById('new-password').value = '';
  
  modal.classList.remove('hidden');
}

async function handleUserFormSubmit(e) {
  e.preventDefault();
  
  const userId = document.getElementById('user-id').value;
  const username = document.getElementById('user-username').value.trim();
  const name = document.getElementById('user-name').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const password = document.getElementById('user-password').value;
  const role = document.getElementById('user-role').value;
  
  const userData = {
    username,
    name,
    email,
    role
  };
  
  if (role === 'supplier') {
    userData.supplierName = document.getElementById('user-supplier-name').value.trim();
    userData.country = document.getElementById('user-country').value;
  }
  
  try {
    UIUtils.showLoading();
    
    if (userId) {
      // 수정
      await updateUser(userId, userData);
      UIUtils.showAlert('사용자 정보가 수정되었습니다.', 'success');
    } else {
      // 추가
      userData.password = password;
      await createUser(userData);
      UIUtils.showAlert('사용자가 추가되었습니다.', 'success');
    }
    
    // 목록 새로고침
    users = await getUsers();
    const container = document.getElementById('main-content');
    await renderUserManagement(container);
    
    document.getElementById('user-modal').classList.add('hidden');
  } catch (error) {
    console.error('User save error:', error);
    UIUtils.showAlert(error.message || '사용자 저장에 실패했습니다.', 'error');
  } finally {
    UIUtils.hideLoading();
  }
}

async function handlePasswordFormSubmit(e) {
  e.preventDefault();
  
  const userId = document.getElementById('password-user-id').value;
  const newPassword = document.getElementById('new-password').value;
  
  try {
    const confirmed = await UIUtils.confirm('비밀번호를 재설정하시겠습니까?');
    if (!confirmed) return;
    
    UIUtils.showLoading();
    await resetUserPassword(userId, newPassword);
    UIUtils.showAlert('비밀번호가 재설정되었습니다.', 'success');
    document.getElementById('password-modal').classList.add('hidden');
  } catch (error) {
    console.error('Password reset error:', error);
    UIUtils.showAlert(error.message || '비밀번호 재설정에 실패했습니다.', 'error');
  } finally {
    UIUtils.hideLoading();
  }
}

async function handleDeleteUser(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  
  const confirmed = await UIUtils.confirm(
    `사용자 "${user.name} (${user.username})"을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
  );
  
  if (!confirmed) return;
  
  try {
    UIUtils.showLoading();
    await deleteUser(userId);
    UIUtils.showAlert('사용자가 삭제되었습니다.', 'success');
    
    // 목록 새로고침
    users = await getUsers();
    const container = document.getElementById('main-content');
    await renderUserManagement(container);
  } catch (error) {
    console.error('User delete error:', error);
    UIUtils.showAlert(error.message || '사용자 삭제에 실패했습니다.', 'error');
  } finally {
    UIUtils.hideLoading();
  }
}

// Firestore 함수들
async function getUsers() {
  try {
    // createdAt 필드가 없는 문서도 포함하기 위해 정렬 제거하고 클라이언트에서 정렬
    const snapshot = await window.db.collection('users').get();
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 클라이언트에서 정렬 (createdAt이 없는 경우 최신으로 간주)
    users.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA; // 최신순
    });
    
    console.log('📋 가져온 사용자 목록:', users);
    
    return users;
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
}

async function createUser(userData) {
  try {
    // Firebase Authentication 계정 생성
    const authResult = await window.auth.createUserWithEmailAndPassword(
      userData.email,
      userData.password
    );
    
    // Firestore에 사용자 정보 저장 (Auth UID를 문서 ID로 사용)
    await window.db.collection('users').doc(authResult.user.uid).set({
      username: userData.username,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      supplierName: userData.supplierName || null,
      country: userData.country || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: null
    });
    
    // 현재 사용자로 다시 로그인 (관리자)
    // Note: createUserWithEmailAndPassword는 자동으로 새 사용자로 로그인하므로
    // 관리자 세션을 유지하려면 다시 로그인해야 함
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('이미 사용 중인 이메일입니다.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('유효하지 않은 이메일 형식입니다.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('비밀번호가 너무 약합니다. 최소 6자 이상 입력하세요.');
    }
    
    throw error;
  }
}

async function updateUser(userId, userData) {
  try {
    await window.db.collection('users').doc(userId).update({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      supplierName: userData.supplierName || null,
      country: userData.country || null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
}

async function resetUserPassword(userId, newPassword) {
  try {
    // Firebase Admin SDK가 필요하므로, 실제로는 Cloud Function을 통해 처리해야 함
    // 여기서는 간단한 구현으로 사용자에게 비밀번호 재설정 이메일 발송
    const userDoc = await window.db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    // 비밀번호 재설정 이메일 발송
    await window.auth.sendPasswordResetEmail(userData.email);
    
    UIUtils.showAlert(
      `비밀번호 재설정 이메일이 ${userData.email}로 발송되었습니다.`,
      'success'
    );
  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('사용자를 찾을 수 없습니다.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('유효하지 않은 이메일입니다.');
    }
    
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    // Firestore에서 사용자 정보 삭제
    await window.db.collection('users').doc(userId).delete();
    
    // Firebase Authentication에서도 삭제하려면 Cloud Function 필요
    // 현재는 Firestore만 삭제
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
}

export default {
  renderUserManagement
};
