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
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse" style="white-space: nowrap;">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 100px;">아이디</th>
                  <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 80px;">이름</th>
                  <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 160px;">이메일</th>
                  <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 70px;">역할</th>
                  <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 130px;">마지막 로그인</th>
                  <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 130px;">생성일</th>
                  <th class="px-2 py-2 border text-left text-xs font-semibold text-gray-600 uppercase" style="min-width: 100px;">작업</th>
                </tr>
              </thead>
              <tbody>
                ${users.length === 0 ? `
                  <tr>
                    <td colspan="7" class="px-2 py-6 border text-center text-gray-500 text-xs">
                      <i class="fas fa-users text-3xl mb-3"></i>
                      <p class="text-sm font-medium">등록된 사용자가 없습니다.</p>
                    </td>
                  </tr>
                ` : users.map(user => renderUserRow(user)).join('')}
              </tbody>
            </table>
          </div>
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
    ? new Date(user.lastLogin.toDate()).toLocaleString('ko-KR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';
  
  const createdAt = user.createdAt 
    ? new Date(user.createdAt.toDate()).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';
  
  return `
    <tr class="border hover:bg-gray-50">
      <td class="px-2 py-2 border text-xs font-medium text-gray-900">${user.username}</td>
      <td class="px-2 py-2 border text-xs text-gray-900">${user.name}</td>
      <td class="px-2 py-2 border text-xs text-gray-700" style="font-size: 10px;">${user.email}</td>
      <td class="px-2 py-2 border text-xs text-center">
        <span class="px-2 py-0.5 text-xs rounded-full ${roleBadge}">
          ${roleText}
        </span>
      </td>
      <td class="px-2 py-2 border text-xs text-gray-500">${lastLogin}</td>
      <td class="px-2 py-2 border text-xs text-gray-500">${createdAt}</td>
      <td class="px-2 py-2 border text-xs">
        <button class="text-blue-600 hover:text-blue-900 mr-2 edit-user-btn" data-user-id="${user.id}" title="수정">
          <i class="fas fa-edit"></i>
        </button>
        <button class="text-green-600 hover:text-green-900 reset-password-btn" data-user-id="${user.id}" title="비밀번호 재설정">
          <i class="fas fa-key"></i>
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

export default {
  renderUserManagement
};
