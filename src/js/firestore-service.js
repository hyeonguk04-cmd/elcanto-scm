// Firestore 데이터 서비스
import { db, storage } from './firebase-config.js';
import { getCurrentUser } from './auth.js';

// ============ Suppliers ============

// 모든 생산업체 가져오기
async function getAllSuppliers() {
  try {
    const snapshot = await db.collection('suppliers')
      .orderBy('country')
      .orderBy('name')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting suppliers:', error);
    throw error;
  }
}

// 특정 생산업체 가져오기
async function getSupplierById(supplierId) {
  try {
    const doc = await db.collection('suppliers').doc(supplierId).get();
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

// 생산업체 추가
async function addSupplier(supplierData) {
  try {
    const docRef = await db.collection('suppliers').add({
      ...supplierData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding supplier:', error);
    throw error;
  }
}

// 생산업체 수정
async function updateSupplier(supplierId, supplierData) {
  try {
    await db.collection('suppliers').doc(supplierId).update({
      ...supplierData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
}

// ============ Orders ============

// 모든 발주 가져오기
async function getAllOrders() {
  try {
    const snapshot = await db.collection('orders')
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

// 생산업체별 발주 가져오기
async function getOrdersBySupplier(supplierName) {
  try {
    const snapshot = await db.collection('orders')
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

// 발주 추가
async function addOrder(orderData) {
  try {
    const user = getCurrentUser();
    const docRef = await db.collection('orders').add({
      ...orderData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: user.uid
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
}

// 발주 수정
async function updateOrder(orderId, orderData) {
  try {
    await db.collection('orders').doc(orderId).update({
      ...orderData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

// 발주 삭제
async function deleteOrder(orderId) {
  try {
    // 관련 프로세스도 삭제
    const processesSnapshot = await db.collection('processes')
      .where('orderId', '==', orderId)
      .get();
    
    const batch = db.batch();
    processesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 발주 삭제
    batch.delete(db.collection('orders').doc(orderId));
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

// ============ Processes ============

// 특정 발주의 모든 공정 가져오기
async function getProcessesByOrder(orderId) {
  try {
    const snapshot = await db.collection('processes')
      .where('orderId', '==', orderId)
      .orderBy('category')
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

// 공정 추가 (발주 생성 시 자동으로 생성됨)
async function addProcess(processData) {
  try {
    const user = getCurrentUser();
    const docRef = await db.collection('processes').add({
      ...processData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding process:', error);
    throw error;
  }
}

// 공정 수정 (실제 완료일 입력 등)
async function updateProcess(processId, processData) {
  try {
    const user = getCurrentUser();
    await db.collection('processes').doc(processId).update({
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

// 증빙자료 업로드
async function uploadEvidence(orderId, processId, file) {
  try {
    const user = getCurrentUser();
    const timestamp = Date.now();
    const fileName = `${orderId}_${processId}_${timestamp}_${file.name}`;
    const storageRef = storage.ref(`evidences/${orderId}/${fileName}`);
    
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
    
    const docRef = await db.collection('evidences').add(evidenceData);
    
    return {
      id: docRef.id,
      fileUrl: downloadURL
    };
  } catch (error) {
    console.error('Error uploading evidence:', error);
    throw error;
  }
}

// 증빙자료 가져오기
async function getEvidencesByOrder(orderId) {
  try {
    const snapshot = await db.collection('evidences')
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

// 증빙자료 삭제
async function deleteEvidence(evidenceId, fileUrl) {
  try {
    // Storage에서 파일 삭제
    const storageRef = storage.refFromURL(fileUrl);
    await storageRef.delete();
    
    // Firestore에서 메타데이터 삭제
    await db.collection('evidences').doc(evidenceId).delete();
  } catch (error) {
    console.error('Error deleting evidence:', error);
    throw error;
  }
}

// ============ 통합 데이터 가져오기 ============

// 발주와 공정 정보를 함께 가져오기
async function getOrdersWithProcesses() {
  try {
    const orders = await getAllOrders();
    
    // 모든 발주에 대한 공정 정보 가져오기
    const ordersWithProcesses = await Promise.all(
      orders.map(async (order) => {
        const processes = await getProcessesByOrder(order.id);
        
        // 공정을 production과 shipping으로 분류
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

// 실시간 리스너 등록
function listenToOrders(callback) {
  return db.collection('orders')
    .orderBy('orderDate', 'desc')
    .onSnapshot((snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(orders);
    });
}

function listenToProcesses(orderId, callback) {
  return db.collection('processes')
    .where('orderId', '==', orderId)
    .orderBy('category')
    .onSnapshot((snapshot) => {
      const processes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(processes);
    });
}

export {
  // Suppliers
  getAllSuppliers,
  getSupplierById,
  addSupplier,
  updateSupplier,
  
  // Orders
  getAllOrders,
  getOrdersBySupplier,
  addOrder,
  updateOrder,
  deleteOrder,
  
  // Processes
  getProcessesByOrder,
  addProcess,
  updateProcess,
  
  // Evidences
  uploadEvidence,
  getEvidencesByOrder,
  deleteEvidence,
  
  // 통합
  getOrdersWithProcesses,
  
  // 리스너
  listenToOrders,
  listenToProcesses
};
