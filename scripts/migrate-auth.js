#!/usr/bin/env node

/**
 * 🚀 Firebase Authentication 마이그레이션 스크립트
 * 
 * 목적: Firestore users 컬렉션 데이터를 Firebase Authentication으로 마이그레이션
 * - Custom UID 사용 (문서 ID = Auth UID)
 * - Dry-run 모드 지원 (시뮬레이션)
 * - 테스트 모드 지원 (1명만)
 * - 전체 마이그레이션 모드
 * 
 * 사용법:
 *   node scripts/migrate-auth.js --dry-run  # 시뮬레이션만 (안전)
 *   node scripts/migrate-auth.js --test     # 1명만 테스트
 *   node scripts/migrate-auth.js            # 전체 실행
 */

const admin = require('firebase-admin');
const path = require('path');

// 서비스 계정 키 경로
const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');

// 명령줄 인자 파싱
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isTestMode = args.includes('--test');

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
const auth = admin.auth();

/**
 * Firebase Auth 사용자 생성 (Custom UID)
 */
async function createAuthUser(uid, email, password) {
  try {
    const userRecord = await auth.createUser({
      uid: uid,           // Custom UID 사용! (문서 ID와 동일)
      email: email,
      password: password,
      emailVerified: false,
      disabled: false
    });
    return { success: true, userRecord };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 마이그레이션 실행
 */
async function migrateUsers() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (isDryRun) {
    console.log('🧪 DRY-RUN 모드: 실제 생성 없이 시뮬레이션만 수행');
  } else if (isTestMode) {
    console.log('🧪 TEST 모드: 1명만 테스트 생성');
  } else {
    console.log('🚀 전체 마이그레이션 실행');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Firestore에서 모든 사용자 가져오기
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️ users 컬렉션이 비어있습니다.');
      return;
    }
    
    console.log(`📦 총 ${usersSnapshot.size}명의 사용자 발견\n`);
    
    const results = {
      total: usersSnapshot.size,
      success: 0,
      skipped: 0,
      failed: 0,
      details: []
    };
    
    let userCount = 0;
    
    // 각 사용자 처리
    for (const doc of usersSnapshot.docs) {
      userCount++;
      const docId = doc.id;
      const data = doc.data();
      
      const result = {
        uid: docId,
        email: data.email,
        username: data.username,
        name: data.name,
        status: 'pending'
      };
      
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`[${userCount}/${usersSnapshot.size}] 처리 중: ${docId}`);
      console.log(`   이메일: ${data.email}`);
      console.log(`   이름: ${data.name || data.username}`);
      console.log(`   역할: ${data.role}`);
      
      // 필수 필드 확인
      if (!data.email || !data.password) {
        console.log(`   ⚠️ 필수 필드 누락 (email 또는 password) - 건너뜀\n`);
        result.status = 'skipped';
        result.reason = '필수 필드 누락';
        results.skipped++;
        results.details.push(result);
        continue;
      }
      
      // 비밀번호 길이 확인
      if (data.password.length < 6) {
        console.log(`   ⚠️ 비밀번호가 너무 짧음 (${data.password.length}자) - 건너뜀\n`);
        result.status = 'skipped';
        result.reason = '비밀번호 길이 부족 (최소 6자)';
        results.skipped++;
        results.details.push(result);
        continue;
      }
      
      // 이미 존재하는지 확인
      try {
        const existingUser = await auth.getUser(docId);
        console.log(`   ⚠️ 이미 존재하는 사용자 - 건너뜀\n`);
        result.status = 'skipped';
        result.reason = '이미 존재함';
        results.skipped++;
        results.details.push(result);
        continue;
      } catch (error) {
        // 사용자가 존재하지 않으면 에러 발생 (정상)
        if (error.code !== 'auth/user-not-found') {
          console.log(`   ❌ 확인 실패: ${error.message}\n`);
          result.status = 'failed';
          result.error = error.message;
          results.failed++;
          results.details.push(result);
          continue;
        }
      }
      
      // Dry-run 모드
      if (isDryRun) {
        console.log(`   ✅ [시뮬레이션] 생성 가능: ${docId}\n`);
        result.status = 'simulated';
        results.success++;
        results.details.push(result);
        continue;
      }
      
      // 실제 생성
      console.log(`   🔄 Firebase Auth 사용자 생성 중...`);
      const createResult = await createAuthUser(docId, data.email, data.password);
      
      if (createResult.success) {
        console.log(`   ✅ 생성 완료! UID: ${createResult.userRecord.uid}\n`);
        result.status = 'success';
        result.createdUid = createResult.userRecord.uid;
        results.success++;
      } else {
        console.log(`   ❌ 생성 실패: ${createResult.error}\n`);
        result.status = 'failed';
        result.error = createResult.error;
        results.failed++;
      }
      
      results.details.push(result);
      
      // 테스트 모드는 1명만
      if (isTestMode) {
        console.log('🧪 테스트 모드: 1명만 처리하고 종료\n');
        break;
      }
    }
    
    // 결과 요약
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 마이그레이션 결과 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`총 처리: ${results.total}명`);
    console.log(`✅ 성공: ${results.success}명`);
    console.log(`⚠️ 건너뜀: ${results.skipped}명`);
    console.log(`❌ 실패: ${results.failed}명\n`);
    
    // 건너뛴 사용자 상세
    if (results.skipped > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️ 건너뛴 사용자');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      results.details
        .filter(r => r.status === 'skipped')
        .forEach((r, i) => {
          console.log(`${i + 1}. ${r.uid} (${r.email})`);
          console.log(`   이유: ${r.reason}\n`);
        });
    }
    
    // 실패한 사용자 상세
    if (results.failed > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ 실패한 사용자');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      results.details
        .filter(r => r.status === 'failed')
        .forEach((r, i) => {
          console.log(`${i + 1}. ${r.uid} (${r.email})`);
          console.log(`   오류: ${r.error}\n`);
        });
    }
    
    // 다음 단계 안내
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 다음 단계');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (isDryRun) {
      console.log('✅ Dry-run 완료! 문제가 없다면 실제 마이그레이션을 진행하세요.');
      console.log('   node scripts/migrate-auth.js --test  # 1명 테스트');
      console.log('   node scripts/migrate-auth.js         # 전체 실행\n');
    } else if (isTestMode) {
      console.log('✅ 테스트 완료! 테스트 계정으로 로그인을 시도해보세요.');
      console.log('   문제가 없다면 전체 마이그레이션을 진행하세요:');
      console.log('   node scripts/migrate-auth.js\n');
    } else {
      console.log('✅ 마이그레이션 완료!');
      console.log('   다음 작업:');
      console.log('   1. auth.js 파일 수정 (signInWithEmailAndPassword 사용)');
      console.log('   2. Firebase Console에서 생성된 사용자 확인');
      console.log('   3. 테스트 로그인 시도\n');
      
      if (results.failed > 0 || results.skipped > 0) {
        console.log('⚠️ 일부 사용자 처리 실패/건너뜀');
        console.log('   위의 상세 내역을 확인하고 수동으로 처리하세요.\n');
      }
    }
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 실행
console.log('\n');
migrateUsers()
  .then(() => {
    console.log('✅ 스크립트 실행 완료\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 실행 실패:', error);
    process.exit(1);
  });
