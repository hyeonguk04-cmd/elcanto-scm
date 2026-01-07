#!/usr/bin/env node

/**
 * Firebase Firestore 백업 스크립트
 * 
 * 사용법:
 *   node scripts/backup.js
 * 
 * 기능:
 *   - 모든 Firestore 컬렉션을 JSON으로 export
 *   - backups/YYYY-MM-DD_HH-mm-ss/ 디렉토리에 저장
 *   - 메타데이터 포함 (백업 시간, 문서 수 등)
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

// 백업할 컬렉션 목록
const COLLECTIONS = ['orders', 'suppliers', 'users', 'processes'];

// 백업 디렉토리 생성
function createBackupDir() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');
  
  const backupDir = path.join(__dirname, '..', 'backups', timestamp);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  return backupDir;
}

// 컬렉션 백업
async function backupCollection(collectionName, backupDir) {
  console.log(`📦 백업 시작: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    const filePath = path.join(backupDir, `${collectionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf-8');
    
    console.log(`✅ ${collectionName}: ${documents.length}건 백업 완료`);
    return { collection: collectionName, count: documents.length, success: true };
  } catch (error) {
    console.error(`❌ ${collectionName} 백업 실패:`, error.message);
    return { collection: collectionName, count: 0, success: false, error: error.message };
  }
}

// 메타데이터 저장
function saveMetadata(backupDir, results) {
  const metadata = {
    timestamp: new Date().toISOString(),
    collections: results,
    totalDocuments: results.reduce((sum, r) => sum + r.count, 0)
  };
  
  const metaPath = path.join(backupDir, 'metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf-8');
  
  console.log('\n📊 백업 메타데이터:');
  console.log(`   시간: ${metadata.timestamp}`);
  console.log(`   총 문서 수: ${metadata.totalDocuments}건`);
}

// 메인 함수
async function main() {
  console.log('🔐 Firebase Firestore 백업 시작\n');
  
  const backupDir = createBackupDir();
  console.log(`📁 백업 디렉토리: ${backupDir}\n`);
  
  const results = [];
  
  for (const collection of COLLECTIONS) {
    const result = await backupCollection(collection, backupDir);
    results.push(result);
  }
  
  saveMetadata(backupDir, results);
  
  console.log('\n✨ 백업 완료!\n');
  
  // 성공/실패 요약
  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`📈 요약:`);
  console.log(`   성공: ${success}개 컬렉션`);
  console.log(`   실패: ${failed}개 컬렉션`);
  
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
  console.error('❌ 백업 오류:', error);
  process.exit(1);
});
