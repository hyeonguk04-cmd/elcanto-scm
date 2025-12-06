#!/usr/bin/env node

/**
 * Assembly 공정 제거 마이그레이션 스크립트
 * 
 * 이 스크립트는 Firestore의 모든 발주 건(orders)에서 assembly 공정을 제거합니다.
 * 
 * 실행 방법:
 * node migrate_remove_assembly.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateOrders() {
  console.log('🚀 Assembly 공정 제거 마이그레이션 시작...\n');
  
  try {
    // 모든 발주 가져오기
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`📦 총 ${ordersSnapshot.size}개의 발주 건 발견\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // 배치 작업을 위한 배열
    const batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500; // Firestore batch limit
    
    for (const doc of ordersSnapshot.docs) {
      const orderId = doc.id;
      const orderData = doc.data();
      
      console.log(`\n📋 처리 중: ${orderId} (스타일: ${orderData.style || 'N/A'})`);
      
      // schedule.production 배열에서 assembly 제거
      let hasAssembly = false;
      let newProduction = [];
      
      if (orderData.schedule && orderData.schedule.production) {
        newProduction = orderData.schedule.production.filter(process => {
          // assembly, 조립 공정 제거
          const isAssembly = process.processKey === 'assembly' || 
                             process.key === 'assembly' ||
                             process.name === '조립' ||
                             process.name_en === 'Assembly' ||
                             process.name_en === 'Assembly (Lasting)';
          
          if (isAssembly) {
            console.log(`  ❌ 제거: ${process.name || process.name_en || 'assembly'}`);
            hasAssembly = true;
            return false;
          }
          return true;
        });
      }
      
      // processes 컬렉션의 하위 문서들도 확인
      const processesSnapshot = await db.collection('orders').doc(orderId).collection('processes').get();
      const assemblyProcesses = [];
      
      for (const processDoc of processesSnapshot.docs) {
        const processData = processDoc.data();
        const isAssembly = processData.processKey === 'assembly' || 
                          processData.key === 'assembly' ||
                          processData.name === '조립';
        
        if (isAssembly) {
          assemblyProcesses.push(processDoc.id);
          console.log(`  ❌ 서브컬렉션에서 제거: processes/${processDoc.id}`);
        }
      }
      
      // 업데이트가 필요한 경우에만 처리
      if (hasAssembly || assemblyProcesses.length > 0) {
        try {
          // 메인 문서 업데이트
          if (hasAssembly) {
            batch.update(doc.ref, {
              'schedule.production': newProduction
            });
            batchCount++;
          }
          
          // 서브컬렉션의 assembly 문서 삭제
          for (const processId of assemblyProcesses) {
            batch.delete(db.collection('orders').doc(orderId).collection('processes').doc(processId));
            batchCount++;
          }
          
          console.log(`  ✅ 업데이트 예약 (production: ${hasAssembly ? 'Yes' : 'No'}, processes: ${assemblyProcesses.length})`);
          updatedCount++;
          
          // 배치 크기 제한 확인
          if (batchCount >= MAX_BATCH_SIZE) {
            console.log(`\n💾 배치 커밋 중 (${batchCount}개 작업)...`);
            await batch.commit();
            console.log(`✅ 배치 커밋 완료\n`);
            batchCount = 0;
          }
        } catch (error) {
          console.error(`  ⚠️ 오류 발생:`, error.message);
          errorCount++;
        }
      } else {
        console.log(`  ⏭️  Assembly 공정 없음 - 건너뜀`);
        skippedCount++;
      }
    }
    
    // 남은 배치 커밋
    if (batchCount > 0) {
      console.log(`\n💾 최종 배치 커밋 중 (${batchCount}개 작업)...`);
      await batch.commit();
      console.log(`✅ 최종 배치 커밋 완료\n`);
    }
    
    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 마이그레이션 완료!');
    console.log('='.repeat(60));
    console.log(`✅ 업데이트됨: ${updatedCount}건`);
    console.log(`⏭️  건너뜀: ${skippedCount}건`);
    console.log(`❌ 오류: ${errorCount}건`);
    console.log(`📦 전체: ${ordersSnapshot.size}건`);
    console.log('='.repeat(60) + '\n');
    
    console.log('🎉 마이그레이션이 성공적으로 완료되었습니다!');
    console.log('💡 웹사이트를 새로고침하여 변경사항을 확인하세요.\n');
    
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    throw error;
  }
}

// 스크립트 실행
migrateOrders()
  .then(() => {
    console.log('✅ 스크립트 종료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 오류:', error);
    process.exit(1);
  });
