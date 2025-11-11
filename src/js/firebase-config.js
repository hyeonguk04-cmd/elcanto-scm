// Firebase 설정
// 실제 Firebase 프로젝트 설정값으로 교체해야 합니다.
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

// Firebase 서비스 초기화
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// 로그 설정 (개발 환경에서만)
if (window.location.hostname === 'localhost') {
  firebase.firestore().useEmulator('localhost', 8080);
  firebase.auth().useEmulator('http://localhost:9099');
  firebase.storage().useEmulator('localhost', 9199);
}

export { auth, db, storage, firebaseConfig };
