// Firebase 설정
// TODO: Firebase Console에서 실제 프로젝트 설정값으로 교체하세요
const firebaseConfig = {
  apiKey: "AIzaSyCFqJnQsfSug8B5--Ilq8wuDnTNOvy8gqE",
  authDomain: "elcanto-scm.firebaseapp.com",
  projectId: "elcanto-scm",
  storageBucket: "elcanto-scm.firebasestorage.app",
  messagingSenderId: "408396102729",
  appId: "1:408396102729:web:c80b150f1ff9046dac9398",
  measurementId: "G-LLCK1MV0DK"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firebase 서비스
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// 개발 환경 설정
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 로컬 개발 환경에서는 에뮬레이터 사용 (선택사항)
if (isDevelopment && false) { // 에뮬레이터 사용시 true로 변경
  db.useEmulator('localhost', 8080);
  auth.useEmulator('http://localhost:9099');
  storage.useEmulator('localhost', 9199);
  console.log('🔧 Firebase 에뮬레이터 사용 중');
}

// Export
window.firebaseApp = firebase;
window.auth = auth;
window.db = db;
window.storage = storage;
window.isDevelopment = isDevelopment;

console.log('✅ Firebase 초기화 완료');
