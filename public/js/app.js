// 메인 앱 로직
import { login, logout, getCurrentUser, isAdmin, isSupplier, isViewer, canView, initializeTestUsers } from './auth.js';
import { UIUtils } from './utils.js';
import { renderSidebar } from './ui-components.js';
import { renderDashboard } from './dashboard.js';
import { renderOrderManagement } from './order-management.js';
import { renderAnalytics } from './analytics.js';
import { renderSupplierView } from './supplier-view.js';
import { renderManufacturerManagement } from './manufacturer-management.js';
import { renderWeeklyReport } from './weekly-report.js';
import { renderUserManagement } from './user-management.js';
import { renderUserManual } from './user-manual.js';
import { initI18n, setLanguage, getCurrentLanguage, t } from './i18n.js';

// 전역 상태
let currentView = null;

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 ELCANTO SCM Portal 시작');
  
  // 다국어 초기화
  initI18n();
  updateLoginPageLanguage();
  
  // 언어 선택 버튼 이벤트 리스너
  document.getElementById('lang-ko')?.addEventListener('click', () => {
    setLanguage('ko');
    updateLoginPageLanguage();
    updateLanguageButtons();
  });
  
  document.getElementById('lang-en')?.addEventListener('click', () => {
    setLanguage('en');
    updateLoginPageLanguage();
    updateLanguageButtons();
  });
  
  // 초기 언어 버튼 상태 설정
  updateLanguageButtons();
  
  // 테스트 사용자 초기화 (개발 환경)
  if (window.isDevelopment) {
    try {
      await initializeTestUsers();
    } catch (error) {
      console.error('테스트 사용자 초기화 실패:', error);
    }
  }
  
  // 로그인 폼 이벤트 리스너
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', handleLogin);
  
  // 로그아웃 버튼 이벤트 리스너
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', handleLogout);
  
  // 사이드바 클릭 이벤트 (이벤트 위임)
  const sidebar = document.getElementById('sidebar-container');
  sidebar.addEventListener('click', (e) => {
    const btn = e.target.closest('.sidebar-btn');
    if (btn) {
      const view = btn.dataset.view;
      navigateTo(view);
    }
  });
  
  // 모달 닫기 버튼들
  document.querySelectorAll('.modal-cancel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('[id$="-modal"]');
      if (modal) {
        UIUtils.closeModal(modal.id);
      }
    });
  });
  
  // 세션 확인
  checkSession();
});

// 로그인 처리
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  
  if (!username || !password) {
    errorEl.textContent = '아이디와 비밀번호를 입력하세요.';
    errorEl.classList.remove('hidden');
    return;
  }
  
  try {
    errorEl.classList.add('hidden');
    const user = await login(username, password);
    console.log('✅ 로그인 성공:', user.name);
    showAppView(user);
  } catch (error) {
    console.error('❌ 로그인 실패:', error);
    errorEl.textContent = error.message || '로그인에 실패했습니다.';
    errorEl.classList.remove('hidden');
  }
}

// 로그아웃 처리
async function handleLogout() {
  try {
    const confirmed = await UIUtils.confirm('로그아웃 하시겠습니까?');
    if (!confirmed) return;
    
    await logout();
    console.log('👋 로그아웃 완료');
    showLoginView();
  } catch (error) {
    console.error('❌ 로그아웃 실패:', error);
    UIUtils.showAlert('로그아웃에 실패했습니다.', 'error');
  }
}

// 세션 확인
function checkSession() {
  const user = getCurrentUser();
  if (user) {
    showAppView(user);
  } else {
    showLoginView();
  }
}

// 로그인 화면 표시
function showLoginView() {
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('app-view').classList.add('hidden');
  document.getElementById('login-form').reset();
}

// 언어 변경 핸들러 (한 번만 등록)
let languageChangeHandler = null;

// 앱 화면 표시
function showAppView(user) {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('app-view').classList.remove('hidden');
  
  // 사용자 정보 표시
  let roleText = '';
  let roleBadge = '';
  
  if (user.role === 'admin') {
    roleText = '관리자';
    roleBadge = 'bg-blue-100 text-blue-800';
  } else if (user.role === 'viewer') {
    roleText = '조회자';
    roleBadge = 'bg-gray-100 text-gray-800';
  } else if (user.role === 'supplier') {
    roleText = '생산업체';
    roleBadge = 'bg-green-100 text-green-800';
  }
  
  document.getElementById('user-display').innerHTML = `
    ${user.name}
    <span class="ml-2 px-2 py-0.5 text-xs rounded-full ${roleBadge}">${roleText}</span>
  `;
  
  // 앱 타이틀 업데이트
  updateAppTitle();
  
  // 로그아웃 버튼 텍스트 업데이트
  updateLogoutButton();
  
  // 사이드바 렌더링
  renderSidebar(user.role);
  
  // 언어 변경 이벤트 리스너 (중복 방지)
  if (!languageChangeHandler) {
    languageChangeHandler = () => {
      updateAppTitle();
      renderSidebar(user.role);
      updateLogoutButton();
      // 현재 뷰 다시 렌더링
      if (currentView) {
        const tempView = currentView;
        currentView = null; // 중복 방지
        navigateTo(tempView);
      }
    };
    window.addEventListener('languageChanged', languageChangeHandler);
  }
  
  // 초기 뷰 로드
  if (isAdmin()) {
    navigateTo('dashboard');
  } else if (isSupplier()) {
    navigateTo('supplier-dashboard');
  }
}

// 뷰 네비게이션
function navigateTo(view) {
  if (currentView === view) return;
  
  currentView = view;
  const mainContent = document.getElementById('main-content');
  
  // 모든 사이드바 버튼 비활성화
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // 현재 뷰 버튼 활성화
  const activeBtn = document.querySelector(`[data-view="${view}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // 뷰 렌더링
  try {
    switch (view) {
      case 'dashboard':
        renderDashboard(mainContent);
        break;
      case 'order-management':
        renderOrderManagement(mainContent);
        break;
      case 'analytics':
        renderAnalytics(mainContent);
        break;
      case 'weekly-report':
        renderWeeklyReport(mainContent);
        break;
      case 'manufacturer-management':
        renderManufacturerManagement(mainContent);
        break;
      case 'user-management':
        renderUserManagement(mainContent);
        break;
      case 'user-manual':
        renderUserManual();
        break;
      case 'supplier-dashboard':
        renderSupplierView(mainContent, 'dashboard');
        break;
      case 'supplier-orders':
        renderSupplierView(mainContent, 'orders');
        break;
      default:
        mainContent.innerHTML = '<div class="text-center text-gray-500 mt-10">페이지를 찾을 수 없습니다.</div>';
    }
  } catch (error) {
    console.error('뷰 렌더링 오류:', error);
    mainContent.innerHTML = `
      <div class="text-center text-red-500 mt-10">
        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
        <p>페이지를 로드하는 중 오류가 발생했습니다.</p>
        <p class="text-sm mt-2">${error.message}</p>
      </div>
    `;
  }
}

// 로그인 페이지 언어 업데이트
function updateLoginPageLanguage() {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  
  document.getElementById('login-title').textContent = t('loginTitle');
  document.getElementById('login-subtitle').textContent = t('loginSubtitle');
  document.getElementById('label-username').textContent = t('username');
  document.getElementById('label-password').textContent = t('password');
  document.getElementById('login-button').textContent = t('loginButton');
  document.getElementById('account-inquiry-title').textContent = t('accountInquiry');
  document.getElementById('account-inquiry-text1').textContent = t('accountInquiryText1');
  document.getElementById('account-inquiry-text2').textContent = t('accountInquiryText2');
  
  // Placeholder 업데이트
  if (usernameInput) usernameInput.placeholder = t('username');
  if (passwordInput) passwordInput.placeholder = t('password');
}

// 언어 버튼 상태 업데이트
function updateLanguageButtons() {
  const currentLang = getCurrentLanguage();
  const koBtn = document.getElementById('lang-ko');
  const enBtn = document.getElementById('lang-en');
  
  if (currentLang === 'ko') {
    koBtn?.classList.add('active');
    enBtn?.classList.remove('active');
  } else {
    koBtn?.classList.remove('active');
    enBtn?.classList.add('active');
  }
}

// 앱 타이틀 업데이트
function updateAppTitle() {
  const appTitle = document.getElementById('app-title');
  if (appTitle) {
    appTitle.textContent = t('appTitle');
  }
}

// 로그아웃 버튼 업데이트
function updateLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket mr-1"></i>${t('logout')}`;
  }
}

// 전역 함수로 export
window.navigateTo = navigateTo;
window.isAdmin = isAdmin;
window.isViewer = isViewer;
window.canView = canView;

export { navigateTo, showLoginView, showAppView };
