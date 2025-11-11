// 인증 관련 로직
import { auth, db } from './firebase-config.js';

// 현재 로그인한 사용자 정보
let currentUser = null;
let currentUserData = null;

// 로그인
async function login(username, password) {
  try {
    // Firestore에서 사용자 찾기
    const usersSnapshot = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    // 비밀번호 확인 (실제 환경에서는 더 안전한 방법 사용)
    if (userData.password !== password) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
    
    // Firebase Auth 로그인 (Custom Token 방식)
    // 실제로는 Cloud Function을 통해 Custom Token 생성
    // 여기서는 간단하게 익명 로그인 후 사용자 정보 연결
    const authResult = await auth.signInAnonymously();
    
    // 사용자 정보 저장
    currentUser = authResult.user;
    currentUserData = {
      uid: userDoc.id,
      ...userData
    };
    
    // 로그인 시간 업데이트
    await db.collection('users').doc(userDoc.id).update({
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return currentUserData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// 로그아웃
async function logout() {
  try {
    await auth.signOut();
    currentUser = null;
    currentUserData = null;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// 현재 사용자 정보 가져오기
function getCurrentUser() {
  return currentUserData;
}

// 관리자 권한 확인
function isAdmin() {
  return currentUserData && currentUserData.role === 'admin';
}

// 생산업체 권한 확인
function isSupplier() {
  return currentUserData && currentUserData.role === 'supplier';
}

// 인증 상태 변경 리스너
function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      callback(currentUserData);
    } else {
      currentUser = null;
      currentUserData = null;
      callback(null);
    }
  });
}

export {
  login,
  logout,
  getCurrentUser,
  isAdmin,
  isSupplier,
  onAuthStateChanged
};
