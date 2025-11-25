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
    const snapshot = await window.db.collection('orders')
      .orderBy('orderDate', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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
    const batch = window.db.batch();
    
    // 관련 프로세스 삭제
    const processesSnapshot = await window.db.collection('processes')
      .where('orderId', '==', orderId)
      .get();
    
    processesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 관련 증빙자료 삭제
    const evidencesSnapshot = await window.db.collection('evidences')
      .where('orderId', '==', orderId)
      .get();
    
    evidencesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 발주 삭제
    batch.delete(window.db.collection('orders').doc(orderId));
    
    await batch.commit();
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
  getEvidencesByOrder,
  getOrdersWithProcesses,
  listenToOrders,
  listenToProcesses
};
