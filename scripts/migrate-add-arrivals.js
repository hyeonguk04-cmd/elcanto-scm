#!/usr/bin/env node

/**
 * 파셜 입고 기능 마이그레이션 스크립트
 * 
 * 목적: 기존 주문(orders) 문서에 arrivals 관련 필드 추가
 * 
 * 추가할 필드:
 * - arrivals: [] (빈 배열)
 * - firstArrival: null
 * - lastArrival: null
 * - arrivalSummary: { totalReceived: 0, progress: 0, count: 0, status: 'pending' }
 * 
 * 실행 방법:
 *   node scripts/migrate-add-arrivals.js
 * 
 * 주의사항:
 * - 이미 arrivals 필드가 있는 문서는 스킵
 * - Firebase 서비스 계정 필요
 * - 프로덕션 환경에서는 백업 후 실행 권장
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase 초기화
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateOrders() {
  console.log('🚀 파셜 입고 마이그레이션 시작...\n');
  
  try {
    // 모든 주문 조회
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`📊 총 ${ordersSnapshot.size}개의 주문 발견\n`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Batch 작업 준비 (최대 500개씩)
    const batchSize = 500;
    let batch = db.batch();
    let batchCount = 0;
    
    for (const doc of ordersSnapshot.docs) {
      const data = doc.data();
      const orderId = doc.id;
      const orderInfo = `${data.style || 'N/A'}_${data.color || 'N/A'}`;
      
      try {
        // 이미 arrivals 필드가 있으면 스킵
        if (data.arrivals !== undefined) {
          console.log(`⏭️  스킵: ${orderInfo} (이미 arrivals 필드 존재)`);
          skippedCount++;
          continue;
        }
        
        // 마이그레이션할 데이터
        const migrationData = {
          arrivals: [],
          firstArrival: null,
          lastArrival: null,
          arrivalSummary: {
            totalReceived: 0,
            progress: 0,
            count: 0,
            status: 'pending'
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Batch에 추가
        batch.update(doc.ref, migrationData);
        batchCount++;
        
        console.log(`✅ 마이그레이션 예정: ${orderInfo}`);
        migratedCount++;
        
        // Batch가 가득 찼으면 커밋
        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`\n💾 Batch 커밋 완료 (${batchCount}건)\n`);
          batch = db.batch();
          batchCount = 0;
        }
        
      } catch (error) {
        console.error(`❌ 오류: ${orderInfo} - ${error.message}`);
        errorCount++;
        errors.push({ orderId, orderInfo, error: error.message });
      }
    }
    
    // 마지막 Batch 커밋
    if (batchCount > 0) {
      await batch.commit();
      console.log(`\n💾 최종 Batch 커밋 완료 (${batchCount}건)\n`);
    }
    
    // 결과 출력
    console.log('\n' + '='.repeat(60));
    console.log('📊 마이그레이션 결과');
    console.log('='.repeat(60));
    console.log(`✅ 마이그레이션 완료: ${migratedCount}건`);
    console.log(`⏭️  스킵: ${skippedCount}건 (이미 존재)`);
    console.log(`❌ 오류: ${errorCount}건`);
    console.log(`📦 총 처리: ${ordersSnapshot.size}건`);
    console.log('='.repeat(60) + '\n');
    
    if (errors.length > 0) {
      console.log('⚠️  오류 상세:');
      errors.forEach(err => {
        console.log(`  - ${err.orderInfo} (${err.orderId}): ${err.error}`);
      });
      console.log('');
    }
    
    if (migratedCount > 0) {
      console.log('🎉 마이그레이션이 성공적으로 완료되었습니다!');
      console.log('');
      console.log('다음 단계:');
      console.log('  1. Firebase Console에서 데이터 확인');
      console.log('  2. 프론트엔드에서 입고 기능 테스트');
      console.log('  3. Firebase 인덱스 생성 (arrivalSummary.status)');
      console.log('');
    }
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    throw error;
  }
}

// 실행 확인
console.log('⚠️  주의: 이 스크립트는 모든 주문 문서를 수정합니다.\n');
console.log('프로덕션 환경이라면 먼저 백업을 권장합니다.\n');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('계속 진행하시겠습니까? (yes/no): ', async (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    readline.close();
    try {
      await migrateOrders();
      process.exit(0);
    } catch (error) {
      console.error('\n💥 치명적 오류:', error);
      process.exit(1);
    }
  } else {
    console.log('\n❌ 마이그레이션 취소됨');
    readline.close();
    process.exit(0);
  }
});
