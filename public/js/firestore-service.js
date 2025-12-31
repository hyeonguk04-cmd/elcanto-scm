// Firestore 데이터 서비스
import { getCurrentUser } from './auth.js';
import { calculateProcessSchedule } from './process-config.js';

// ============ Suppliers (생산업체) ============

export async function getAllSuppliers() {
  try {
    const snapshot = await window.db.collection('suppliers').get();
    
    // 클라이언트 사이드에서 정렬
    const suppliers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 국가순, 이름순으로 정렬
    suppliers.sort((a, b) => {
      const countryCompare = (a.country || '').localeCompare(b.country || '');
      if (countryCompare !== 0) return countryCompare;
      return (a.name || '').localeCompare(b.name || '');
    });
    
    return suppliers;
  } catch (error) {
    console.error('Error getting suppliers:', error);
    throw error;
  }
}

export async function getSupplierById(supplierId) {
  try {
    const doc = await window.db.collection('suppliers').doc(supplierId).get();
    if (!doc.exists) {
      throw new Error('Supplier not found');
    }
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting supplier:', error);
    throw error;
  }
}

export async function getSupplierByName(supplierName) {
  try {
    const snapshot = await window.db.collection('suppliers')
      .where('name', '==', supplierName)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting supplier by name:', error);
    throw error;
  }
}

export async function getSuppliersByCountry() {
  try {
    const suppliers = await getAllSuppliers();
    
    // 국가별로 그룹화
    const suppliersByCountry = {};
    suppliers.forEach(supplier => {
      const country = supplier.location || supplier.country || '기타';
      if (!suppliersByCountry[country]) {
        suppliersByCountry[country] = [];
      }
      suppliersByCountry[country].push(supplier.name);
    });
    
    return suppliersByCountry;
  } catch (error) {
    console.error('Error getting suppliers by country:', error);
    throw error;
  }
}

export async function addSupplier(supplierData) {
  try {
    // 현재 로그인한 사용자의 username을 문서 ID로 사용
    const currentUser = getCurrentUser();
    console.log('🔍 addSupplier - currentUser:', currentUser);
    
    if (!currentUser || !currentUser.username) {
      console.error('❌ 로그인 정보 없음:', currentUser);
      throw new Error('로그인 정보를 찾을 수 없습니다.');
    }
    
    const supplierId = currentUser.username;
    console.log('📝 Supplier ID (username):', supplierId);
    
    // 중복 확인 (한 사용자당 하나의 업체만 등록 가능)
    const existingDoc = await window.db.collection('suppliers').doc(supplierId).get();
    console.log('🔍 중복 확인:', existingDoc.exists);
    
    if (existingDoc.exists) {
      throw new Error('이미 등록된 업체가 있습니다. 한 계정당 하나의 업체만 등록할 수 있습니다.');
    }
    
    const dataToSave = {
      ...supplierData,
      username: currentUser.username, // username 필드 명시적 저장
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('💾 저장할 데이터:', dataToSave);
    console.log('📍 저장 경로: suppliers/' + supplierId);
    
    await window.db.collection('suppliers').doc(supplierId).set(dataToSave);
    
    console.log('✅ 업체 등록 완료:', supplierId);
    return supplierId;
  } catch (error) {
    console.error('❌ Error adding supplier:', error);
    throw error;
  }
}

export async function addSupplierWithUsername(supplierData, username) {
  try {
    // 엑셀 업로드용: 관리자가 특정 username으로 업체 등록
    if (!username) {
      throw new Error('username이 필요합니다.');
    }
    
    const supplierId = username;
    
    // 중복 확인
    const existingDoc = await window.db.collection('suppliers').doc(supplierId).get();
    if (existingDoc.exists) {
      throw new Error(`사용자 ${username}의 업체가 이미 등록되어 있습니다.`);
    }
    
    await window.db.collection('suppliers').doc(supplierId).set({
      ...supplierData,
      username: username,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return supplierId;
  } catch (error) {
    console.error('Error adding supplier with username:', error);
    throw error;
  }
}

export async function updateSupplier(supplierId, supplierData) {
  try {
    await window.db.collection('suppliers').doc(supplierId).update({
      ...supplierData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
}

// ============ Orders ============

export async function getAllOrders() {
  try {
    const snapshot = await window.db.collection('orders').get();
    
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 클라이언트 사이드에서 정렬 (uploadOrder가 있으면 우선, 없으면 orderDate 기준)
    orders.sort((a, b) => {
      // uploadOrder가 둘 다 있으면 uploadOrder 기준으로 오름차순 정렬
      if (a.uploadOrder !== undefined && b.uploadOrder !== undefined) {
        return a.uploadOrder - b.uploadOrder;
      }
      // uploadOrder가 하나만 있으면 그것을 우선
      if (a.uploadOrder !== undefined) return -1;
      if (b.uploadOrder !== undefined) return 1;
      // 둘 다 없으면 orderDate 기준 내림차순 (최신순)
      return (b.orderDate || '').localeCompare(a.orderDate || '');
    });
    
    return orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
}

export async function getOrdersBySupplier(supplierName) {
  try {
    const snapshot = await window.db.collection('orders')
      .where('supplier', '==', supplierName)
      .orderBy('orderDate', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting orders by supplier:', error);
    throw error;
  }
}

export async function addOrder(orderData) {
  try {
    const user = getCurrentUser();
    const batch = window.db.batch();
    
    // 발주 추가
    const orderRef = window.db.collection('orders').doc();
    batch.set(orderRef, {
      ...orderData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: user.uid,
      status: 'pending'
    });
    
    // 공정 자동 생성
    const supplier = await getSupplierByName(orderData.supplier);
    const schedule = calculateProcessSchedule(
      orderData.orderDate,
      supplier?.leadTimes,
      orderData.route
    );
    
    // 생산 공정 추가
    schedule.production.forEach((process, index) => {
      const processRef = window.db.collection('processes').doc();
      batch.set(processRef, {
        orderId: orderRef.id,
        processName: process.name,
        processNameEn: process.name_en,
        processKey: process.processKey,
        category: 'production',
        order: index,
        targetDate: process.targetDate,
        actualDate: null,
        delayDays: null,
        delayReason: null,
        evidenceUrl: null,
        evidenceId: null,
        leadTime: process.leadTime,
        updatedBy: user.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    
    // 운송 공정 추가
    schedule.shipping.forEach((process, index) => {
      const processRef = window.db.collection('processes').doc();
      const processData = {
        orderId: orderRef.id,
        processName: process.name,
        processNameEn: process.name_en,
        processKey: process.processKey,
        category: 'shipping',
        order: index,
        targetDate: process.targetDate,
        actualDate: null,
        delayDays: null,
        delayReason: null,
        evidenceUrl: null,
        evidenceId: null,
        leadTime: process.leadTime,
        updatedBy: user.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      if (process.route) {
        processData.route = process.route;
      }
      
      batch.set(processRef, processData);
    });
    
    await batch.commit();
    return orderRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
}

export async function updateOrder(orderId, orderData) {
  try {
    await window.db.collection('orders').doc(orderId).update({
      ...orderData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

export async function deleteOrder(orderId) {
  try {
    // 1. 발주 정보 가져오기 (스타일 이미지 URL 확인용)
    const orderDoc = await window.db.collection('orders').doc(orderId).get();
    const orderData = orderDoc.data();
    
    const batch = window.db.batch();
    
    // 2. 관련 프로세스 삭제
    const processesSnapshot = await window.db.collection('processes')
      .where('orderId', '==', orderId)
      .get();
    
    processesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 3. 관련 증빙자료 삭제 (Firestore + Storage)
    const evidencesSnapshot = await window.db.collection('evidences')
      .where('orderId', '==', orderId)
      .get();
    
    // Storage에서 증빙 파일 삭제
    const evidenceDeletionPromises = [];
    evidencesSnapshot.docs.forEach(doc => {
      const evidenceData = doc.data();
      batch.delete(doc.ref);
      
      // Storage 파일 삭제 (evidenceUrl에서 경로 추출)
      if (evidenceData.fileUrl) {
        try {
          const fileRef = window.storage.refFromURL(evidenceData.fileUrl);
          evidenceDeletionPromises.push(
            fileRef.delete().catch(err => {
              console.warn(`증빙 파일 삭제 실패: ${evidenceData.fileUrl}`, err);
            })
          );
        } catch (err) {
          console.warn(`증빙 파일 참조 생성 실패: ${evidenceData.fileUrl}`, err);
        }
      }
    });
    
    // 4. 스타일 이미지 삭제 (Storage)
    if (orderData?.styleImage) {
      try {
        const imageRef = window.storage.refFromURL(orderData.styleImage);
        evidenceDeletionPromises.push(
          imageRef.delete().catch(err => {
            console.warn(`스타일 이미지 삭제 실패: ${orderData.styleImage}`, err);
          })
        );
      } catch (err) {
        console.warn(`스타일 이미지 참조 생성 실패: ${orderData.styleImage}`, err);
      }
    }
    
    // 5. 발주 삭제 (Firestore)
    batch.delete(window.db.collection('orders').doc(orderId));
    
    // 6. Firestore 배치 커밋 및 Storage 파일 삭제
    await Promise.all([
      batch.commit(),
      ...evidenceDeletionPromises
    ]);
    
    console.log(`✅ 발주 ${orderId} 완전 삭제 완료 (Firestore + Storage)`);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

// ============ Processes ============

export async function getProcessesByOrder(orderId) {
  try {
    const snapshot = await window.db.collection('processes')
      .where('orderId', '==', orderId)
      .orderBy('category')
      .orderBy('order')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting processes:', error);
    throw error;
  }
}

export async function updateProcess(processId, processData) {
  try {
    const user = getCurrentUser();
    await window.db.collection('processes').doc(processId).update({
      ...processData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid
    });
  } catch (error) {
    console.error('Error updating process:', error);
    throw error;
  }
}

// ============ Evidences ============

export async function uploadEvidence(orderId, processId, file) {
  try {
    const user = getCurrentUser();
    const timestamp = Date.now();
    const fileName = `${orderId}_${processId}_${timestamp}_${file.name}`;
    const storageRef = window.storage.ref(`evidences/${orderId}/${fileName}`);
    
    // 파일 업로드
    const uploadTask = await storageRef.put(file);
    const downloadURL = await uploadTask.ref.getDownloadURL();
    
    // 메타데이터 저장
    const evidenceData = {
      orderId,
      processId,
      fileName: file.name,
      fileUrl: downloadURL,
      fileSize: file.size,
      contentType: file.type,
      uploadedBy: user.uid,
      uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await window.db.collection('evidences').add(evidenceData);
    
    // 프로세스 업데이트
    await updateProcess(processId, {
      evidenceUrl: downloadURL,
      evidenceId: docRef.id
    });
    
    return {
      id: docRef.id,
      fileUrl: downloadURL
    };
  } catch (error) {
    console.error('Error uploading evidence:', error);
    throw error;
  }
}

// 이미지 리사이징 및 압축
async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 캔버스 생성
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 비율 유지하면서 리사이징
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 이미지 그리기
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Blob으로 변환 (JPEG, 압축률 적용)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { 
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            } else {
              reject(new Error('이미지 압축 실패'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

// 스타일 이미지 업로드 (엑셀에서 추출된 이미지) - 압축 적용
export async function uploadStyleImage(style, imageFile) {
  try {
    const startTime = Date.now();
    const originalSize = imageFile.size;
    
    // 이미지 압축 (800x800 최대 크기, 80% 품질)
    const compressedFile = await compressImage(imageFile, 800, 800, 0.8);
    const compressedSize = compressedFile.size;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    
    console.log(`  🗜️ 압축: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${compressionRatio}% 감소)`);
    
    // 파일명 단순화
    const fileName = `${style}.jpg`;
    const storageRef = window.storage.ref(`style-images/${fileName}`);
    
    // 메타데이터 설정
    const metadata = {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=31536000', // 1년 캐시
      customMetadata: {
        originalSize: originalSize.toString(),
        compressedSize: compressedSize.toString()
      }
    };
    
    // 파일 업로드
    const uploadTask = await storageRef.put(compressedFile, metadata);
    const downloadURL = await uploadTask.ref.getDownloadURL();
    
    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`  ✅ 업로드 완료: ${uploadTime}초 소요`);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading style image:', error);
    throw error;
  }
}

export async function getEvidencesByOrder(orderId) {
  try {
    const snapshot = await window.db.collection('evidences')
      .where('orderId', '==', orderId)
      .orderBy('uploadedAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting evidences:', error);
    throw error;
  }
}

// ============ 통합 데이터 가져오기 ============

export async function getOrdersWithProcesses() {
  try {
    const orders = await getAllOrders();
    
    const ordersWithProcesses = await Promise.all(
      orders.map(async (order) => {
        const processes = await getProcessesByOrder(order.id);
        
        const schedule = {
          production: processes.filter(p => p.category === 'production'),
          shipping: processes.filter(p => p.category === 'shipping')
        };
        
        return {
          ...order,
          schedule
        };
      })
    );
    
    return ordersWithProcesses;
  } catch (error) {
    console.error('Error getting orders with processes:', error);
    throw error;
  }
}

// ============ 실시간 리스너 ============

export function listenToOrders(callback) {
  return window.db.collection('orders')
    .orderBy('orderDate', 'desc')
    .onSnapshot((snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(orders);
    });
}

export function listenToProcesses(orderId, callback) {
  return window.db.collection('processes')
    .where('orderId', '==', orderId)
    .orderBy('category')
    .orderBy('order')
    .onSnapshot((snapshot) => {
      const processes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(processes);
    });
}

export default {
  getAllSuppliers,
  getSupplierById,
  getSupplierByName,
  getSuppliersByCountry,
  addSupplier,
  addSupplierWithUsername,
  updateSupplier,
  getAllOrders,
  getOrdersBySupplier,
  addOrder,
  updateOrder,
  deleteOrder,
  getProcessesByOrder,
  updateProcess,
  uploadEvidence,
  uploadStyleImage,
  getEvidencesByOrder,
  getOrdersWithProcesses,
  listenToOrders,
  listenToProcesses
};
