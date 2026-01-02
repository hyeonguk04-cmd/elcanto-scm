// 챠오란 생산업체의 리드타임을 UI 표시 값과 일치시키는 스크립트
// 브라우저 Console에서 실행: F12 → Console → 아래 코드 복사&붙여넣기

(async function fixChaoranLeadTimes() {
  console.log('🔧 챠오란 생산업체 리드타임 수정 시작...');
  
  try {
    const chaoranRef = window.db.collection('suppliers').doc('chaoran');
    const doc = await chaoranRef.get();
    
    if (!doc.exists) {
      console.error('❌ chaoran 문서를 찾을 수 없습니다!');
      return;
    }
    
    console.log('📦 현재 leadTimes:', doc.data().leadTimes);
    
    // UI 표시값과 일치시킴
    const updatedLeadTimes = {
      material: 21,           // 자재 (기존: 26)
      hando_cfm: 15,          // 한도CFM (기존: 15, 유지)
      cutting_upper: 17,      // 제갑&조립 (기존: 33)
      factory_shipment: 4,    // 공장출고 (기존: 5)
      shipping: 3,            // 선적 (기존: 4)
      arrival: 8              // 입항 (기존: 35)
    };
    
    await chaoranRef.update({
      leadTimes: updatedLeadTimes
    });
    
    console.log('✅ leadTimes 업데이트 완료!');
    console.log('📊 새로운 leadTimes:', updatedLeadTimes);
    
    // 검증
    const updatedDoc = await chaoranRef.get();
    console.log('🔍 검증 결과:', updatedDoc.data().leadTimes);
    
    alert('✅ 챠오란 생산업체의 리드타임이 성공적으로 업데이트되었습니다!');
    
  } catch (error) {
    console.error('❌ 업데이트 실패:', error);
    alert('❌ 업데이트 실패: ' + error.message);
  }
})();
