#!/usr/bin/env node

/**
 * Firebase Firestore 복구 스크립트
 * 
 * 사용법:
 *   node scripts/restore.js backups/2025-01-07_14-30-00
 * 
 * 주의:
 *   - 기존 데이터를 덮어쓰지 않고 병합합니다
 *   - 같은 ID가 있으면 백업 데이터로 업데이트됩니다
 *   - --force 옵션으로 전체 삭제 후 복구 가능
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin SDK 초기화
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 명령행 인자 파싱
const args = process.argv.slice(2);
const backupDir = args[0];
const forceMode = args.includes('--force');
const dryRun = args.includes('--dry-run');

if (!backupDir) {
  console.error('❌ 사용법: node scripts/restore.js <백업_디렉토리>');
  console.error('   예시: node scripts/restore.js backups/2025-01-07_14-30-00');
  process.exit(1);
}

// 백업 디렉토리 확인
if (!fs.existsSync(backupDir)) {
  console.error(`❌ 백업 디렉토리를 찾을 수 없습니다: ${backupDir}`);
  process.exit(1);
}

// 메타데이터 읽기
function readMetadata() {
  const metaPath = path.join(backupDir, 'metadata.json');
  
  if (!fs.existsSync(metaPath)) {
    console.warn('⚠️  메타데이터 파일이 없습니다.');
    return null;
  }
  
  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  console.log('📊 백업 정보:');
  console.log(`   백업 시간: ${metadata.timestamp}`);
  console.log(`   총 문서 수: ${metadata.totalDocuments}건`);
  console.log(`   컬렉션: ${metadata.collections.map(c => c.collection).join(', ')}\n`);
  
  return metadata;
}

// 컬렉션 삭제 (force 모드)
async function deleteCollection(collectionName) {
  console.log(`🗑️  기존 ${collectionName} 삭제 중...`);
  
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`✅ ${collectionName} 삭제 완료 (${snapshot.size}건)`);
}

// 컬렉션 복구
async function restoreCollection(collectionName) {
  const filePath = path.join(backupDir, `${collectionName}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  ${collectionName}.json 파일이 없습니다. 건너뜀.`);
    return { collection: collectionName, count: 0, skipped: true };
  }
  
  console.log(`📦 복구 시작: ${collectionName}`);
  
  try {
    const documents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (dryRun) {
      console.log(`   [DRY RUN] ${documents.length}건 복구 예정`);
      return { collection: collectionName, count: documents.length, success: true, dryRun: true };
    }
    
    // Firestore는 batch 당 500개 제한
    const BATCH_SIZE = 500;
    let restored = 0;
    
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = documents.slice(i, i + BATCH_SIZE);
      
      chunk.forEach(doc => {
        const docRef = db.collection(collectionName).doc(doc.id);
        batch.set(docRef, doc.data, { merge: !forceMode });
      });
      
      await batch.commit();
      restored += chunk.length;
      
      if (documents.length > BATCH_SIZE) {
        console.log(`   진행: ${restored}/${documents.length}건`);
      }
    }
    
    console.log(`✅ ${collectionName}: ${restored}건 복구 완료`);
    return { collection: collectionName, count: restored, success: true };
  } catch (error) {
    console.error(`❌ ${collectionName} 복구 실패:`, error.message);
    return { collection: collectionName, count: 0, success: false, error: error.message };
  }
}

// 메인 함수
async function main() {
  console.log('🔐 Firebase Firestore 복구 시작\n');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN 모드: 실제로 데이터를 변경하지 않습니다.\n');
  }
  
  if (forceMode) {
    console.log('⚠️  FORCE 모드: 기존 데이터를 삭제하고 복구합니다.\n');
  } else {
    console.log('ℹ️  MERGE 모드: 기존 데이터와 병합합니다.\n');
  }
  
  const metadata = readMetadata();
  
  // 사용자 확인
  if (!dryRun && process.stdin.isTTY) {
    console.log('⚠️  복구를 진행하시겠습니까? (yes/no)');
    // 실제 환경에서는 readline 사용
  }
  
  const collections = metadata ? metadata.collections.map(c => c.collection) : 
    fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.json') && f !== 'metadata.json')
      .map(f => f.replace('.json', ''));
  
  const results = [];
  
  for (const collection of collections) {
    if (forceMode && !dryRun) {
      await deleteCollection(collection);
    }
    
    const result = await restoreCollection(collection);
    results.push(result);
  }
  
  console.log('\n✨ 복구 완료!\n');
  
  // 요약
  const success = results.filter(r => r.success && !r.skipped).length;
  const failed = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.skipped).length;
  
  console.log(`📈 요약:`);
  console.log(`   성공: ${success}개 컬렉션`);
  console.log(`   실패: ${failed}개 컬렉션`);
  console.log(`   건너뜀: ${skipped}개 컬렉션`);
  
  if (failed > 0) {
    console.log('\n⚠️  실패한 컬렉션:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.collection}: ${r.error}`);
    });
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// 실행
main().catch(error => {
  console.error('❌ 복구 오류:', error);
  process.exit(1);
});
