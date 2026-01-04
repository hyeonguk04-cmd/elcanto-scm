# 🔴 생산업체 리드타임 불일치 문제 분석

## 문제 상황

### 챠오란 예시:
- **생산업체 관리 화면 표시값** (UI):
  - 자재: 21일
  - 한도CFM: 15일
  - 제갑&조립: 17일
  - 공장출고: 4일
  - 선적: 3일
  - 입항: 8일

- **Firebase /suppliers/chaoran leadTimes**:
  ```
  material: 26
  hando_cfm: 15
  cutting_upper: 33
  factory_shipment: 5
  shipping: 4
  arrival: 35
  ```

## 핵심 질문

**1. UI 표시값은 어디서 오나요?**
   - A) Firebase leadTimes에서 직접 로드? → 그렇다면 UI도 26, 33, 5, 4, 35를 표시해야 함
   - B) 다른 소스(엑셀, 하드코딩)? → 그렇다면 어디?

**2. "UI 표시값"이 21, 15, 17, 4, 3, 8 이라고 말씀하셨는데:**
   - 실제로 생산업체 관리 화면에서 "챠오란 수정" 버튼을 눌렀을 때 input에 **21, 15, 17, 4, 3, 8**이 표시되나요?
   - 아니면 **26, 15, 33, 5, 4, 35**가 표시되나요?

## 가능한 시나리오

### 시나리오 A: UI가 Firebase 값을 표시하는 경우
```javascript
// manufacturer-management.js Line 569-575
document.getElementById('leadTime_material').value = supplier.leadTimes.material || '';
// → Firebase의 26이 표시됨
```

→ **해결책**: Firebase 값을 21로 수정

### 시나리오 B: UI가 다른 소스를 표시하는 경우
→ **확인 필요**: 어디서 21이라는 값이 오는지 추적

## 확인 필요 사항

**생산업체 관리 화면에서:**
1. "챠오란" 업체의 "수정" 버튼 클릭
2. "공정별 리드타임" 섹션의 각 input 값 확인:
   - 자재 input에 표시된 값: ___일
   - 한도CFM input에 표시된 값: ___일
   - 제갑&조립 input에 표시된 값: ___일
   - 공장출고 input에 표시된 값: ___일
   - 선적 input에 표시된 값: ___일
   - 입항 input에 표시된 값: ___일

**스크린샷 또는 정확한 값을 알려주시면 정확한 해결책을 제공할 수 있습니다!**

