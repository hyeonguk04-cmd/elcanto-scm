// 공정 프로세스 설정
// 새로운 공정 구조 정의
const PROCESS_CONFIG = {
  production: [
    { name: '자재(어퍼)', name_en: 'Material (Upper)', key: 'material_upper', defaultLeadTime: 7 },
    { name: '자재(저부)', name_en: 'Material (Sole)', key: 'material_sole', defaultLeadTime: 7 },
    { name: '한도CFM', name_en: 'Hando CFM', key: 'hando_cfm', defaultLeadTime: 2 },
    { name: '재단', name_en: 'Cutting', key: 'cutting', defaultLeadTime: 3 },
    { name: '제갑', name_en: 'Upper Making', key: 'upper_making', defaultLeadTime: 10 },
    { name: '조립', name_en: 'Assembly (Lasting)', key: 'assembly', defaultLeadTime: 7 },
    { name: '자체검사', name_en: 'Self Inspection', key: 'self_inspection', defaultLeadTime: 2 },
    { name: '공장출고', name_en: 'Factory Shipment', key: 'factory_shipment', defaultLeadTime: 3 }
  ],
  shipping: [
    { name: '선적', name_en: 'Shipping', key: 'shipping', defaultLeadTime: 2 },
    { name: '입항', name_en: 'Arrival', key: 'arrival', defaultLeadTime: 2, hasRoute: true }
  ]
};

// 선적 경로별 리드타임 (일)
const SHIPPING_LEAD_TIMES = {
  '단동-인천': 1,
  '청도-인천': 1,
  '웨이하이-인천': 1,
  '연태-인천': 1,
  '쉐코우-인천': 4,
  '닝보-인천': 5,
  '닝보-부산': 3,
  '호치민-인천': 7,
  '나바사바-부산': 28,
  '국내운송': 1
};

// 국가별 선적 경로
const ROUTES_BY_COUNTRY = {
  "중국": ["웨이하이-인천", "연태-인천", "쉐코우-인천", "닝보-부산", "닝보-인천", "청도-인천", "단동-인천"],
  "베트남": ["호치민-인천"],
  "인도": ["나바사바-부산"],
  "한국": ["국내운송"]
};

// 색상 코드 데이터
const COLOR_CODE_DATA = {
  "10": "White", "15": "Grey", "16": "L/Grey", "17": "D/Grey", "18": "M/Grey", "19": "Black",
  "20": "Red", "21": "D/Red", "25": "Pink", "26": "L/Pink", "27": "D/Pink", "29": "Burgandy",
  "30": "Yellow", "31": "L/Yellow", "34": "Ocher", "35": "Beige", "36": "D/Beige", 
  "37": "D/Beige", "38": "M/Beige", "39": "Ivory", "40": "Green", "41": "L/Green",
  "45": "Yellow Green", "46": "Blue Green", "49": "Khaki", "50": "Blue", "51": "L/Blue",
  "52": "D/Blue", "53": "PALACE BLUE", "54": "AQUA SKY", "55": "Indigo", "56": "D/Indigo",
  "57": "D/Indigo", "58": "D/Khaki", "59": "Navy", "60": "Charcoal", "61": "Coral",
  "62": "Hunter", "63": "Royal", "64": "Cream", "65": "Ds-T L/BLUE", "66": "DST BLUE",
  "68": "DST D/BLUE", "69": "DST GREY", "70": "Violet", "71": "DST WHITE", "72": "RINSE",
  "75": "Purple", "80": "Orange", "85": "Brown", "91": "Silver", "92": "Gold",
  "93": "Pewter", "94": "Bronze", "99": "Mix", "TP": "Taupe", "TA": "Tan",
  "BL": "M/Black", "SB": "S/Black", "PB": "P/Black", "MB": "M/Black",
  "CO": "Cognac", "PL": "Pearl"
};

// 국가별 생산업체
const SUPPLIERS_BY_COUNTRY = {
  "중국": ["성안", "메이하오", "차오란", "리청", "한이", "아마존", "주딩", "태영", "봉연", "삼명", "가온", "수창", "키미"],
  "베트남": ["AAU", "티앤팟", "스타원", "마코토"],
  "인도": ["루트라", "SKS", "디로드", "샤이안", "엑스포", "프루티"],
  "한국": ["한국업체1", "한국업체2", "한국업체3"]
};

// 공정 프로세스를 위한 헬퍼 함수들
function getAllProcesses() {
  return [...PROCESS_CONFIG.production, ...PROCESS_CONFIG.shipping];
}

function getProcessByKey(key) {
  const allProcesses = getAllProcesses();
  return allProcesses.find(p => p.key === key);
}

function getProcessByName(name) {
  const allProcesses = getAllProcesses();
  return allProcesses.find(p => p.name === name);
}

// 언어에 따른 공정명 가져오기
function getProcessName(process, lang = 'ko') {
  if (!process) return '';
  return lang === 'en' ? (process.name_en || process.name) : process.name;
}

// 날짜 계산 유틸리티
function addDays(dateStr, days) {
  if (!dateStr || days === null || days === undefined) return null;
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function dateDiffInDays(targetDate, actualDate) {
  if (!targetDate) return null;
  if (!actualDate) return null;
  const target = new Date(targetDate);
  const actual = new Date(actualDate);
  const diffTime = actual - target;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 공정 일정 자동 계산 (표준 리드타임 기준)
function calculateProcessSchedule(orderDate, supplierLeadTimes = null, route = null) {
  const schedule = {
    production: [],
    shipping: []
  };
  
  let currentDate = orderDate;
  
  // 생산 공정
  PROCESS_CONFIG.production.forEach(process => {
    const leadTime = (supplierLeadTimes && supplierLeadTimes[process.key]) || process.defaultLeadTime;
    currentDate = addDays(currentDate, leadTime);
    schedule.production.push({
      processKey: process.key,
      name: process.name,
      name_en: process.name_en,
      targetDate: currentDate,
      actualDate: null,
      photo: null,
      delayReason: null,
      leadTime: leadTime
    });
  });
  
  // 운송 공정
  PROCESS_CONFIG.shipping.forEach(process => {
    let leadTime = process.defaultLeadTime;
    
    // 입항의 경우 선적 경로에 따라 리드타임 결정
    if (process.key === 'arrival' && route) {
      leadTime = SHIPPING_LEAD_TIMES[route] || 0;
    }
    
    currentDate = addDays(currentDate, leadTime);
    
    const processData = {
      processKey: process.key,
      name: process.name,
      name_en: process.name_en,
      targetDate: currentDate,
      actualDate: null,
      photo: null,
      delayReason: null,
      leadTime: leadTime
    };
    
    if (process.hasRoute) {
      processData.route = route;
    }
    
    schedule.shipping.push(processData);
  });
  
  return schedule;
}

export {
  PROCESS_CONFIG,
  SHIPPING_LEAD_TIMES,
  ROUTES_BY_COUNTRY,
  COLOR_CODE_DATA,
  SUPPLIERS_BY_COUNTRY,
  getAllProcesses,
  getProcessByKey,
  getProcessByName,
  getProcessName,
  addDays,
  dateDiffInDays,
  calculateProcessSchedule
};
