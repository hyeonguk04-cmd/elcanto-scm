// 인증 관련 로직
import { UIUtils } from './utils.js';

// 현재 로그인한 사용자 정보
let currentUser = null;
let currentUserData = null;

// 로그인
export async function login(username, password) {
  try {
    UIUtils.showLoading();
    
    // 기존 세션이 있으면 먼저 로그아웃
    try {
      const currentAuth = window.auth.currentUser;
      if (currentAuth) {
        console.log('🔄 기존 세션 로그아웃 중...');
        await window.auth.signOut();
      }
    } catch (signOutError) {
      console.warn('⚠️ 기존 세션 로그아웃 실패 (무시):', signOutError);
    }
    
    // Firestore에서 사용자 정보 찾기 (username을 문서 ID로 직접 조회)
    const userDoc = await window.db.collection('users').doc(username).get();
    
    if (!userDoc.exists) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data();
    
    // Firebase Authentication으로 이메일/비밀번호 로그인
    const authResult = await window.auth.signInWithEmailAndPassword(
      userData.email,
      password
    );
    
    // 사용자 정보 저장
    currentUser = authResult.user;
    currentUserData = {
      uid: authResult.user.uid, // Firebase Auth UID
      ...userData
    };
    
    // 로그인 시간 업데이트 (username을 문서 ID로 사용)
    try {
      await window.db.collection('users').doc(username).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ 로그인 성공: ${username} (Auth UID: ${authResult.user.uid})`);
    } catch (updateError) {
      // 업데이트 실패해도 로그인은 계속 진행
      console.warn('⚠️ lastLogin 업데이트 실패 (로그인은 성공):', updateError);
      // set()으로 재시도
      await window.db.collection('users').doc(username).set({
        ...userData,
        uid: authResult.user.uid,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    
    // 세션 스토리지에 저장
    sessionStorage.setItem('currentUser', JSON.stringify(currentUserData));
    
    UIUtils.hideLoading();
    return currentUserData;
  } catch (error) {
    UIUtils.hideLoading();
    console.error('Login error:', error);
    
    // Firebase Auth 에러 메시지를 사용자 친화적으로 변환
    let errorMessage = '로그인에 실패했습니다.';
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials') {
      errorMessage = '아이디 또는 비밀번호가 일치하지 않습니다.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = '사용자를 찾을 수 없습니다.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '잘못된 이메일 형식입니다.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = '비활성화된 계정입니다.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message && !error.message.includes('Firebase:')) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
}

// 로그아웃
export async function logout() {
  try {
    await window.auth.signOut();
    currentUser = null;
    currentUserData = null;
    sessionStorage.removeItem('currentUser');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// 현재 사용자 정보 가져오기
export function getCurrentUser() {
  // 메모리에 있으면 반환
  if (currentUserData) return currentUserData;
  
  // 세션 스토리지에서 복원
  const stored = sessionStorage.getItem('currentUser');
  if (stored) {
    currentUserData = JSON.parse(stored);
    return currentUserData;
  }
  
  return null;
}

// 관리자 권한 확인
export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

// 생산업체 권한 확인
export function isSupplier() {
  const user = getCurrentUser();
  return user && user.role === 'supplier';
}

// 조회자 권한 확인
export function isViewer() {
  const user = getCurrentUser();
  return user && user.role === 'viewer';
}

// 관리자 또는 조회자 권한 확인 (읽기 권한)
export function canView() {
  const user = getCurrentUser();
  return user && (user.role === 'admin' || user.role === 'viewer');
}

// 인증 상태 확인
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

// 인증 상태 변경 리스너
export function onAuthStateChanged(callback) {
  return window.auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      callback(getCurrentUser());
    } else {
      currentUser = null;
      currentUserData = null;
      sessionStorage.removeItem('currentUser');
      callback(null);
    }
  });
}

// 사용자 초기화 (테스트용 - 실제 환경에서는 제거)
export async function initializeTestUsers() {
  try {
    // yang_hyeonguk 관리자 계정 확인
    const hyeongukSnapshot = await window.db.collection('users')
      .where('username', '==', 'yang_hyeonguk')
      .limit(1)
      .get();
    
    if (hyeongukSnapshot.empty) {
      try {
        // Firebase Auth에 계정 생성
        const userCredential = await window.auth.createUserWithEmailAndPassword(
          'yang.hyeonguk@elcanto.com',
          'hyeonguk123!'
        );
        
        // Firestore에 사용자 정보 저장 (Auth UID를 문서 ID로 사용)
        await window.db.collection('users').doc(userCredential.user.uid).set({
          username: 'yang_hyeonguk',
          name: '양형욱',
          email: 'yang.hyeonguk@elcanto.com',
          role: 'admin',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: null
        });
        console.log('✅ yang_hyeonguk 관리자 계정 생성됨');
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log('⚠️ yang_hyeonguk 계정이 이미 Firebase Auth에 존재합니다.');
        } else {
          console.error('❌ yang_hyeonguk 계정 생성 실패:', authError);
        }
      }
    }
    
    // 기본 관리자 사용자 확인
    const adminSnapshot = await window.db.collection('users')
      .where('username', '==', 'admin')
      .limit(1)
      .get();
    
    if (adminSnapshot.empty) {
      try {
        // Firebase Auth에 계정 생성
        const userCredential = await window.auth.createUserWithEmailAndPassword(
          'admin@elcanto.com',
          'admin123'
        );
        
        // Firestore에 사용자 정보 저장
        await window.db.collection('users').doc(userCredential.user.uid).set({
          username: 'admin',
          name: '관리자',
          email: 'admin@elcanto.com',
          role: 'admin',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: null
        });
        console.log('✅ admin 관리자 계정 생성됨');
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log('⚠️ admin 계정이 이미 Firebase Auth에 존재합니다.');
        } else {
          console.error('❌ admin 계정 생성 실패:', authError);
        }
      }
    }
    
    // 생산업체 사용자들 초기화
    const suppliers = [
      { username: 'shengan', name: '성안', email: 'shengan@example.com', supplierName: '성안', country: '중국' },
      { username: 'pungdo', name: '풍도', email: 'pungdo@example.com', supplierName: '풍도', country: '중국' },
      { username: 'sungwoo', name: '성우', email: 'sungwoo@example.com', supplierName: '성우', country: '중국' },
      { username: 'jeil', name: '제일', email: 'jeil@example.com', supplierName: '제일', country: '중국' },
      { username: 'hanil', name: '한일', email: 'hanil@example.com', supplierName: '한일', country: '베트남' },
      { username: 'kumho', name: '금호', email: 'kumho@example.com', supplierName: '금호', country: '인도' }
    ];
    
    for (const supplier of suppliers) {
      const snapshot = await window.db.collection('users')
        .where('username', '==', supplier.username)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        try {
          // Firebase Auth에 계정 생성
          const userCredential = await window.auth.createUserWithEmailAndPassword(
            supplier.email,
            'supplier123'
          );
          
          // Firestore에 사용자 정보 저장
          await window.db.collection('users').doc(userCredential.user.uid).set({
            username: supplier.username,
            name: supplier.name,
            email: supplier.email,
            role: 'supplier',
            supplierName: supplier.supplierName,
            country: supplier.country,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: null
          });
          console.log(`✅ ${supplier.name} 생산업체 계정 생성됨`);
        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            console.log(`⚠️ ${supplier.username} 계정이 이미 Firebase Auth에 존재합니다.`);
          } else {
            console.error(`❌ ${supplier.username} 계정 생성 실패:`, authError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Test user initialization error:', error);
  }
}

export default {
  login,
  logout,
  getCurrentUser,
  isAdmin,
  isSupplier,
  isViewer,
  canView,
  isAuthenticated,
  onAuthStateChanged,
  initializeTestUsers
};
