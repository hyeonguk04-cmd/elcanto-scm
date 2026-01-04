// 브라우저 Console에서 실행할 디버깅 스크립트
console.log('🔍 운송 공정 디버깅 시작...');

window.db.collection('orders').limit(1).get().then(snapshot => {
  snapshot.forEach(doc => {
    const order = doc.data();
    console.log('\n📦 발주 ID:', doc.id);
    console.log('🏭 생산업체:', order.supplier);
    console.log('🚢 선적항-도착항:', order.route);
    console.log('\n📊 processes 구조:', order.processes);
    
    if (order.processes) {
      console.log('\n🔧 생산 공정 (production):');
      if (order.processes.production) {
        order.processes.production.forEach((proc, i) => {
          console.log(`  ${i}. ${proc.key || proc.processKey}: ${proc.targetDate} (리드타임: ${proc.leadTime}일)`);
        });
      } else {
        console.log('  ❌ production 없음');
      }
      
      console.log('\n🚢 운송 공정 (shipping):');
      if (order.processes.shipping) {
        order.processes.shipping.forEach((proc, i) => {
          console.log(`  ${i}. ${proc.key || proc.processKey}: ${proc.targetDate} (리드타임: ${proc.leadTime}일)`);
        });
      } else {
        console.log('  ❌ shipping 없음');
      }
    } else {
      console.log('❌ processes 필드 자체가 없음!');
    }
    
    console.log('\n📊 schedule 구조 (deprecated):', order.schedule);
  });
}).catch(error => {
  console.error('❌ 에러:', error);
});

console.log('⏳ Firebase에서 데이터 로드 중...');
