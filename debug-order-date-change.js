// F12 → Console에서 실행
// 발주일 변경 시 디버깅

// 발주일 input에 이벤트 리스너 직접 추가
document.querySelectorAll('.order-date-input').forEach(input => {
  input.addEventListener('change', async (e) => {
    console.log('🔍 발주일 변경 감지:', e.target.value);
    console.log('  orderId:', e.target.dataset.orderId);
    
    const orderId = e.target.dataset.orderId;
    const newDate = e.target.value;
    
    // 해당 발주 찾기
    const orderDoc = await window.db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      console.error('❌ 발주를 찾을 수 없음!');
      return;
    }
    
    const order = { id: orderDoc.id, ...orderDoc.data() };
    console.log('📦 현재 발주 데이터:', order);
    console.log('  supplier:', order.supplier);
    console.log('  processes:', order.processes);
    console.log('  schedule:', order.schedule);
  });
});

console.log('✅ 발주일 변경 디버깅 리스너 등록 완료!');
console.log('이제 발주일을 변경해보세요.');
