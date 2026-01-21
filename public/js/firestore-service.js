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
    
    console.log('🏭 addOrder 시작:', {
      supplier: orderData.supplier,
      orderDate: orderData.orderDate,
      route: orderData.route
    });
    
    // 생산업체 정보 조회 후 리드타임을 적용하여 일정 재계산
    const supplier = await getSupplierByName(orderData.supplier);
    console.log('📦 생산업체 조회 결과:', {
      name: supplier?.name,
      leadTimes: supplier?.leadTimes,
      shippingRoute: supplier?.shippingRoute
    });
    
    // route가 없으면 생산업체의 shippingRoute 사용
    const finalRoute = orderData.route || supplier?.shippingRoute || null;
    console.log('🚢 최종 route:', { 
      orderDataRoute: orderData.route, 
      supplierRoute: supplier?.shippingRoute,
      finalRoute: finalRoute 
    });
    
    const schedule = calculateProcessSchedule(
      orderData.orderDate,
      supplier?.leadTimes,
      finalRoute,
      supplier
    );
    
    console.log('📊 계산된 schedule:', schedule);
    
    // 프로세스를 내장 구조로 변환
    const processes = {
      production: (schedule.production || []).map((process, index) => ({
        key: process.processKey || process.key,
        name: process.name,
        name_en: process.name_en || process.name,
        targetDate: process.targetDate,
        completedDate: process.completedDate || null,
        actualDate: process.actualDate || null,
        delayDays: process.delayDays || null,
        delayReason: process.delayReason || null,
        evidenceUrl: process.evidenceUrl || null,
        evidenceId: process.evidenceId || null,
        leadTime: process.leadTime,
        order: index
      })),
      shipping: (schedule.shipping || []).map((process, index) => ({
        name: process.name,
        name_en: process.name_en || process.name,
        key: process.processKey || process.key,
        targetDate: process.targetDate,
        completedDate: process.completedDate || null,
        actualDate: process.actualDate || null,
        delayDays: process.delayDays || null,
        delayReason: process.delayReason || null,
        evidenceUrl: process.evidenceUrl || null,
        evidenceId: process.evidenceId || null,
        leadTime: process.leadTime,
        route: process.route || null,
        order: index
      }))
    };
    
    // orderData에서 schedule 제거 (processes로 대체)
    const { schedule: _, ...orderDataWithoutSchedule } = orderData;
    
    // 발주 데이터에 processes 추가
    const orderRef = await window.db.collection('orders').add({
      ...orderDataWithoutSchedule,
      route: finalRoute,  // 최종 route 저장
      processes,
      schedule: processes,  // 호환성을 위해 schedule도 유지
      createdBy: user?.uid || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
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

// 프로세스 업데이트 (내장 구조)
export async function updateProcess(orderId, category, processIndex, processData) {
  try {
    const user = getCurrentUser();
    
    // 발주 문서 가져오기
    const orderRef = window.db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      throw new Error('Order not found');
    }
    
    const order = orderDoc.data();
    const processes = order.processes || { production: [], shipping: [] };
    
    // 해당 프로세스 업데이트
    if (category === 'production' && processes.production[processIndex]) {
      processes.production[processIndex] = {
        ...processes.production[processIndex],
        ...processData,
        updatedAt: firebase.firestore.Timestamp.now(),
        updatedBy: user.uid
      };
    } else if (category === 'shipping' && processes.shipping[processIndex]) {
      processes.shipping[processIndex] = {
        ...processes.shipping[processIndex],
        ...processData,
        updatedAt: firebase.firestore.Timestamp.now(),
        updatedBy: user.uid
      };
    }
    
    // 발주 문서 업데이트
    await orderRef.update({
      processes,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error updating process:', error);
    throw error;
  }
}

// 호환성을 위한 레거시 함수 (기존 코드 지원)
export async function updateProcessLegacy(processId, processData) {
  try {
    const user = getCurrentUser();
    await window.db.collection('processes').doc(processId).update({
      ...processData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid
    });
  } catch (error) {
    console.error('Error updating process (legacy):', error);
    throw error;
  }
}

// ============ Evidences ============

export async function uploadEvidence(orderId, category, processIndex, file) {
  try {
    const user = getCurrentUser();
    const timestamp = Date.now();
    const fileName = `${orderId}_${category}_${processIndex}_${timestamp}_${file.name}`;
    const storageRef = window.storage.ref(`evidences/${orderId}/${fileName}`);
    
    // 파일 업로드
    const uploadTask = await storageRef.put(file);
    const downloadURL = await uploadTask.ref.getDownloadURL();
    
    // 메타데이터 저장
    const evidenceData = {
      orderId,
      category,
      processIndex,
      fileName: file.name,
      fileUrl: downloadURL,
      fileSize: file.size,
      contentType: file.type,
      uploadedBy: user.uid,
      uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await window.db.collection('evidences').add(evidenceData);
    
    // 프로세스 업데이트 (새 구조)
    await updateProcess(orderId, category, processIndex, {
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
        
        // 📊 원본 크기 로깅
        console.log(`  📐 원본 크기: ${width} × ${height} (비율: ${(width/height).toFixed(2)}:1)`);
        
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
        
        console.log(`  📏 압축 후 크기: ${width} × ${height} (비율: ${(width/height).toFixed(2)}:1)`);
        
        canvas.width = width;
        canvas.height = height;
        
        // 이미지 그리기
        const ctx = canvas.getContext('2d');
        
        // 투명 배경을 흰색으로 채우기 (JPEG는 투명도 미지원)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
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
export async function uploadStyleImage(style, imageFile, color = '') {
  try {
    const startTime = Date.now();
    const originalSize = imageFile.size;
    
    // 이미지 압축 (800x800 최대 크기, 80% 품질)
    const compressedFile = await compressImage(imageFile, 800, 800, 0.8);
    const compressedSize = compressedFile.size;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    
    console.log(`  🗜️ 압축: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${compressionRatio}% 감소)`);
    
    // 파일명 고유하게 생성 (스타일 + 색상 또는 타임스탬프)
    const uniqueId = color ? color.toString().trim() : Date.now().toString();
    const fileName = `${style}_${uniqueId}.jpg`;
    const storageRef = window.storage.ref(`style-images/${fileName}`);
    
    console.log(`  📝 파일명: ${fileName}`);
    
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
    console.log('📊 발주 데이터 로드 시작...');
    const startTime = Date.now();
    
    const snapshot = await window.db.collection('orders').get();
    
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
        // processes는 이미 내장되어 있음 (새 구조)
      };
    });
    
    // 정렬
    orders.sort((a, b) => {
      if (a.uploadOrder !== undefined && b.uploadOrder !== undefined) {
        return a.uploadOrder - b.uploadOrder;
      }
      if (a.uploadOrder !== undefined) return -1;
      if (b.uploadOrder !== undefined) return 1;
      return (b.orderDate || '').localeCompare(a.orderDate || '');
    });
    
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ ${orders.length}건 로드 완료 (${loadTime}초)`);
    
    return orders;
  } catch (error) {
    console.error('Error getting orders with processes:', error);
    throw error;
  }
}

// 입고요구월로 발주 조회 (서버 필터링)
export async function getOrdersByRequiredMonth(year, month) {
  try {
    console.log(`📊 입고요구월 ${year}-${month} 발주 데이터 로드 시작...`);
    const startTime = Date.now();
    
    // 해당 월의 시작일과 종료일 계산
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    console.log(`   조회 범위: ${startDate} ~ ${endDate}`);
    
    // Firebase where 쿼리
    const snapshot = await window.db.collection('orders')
      .where('requiredDelivery', '>=', startDate)
      .where('requiredDelivery', '<=', endDate)
      .get();
    
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    });
    
    // 정렬
    orders.sort((a, b) => {
      if (a.uploadOrder !== undefined && b.uploadOrder !== undefined) {
        return a.uploadOrder - b.uploadOrder;
      }
      if (a.uploadOrder !== undefined) return -1;
      if (b.uploadOrder !== undefined) return 1;
      return (b.orderDate || '').localeCompare(a.orderDate || '');
    });
    
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ ${orders.length}건 로드 완료 (${loadTime}초)`);
    
    return orders;
  } catch (error) {
    console.error('Error getting orders by required month:', error);
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

// ============ Arrivals (입고 관리) ============

/**
 * 입고 등록
 * @param {string} orderId - 발주 ID
 * @param {Object} arrivalData - 입고 데이터 { date, quantity, note }
 * @returns {Promise<Object>} 업데이트된 arrivalSummary
 */
export async function addArrival(orderId, arrivalData) {
  try {
    const user = getCurrentUser();
    
    // 1. 발주 문서 가져오기
    const orderRef = window.db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      throw new Error('발주를 찾을 수 없습니다.');
    }
    
    const order = orderDoc.data();
    const existingArrivals = order.arrivals || [];
    const orderQuantity = order.quantity || 0;
    
    // 2. 누적 수량 계산
    const totalReceived = existingArrivals.reduce((sum, a) => sum + (a.quantity || 0), 0);
    const newCumulative = totalReceived + arrivalData.quantity;
    
    // 3. 초과 입고 체크 (경고만, 차단 안 함)
    if (newCumulative > orderQuantity) {
      console.warn(`⚠️ 초과 입고: 누적 ${newCumulative}개 > 발주 ${orderQuantity}개`);
    }
    
    // 4. 새 입고 데이터 생성
    const newArrival = {
      date: arrivalData.date,
      quantity: arrivalData.quantity,
      cumulative: newCumulative,
      note: arrivalData.note || '',
      createdAt: firebase.firestore.Timestamp.now(),
      createdBy: user?.uid || null
    };
    
    // 5. 입고 배열에 추가
    const updatedArrivals = [...existingArrivals, newArrival];
    
    // 6. arrivalSummary 자동 계산
    const progress = orderQuantity > 0 ? Math.round((newCumulative / orderQuantity) * 100) : 0;
    let status = 'pending';
    if (progress >= 101) status = 'over';
    else if (progress === 100) status = 'completed';
    else if (progress > 0) status = 'partial';
    
    const arrivalSummary = {
      totalReceived: newCumulative,
      progress: progress,
      count: updatedArrivals.length,
      status: status
    };
    
    // 7. firstArrival, lastArrival 계산
    const firstArrival = updatedArrivals[0] ? {
      date: updatedArrivals[0].date,
      quantity: updatedArrivals[0].quantity
    } : null;
    
    const lastArrival = updatedArrivals[updatedArrivals.length - 1] ? {
      date: updatedArrivals[updatedArrivals.length - 1].date,
      quantity: updatedArrivals[updatedArrivals.length - 1].quantity
    } : null;
    
    // 8. Firestore 업데이트
    await orderRef.update({
      arrivals: updatedArrivals,
      firstArrival: firstArrival,
      lastArrival: lastArrival,
      arrivalSummary: arrivalSummary,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ 입고 등록 완료: ${orderId} - ${arrivalData.quantity}개 (누적: ${newCumulative}/${orderQuantity})`);
    
    return arrivalSummary;
  } catch (error) {
    console.error('Error adding arrival:', error);
    throw error;
  }
}

/**
 * 입고 이력 조회
 * @param {string} orderId - 발주 ID
 * @returns {Promise<Array>} 입고 이력 배열
 */
export async function getArrivals(orderId) {
  try {
    const orderDoc = await window.db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      throw new Error('발주를 찾을 수 없습니다.');
    }
    
    const order = orderDoc.data();
    return order.arrivals || [];
  } catch (error) {
    console.error('Error getting arrivals:', error);
    throw error;
  }
}

/**
 * 입고 수정
 * @param {string} orderId - 발주 ID
 * @param {number} arrivalIndex - 입고 인덱스
 * @param {Object} updateData - 수정할 데이터 { date?, quantity?, note? }
 * @returns {Promise<Object>} 업데이트된 arrivalSummary
 */
export async function updateArrival(orderId, arrivalIndex, updateData) {
  try {
    const user = getCurrentUser();
    
    // 1. 발주 문서 가져오기
    const orderRef = window.db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      throw new Error('발주를 찾을 수 없습니다.');
    }
    
    const order = orderDoc.data();
    const arrivals = order.arrivals || [];
    const orderQuantity = order.quantity || 0;
    
    if (arrivalIndex < 0 || arrivalIndex >= arrivals.length) {
      throw new Error('유효하지 않은 입고 인덱스입니다.');
    }
    
    // 2. 해당 입고 수정
    arrivals[arrivalIndex] = {
      ...arrivals[arrivalIndex],
      ...updateData,
      updatedAt: firebase.firestore.Timestamp.now(),
      updatedBy: user?.uid || null
    };
    
    // 3. 누적 수량 재계산 (모든 입고)
    let cumulative = 0;
    for (let i = 0; i < arrivals.length; i++) {
      cumulative += arrivals[i].quantity || 0;
      arrivals[i].cumulative = cumulative;
    }
    
    // 4. arrivalSummary 재계산
    const totalReceived = cumulative;
    const progress = orderQuantity > 0 ? Math.round((totalReceived / orderQuantity) * 100) : 0;
    let status = 'pending';
    if (progress >= 101) status = 'over';
    else if (progress === 100) status = 'completed';
    else if (progress > 0) status = 'partial';
    
    const arrivalSummary = {
      totalReceived: totalReceived,
      progress: progress,
      count: arrivals.length,
      status: status
    };
    
    // 5. firstArrival, lastArrival 재계산
    const firstArrival = arrivals[0] ? {
      date: arrivals[0].date,
      quantity: arrivals[0].quantity
    } : null;
    
    const lastArrival = arrivals[arrivals.length - 1] ? {
      date: arrivals[arrivals.length - 1].date,
      quantity: arrivals[arrivals.length - 1].quantity
    } : null;
    
    // 6. Firestore 업데이트
    await orderRef.update({
      arrivals: arrivals,
      firstArrival: firstArrival,
      lastArrival: lastArrival,
      arrivalSummary: arrivalSummary,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ 입고 수정 완료: ${orderId} - 인덱스 ${arrivalIndex}`);
    
    return arrivalSummary;
  } catch (error) {
    console.error('Error updating arrival:', error);
    throw error;
  }
}

/**
 * 최근 입고 삭제 (가장 마지막 입고만 삭제 가능)
 * @param {string} orderId - 발주 ID
 * @returns {Promise<Object>} 업데이트된 arrivalSummary
 */
export async function deleteLastArrival(orderId) {
  try {
    // 1. 발주 문서 가져오기
    const orderRef = window.db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      throw new Error('발주를 찾을 수 없습니다.');
    }
    
    const order = orderDoc.data();
    const arrivals = order.arrivals || [];
    const orderQuantity = order.quantity || 0;
    
    if (arrivals.length === 0) {
      throw new Error('삭제할 입고 이력이 없습니다.');
    }
    
    // 2. 마지막 입고 제거
    arrivals.pop();
    
    // 3. arrivalSummary 재계산
    const totalReceived = arrivals.reduce((sum, a) => sum + (a.quantity || 0), 0);
    const progress = orderQuantity > 0 ? Math.round((totalReceived / orderQuantity) * 100) : 0;
    let status = 'pending';
    if (progress >= 101) status = 'over';
    else if (progress === 100) status = 'completed';
    else if (progress > 0) status = 'partial';
    
    const arrivalSummary = {
      totalReceived: totalReceived,
      progress: progress,
      count: arrivals.length,
      status: status
    };
    
    // 4. firstArrival, lastArrival 재계산
    const firstArrival = arrivals.length > 0 ? {
      date: arrivals[0].date,
      quantity: arrivals[0].quantity
    } : null;
    
    const lastArrival = arrivals.length > 0 ? {
      date: arrivals[arrivals.length - 1].date,
      quantity: arrivals[arrivals.length - 1].quantity
    } : null;
    
    // 5. Firestore 업데이트
    await orderRef.update({
      arrivals: arrivals,
      firstArrival: firstArrival,
      lastArrival: lastArrival,
      arrivalSummary: arrivalSummary,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ 최근 입고 삭제 완료: ${orderId}`);
    
    return arrivalSummary;
  } catch (error) {
    console.error('Error deleting last arrival:', error);
    throw error;
  }
}

/**
 * 입고 요약 정보 조회
 * @param {string} orderId - 발주 ID
 * @returns {Promise<Object>} arrivalSummary 객체
 */
export async function getArrivalSummary(orderId) {
  try {
    const orderDoc = await window.db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      throw new Error('발주를 찾을 수 없습니다.');
    }
    
    const order = orderDoc.data();
    return order.arrivalSummary || {
      totalReceived: 0,
      progress: 0,
      count: 0,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error getting arrival summary:', error);
    throw error;
  }
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
  listenToProcesses,
  getOrdersByRequiredMonth,
  // 입고 관리
  addArrival,
  getArrivals,
  updateArrival,
  deleteLastArrival,
  getArrivalSummary
};
