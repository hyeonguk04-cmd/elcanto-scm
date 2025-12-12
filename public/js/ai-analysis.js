// AI 분석 시스템 for 종합현황 대시보드
// Hybrid Approach: Background Preloading + Smart Caching

// ===== KPI 우선순위 정의 =====
const KPI_PRIORITIES = {
  delayed: { priority: 'HIGH', delay: 1000, label: '지연 물량' },
  progress: { priority: 'HIGH', delay: 1000, label: '입고 진행률' },
  ontime: { priority: 'MEDIUM', delay: 5000, label: '납기 준수율' },
  total: { priority: 'LOW', delay: 10000, label: '총 발주량' }
};

// ===== AI 분석 캐시 시스템 =====
class AIAnalysisCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 20;
    this.ttl = 15 * 60 * 1000; // 15분
  }

  /**
   * 캐시 키 생성 (KPI 타입 + 데이터 값 + 5분 단위 타임슬롯)
   */
  generateKey(kpiType, value) {
    const now = new Date();
    const timeSlot = Math.floor(now.getTime() / (5 * 60 * 1000)); // 5분 단위
    return `${kpiType}_${value}_${timeSlot}`;
  }

  /**
   * 캐시 조회
   */
  get(kpiType, value) {
    const key = this.generateKey(kpiType, value);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // TTL 체크
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 캐시 저장
   */
  set(kpiType, value, data) {
    const key = this.generateKey(kpiType, value);

    // 최대 크기 초과 시 가장 오래된 항목 제거
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 캐시 무효화
   */
  invalidate(kpiType) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(kpiType + '_')) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 캐시 통계
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 전체 캐시 초기화
   */
  clear() {
    this.cache.clear();
  }
}

// 글로벌 캐시 인스턴스
const aiCache = new AIAnalysisCache();

// ===== AI 분석 상태 관리 =====
const analysisState = {
  delayed: { status: 'pending', data: null },
  progress: { status: 'pending', data: null },
  ontime: { status: 'pending', data: null },
  total: { status: 'pending', data: null }
};

// ===== KPI별 프롬프트 생성 =====
function generatePrompt(kpiType, kpiData) {
  const prompts = {
    delayed: `당신은 생산 관리 전문가입니다.

[지연 물량 데이터]
- 총 지연 물량: ${kpiData.delayedQty}개
- 지연 건수: ${kpiData.delayedOrders}건
- 주요 업체: ${kpiData.topSupplier || '데이터 없음'}
- 심각도: ${kpiData.severity || 'medium'}

분석 포인트:
1. 지연 물량의 긴급 대응 방안
2. 업체별 리스크 분석 및 해소 전략
3. 장기 지연 방지책
4. 즉시 실행 가능한 구체적 조치사항

JSON 형식으로만 응답하세요. 다음 구조를 따르세요:
{
  "currentStatus": "현황을 3-4문장으로 요약",
  "keyMetrics": [
    {"label": "지표명", "value": "값"}
  ],
  "issues": [
    {
      "priority": "high|medium|low",
      "title": "이슈 제목",
      "description": "이슈 상세 설명"
    }
  ],
  "suggestions": [
    {
      "title": "제안 제목",
      "detail": "구체적인 실행 방안",
      "urgency": "immediate|short|medium|long",
      "expectedTime": "예상 소요 시간"
    }
  ],
  "expectedImpact": "개선 시 예상 효과 요약",
  "impactMetrics": [
    {
      "name": "지표명",
      "before": "현재값",
      "after": "목표값",
      "improvement": "개선율"
    }
  ]
}

issues는 3개, suggestions는 3-4개로 제한하세요.`,

    progress: `당신은 생산 관리 전문가입니다.

[입고 진행률 데이터]
- 현재 진행률: ${kpiData.progressRate}%
- 완료 물량: ${kpiData.completedQty}개 / 총 ${kpiData.totalQty}개
- 공정별 현황: ${JSON.stringify(kpiData.processStatus || {})}
- 채널별 편차: ${JSON.stringify(kpiData.channelStats || {})}

분석 포인트:
1. 병목 공정 분석 및 원인
2. 채널별 편차 해소 방안
3. 공정 우선순위별 해결 방안
4. 목표 달성 로드맵

JSON 형식으로만 응답하세요. issues 3개, suggestions 3-4개로 제한.`,

    ontime: `당신은 생산 관리 전문가입니다.

[납기 준수율 데이터]
- 현재 준수율: ${kpiData.onTimeRate}%
- 정시 입고: ${kpiData.onTimeOrders}건
- 지연 입고: ${kpiData.lateOrders}건
- 업체별 현황: ${JSON.stringify(kpiData.supplierStats || {})}

분석 포인트:
1. 준수율 저하 근본 원인
2. 업체별 맞춤 대응 방안
3. 발주 리드타임 재설정 필요성
4. 단기(1주), 중기(1개월) 개선 계획

JSON 형식으로만 응답하세요. issues 3개, suggestions 3-4개로 제한.`,

    total: `당신은 공급망 관리 전문가입니다.

[총 발주량 데이터]
- 총 발주량: ${kpiData.totalQty}개
- 발주 건수: ${kpiData.totalOrders}건
- 업체별 분포: ${JSON.stringify(kpiData.supplierDistribution || {})}
- 집중도: ${kpiData.concentration || 'N/A'}

분석 포인트:
1. 공급업체 집중도 리스크 평가
2. 공급망 안정성을 위한 다변화 전략
3. 2차 협력업체 확보 방안
4. 발주량 재분배 시나리오

JSON 형식으로만 응답하세요. issues 3개, suggestions 3-4개로 제한.`
  };

  return prompts[kpiType] || '';
}

// ===== Fallback 인사이트 (API 오류 시 사용) =====
const FALLBACK_INSIGHTS = {
  delayed: {
    currentStatus: '지연 물량에 대한 긴급 대응이 필요합니다. 주요 생산업체와의 커뮤니케이션을 강화하여 지연 원인을 파악하고 개선 조치를 취해야 합니다.',
    keyMetrics: [
      { label: '총 지연 물량', value: '데이터 확인 필요' },
      { label: '평균 지연 일수', value: '분석 중' }
    ],
    issues: [
      {
        priority: 'high',
        title: '생산업체 집중 리스크',
        description: '특정 업체에 발주가 집중되어 있어 해당 업체의 지연이 전체 공급망에 큰 영향을 미칩니다.'
      },
      {
        priority: 'high',
        title: '긴급 대응 체계 필요',
        description: '지연 물량에 대한 신속한 파악과 대응이 필요합니다.'
      },
      {
        priority: 'medium',
        title: '리드타임 재검토',
        description: '현재 설정된 리드타임이 실제 생산 상황을 반영하지 못하고 있을 가능성이 있습니다.'
      }
    ],
    suggestions: [
      {
        title: '일일 모니터링 강화',
        detail: '지연 물량에 대한 일일 모니터링 체계를 구축하고 담당자를 지정합니다.',
        urgency: 'immediate',
        expectedTime: '즉시'
      },
      {
        title: '생산업체 커뮤니케이션',
        detail: '주요 생산업체와 주간 정기 회의를 통해 생산 현황 및 이슈를 공유합니다.',
        urgency: 'short',
        expectedTime: '1주일'
      },
      {
        title: '대체 공급업체 확보',
        detail: '리스크 분산을 위해 대체 공급업체를 발굴하고 테스트 발주를 진행합니다.',
        urgency: 'medium',
        expectedTime: '1개월'
      }
    ],
    expectedImpact: '개선 조치 시행 시 지연 물량을 30-50% 감소시킬 수 있으며, 납기 준수율을 향상시킬 수 있습니다.',
    impactMetrics: [
      {
        name: '지연 물량',
        before: '현재 수준',
        after: '30-50% 감소',
        improvement: '30-50%'
      }
    ]
  },

  progress: {
    currentStatus: '입고 진행률을 향상시키기 위해 후반 공정의 병목 현상을 해소해야 합니다. 채널별 편차를 줄이고 전체적인 진행률을 개선하는 것이 중요합니다.',
    keyMetrics: [
      { label: '전체 진행률', value: '데이터 확인 필요' },
      { label: '병목 공정', value: '분석 중' }
    ],
    issues: [
      {
        priority: 'high',
        title: '후반 공정 병목',
        description: '출고, 선적, 입항 공정에서 지연이 발생하고 있습니다.'
      },
      {
        priority: 'medium',
        title: '채널별 진행률 편차',
        description: '채널 간 진행률 차이가 발생하고 있어 균형적인 관리가 필요합니다.'
      },
      {
        priority: 'medium',
        title: '공정 가시성 부족',
        description: '실시간 공정 현황 파악이 어려워 신속한 대응이 제한적입니다.'
      }
    ],
    suggestions: [
      {
        title: '병목 공정 리소스 집중',
        detail: '지연이 발생하는 공정에 인력 및 리소스를 우선 배치합니다.',
        urgency: 'immediate',
        expectedTime: '즉시'
      },
      {
        title: 'ELCANTO 채널 벤치마킹',
        detail: '진행률이 높은 채널의 프로세스를 분석하여 다른 채널에 적용합니다.',
        urgency: 'short',
        expectedTime: '1-2주'
      },
      {
        title: '실시간 트래킹 시스템 도입',
        detail: '공정별 실시간 현황을 파악할 수 있는 시스템을 구축합니다.',
        urgency: 'medium',
        expectedTime: '1개월'
      }
    ],
    expectedImpact: '병목 공정 해소 및 채널별 균형 개선으로 전체 진행률을 15-20% 향상시킬 수 있습니다.',
    impactMetrics: [
      {
        name: '입고 진행률',
        before: '현재 수준',
        after: '15-20% 향상',
        improvement: '15-20%'
      }
    ]
  },

  ontime: {
    currentStatus: '납기 준수율 개선을 위해 생산업체별 맞춤 관리와 리드타임 재설정이 필요합니다. 전체적인 지연 상황을 해소하기 위한 체계적인 접근이 요구됩니다.',
    keyMetrics: [
      { label: '납기 준수율', value: '데이터 확인 필요' },
      { label: '평균 지연일', value: '분석 중' }
    ],
    issues: [
      {
        priority: 'high',
        title: '전반적인 납기 지연',
        description: '대부분의 발주에서 납기 지연이 발생하고 있습니다.'
      },
      {
        priority: 'high',
        title: '업체별 대응 필요',
        description: '생산업체별로 지연 원인과 패턴이 다르므로 맞춤형 관리가 필요합니다.'
      },
      {
        priority: 'medium',
        title: '리드타임 현실화',
        description: '현재 리드타임 설정이 실제 생산 소요 시간을 반영하지 못하고 있습니다.'
      }
    ],
    suggestions: [
      {
        title: '업체별 개선 계획 수립',
        detail: '주요 생산업체별로 지연 원인을 분석하고 개별 개선 계획을 수립합니다.',
        urgency: 'immediate',
        expectedTime: '1주일'
      },
      {
        title: '리드타임 재설정',
        detail: '최근 6개월 데이터를 기반으로 현실적인 리드타임을 재설정합니다.',
        urgency: 'short',
        expectedTime: '2주일'
      },
      {
        title: '인센티브 제도 도입',
        detail: '납기 준수 시 인센티브를 제공하여 생산업체의 동기를 부여합니다.',
        urgency: 'medium',
        expectedTime: '1개월'
      }
    ],
    expectedImpact: '체계적인 관리와 리드타임 재설정으로 납기 준수율을 20-30% 향상시킬 수 있습니다.',
    impactMetrics: [
      {
        name: '납기 준수율',
        before: '현재 수준',
        after: '20-30% 향상',
        improvement: '20-30%'
      }
    ]
  },

  total: {
    currentStatus: '공급망 안정성을 위해 발주량 분산과 2차 협력업체 확보가 필요합니다. 특정 업체에 대한 의존도를 낮추고 리스크를 분산시키는 것이 중요합니다.',
    keyMetrics: [
      { label: '총 발주량', value: '데이터 확인 필요' },
      { label: '업체 집중도', value: '분석 중' }
    ],
    issues: [
      {
        priority: 'high',
        title: '공급업체 집중 리스크',
        description: '특정 업체에 발주가 집중되어 있어 해당 업체의 문제 발생 시 전체 공급망에 큰 영향을 받습니다.'
      },
      {
        priority: 'medium',
        title: '공급망 다변화 필요',
        description: '리스크 분산을 위한 공급망 다변화가 필요합니다.'
      },
      {
        priority: 'medium',
        title: '2차 협력업체 부족',
        description: '주요 업체의 문제 발생 시 대체할 수 있는 2차 협력업체가 부족합니다.'
      }
    ],
    suggestions: [
      {
        title: '신규 협력업체 발굴',
        detail: '현재 주요 업체 외에 추가로 2-3개 협력업체를 발굴하고 평가합니다.',
        urgency: 'short',
        expectedTime: '1개월'
      },
      {
        title: '발주량 재분배',
        detail: '주요 업체의 발주 비중을 70% 이하로 조정하여 리스크를 분산합니다.',
        urgency: 'medium',
        expectedTime: '2-3개월'
      },
      {
        title: '업체별 역량 평가',
        detail: '정기적으로 협력업체의 생산 역량과 재무 상태를 평가합니다.',
        urgency: 'medium',
        expectedTime: '분기별'
      }
    ],
    expectedImpact: '공급망 다변화를 통해 특정 업체 리스크를 50% 이상 감소시키고 공급 안정성을 향상시킬 수 있습니다.',
    impactMetrics: [
      {
        name: '업체 집중도',
        before: '현재 수준',
        after: '50% 이상 감소',
        improvement: '50%+'
      }
    ]
  }
};

// ===== AI API 호출 함수 =====
async function callAIAPI(kpiType, kpiData) {
  try {
    const prompt = generatePrompt(kpiType, kpiData);
    
    // Anthropic Claude API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env?.VITE_ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // JSON 블록 추출
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const parsedData = JSON.parse(jsonText);

    // 필수 필드 검증
    if (!parsedData.currentStatus || !parsedData.issues || !parsedData.suggestions || !parsedData.expectedImpact) {
      throw new Error('Missing required fields in response');
    }

    // 데이터 정규화
    parsedData.issues = (parsedData.issues || []).slice(0, 3);
    parsedData.suggestions = (parsedData.suggestions || []).slice(0, 4);

    return parsedData;

  } catch (error) {
    console.error(`[AI Analysis Error] ${kpiType}:`, error);
    
    // Fallback 인사이트 반환
    return FALLBACK_INSIGHTS[kpiType];
  }
}

// ===== 단일 KPI 분석 함수 =====
async function analyzeKPI(kpiType, kpiData) {
  // 캐시 확인
  const cached = aiCache.get(kpiType, JSON.stringify(kpiData));
  if (cached) {
    console.log(`[AI Analysis] Cache hit for ${kpiType}`);
    return { data: cached, source: 'cache' };
  }

  console.log(`[AI Analysis] Analyzing ${kpiType}...`);
  
  // 상태 업데이트
  analysisState[kpiType].status = 'analyzing';

  try {
    // AI API 호출
    const result = await callAIAPI(kpiType, kpiData);

    // 캐시 저장
    aiCache.set(kpiType, JSON.stringify(kpiData), result);

    // 상태 업데이트
    analysisState[kpiType].status = 'completed';
    analysisState[kpiType].data = result;

    return { data: result, source: 'api' };

  } catch (error) {
    console.error(`[AI Analysis] Failed to analyze ${kpiType}:`, error);
    
    // 상태 업데이트
    analysisState[kpiType].status = 'error';

    // Fallback 사용
    return { data: FALLBACK_INSIGHTS[kpiType], source: 'fallback' };
  }
}

// ===== 백그라운드 분석 초기화 =====
async function initializeAIAnalysis(dashboardData) {
  console.log('[AI Analysis] Initializing background analysis...');

  const kpiData = {
    delayed: {
      delayedQty: dashboardData.kpi.delayedQty,
      delayedOrders: dashboardData.kpi.delayedOrders,
      topSupplier: getTopDelayedSupplier(dashboardData.delayedOrders),
      severity: getDelaySeverity(dashboardData.delayedOrders)
    },
    progress: {
      progressRate: dashboardData.kpi.progressRate,
      completedQty: dashboardData.kpi.completedQty,
      totalQty: dashboardData.kpi.totalQty,
      processStatus: getProcessStatus(dashboardData.orders),
      channelStats: getChannelStats(dashboardData.orders)
    },
    ontime: {
      onTimeRate: dashboardData.kpi.onTimeRate,
      onTimeOrders: dashboardData.kpi.onTimeOrders,
      lateOrders: dashboardData.completedOrders.length - dashboardData.kpi.onTimeOrders,
      supplierStats: getSupplierOntimeStats(dashboardData.orders, dashboardData.completedOrders)
    },
    total: {
      totalQty: dashboardData.kpi.totalQty,
      totalOrders: dashboardData.kpi.totalOrders,
      supplierDistribution: getSupplierDistribution(dashboardData.orders),
      concentration: getSupplierConcentration(dashboardData.orders)
    }
  };

  // HIGH 우선순위 (병렬 분석)
  const highPriority = ['delayed', 'progress'];
  setTimeout(async () => {
    const highPromises = highPriority.map(kpiType => {
      return analyzeKPI(kpiType, kpiData[kpiType]).then(() => {
        // 뱃지 업데이트
        updateKPIBadge(kpiType, 'completed');
      });
    });

    await Promise.all(highPromises);
    
    // 토스트 알림
    showToast('✓ 주요 KPI AI 분석 완료', 'success');

  }, KPI_PRIORITIES.delayed.delay);

  // MEDIUM 우선순위
  setTimeout(async () => {
    await analyzeKPI('ontime', kpiData.ontime);
    updateKPIBadge('ontime', 'completed');
  }, KPI_PRIORITIES.ontime.delay);

  // LOW 우선순위
  setTimeout(async () => {
    await analyzeKPI('total', kpiData.total);
    updateKPIBadge('total', 'completed');
  }, KPI_PRIORITIES.total.delay);
}

// ===== 헬퍼 함수들 =====
function getTopDelayedSupplier(delayedOrders) {
  const supplierQty = {};
  delayedOrders.forEach(order => {
    if (order.supplier) {
      supplierQty[order.supplier] = (supplierQty[order.supplier] || 0) + (order.qty || 0);
    }
  });
  
  const sorted = Object.entries(supplierQty).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

function getDelaySeverity(delayedOrders) {
  const today = new Date();
  let maxDelay = 0;
  
  delayedOrders.forEach(order => {
    if (order.requiredDelivery) {
      const days = Math.floor((today - new Date(order.requiredDelivery)) / (1000 * 60 * 60 * 24));
      maxDelay = Math.max(maxDelay, days);
    }
  });
  
  if (maxDelay >= 15) return 'high';
  if (maxDelay >= 8) return 'medium';
  return 'low';
}

function getProcessStatus(orders) {
  // PROCESS_CONFIG를 사용할 수 없으므로 기본 공정 사용
  const processes = ['자재', '한도CFM', '제갑&조립', '공정출고', '선적', '입항'];
  const status = {};
  
  processes.forEach(processName => {
    const completed = orders.filter(order => {
      const allProcesses = [
        ...(order.schedule?.production || []),
        ...(order.schedule?.shipping || [])
      ];
      return allProcesses.some(p => p.name === processName && p.actualDate);
    }).length;
    
    status[processName] = {
      completed,
      total: orders.length,
      rate: orders.length > 0 ? Math.round((completed / orders.length) * 100) : 0
    };
  });
  
  return status;
}

function getChannelStats(orders) {
  const stats = {};
  ['ELCANTO', 'IM'].forEach(channel => {
    const channelOrders = orders.filter(o => o.channel === channel);
    const completed = channelOrders.filter(order => {
      const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
      return arrivalProcess?.actualDate;
    });
    
    const totalQty = channelOrders.reduce((sum, o) => sum + (o.qty || 0), 0);
    const completedQty = completed.reduce((sum, o) => sum + (o.qty || 0), 0);
    
    stats[channel] = {
      total: totalQty,
      completed: completedQty,
      rate: totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0
    };
  });
  
  return stats;
}

function getSupplierOntimeStats(orders, completedOrders) {
  const stats = {};
  const suppliers = [...new Set(orders.map(o => o.supplier).filter(s => s))];
  
  suppliers.forEach(supplier => {
    const supplierCompleted = completedOrders.filter(o => o.supplier === supplier);
    const onTime = supplierCompleted.filter(order => {
      const arrivalProcess = order.schedule?.shipping?.find(p => p.processKey === 'arrival');
      if (!order.requiredDelivery || !arrivalProcess?.actualDate) return false;
      return new Date(arrivalProcess.actualDate) <= new Date(order.requiredDelivery);
    }).length;
    
    stats[supplier] = {
      total: supplierCompleted.length,
      onTime,
      rate: supplierCompleted.length > 0 ? Math.round((onTime / supplierCompleted.length) * 100) : 0
    };
  });
  
  return stats;
}

function getSupplierDistribution(orders) {
  const distribution = {};
  orders.forEach(order => {
    if (order.supplier) {
      distribution[order.supplier] = (distribution[order.supplier] || 0) + (order.qty || 0);
    }
  });
  return distribution;
}

function getSupplierConcentration(orders) {
  const distribution = getSupplierDistribution(orders);
  const total = Object.values(distribution).reduce((sum, qty) => sum + qty, 0);
  
  if (total === 0) return 'N/A';
  
  const maxQty = Math.max(...Object.values(distribution));
  const concentration = Math.round((maxQty / total) * 100);
  
  return `${concentration}%`;
}

function updateKPIBadge(kpiType, status) {
  const card = document.querySelector(`[data-kpi="${kpiType}"]`);
  if (!card) return;
  
  // 기존 뱃지 제거
  const existingBadge = card.querySelector('.ai-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
  
  // 새 뱃지 추가
  const badge = document.createElement('div');
  badge.className = 'ai-badge absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xxs px-2 py-0.5 rounded-full shadow-md flex items-center gap-1';
  badge.innerHTML = '<i class="fas fa-robot"></i> <span>AI 분석됨</span>';
  
  card.style.position = 'relative';
  card.appendChild(badge);
}

function showToast(message, type = 'info') {
  // 기존 토스트 제거
  const existing = document.querySelector('.ai-toast');
  if (existing) {
    existing.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `ai-toast fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm flex items-center gap-2 animate-slide-in`;
  
  if (type === 'success') {
    toast.classList.add('bg-green-500');
  } else if (type === 'error') {
    toast.classList.add('bg-red-500');
  } else {
    toast.classList.add('bg-blue-500');
  }
  
  toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-slide-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== Export =====
export {
  aiCache,
  analysisState,
  initializeAIAnalysis,
  analyzeKPI,
  updateKPIBadge,
  showToast,
  FALLBACK_INSIGHTS
};
