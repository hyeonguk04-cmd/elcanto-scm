#!/usr/bin/env node

/**
 * 🔍 Firestore Users 데이터 분석 스크립트
 * 
 * 목적: 28명의 사용자 데이터 구조를 분석하여 Firebase Auth 마이그레이션 가능성 검증
 * - UID로 사용 가능한 문서 ID 검증
 * - 필수 필드 (email, password) 존재 확인
 * - 잠재적 문제점 미리 발견
 * 
 * 안전성: 읽기 전용, 데이터 변경 없음 ✅
 */

const admin = require('firebase-admin');
const path = require('path');

// 서비스 계정 키 경로
const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');

// Firebase Admin SDK 초기화
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK 초기화 완료\n');
} catch (error) {
  console.error('❌ Firebase Admin SDK 초기화 실패:');
  console.error('   service-account-key.json 파일이 프로젝트 루트에 있는지 확인하세요.');
  console.error('   다운로드 방법: Firebase Console → Project Settings → Service Accounts → Generate New Private Key\n');
  process.exit(1);
}

const db = admin.firestore();

// Firebase Auth UID 규칙
const UID_RULES = {
  maxLength: 128,
  // Firebase Auth는 대부분의 문자를 허용하지만, 안전을 위해 제한적으로 검증
  validPattern: /^[a-zA-Z0-9_\-\.@]+$/,
  recommendations: {
    underscore: true,    // yang_hyeonguk ✅
    hyphen: true,        // supplier-1 ✅
    dot: true,          // user.name ✅
    atSign: true,       // user@domain (이메일 형태는 비추천이지만 가능)
  }
};

/**
 * UID 유효성 검증
 */
function validateUID(uid) {
  const issues = [];
  
  if (uid.length > UID_RULES.maxLength) {
    issues.push(`⚠️ UID가 너무 깁니다 (${uid.length}자, 최대 ${UID_RULES.maxLength}자)`);
  }
  
  if (!UID_RULES.validPattern.test(uid)) {
    issues.push(`⚠️ UID에 허용되지 않는 문자가 포함되어 있습니다`);
  }
  
  if (uid.includes('@')) {
    issues.push(`💡 이메일 형태의 UID는 권장하지 않습니다 (혼동 가능)`);
  }
  
  return {
    valid: issues.length === 0 || issues.every(i => i.startsWith('💡')),
    issues
  };
}

/**
 * 사용자 데이터 분석
 */
async function analyzeUsers() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Firestore Users 컬렉션 분석 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // 모든 사용자 문서 가져오기
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`📦 총 사용자 수: ${usersSnapshot.size}명\n`);
    
    if (usersSnapshot.empty) {
      console.log('⚠️ users 컬렉션이 비어있습니다.');
      return;
    }
    
    const analysis = {
      total: usersSnapshot.size,
      valid: 0,
      warnings: 0,
      errors: 0,
      users: []
    };
    
    // 각 사용자 분석
    usersSnapshot.forEach((doc) => {
      const docId = doc.id;
      const data = doc.data();
      
      const userAnalysis = {
        docId,
        data: {},
        issues: [],
        status: 'valid'
      };
      
      // 문서 ID (UID) 검증
      const uidValidation = validateUID(docId);
      if (!uidValidation.valid) {
        userAnalysis.status = 'error';
        analysis.errors++;
      } else if (uidValidation.issues.length > 0) {
        userAnalysis.status = 'warning';
        analysis.warnings++;
      } else {
        analysis.valid++;
      }
      userAnalysis.issues.push(...uidValidation.issues);
      
      // 필수 필드 검증
      const requiredFields = ['email', 'password', 'username', 'role'];
      requiredFields.forEach(field => {
        if (!data[field]) {
          userAnalysis.issues.push(`❌ 필수 필드 누락: ${field}`);
          userAnalysis.status = 'error';
          if (userAnalysis.status !== 'error') analysis.errors++;
        } else {
          userAnalysis.data[field] = data[field];
        }
      });
      
      // 이메일 형식 검증
      if (data.email && !data.email.includes('@')) {
        userAnalysis.issues.push(`⚠️ 이메일 형식이 올바르지 않습니다: ${data.email}`);
        if (userAnalysis.status === 'valid') {
          userAnalysis.status = 'warning';
          analysis.warnings++;
          analysis.valid--;
        }
      }
      
      // 비밀번호 길이 검증 (Firebase Auth 최소 6자)
      if (data.password && data.password.length < 6) {
        userAnalysis.issues.push(`⚠️ 비밀번호가 너무 짧습니다 (${data.password.length}자, 최소 6자)`);
        if (userAnalysis.status === 'valid') {
          userAnalysis.status = 'warning';
          analysis.warnings++;
          analysis.valid--;
        }
      }
      
      // 추가 필드 확인
      const optionalFields = ['name', 'company', 'createdAt', 'lastLogin'];
      optionalFields.forEach(field => {
        if (data[field]) {
          userAnalysis.data[field] = data[field];
        }
      });
      
      analysis.users.push(userAnalysis);
    });
    
    // 결과 출력
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 분석 결과 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`✅ 마이그레이션 가능: ${analysis.valid}명`);
    console.log(`⚠️ 경고 있음: ${analysis.warnings}명`);
    console.log(`❌ 오류 있음: ${analysis.errors}명\n`);
    
    // 상세 내역
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 사용자 상세 분석');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    analysis.users.forEach((user, index) => {
      const statusIcon = user.status === 'valid' ? '✅' : 
                        user.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${index + 1}. ${statusIcon} ${user.docId}`);
      console.log(`   이메일: ${user.data.email || '(없음)'}`);
      console.log(`   이름: ${user.data.name || user.data.username || '(없음)'}`);
      console.log(`   역할: ${user.data.role || '(없음)'}`);
      console.log(`   회사: ${user.data.company || '(없음)'}`);
      
      if (user.issues.length > 0) {
        console.log(`   문제점:`);
        user.issues.forEach(issue => {
          console.log(`      ${issue}`);
        });
      }
      console.log('');
    });
    
    // 결론 및 권장사항
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 권장사항');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (analysis.errors > 0) {
      console.log('❌ 오류가 있는 사용자가 있습니다.');
      console.log('   먼저 Firestore 데이터를 수정한 후 마이그레이션을 진행하세요.\n');
    } else if (analysis.warnings > 0) {
      console.log('⚠️ 경고가 있지만 마이그레이션은 가능합니다.');
      console.log('   경고 내용을 확인하고 진행 여부를 결정하세요.\n');
    } else {
      console.log('✅ 모든 사용자 데이터가 마이그레이션 가능합니다!');
      console.log('   다음 단계: migrate-auth.js 스크립트를 dry-run 모드로 실행하세요.\n');
    }
    
    console.log('다음 명령어:');
    console.log('  node scripts/migrate-auth.js --dry-run  # 시뮬레이션');
    console.log('  node scripts/migrate-auth.js --test     # 1명 테스트');
    console.log('  node scripts/migrate-auth.js            # 전체 실행\n');
    
  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 실행
analyzeUsers()
  .then(() => {
    console.log('✅ 분석 완료\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 실행 실패:', error);
    process.exit(1);
  });
