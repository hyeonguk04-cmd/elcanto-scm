// 전체 진단 스크립트 - F12 Console에서 실행

console.log('🔍 ===== 전체 시스템 진단 시작 =====\n');

// 1. Firebase 연결 확인
console.log('1️⃣ Firebase 연결 상태:');
console.log('  window.db:', window.db ? '✅ 정상' : '❌ 없음');

// 2. 발주 데이터 확인
console.log('\n2️⃣ 챠오란 발주 데이터 확인:');
window.db.collection('orders').where('supplier', '==', '챠오란').limit(1).get().then(snapshot => {
  if (snapshot.empty) {
    console.error('  ❌ 챠오란 발주 데이터가 없습니다!');
    return;
  }
  
  snapshot.forEach(doc => {
    const order = doc.data();
    console.log('  📋 발주 ID:', doc.id);
    console.log('  📅 발주일:', order.orderDate);
    console.log('  🏭 생산업체:', order.supplier);
    console.log('  🚢 route:', order.route);
    console.log('  📦 processes 존재:', !!order.processes);
    console.log('  📊 schedule 존재:', !!order.schedule);
    
    if (order.processes) {
      console.log('\n  🔧 processes.production:');
      order.processes.production?.forEach((p, i) => {
        console.log(`    ${i+1}. ${p.name}: targetDate=${p.targetDate}, leadTime=${p.leadTime}`);
      });
      
      console.log('\n  🚢 processes.shipping:');
      order.processes.shipping?.forEach((p, i) => {
        console.log(`    ${i+1}. ${p.name}: targetDate=${p.targetDate}, leadTime=${p.leadTime}`);
      });
    } else {
      console.error('  ❌ processes 필드가 없습니다!');
    }
  });
});

// 3. 생산업체 정보 확인
console.log('\n3️⃣ 챠오란 생산업체 정보:');
window.db.collection('suppliers').doc('chaoran').get().then(doc => {
  if (!doc.exists) {
    console.error('  ❌ chaoran 생산업체가 없습니다!');
    return;
  }
  
  const supplier = doc.data();
  console.log('  📦 name:', supplier.name);
  console.log('  🚢 shippingRoute:', supplier.shippingRoute);
  console.log('  ⏱️ leadTimes:', supplier.leadTimes);
});

// 4. 현재 페이지의 orders 배열 확인
console.log('\n4️⃣ 메모리상 orders 배열:');
if (typeof orders !== 'undefined') {
  console.log('  📊 총 발주 수:', orders.length);
  const chaoranOrders = orders.filter(o => o.supplier === '챠오란');
  console.log('  📦 챠오란 발주 수:', chaoranOrders.length);
  
  if (chaoranOrders.length > 0) {
    const first = chaoranOrders[0];
    console.log('\n  첫 번째 챠오란 발주:');
    console.log('    ID:', first.id);
    console.log('    orderDate:', first.orderDate);
    console.log('    route:', first.route);
    console.log('    processes:', !!first.processes);
    console.log('    schedule:', !!first.schedule);
  }
} else {
  console.error('  ❌ orders 배열이 없습니다!');
}

console.log('\n✅ ===== 진단 완료 =====');
console.log('위 결과를 확인하고 공유해주세요!');
