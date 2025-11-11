// Firebase 설정
// TODO: Firebase Console에서 실제 프로젝트 설정값으로 교체하세요
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "elcanto-scm.firebaseapp.com",
  projectId: "elcanto-scm",
  storageBucket: "elcanto-scm.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
