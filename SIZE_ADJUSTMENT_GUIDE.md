# 📏 테이블 및 컨테이너 사이즈 조정 가이드

각 페이지의 테이블 높이, 여백, 패딩 등을 직접 조정할 수 있는 가이드입니다.

---

## 🎯 주요 조정 포인트

### 1. **간격 조정 (Spacing)**
- `space-y-X` : 수직 간격 (0, 1, 2, 3, 4, 5, 6, 8, 10, 12 등)
  - 예: `space-y-3` = 12px, `space-y-6` = 24px

### 2. **패딩 조정 (Padding)**
- `p-X` : 전체 패딩
- `px-X` : 좌우 패딩
- `py-X` : 상하 패딩
  - 예: `p-3` = 12px, `p-6` = 24px

### 3. **테이블 높이 조정**
- `calc(100vh - XXpx)` : 화면 높이에서 XXpx를 뺀 크기
  - 숫자를 **작게** 하면 → 테이블이 **더 커짐**
  - 숫자를 **크게** 하면 → 테이블이 **더 작아짐**

### 4. **텍스트 크기**
- `text-xs` : 12px (가장 작음)
- `text-sm` : 14px
- `text-base` : 16px
- `text-lg` : 18px
- `text-xl` : 20px
- `text-2xl` : 24px

---

## 📄 페이지별 조정 위치

### 1️⃣ **생산 목표일정 수립**
**파일**: `/home/user/webapp/public/js/order-management.js`

```javascript
// 📍 라인 28-54
container.innerHTML = `
  <div class="space-y-3">  <!-- ⬅️ 상단 여백 조정 (space-y-3, 6 등) -->
    <div class="flex justify-between items-center flex-wrap gap-4">
      <h2 class="text-xl font-bold text-gray-800">  <!-- ⬅️ 제목 크기 (text-xl, 2xl 등) -->
        생산 목표일정 수립
      </h2>
      <div class="space-x-2">  <!-- ⬅️ 버튼 간격 -->
        <button class="px-3 py-1.5 text-sm">  <!-- ⬅️ 버튼 크기 -->
          ...
        </button>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-lg p-3">  <!-- ⬅️ 카드 패딩 (p-3, 6 등) -->
      <div id="orders-table" class="overflow-auto" 
           style="max-height: calc(100vh - 120px);">  <!-- ⬅️ 테이블 높이 조정 -->
      </div>
    </div>
  </div>
`;
```

**현재 설정**:
- 상단 여백: `space-y-3` (12px)
- 제목: `text-xl` (20px)
- 카드 패딩: `p-3` (12px)
- 테이블 높이: `calc(100vh - 120px)` ← **120을 줄이면 테이블이 커짐**

---

### 2️⃣ **공정 입고진척 현황**
**파일**: `/home/user/webapp/public/js/analytics.js`

```javascript
// 📍 라인 40-60
container.innerHTML = `
  <div class="space-y-3">  <!-- ⬅️ 상단 여백 -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold text-gray-800">  <!-- ⬅️ 제목 크기 -->
        공정 입고진척 현황
      </h2>
      <div class="flex space-x-2">
        <select class="px-2 py-1.5 text-sm">  <!-- ⬅️ 필터 크기 -->
          ...
        </select>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      <div id="analytics-table-container" class="overflow-auto" 
           style="max-height: calc(100vh - 110px);">  <!-- ⬅️ 테이블 높이 -->
      </div>
    </div>
  </div>
`;
```

**현재 설정**:
- 상단 여백: `space-y-3`
- 제목: `text-xl`
- 테이블 높이: `calc(100vh - 110px)` ← **110을 줄이면 테이블이 커짐**

---

### 3️⃣ **주간 리포트**
**파일**: `/home/user/webapp/public/js/weekly-report.js`

```javascript
// 📍 라인 115-135
<div class="space-y-3">  <!-- ⬅️ 전체 상단 여백 -->
  <h2 class="text-lg font-bold text-gray-800">  <!-- ⬅️ 제목 크기 -->
    주간 리포트
  </h2>

  <!-- KPI 카드 섹션 -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-3">  <!-- ⬅️ KPI 카드 간격 -->
    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-3">  <!-- ⬅️ 카드 패딩 -->
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-blue-600 font-medium mb-0.5">  <!-- ⬅️ 라벨 크기 -->
            주간 발주량
          </p>
          <p class="text-xl font-bold text-blue-700">  <!-- ⬅️ 숫자 크기 -->
            ${weeklyOrderQty.toLocaleString()}개
          </p>
        </div>
        <div class="bg-blue-500 text-white rounded-full p-1.5">  <!-- ⬅️ 아이콘 패딩 -->
          <i class="fas fa-shopping-cart text-base"></i>  <!-- ⬅️ 아이콘 크기 -->
        </div>
      </div>
    </div>
  </div>

  <!-- 테이블 섹션 -->
  <div class="bg-white rounded-xl shadow-lg overflow-hidden">
    <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2">  <!-- ⬅️ 헤더 패딩 -->
      <h3 class="text-base font-bold text-white">  <!-- ⬅️ 헤더 텍스트 크기 -->
        주간 발주 현황
      </h3>
    </div>
    <div class="overflow-auto" 
         style="max-height: calc(100vh - 280px);">  <!-- ⬅️ 테이블 높이 -->
    </div>
  </div>
</div>
```

**현재 설정**:
- 상단 여백: `space-y-3`
- 제목: `text-lg` (18px)
- KPI 카드 간격: `gap-3` (12px)
- KPI 카드 패딩: `p-3` (12px)
- KPI 숫자 크기: `text-xl` (20px)
- 테이블 높이: `calc(100vh - 280px)` ← **280을 줄이면 테이블이 커짐**

---

### 4️⃣ **생산업체 관리**
**파일**: `/home/user/webapp/public/js/manufacturer-management.js`

```javascript
// 📍 라인 14-29
<div class="manufacturer-management">
  <div class="flex justify-between items-center mb-3">  <!-- ⬅️ 하단 여백 -->
    <div>
      <h2 class="text-xl font-bold text-gray-800">  <!-- ⬅️ 제목 크기 -->
        생산업체 관리
      </h2>
      <p class="text-xs text-gray-500 mt-0.5">  <!-- ⬅️ 설명 크기 -->
        생산업체 정보를 등록하고 관리합니다
      </p>
    </div>
    <button class="px-3 py-1.5 text-sm">  <!-- ⬅️ 버튼 크기 -->
      업체 추가
    </button>
  </div>

  <div class="bg-white rounded-xl shadow-lg overflow-hidden">
    <div class="overflow-auto" 
         style="max-height: calc(100vh - 110px);">  <!-- ⬅️ 테이블 높이 -->
    </div>
  </div>
</div>
```

**현재 설정**:
- 상단 여백: `mb-3` (12px)
- 제목: `text-xl`
- 테이블 높이: `calc(100vh - 110px)` ← **110을 줄이면 테이블이 커짐**

---

### 5️⃣ **사용자 관리**
**파일**: `/home/user/webapp/public/js/user-management.js`

```javascript
// 📍 라인 13-24
<div class="space-y-3">  <!-- ⬅️ 상단 여백 -->
  <div class="flex justify-between items-center">
    <h2 class="text-xl font-bold text-gray-800">  <!-- ⬅️ 제목 크기 -->
      사용자 관리
    </h2>
    <button class="px-3 py-1.5 text-sm">  <!-- ⬅️ 버튼 크기 -->
      사용자 추가
    </button>
  </div>
  
  <div class="bg-white rounded-xl shadow-lg overflow-hidden">
    <div class="overflow-auto" 
         style="max-height: calc(100vh - 110px);">  <!-- ⬅️ 테이블 높이 -->
    </div>
  </div>
</div>
```

**현재 설정**:
- 상단 여백: `space-y-3`
- 제목: `text-xl`
- 테이블 높이: `calc(100vh - 110px)` ← **110을 줄이면 테이블이 커짐**

---

## 🔧 실제 조정 예시

### 예시 1: 테이블을 더 크게 만들기
```javascript
// 변경 전
style="max-height: calc(100vh - 120px);"

// 변경 후 (50px 더 큼)
style="max-height: calc(100vh - 70px);"
```

### 예시 2: 상단 여백 늘리기
```javascript
// 변경 전
<div class="space-y-3">  <!-- 12px -->

// 변경 후
<div class="space-y-6">  <!-- 24px -->
```

### 예시 3: 제목 크게 만들기
```javascript
// 변경 전
<h2 class="text-xl">  <!-- 20px -->

// 변경 후
<h2 class="text-2xl">  <!-- 24px -->
```

### 예시 4: 카드 패딩 늘리기
```javascript
// 변경 전
<div class="p-3">  <!-- 12px -->

// 변경 후
<div class="p-6">  <!-- 24px -->
```

---

## 📊 조정 권장사항

### 테이블 높이 최적화
| 페이지 | 현재 값 | 권장 범위 | 설명 |
|--------|---------|-----------|------|
| 생산 목표일정 | -120px | -80px ~ -150px | 버튼이 많아서 약간 여유 필요 |
| 공정 입고진척 | -110px | -80px ~ -140px | 필터가 있어서 중간 정도 |
| 주간 리포트 | -280px | -200px ~ -350px | KPI 카드 때문에 더 많이 빼야 함 |
| 생산업체 관리 | -110px | -80px ~ -140px | 단순 테이블 |
| 사용자 관리 | -110px | -80px ~ -140px | 단순 테이블 |

### 간격 최적화
- **넓게**: `space-y-6` (24px) - 여유로운 레이아웃
- **보통**: `space-y-4` (16px) - 균형잡힌 레이아웃
- **좁게**: `space-y-3` (12px) - 컴팩트한 레이아웃 (현재)
- **매우 좁게**: `space-y-2` (8px) - 최대 압축

---

## 🚀 변경 후 배포 방법

1. 파일 수정
2. Git 커밋 & 푸시
```bash
cd /home/user/webapp
git add .
git commit -m "style: adjust table sizes for [페이지명]"
git push origin main
```
3. GitHub Actions 자동 배포 (2-3분 소요)
4. 브라우저 강제 새로고침 (Ctrl+Shift+R)

---

## 💡 팁

1. **한 번에 하나씩 조정**: 여러 값을 동시에 바꾸면 어떤 게 효과적인지 모름
2. **백업 먼저**: 변경 전 현재 값을 주석으로 남겨두기
3. **실제 데이터로 테스트**: 테이블에 많은 행이 있을 때 확인
4. **반응형 고려**: 다양한 화면 크기에서 테스트

---

이 가이드로 각 페이지의 레이아웃을 자유롭게 조정하실 수 있습니다! 🎨
