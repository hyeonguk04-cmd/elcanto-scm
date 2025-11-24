// 다국어 지원 (i18n)
const translations = {
  ko: {
    // 로그인 페이지
    loginTitle: 'ELCANTO SCM PORTAL',
    loginSubtitle: '로그인하여 생산 현황을 관리하세요.',
    username: '아이디',
    password: '비밀번호',
    loginButton: '로그인',
    accountInquiry: '계정 관련 문의',
    accountInquiryText1: '엘칸토 IT팀에 문의하여',
    accountInquiryText2: '계정 정보를 받으세요.',
    
    // 헤더
    logout: '로그아웃',
    
    // 사이드바 메뉴
    dashboard: '종합 현황',
    orderManagement: '생산 목표일정 수립',
    analytics: '공정 입고진척 현황',
    weeklyReport: '주간 리포트',
    manufacturerManagement: '생산업체 관리',
    userManagement: '사용자 관리',
    userManual: '사용 메뉴얼',
    supplierDashboard: '내 대시보드',
    supplierOrders: '실적 입력',
    
    // 공통
    all: '전체',
    channel: '채널',
    supplier: '생산업체',
    search: '검색',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '수정',
    add: '추가',
    close: '닫기',
    confirm: '확인',
    loading: '처리 중...',
    
    // KPI
    onTimeRate: '납기 준수율',
    progressRate: '입고 진행률',
    delayedQty: '지연 물량',
    totalQty: '총 발주량',
    
    // 날짜
    startDate: '시작일',
    endDate: '종료일',
    dateRange: '날짜 범위',
    
    // 메시지
    confirmLogout: '로그아웃 하시겠습니까?',
    confirmDelete: '삭제하시겠습니까?',
    saveSuccess: '저장되었습니다.',
    deleteSuccess: '삭제되었습니다.',
    errorOccurred: '오류가 발생했습니다.',
    noData: '데이터가 없습니다.',
  },
  
  en: {
    // Login page
    loginTitle: 'ELCANTO SCM PORTAL',
    loginSubtitle: 'Login to manage production status',
    username: 'Username',
    password: 'Password',
    loginButton: 'Login',
    accountInquiry: 'Account Inquiry',
    accountInquiryText1: 'Please contact',
    accountInquiryText2: 'ELCANTO IT Team for account information.',
    
    // Header
    logout: 'Logout',
    
    // Sidebar menu
    dashboard: 'Dashboard',
    orderManagement: 'Production Schedule',
    analytics: 'Process Progress',
    weeklyReport: 'Weekly Report',
    manufacturerManagement: 'Supplier Management',
    userManagement: 'User Management',
    userManual: 'User Manual',
    supplierDashboard: 'My Dashboard',
    supplierOrders: 'Performance Input',
    
    // Common
    all: 'All',
    channel: 'Channel',
    supplier: 'Supplier',
    search: 'Search',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    confirm: 'Confirm',
    loading: 'Processing...',
    
    // KPI
    onTimeRate: 'On-Time Rate',
    progressRate: 'Delivery Progress',
    delayedQty: 'Delayed Quantity',
    totalQty: 'Total Quantity',
    
    // Date
    startDate: 'Start Date',
    endDate: 'End Date',
    dateRange: 'Date Range',
    
    // Messages
    confirmLogout: 'Do you want to logout?',
    confirmDelete: 'Do you want to delete?',
    saveSuccess: 'Saved successfully.',
    deleteSuccess: 'Deleted successfully.',
    errorOccurred: 'An error occurred.',
    noData: 'No data available.',
  }
};

// 현재 언어 (기본값: 한국어)
let currentLanguage = localStorage.getItem('language') || 'ko';

// 언어 변경 함수
export function setLanguage(lang) {
  if (!translations[lang]) {
    console.error(`Language '${lang}' not supported`);
    return;
  }
  
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  
  // HTML lang 속성 변경
  document.documentElement.lang = lang;
  
  // 언어 변경 이벤트 발생
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

// 현재 언어 가져오기
export function getCurrentLanguage() {
  return currentLanguage;
}

// 번역 텍스트 가져오기
export function t(key) {
  const keys = key.split('.');
  let value = translations[currentLanguage];
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  if (value === undefined) {
    console.warn(`Translation key '${key}' not found for language '${currentLanguage}'`);
    return key;
  }
  
  return value;
}

// 모든 번역 가져오기
export function getTranslations(lang = currentLanguage) {
  return translations[lang] || translations['ko'];
}

// 초기화
export function initI18n() {
  // 저장된 언어 설정 로드
  const savedLang = localStorage.getItem('language');
  if (savedLang && translations[savedLang]) {
    setLanguage(savedLang);
  }
  
  console.log(`🌐 Language initialized: ${currentLanguage}`);
}

export default {
  setLanguage,
  getCurrentLanguage,
  t,
  getTranslations,
  initI18n
};
