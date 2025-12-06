// 유틸리티 함수들

// 날짜 관련 유틸리티
export const DateUtils = {
  // 날짜 차이 계산 (일)
  diffInDays(targetDate, actualDate) {
    if (!targetDate || !actualDate) return null;
    const target = new Date(targetDate);
    const actual = new Date(actualDate);
    const diffTime = actual - target;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // 날짜에 일수 추가
  addDays(dateStr, days) {
    if (!dateStr || days === null || days === undefined) return null;
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },

  // 날짜 포맷팅 (YYYY-MM-DD)
  formatDate(date) {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date.toDate) date = date.toDate(); // Firestore Timestamp
    return date.toISOString().split('T')[0];
  },

  // 오늘 날짜
  today() {
    return new Date().toISOString().split('T')[0];
  },

  // 날짜 비교
  isBefore(date1, date2) {
    return new Date(date1) < new Date(date2);
  },

  isAfter(date1, date2) {
    return new Date(date1) > new Date(date2);
  },

  // 주차 계산
  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  },

  // 엑셀 날짜를 문자열로 변환
  excelDateToString(excelDate) {
    if (!excelDate) return null;
    
    // 이미 문자열 형식(YYYY-MM-DD)이면 그대로 반환
    if (typeof excelDate === 'string') {
      return excelDate;
    }
    
    // 엑셀 날짜 시리얼 번호를 JavaScript Date로 변환
    // 엑셀은 1900-01-01을 1로 시작 (단, 1900년을 윤년으로 잘못 계산하는 버그 있음)
    const excelEpoch = new Date(1899, 11, 30); // 1899-12-30
    const msPerDay = 86400000;
    const date = new Date(excelEpoch.getTime() + excelDate * msPerDay);
    
    // 로컬 시간대 기준으로 날짜 포맷팅 (UTC 변환 문제 방지)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
};

// UI 유틸리티
export const UIUtils = {
  // 로딩 스피너 표시/숨김
  showLoading() {
    document.getElementById('loading-spinner')?.classList.remove('hidden');
  },

  hideLoading() {
    document.getElementById('loading-spinner')?.classList.add('hidden');
  },

  // 알림 메시지 표시
  showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fade-in fixed top-4 right-4 z-50 max-w-md`;
    alertDiv.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.remove();
    }, 3000);
  },

  // 확인 대화상자
  async confirm(message) {
    return window.confirm(message);
  },

  // 모달 열기/닫기
  openModal(modalId) {
    document.getElementById(modalId)?.classList.remove('hidden');
  },

  closeModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
  },

  // 요소 표시/숨김
  show(elementId) {
    document.getElementById(elementId)?.classList.remove('hidden');
  },

  hide(elementId) {
    document.getElementById(elementId)?.classList.add('hidden');
  },

  // 지연 상태에 따른 CSS 클래스
  getDelayClass(delayDays) {
    if (delayDays === null) return 'delay-zero';
    if (delayDays > 0) return 'delay-positive';
    if (delayDays < 0) return 'delay-negative';
    return 'delay-zero';
  },

  // 지연일 렌더링
  renderDelay(delayDays) {
    if (delayDays === null) return '-';
    const className = this.getDelayClass(delayDays);
    const displayValue = delayDays === 0 ? '0' : delayDays > 0 ? `+${delayDays}` : delayDays;
    return `<span class="${className}">${displayValue}</span>`;
  }
};

// 데이터 유틸리티
export const DataUtils = {
  // 배열을 그룹화
  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = typeof key === 'function' ? key(item) : item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  },

  // 배열 정렬
  sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = typeof key === 'function' ? key(a) : a[key];
      const bVal = typeof key === 'function' ? key(b) : b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // 배열 필터링
  filterBy(array, filters) {
    return array.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === '전체' || value === null || value === undefined) return true;
        return item[key] === value;
      });
    });
  },

  // 합계 계산
  sumBy(array, key) {
    return array.reduce((sum, item) => {
      const value = typeof key === 'function' ? key(item) : item[key];
      return sum + (value || 0);
    }, 0);
  },

  // 평균 계산
  averageBy(array, key) {
    if (array.length === 0) return 0;
    return this.sumBy(array, key) / array.length;
  },

  // 고유 값 추출
  unique(array, key = null) {
    if (!key) return [...new Set(array)];
    return [...new Set(array.map(item => item[key]))];
  }
};

// 엑셀 유틸리티
export const ExcelUtils = {
  // 엑셀 파일 읽기
  async readExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  // 엑셀 파일에서 이미지 추출
  async extractImagesFromExcel(file) {
    try {
      console.log('🔍 ZIP 파일 로딩 시작...');
      const zip = await JSZip.loadAsync(file);
      
      // ZIP 파일 구조 확인 (디버깅용)
      console.log('📦 ZIP 파일 내용:');
      zip.forEach((relativePath, zipEntry) => {
        console.log(`  - ${relativePath} (dir: ${zipEntry.dir})`);
      });
      
      const images = [];
      const mediaFolder = zip.folder('xl/media');
      
      if (!mediaFolder) {
        console.warn('⚠️ xl/media 폴더가 없습니다. 엑셀 파일에 이미지가 포함되지 않았을 수 있습니다.');
        // 대체 경로 확인
        const altPaths = ['xl/media/', 'media/', 'images/'];
        for (const altPath of altPaths) {
          const altFolder = zip.folder(altPath);
          if (altFolder) {
            console.log(`✅ 대체 경로 발견: ${altPath}`);
            break;
          }
        }
        return images;
      }

      console.log('📁 xl/media 폴더 발견, 이미지 추출 시작...');
      
      // 이미지 파일 추출
      const imagePromises = [];
      let imageCount = 0;
      
      mediaFolder.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          imageCount++;
          console.log(`  🖼️ 이미지 발견: ${relativePath}`);
          imagePromises.push(
            zipEntry.async('blob').then(blob => {
              const ext = relativePath.split('.').pop().toLowerCase();
              const mimeType = ext === 'png' ? 'image/png' : 
                              ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 
                              ext === 'gif' ? 'image/gif' : 
                              ext === 'bmp' ? 'image/bmp' : 'image/png';
              
              const fileName = relativePath.split('/').pop();
              console.log(`    ✓ 변환: ${fileName} (${mimeType})`);
              
              return {
                name: fileName,
                relativePath: relativePath,
                blob: new Blob([blob], { type: mimeType }),
                file: new File([blob], fileName, { type: mimeType })
              };
            })
          );
        }
      });

      const extractedImages = await Promise.all(imagePromises);
      console.log(`✅ 총 ${extractedImages.length}개의 이미지 추출 완료`);
      extractedImages.forEach((img, idx) => {
        console.log(`  ${idx + 1}. ${img.name} (크기: ${img.file.size} bytes)`);
      });
      
      return extractedImages;
    } catch (error) {
      console.error('❌ 이미지 추출 오류:', error);
      return [];
    }
  },

  // 엑셀 파일과 이미지를 함께 읽기
  async readExcelWithImages(file) {
    try {
      const [data, images] = await Promise.all([
        this.readExcel(file),
        this.extractImagesFromExcel(file)
      ]);
      
      return {
        data,
        images
      };
    } catch (error) {
      console.error('엑셀 읽기 오류:', error);
      throw error;
    }
  },

  // 엑셀 파일 생성 및 다운로드
  downloadExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, filename);
  },

  // 템플릿 다운로드
  downloadTemplate(columns, filename) {
    const data = [columns.reduce((obj, col) => ({ ...obj, [col]: '' }), {})];
    this.downloadExcel(data, filename);
  }
};

// Storage 유틸리티
export const StorageUtils = {
  // 로컬 스토리지에 저장
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('LocalStorage save error:', error);
      return false;
    }
  },

  // 로컬 스토리지에서 가져오기
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  },

  // 로컬 스토리지에서 삭제
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  },

  // 로컬 스토리지 초기화
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  }
};

// 검증 유틸리티
export const ValidationUtils = {
  // 이메일 검증
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // 날짜 검증
  isValidDate(dateStr) {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  },

  // 숫자 검증
  isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  // 필수 필드 검증
  validateRequired(value) {
    return value !== null && value !== undefined && value !== '';
  },

  // 범위 검증
  validateRange(value, min, max) {
    const num = parseFloat(value);
    return num >= min && num <= max;
  }
};

// 포맷 유틸리티
export const FormatUtils = {
  // 숫자 포맷 (천단위 구분)
  formatNumber(num) {
    return num?.toLocaleString() || '0';
  },

  // 퍼센트 포맷
  formatPercent(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  // 파일 크기 포맷
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
};

// Export all utilities
export default {
  DateUtils,
  UIUtils,
  DataUtils,
  ExcelUtils,
  StorageUtils,
  ValidationUtils,
  FormatUtils
};
