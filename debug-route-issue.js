// 브라우저 Console에서 실행
console.log('🔍 Route 문제 디버깅...');

window.db.collection('orders').limit(1).get().then(snapshot => {
  snapshot.forEach(doc => {
    const order = doc.data();
    console.log('\n📦 발주 데이터:');
    console.log('  ID:', doc.id);
    console.log('  생산업체:', order.supplier);
    console.log('  order.route:', order.route);
    console.log('  order.country:', order.country);
    
    console.log('\n🚢 Processes:');
    if (order.processes?.shipping) {
      order.processes.shipping.forEach(proc => {
        console.log(`  ${proc.name}: route =`, proc.route);
      });
    }
    
    console.log('\n📊 ROUTES_BY_COUNTRY[중국]:');
    console.log(window.ROUTES_BY_COUNTRY?.['중국'] || 'ROUTES_BY_COUNTRY not found');
    
    console.log('\n🎯 첫 번째 route (default):');
    const firstRoute = window.ROUTES_BY_COUNTRY?.['중국']?.[0];
    console.log('  첫 번째:', firstRoute);
    console.log('  order.route === firstRoute?', order.route === firstRoute);
  });
}).catch(error => {
  console.error('❌ 에러:', error);
});
