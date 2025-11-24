# 📊 종합현황(Dashboard) 화면 개선 필요 사항

## 🔴 긴급 개선 필요 (Critical)

### 1. **KPI 지표의 정확성 및 명확성**
**현재 문제:**
- "납기 준수율"의 계산 기준이 모호함
  - 현재: 완료된 발주 중 정시 입고된 발주 비율
  - 문제: 미완료 발주은 제외되어 실제 전체 납기 준수 상황을 반영하지 못함
  
**개선 방안:**
```javascript
// 현재 코드 (Line 164-169)
const onTimeOrders = completedOrders.filter(order => {
  const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
  if (!arrivalProcess?.targetDate || !arrivalProcess?.actualDate) return false;
  const delayDays = DateUtils.diffInDays(arrivalProcess.targetDate, arrivalProcess.actualDate);
  return delayDays <= 0;
}).length;

// 개선안 1: 전체 발주 대비 정시 입고율
onTimeRate = Math.round((onTimeOrders / totalOrders) * 100)

// 개선안 2: 별도 KPI 추가
- 납기 준수율: 전체 대비 정시 입고
- 완료율: 전체 대비 입고 완료
```

### 2. **날짜 필터의 혼란**
**현재 문제:**
- 상단 필터(채널, 생산업체)는 전체 데이터에 적용
- 차트 섹션의 날짜 필터는 차트에만 적용
- 사용자가 어떤 데이터를 보고 있는지 혼란

**개선 방안:**
```
Option 1: 날짜 필터를 상단으로 이동
┌─────────────────────────────────────────┐
│ KPI 요약                                 │
│ [채널 ▼] [생산업체 ▼] [2024-01-01 ~ 2024-12-31] │
└─────────────────────────────────────────┘

Option 2: 필터 적용 범위 명시
- "전체 데이터: 채널, 생산업체 필터 적용"
- "차트: 추가로 날짜 범위 적용"
```

### 3. **지연 물량 계산 로직 오류**
**현재 문제 (Line 147-155):**
```javascript
// 미입고 발주 중에서만 지연 판단
const delayedOrders = pendingOrders.filter(order => {
  const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
  if (!arrivalProcess) return false;
  
  const targetDate = arrivalProcess.targetDate;
  const today = DateUtils.today();
  return DateUtils.isAfter(today, targetDate);
});
```

**문제점:**
- `arrivalProcess`가 없으면 지연으로 판단 안 됨
- `targetDate`가 없으면 지연으로 판단 안 됨
- **입고요구일(requiredDelivery) 기준이 아닌 목표일(targetDate) 기준**

**개선 방안:**
```javascript
// 입고요구일 기준으로 지연 판단
const delayedOrders = pendingOrders.filter(order => {
  if (!order.requiredDelivery) return false;
  const requiredDate = new Date(order.requiredDelivery);
  const today = new Date();
  
  // 입고요구일이 지났는데 아직 미입고
  return today > requiredDate;
});
```

---

## 🟡 중요 개선 필요 (High Priority)

### 4. **차트의 데이터 표현 개선**
**현재 문제:**
- 세로 막대 차트가 날짜별 발주량만 표시
- 실제 공정 진행 상황을 직관적으로 파악하기 어려움
- 막대를 클릭해야만 상세 정보 확인 가능

**개선 방안:**
```
Option 1: 차트에 더 많은 정보 표시
┌─────────────────────────────────┐
│   100%  │                        │
│    80%  │  ▓▓  ▓▓  ▓▓            │ 완료
│    60%  │  ▓▓  ▓▓  ▓▓  ░░        │ 진행중
│    40%  │  ▓▓  ▓▓  ▓▓  ░░  ░░    │ 미착수
│    20%  │  ▓▓  ▓▓  ▓▓  ░░  ░░    │
│     0%  │  ▓▓  ▓▓  ▓▓  ░░  ░░    │
│       2024-11-01 11-05 11-10    │
└─────────────────────────────────┘

Option 2: 테이블 뷰 추가
날짜 | 발주량 | 완료 | 진행중 | 공정률 | 지연
```

### 5. **미입고 테이블 개선**
**현재 문제:**
- 차트를 클릭해야만 데이터 표시
- 초기 화면에서는 빈 상태
- "미입고 상세 현황"이라는 이름이 모호함

**개선 방안:**
```javascript
// Line 131: 초기에 모든 미입고 발주 표시
renderPendingOrdersTable(dashboardData.pendingOrders);

// 또는 지연된 발주만 초기 표시
renderPendingOrdersTable(dashboardData.delayedOrders);

// 제목 변경
"🚨 지연 리스크 발주" 또는 "⚠️ 입고 지연 우려"
```

### 6. **공정률 계산의 정확성**
**현재 코드 (Line 253-261):**
```javascript
function calculateProcessRate(order) {
  const productionProcesses = order.schedule?.production || [];
  const shippingProcesses = order.schedule?.shipping || [];
  const allProcesses = [...productionProcesses, ...shippingProcesses];
  const totalProcesses = PROCESS_CONFIG.production.length + PROCESS_CONFIG.shipping.length;
  const completedProcesses = allProcesses.filter(p => p.actualDate).length;
  return totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0;
}
```

**문제점:**
- 모든 공정의 가중치가 동일
- 실제로는 일부 공정이 더 오래 걸림 (예: 원단 입고 vs 검수)

**개선 방안:**
```javascript
// 가중치 기반 공정률 계산
function calculateWeightedProcessRate(order) {
  const processes = [
    ...PROCESS_CONFIG.production.map(p => ({
      ...p,
      actual: order.schedule?.production?.find(s => s.processKey === p.key)
    })),
    ...PROCESS_CONFIG.shipping.map(p => ({
      ...p,
      actual: order.schedule?.shipping?.find(s => s.processKey === p.key)
    }))
  ];
  
  const totalWeight = processes.reduce((sum, p) => sum + (p.defaultLeadTime || 1), 0);
  const completedWeight = processes
    .filter(p => p.actual?.actualDate)
    .reduce((sum, p) => sum + (p.defaultLeadTime || 1), 0);
  
  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}
```

---

## 🟢 개선 권장 (Medium Priority)

### 7. **물류입고 예정일 계산 로직 개선**
**현재 문제 (Line 420-469):**
- 복잡한 계산 로직
- 에러 처리 부족
- 실제 리드타임이 반영되지 않을 수 있음

**개선 방안:**
```javascript
// 더 명확한 로직과 에러 처리
function calculateExpectedArrival(order) {
  try {
    // 1. 마지막 완료된 공정 찾기
    const lastCompleted = findLastCompletedProcess(order);
    
    // 2. 남은 공정 계산
    const remainingProcesses = getRemainingProcesses(order, lastCompleted);
    
    // 3. 예상일 계산
    let expectedDate = lastCompleted?.actualDate 
      ? new Date(lastCompleted.actualDate)
      : new Date(order.orderDate || Date.now());
    
    remainingProcesses.forEach(process => {
      const leadTime = process.leadTime || process.defaultLeadTime || 0;
      expectedDate.setDate(expectedDate.getDate() + leadTime);
    });
    
    return formatDate(expectedDate);
  } catch (error) {
    console.error('Expected arrival calculation error:', error);
    return '-';
  }
}
```

### 8. **KPI 카드에 상세 정보 추가**
**개선 방안:**
```javascript
// 툴팁 또는 클릭 시 상세 정보 표시
<div class="... cursor-pointer" onclick="showKPIDetails('onTimeRate')">
  <p>납기 준수율</p>
  <p>85%</p>
  <p class="text-xxs text-gray-500">
    정시: 170건 / 지연: 30건
  </p>
</div>
```

### 9. **날짜 범위 프리셋 추가**
**개선 방안:**
```javascript
<div class="flex space-x-2">
  <button class="preset-btn">오늘</button>
  <button class="preset-btn">이번주</button>
  <button class="preset-btn">이번달</button>
  <button class="preset-btn">최근 3개월</button>
  <input type="date" id="status-start-date">
  <span>~</span>
  <input type="date" id="status-end-date">
</div>
```

### 10. **차트 인터랙션 개선**
**현재:**
- 막대 클릭 시 미입고 테이블로 스크롤
- 호버 시 툴팁 표시

**개선 방안:**
```javascript
// 1. 막대 클릭 시 해당 발주으로 이동
onclick="navigateToOrders('${data.date}')"

// 2. 드래그로 날짜 범위 선택
// 3. 더블클릭으로 해당 일자 확대
// 4. 차트 타입 변경 옵션 (막대 / 선 / 파이)
```

---

## 🔵 추가 기능 제안 (Nice to Have)

### 11. **실시간 업데이트**
```javascript
// 주기적 데이터 갱신
setInterval(() => {
  if (document.visibilityState === 'visible') {
    updateDashboard();
  }
}, 5 * 60 * 1000); // 5분마다
```

### 12. **데이터 내보내기**
```javascript
// KPI 요약 PDF 다운로드
// 차트 이미지 저장
// 테이블 엑셀 내보내기
```

### 13. **알림 기능**
```javascript
// 지연 위험 발주 자동 알림
// 임계값 초과 시 경고
if (kpi.onTimeRate < 70) {
  showWarning('납기 준수율이 70% 미만입니다!');
}
```

### 14. **비교 기능**
```javascript
// 이전 기간 대비 증감
const previousPeriod = calculatePreviousPeriodKPI();
const change = kpi.onTimeRate - previousPeriod.onTimeRate;

<span class="${change > 0 ? 'text-green-600' : 'text-red-600'}">
  {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
</span>
```

---

## 📋 우선순위 요약

### ⚡ 즉시 수정 필요 (Week 1)
1. ✅ 지연 물량 계산 로직 수정 (입고요구일 기준)
2. ✅ 날짜 필터 위치 및 적용 범위 명확화
3. ✅ KPI 지표 정의 명확화

### 🎯 단기 개선 (Week 2-3)
4. ✅ 차트 데이터 표현 개선
5. ✅ 미입고 테이블 초기 데이터 표시
6. ✅ 공정률 계산 가중치 반영

### 🔄 중기 개선 (Month 1-2)
7. ✅ 물류입고 예정일 계산 로직 리팩토링
8. ✅ KPI 카드 상세 정보 추가
9. ✅ 날짜 범위 프리셋

### 💡 장기 개선 (Month 3+)
10. ✅ 실시간 업데이트
11. ✅ 데이터 내보내기
12. ✅ 알림 기능
13. ✅ 비교 기능

---

## 🎨 UI/UX 개선 제안

### 레이아웃
```
현재:
┌──────────────────────────────────┐
│ KPI 요약        [채널▼][업체▼]   │
├──────────────────────────────────┤
│ [KPI 4개]                         │
├──────────────────────────────────┤
│ 📊 전체 발주 대비 공정 현황       │
│    [날짜 범위]                    │
│    [차트 - 큼]                    │
├──────────────────────────────────┤
│ 🚨 모니터링                       │
│    [빈 테이블]                    │
└──────────────────────────────────┘

개선안:
┌──────────────────────────────────┐
│ 종합현황                          │
│ [채널▼][업체▼][기간▼][새로고침]  │
├──────────────────────────────────┤
│ [KPI 4개] 각각 클릭 가능          │
├──────────────────────────────────┤
│ 📊 공정 진행 현황   [차트타입▼]  │
│    [차트 - 작음]                  │
├──────────────────────────────────┤
│ ⚠️ 지연 위험 발주 (15건)         │
│    [정렬된 테이블 - 즉시 표시]   │
└──────────────────────────────────┘
```

### 색상 일관성
- 🟢 정상/완료: green-500
- 🔵 진행중: blue-500
- 🟡 주의: yellow-500
- 🔴 지연/위험: red-500

---

## 💻 코드 품질 개선

### 성능 최적화
```javascript
// 1. 메모이제이션
const memoizedProcessRate = useMemo(() => 
  calculateProcessRate(order), [order]);

// 2. 불필요한 재계산 방지
if (JSON.stringify(newFilters) === JSON.stringify(oldFilters)) {
  return; // Skip update
}

// 3. 대량 데이터 처리
// 1000개 이상 발주 시 가상 스크롤링 적용
```

### 에러 처리
```javascript
// 모든 계산 함수에 try-catch 추가
// 사용자에게 친화적인 에러 메시지
// 로깅 및 모니터링
```

### 테스트
```javascript
// 단위 테스트 추가
describe('calculateProcessRate', () => {
  it('should calculate correct rate for completed order', () => {
    // ...
  });
});
```

---

이 문서를 기반으로 우선순위에 따라 순차적으로 개선하시면 됩니다! 🚀
