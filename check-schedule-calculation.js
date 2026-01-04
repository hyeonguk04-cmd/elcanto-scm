// 브라우저 Console에서 실행할 디버깅 스크립트

console.log('🔍 일정 계산 문제 진단 시작...');

// 1. 챠오란 생산업체 정보 확인
window.db.collection('suppliers').doc('chaoran').get().then(doc => {
  if (!doc.exists) {
    console.error('❌ chaoran 문서가 없습니다!');
    return;
  }
  
  const supplier = doc.data();
  console.log('\n📦 챠오란 생산업체 정보:');
  console.log('  name:', supplier.name);
  console.log('  leadTimes:', supplier.leadTimes);
  console.log('  shippingRoute:', supplier.shippingRoute);
});

// 2. 업로드된 발주 데이터 확인
window.db.collection('orders').where('supplier', '==', '챠오란').limit(1).get().then(snapshot => {
  if (snapshot.empty) {
    console.error('\n❌ 챠오란 발주 데이터가 없습니다!');
    return;
  }
  
  snapshot.forEach(doc => {
    const order = doc.data();
    console.log('\n📋 발주 데이터:');
    console.log('  스타일:', order.style);
    console.log('  발주일:', order.orderDate);
    console.log('  생산업체:', order.supplier);
    console.log('  route:', order.route);
    console.log('\n🔧 processes.production:');
    if (order.processes?.production) {
      order.processes.production.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name}: targetDate=${p.targetDate}, leadTime=${p.leadTime}`);
      });
    } else {
      console.error('  ❌ processes.production이 없습니다!');
    }
    
    console.log('\n🚢 processes.shipping:');
    if (order.processes?.shipping) {
      order.processes.shipping.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name}: targetDate=${p.targetDate}, leadTime=${p.leadTime}`);
      });
    } else {
      console.error('  ❌ processes.shipping이 없습니다!');
    }
    
    console.log('\n📊 schedule (deprecated):');
    if (order.schedule) {
      console.log('  schedule.production:', order.schedule.production);
      console.log('  schedule.shipping:', order.schedule.shipping);
    }
  });
});

console.log('\n✅ 진단 완료! 위 결과를 확인하세요.');
