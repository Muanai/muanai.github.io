
(function () {
  const loader = document.getElementById('loader');
  const textEl = document.getElementById('loader-text');
  const bar = document.getElementById('loader-bar');
  const label = document.getElementById('loader-label');

  document.body.classList.add('loading');

  /* ── Build character spans ── */
  const WORDS = ['SIGNAL', 'OVER', 'NOISE'];
  const allChars = [];

  WORDS.forEach(word => {
    const wordEl = document.createElement('span');
    wordEl.className = 'loader-word';
    word.split('').forEach(ch => {
      const span = document.createElement('span');
      span.className = 'loader-char';
      span.textContent = ch;
      wordEl.appendChild(span);
      allChars.push(span);
    });
    textEl.appendChild(wordEl);
  });

  /* ── Animate chars one by one ── */
  const CHAR_DELAY = 48;   /* ms between each char */
  const totalCharTime = allChars.length * CHAR_DELAY + 300;

  allChars.forEach((ch, i) => {
    setTimeout(() => ch.classList.add('visible'), i * CHAR_DELAY);
  });

  /* ── Show label after first word ── */
  setTimeout(() => label.classList.add('visible'), WORDS[0].length * CHAR_DELAY + 100);

  /* ── Progress bar fills over totalCharTime ── */
  let progress = 0;
  const BAR_DURATION = totalCharTime + 200;
  const TICK = 40;
  const increment = (TICK / BAR_DURATION) * 100;

  const barInterval = setInterval(() => {
    progress = Math.min(progress + increment, 92); /* stop at 92, jump to 100 at end */
    bar.style.width = progress + '%';
  }, TICK);

  /* ── Dismiss loader ── */
  function dismiss() {
    clearInterval(barInterval);
    bar.style.width = '100%';
    bar.style.transition = 'width 0.2s ease';

    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.remove('loading');
    }, 250);
  }

  /* Dismiss when: chars done + page loaded (whichever is later) */
  let charsReady = false;
  let pageReady = false;

  function tryDismiss() {
    if (charsReady && pageReady) dismiss();
  }

  setTimeout(() => { charsReady = true; tryDismiss(); }, totalCharTime);

  if (document.readyState === 'complete') {
    pageReady = true;
  } else {
    window.addEventListener('load', () => { pageReady = true; tryDismiss(); });
  }

  /* Safety fallback — dismiss after 4s no matter what */
  setTimeout(() => {
    if (!loader.classList.contains('hidden')) dismiss();
  }, 4000);
})();


document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('#vanta-canvas');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (el && !reduced) {
    VANTA.TOPOLOGY({
      el: '#vanta-canvas',
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1.00,
      scaleMobile: 1.00,
      color: 0xff6161,
      backgroundColor: 0x07080a,
    });
  }
});


window.toggleDropdown = function (e, btn) {
  e.stopPropagation();
  document.querySelectorAll('.detail-dropdown-menu.open').forEach(menu => {
    if (menu !== btn.nextElementSibling) {
      menu.classList.remove('open');
      menu.previousElementSibling.classList.remove('active');
    }
  });
  const menu = btn.nextElementSibling;
  menu.classList.toggle('open');
  btn.classList.toggle('active');
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.detail-dropdown-wrapper')) {
    document.querySelectorAll('.detail-dropdown-menu.open').forEach(menu => {
      menu.classList.remove('open');
      menu.previousElementSibling.classList.remove('active');
    });
  }
});

function renderProjectLink(l) {
  if (l.subLinks && l.subLinks.length > 0) {
    const dropdownItems = l.subLinks.map(sub => `<a href="${sub.url}" target="_blank" class="detail-dropdown-item">${sub.label}</a>`).join('');
    return `
          <div class="detail-dropdown-wrapper">
            <button class="detail-link ${l.type} detail-dropdown-trigger" onclick="toggleDropdown(event, this)">
              ${l.label}
              <svg class="dropdown-chevron" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div class="detail-dropdown-menu liquid-glass">
              ${dropdownItems}
            </div>
          </div>`;
  }
  return `
        <a href="${l.url}" target="_blank" class="detail-link ${l.type}">
          ${l.label}
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>`;
}

const PROJECTS = [
  {
    id: 'telkomsel',
    title: 'Telligence',
    shortDesc: 'Automated pipeline to detect competitor telecom infrastructure using YOLOv8.',
    tech: 'Ultralytics / YOLOv8',
    image: 'assets/projects/telkomsel_app.webp',

    tags: ['ops-analytics', 'comvis'],
    featured: true,
    wip: false,
    tabs: {
      overview: {
        label: 'Competitive Intelligence via Computer Vision',
        text: 'Developed an <strong>automated pipeline</strong> to detect competitor telecom infrastructure using YOLOv8 for Telkomsel\'s Business Growth and Analytics division. Transformed manual, labor-intensive field surveys into a scalable, visual analytics prototype for market penetration analysis.',
      },
      problem: {
        label: 'Invisible Infrastructure',
        text: '<strong>Manual mapping is costly</strong>, while standard models fail to detect thin cables and heavily occluded poles in chaotic street environments. Severe class imbalance (e.g., rare providers) and environmental noise rendered off-the-shelf detection models ineffective.',
      },
      process: {
        label: 'High-Res YOLOv8 Engineering',
        text: 'Constructed a proprietary dataset from scratch via manual field collection of street-level infrastructure imagery. Curated and annotated <strong>specifically for this task</strong>, then augmented with synthetic data to address severe class imbalance. Optimized YOLOv8 training with 1248px resolution scaling to recover fine-grained features like fiber optic cables. Implemented a custom inference engine with EXIF extraction and geospatial mapping (BPS shapefiles) to <strong>link detections to specific sub-districts</strong>.',
      },
      lesson: {
        label: 'Physical Geometries & Minority Limits',
        text: 'Standard unconstrained augmentations (vertical flips, 90° rotations) broke model convergence because street infrastructure strictly obeys gravity. For severe minority classes (Lintasarta), synthetic training data recovered feature representation (0.0 → 0.497 mAP50), but with only 2 real-world validation instances, production deployment mandates human-in-the-loop analyst verification rather than autonomous trust.',
      },
      outcome: {
        label: 'Technical Result',
        metric: { val: '0.763 mAP50', sub: '+24% accuracy from 0.52 baseline' },
        text: 'Successfully resurrected failing minority classes (~0% → ~50%). Delivered a deployment-ready tool that automates the conversion of raw street photos into <strong>mapped competitive intelligence</strong>.',
      },
    },
    links: [
      { label: 'View on GitHub', url: 'https://github.com/Muanai/real-world-telecom-infrastructure-object-detection', type: 'primary' },
      { label: 'Read Study Case', url: 'https://medium.com/@muanaikhalifahr/from-street-images-to-geo-spatial-insights-detecting-telecom-infrastructure-with-yolov8-5fb419dbf4f4', type: 'secondary' },
    ],
  },
  {
    id: 'cortex',
    title: 'Cortex Risk',
    shortDesc: 'RAG system for credit risk explainability based on financial regulation documents.',
    tech: 'RAG / LLM',
    image: 'assets/projects/cortex_preview.webp',

    tags: ['risk-intel', 'nlp'],
    featured: true,
    wip: false,
    tabs: {
      overview: {
        label: 'Hybrid XAI & Compliance Audit Pipeline',
        text: 'Designed an end-to-end credit risk scoring engine that <strong>bridges black-box machine learning</strong> predictions with automated legal compliance. Combines tabular risk modeling with a generative legal audit framework to ensure full adherence to OJK financial regulations (POJK 40/2024).',
      },
      problem: {
        label: 'The Black-Box Risk & Compliance Gap',
        text: 'Standard high-performance credit scoring models provide accurate probability of default metrics but <strong>lack interpretability</strong>. Financial institutions struggle to explain localized risk decisions to auditors and map complex data features to strict regulatory frameworks in real-time.',
      },
      process: {
        label: 'Dual-Engine Architecture: SHAP + RAG',
        text: 'Processed historical credit records to evaluate line utilization, payment delays, and income dynamics. Concurrently ingested semi-structured text data from official financial authority regulations (POJK) into a vector database to enable targeted semantic retrieval. Implemented a pipeline where an XGBoost model generates risk probabilities and SHAP computes localized feature attributions. These analytical metrics are injected as context into ChromaDB and synthesized by Llama 3.1 via Groq LPU to produce deterministic, audit-grade legal narratives.',
      },
      lesson: {
        label: 'Tabular Neural Tradeoffs & Hallucination Traps',
        text: 'Deep tabular models (FT-Transformer, ~0.85 AUC) added 20x inference latency without beating regularized XGBoost (0.8687 AUC), while losing exact Shapley attribution. In the generative layer, compact local LLMs routinely hallucinated calendar dates in legal narratives, necessitating zero temperature, strict regex date stripping, and fallback legal templates to guarantee zero-hallucination compliance.',
      },
      outcome: {
        label: 'Production-Grade Explainable Credit Decisions',
        metric: { val: '0.8687 AUC', sub: 'Gini 0.7374 | Sub-ms CPU Inference' },
        text: 'Delivers full interpretability for risk-critical applications, mapping model feature weights directly to legal clauses with <strong>zero-hallucination</strong> compliance checking ready for production deployment.',
      },
    },
    links: [
      { label: 'View on GitHub', url: 'https://github.com/Muanai/fintech-credit-risk-xai', type: 'primary' },
    ],
  },
  {
    id: 'food',
    title: 'Traditional Food Image Classification',
    shortDesc: 'Competition-grade CV system using SwinV2 & ConvNeXt to classify 15 Indonesian cuisines.',
    tech: 'SwinV2 / ConvNeXt',
    image: 'assets/projects/grad_cam.webp',

    tags: ['comvis'],
    featured: false,
    wip: false,
    tabs: {
      overview: {
        label: 'SOTA Food Recognition Pipeline',
        text: 'Designed a competition-grade computer vision system leveraging Vision Transformers (SwinV2) and ConvNeXt to classify 15 types of traditional Indonesian cuisine. A high-performance solution aimed at helping MSMEs automate inventory and sales through visual recognition.',
      },
      problem: {
        label: 'Fine-Grained Visual Ambiguity',
        text: 'Distinguishing between visually similar traditional dishes (high inter-class similarity) was difficult due to a limited dataset of only ~4,200 labeled images. Standard CNNs struggled to generalize, risking overfitting on the small, proprietary training set.',
      },
      process: {
        label: 'Semi-Supervised Teacher-Student Ensemble',
        text: 'Worked with a restricted, proprietary dataset of 15 food classes, requiring aggressive augmentation strategies to prevent data starvation. Relied heavily on generating synthetic training signals via pseudo-labeling. Implemented a Teacher-Student framework where high-confidence predictions (>0.86) from a ConvNeXt Teacher were used to train robust Student models. Combined local texture bias of ConvNeXtV2 with global context of SwinV2 using a Geometric Mean Ensemble.',
      },
      lesson: {
        label: 'Error Collinearity & Geometric Calibration',
        text: 'Discarded EfficientNetV2-L despite high standalone accuracy because its errors were collinear with ConvNeXtV2, destabilizing the ensemble. In multi-model blending, naive arithmetic soft-voting over-rewarded uncertain predictions on ambiguous broths; switching to Weighted Geometric Mean in log-space with Temperature Scaling (T=1.6) strictly penalized cross-model disagreement and unlocked our Top 10 leaderboard finish.',
      },
      outcome: {
        label: 'Top-Tier Leaderboard Performance',
        metric: { val: '0.9522', sub: 'Rank 10 / 131 Teams (Top 7%) — Kaggle Leaderboard' },
        text: 'Proven robustness with Test Time Augmentation (TTA), delivering high-confidence predictions even on unaligned or noisy test images.',
      },
    },
    links: [
      { label: 'View on GitHub', url: 'https://github.com/Muanai/msmes-food-image-classification', type: 'primary' },
    ],
  },
  {
    id: 'flux',
    title: 'Feature Flux',
    shortDesc: 'Production-grade dual-store infrastructure serving stateful risk features sub-2ms latency.',
    tech: 'Redis / Numba',
    image: 'assets/projects/flux_benchmark.webp',

    tags: ['risk-intel'],
    featured: true,
    wip: false,
    tabs: {
      overview: {
        label: 'Dual-Store Fintech Infrastructure',
        text: 'An end-to-end <strong>high-performance feature store</strong> separating heavy analytical computations from real-time operational serving. Utilizes JIT-compiled Numba loops for complex data extraction and containerized Go microservices for ultra-low latency inference pipelines.',
      },
      problem: {
        label: 'Production Serving Bottlenecks',
        text: 'Traditional synchronous Python pipelines are incapable of <strong>serving millions of real-time credit verdicts at digital checkouts</strong>. Analytical code belongs in data warehouses, while operational layers require immediate data persistence and zero on-the-fly computational overhead to prevent customer churn.',
      },
      process: {
        label: 'Asynchronous Persistence & Containerization',
        text: 'Implements a robust data pipeline mapping across explicit system boundaries. Features are split between an <strong>offline training store (PostgreSQL)</strong> and a volatile high-speed <strong>online operational memory cache (Redis)</strong> utilizing defensive string mapping to guarantee data integrity. Built an <strong>ultra-lightweight serving endpoint</strong> containerized via multi-stage Alpine Docker builds. Enforced hard data resilience by executing non-blocking background disk dumps (bgsave) directly to persistent physical storage immediately following python ingestion cycles.',
      },
      lesson: {
        label: 'The Floating ID Trap & Memory Volatility',
        text: 'Cross-boundary serialization caused silent failures: Pandas implicitly upcast sparse customer IDs to float64, writing Redis keys as customer:2.0 and breaking Go API lookups (customer:2) with 404s, resolved via defensive string casting. Furthermore, high-speed Python batch ingestion terminated before Redis triggered its default 5-minute disk snapshot, requiring explicit non-blocking r.bgsave() calls to prevent feature vaporization across container restarts.',
      },
      outcome: {
        label: 'System Metrics & Business Impact',
        metric: { val: '+7.3%', sub: 'OOF ROC-AUC Uplift via Regularized LightGBM' },
        text: 'Achieved a definitive 617.69 Requests Per Second (RPS) throughput with a 1.61ms average latency under a strict 10,000-request load test with a 0% failure rate. Restored the full feature trident, preventing millions in non-performing toxic loans.',
      },
    },
    links: [
      { label: 'View on GitHub', url: 'https://github.com/Muanai/credit-risk-feature-engine', type: 'primary' },
      {
        label: 'Read Study Case',
        type: 'secondary',
        subLinks: [
          { label: 'Part 1: Initial Implementation', url: 'https://medium.com/@muanaikhalifahr/credit-risk-feature-engineering-with-python-numba-eb9643908f9c' },
          { label: 'Part 2: End-to-End Feature Store', url: 'https://medium.com/@muanaikhalifahr/architecting-an-end-to-end-feature-store-for-credit-risk-from-python-numba-to-containerized-go-api-14e6de767992' }
        ]
      },
    ],
  },
  {
    id: 'textsum',
    title: 'Indonesian Abstractive Summarization',
    shortDesc: 'Production-ready NLP pipeline using IndoBART-v2 with legacy library patching.',
    tech: 'Hugging Face / PyTorch',
    image: 'assets/projects/sum_architecture.webp',

    tags: ['nlp'],
    featured: false,
    wip: false,
    tabs: {
      overview: {
        label: 'Production-Ready NLP Pipeline',
        text: 'Engineered an abstractive text summarization pipeline utilizing IndoBART-v2. Transitioned the project from a monolithic experimental notebook into a scalable, modular system designed for high-density information environments like Fintech and E-commerce.',
      },
      problem: {
        label: 'Legacy Dependencies & Compatibility',
        text: '<strong>Broken ecosystem compatibility</strong> threatened the project. The legacy Indonesian tokenizer (IndoNLG) suffered from severe signature mismatches with modern Hugging Face Transformers APIs, causing immediate runtime crashes during initialization.',
      },
      process: {
        label: 'Runtime Surgery & Hardware Alignment',
        text: 'Utilized the IndoSum dataset. To ensure maintainability, the data pipeline was completely decoupled from the model architecture using an isolated <code>IndoSumManager</code> class to handle text cleaning, JSON flattening, and deterministic splitting. Executed runtime "monkey-patching" to dynamically inject missing flags and wrap incompatible methods, rescuing the legacy tokenizer without altering source code. Optimized training on NVIDIA Turing architecture (T4) using FP16 Mixed Precision for maximum throughput.',
      },
      lesson: {
        label: 'The ROUGE Score Illusion & Generation Loops',
        text: 'Identified the "ROUGE trap": between Epoch 3 and 5, ROUGE continued climbing (+0.004) while validation loss sharply diverged (1.82 → 2.05) as the model memorized training phrasing and began hallucinating out-of-domain facts; early stopping at the divergence knee was essential to preserve factual groundedness. In decoding, omitting explicit [ind] BOS/decoder token bindings caused the multilingual MBart architecture to enter degenerate loops emitting endless EOS tokens.',
      },
      outcome: {
        label: 'Strategic Evaluation',
        text: 'Achieved competitive ROUGE scores while proactively identifying the "overfitting trap" via loss curve divergence analysis (Epoch 3). Implemented strict generation parameters to prevent End-of-Sequence (EOS) hallucinations, prioritizing semantic groundedness over raw token matching.',
        metric: { val: '0.3540 R1', sub: 'ROUGE-2: 0.1620 | Tensor Core FP16' },
      },
    },
    links: [
      { label: 'View on GitHub', url: 'https://github.com/Muanai/indobart-indosum-summarizer', type: 'primary' },
      { label: 'Read Study Case', url: 'https://medium.com/@muanaikhalifahr/taming-ambiguity-in-indonesian-text-summarization-building-an-indobart-v2-pipeline-from-research-f3be68ee6cac', type: 'secondary' },
    ],
  },
  {
    id: 'basa',
    title: 'BASA',
    shortDesc: 'Indonesian text normalization toolkit built for dirty social media, e-commerce, and chat logs.',
    tech: 'Python / Hatchling',
    image: 'assets/projects/basa_banner.webp',

    tags: ['nlp'],
    featured: false,
    wip: false,
    tabs: {
      overview: {
        label: 'Modern Indonesian NLP Preprocessing for LLMs',
        text: 'Engineered an open-source, lightweight text normalization library specifically designed for LLMs, RAG retrievers, and embedding models. Normalizes messy colloquial text (slang, elongated characters, punctuation spam) while preserving morphological sentence structures, packaged with a strictly typed Python 3.10+ interface and <strong>zero external dependencies</strong> for its core engine.',
      },
      problem: {
        label: 'The Stemming Mismatch & Token Fragmentation',
        text: 'Legacy Indonesian NLP tools (Sastrawi) relied on destructive morphological stemming that strips prefixes and suffixes—destroying active/passive voice and syntax, which causes modern LLMs to hallucinate. Furthermore, raw colloquial text (e.g. <code>"gkkkkkkk"</code>) shatters BPE tokenizers into 5–6 arbitrary subword fragments, diluting context windows and degrading RAG vector cosine retrieval.',
      },
      process: {
        label: '5-Stage Sequential Pipeline & Zero-Dependency Core',
        text: 'Built a high-performance normalization pipeline: case normalization → compiled longest-first slang expansion (1,300+ entries across 27 categories) → differential character repetition collapse (vowels $\\ge 2$ vs. consonants $\\ge 3$ to protect words like <i>maaf</i>, <i>saat</i>, and <i>dll</i>) → opt-in Levenshtein typo correction with LRU caching → punctuation/whitespace cleanup. All implemented exclusively using Python standard library modules for sub-millisecond cold starts in serverless microservices.',
      },
      lesson: {
        label: 'Conservative Defaults & Opt-in Destruction',
        text: 'Established that automated text preprocessing must be conservative by default: destructive typo correction using character edit distance is strictly opt-in and requires caller-provided domain vocabularies, as bundling static generic dictionaries (like KBBI) silently corrupts e-commerce jargon, brand names, and technical terms. Morphological affixes must remain intact for modern dense vector representations.',
      },
      outcome: {
        label: 'Production-Ready Tooling & Test Coverage',
        metric: { val: '90/90 Tests Passed', sub: '0.54s Runtime | Zero Core Dependencies' },
        text: 'Achieved 100% automated test suite passing in 0.54s with strict static typing conforming to mypy. Eliminates subword fragmentation, reducing prompt token bloat while bridging vocabulary divergence in Indonesian RAG pipelines. Version 0.1.0 published under MIT License.',
      },
    },
    links: [
      { label: 'View on GitHub', url: 'https://github.com/Muanai/basa', type: 'primary' },
    ],
  },
];

/* ── STATE ── */
let activeTab = 'featured';
let activeProjectId = null;

/* ── HELPERS ── */
function getProjectsByTab(tab) {
  if (tab === 'featured') return PROJECTS.filter(p => p.featured);
  if (tab === 'risk-intel') return PROJECTS.filter(p => p.tags.includes('risk-intel'));
  if (tab === 'ops-analytics') return PROJECTS.filter(p => p.tags.includes('ops-analytics'));
  if (tab === 'comvis') return PROJECTS.filter(p => p.tags.includes('comvis'));
  if (tab === 'nlp') return PROJECTS.filter(p => p.tags.includes('nlp'));
  return PROJECTS;
}

const TAG_TICKERS = {
  'risk-intel': 'RISK',
  'ops-analytics': 'OPS',
  'comvis': 'COMV',
  'nlp': 'NLP',
};

function renderList(projects) {
  const list = document.getElementById('project-list');
  list.innerHTML = '';

  projects.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'project-list-item';
    item.dataset.id = p.id;

    const topBadge = (p.featured && activeTab !== 'featured')
      ? `<span class="badge-featured">Featured</span>`
      : p.wip
        ? `<span class="badge-wip">In Progress</span>`
        : '';

    item.innerHTML = `
          <div class="list-item-top">
            <span class="list-item-title">${p.title}</span>
            ${topBadge}
          </div>
          <p class="list-item-desc">${p.shortDesc}</p>
          <div class="list-item-tags">
            ${p.tags.map(t => `<span class="tag-chip">${TAG_TICKERS[t] || t.toUpperCase()}</span>`).join('')}
          </div>
        `;

    item.addEventListener('click', () => selectProject(p.id));
    list.appendChild(item);
  });
}

function selectProject(id) {
  activeProjectId = id;

  /* update list active state */
  document.querySelectorAll('.project-list-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });

  const p = PROJECTS.find(p => p.id === id);
  renderDetail(p);
}

/* ── DETAIL TABS STATE ── */
let activeDetailTab = 'overview';

function renderDetail(p) {
  const panel = document.getElementById('project-detail');

  if (p.wip) {
    panel.innerHTML = `
          <div class="detail-wip">
            <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
            <p class="detail-wip-title">Work in Progress</p>
            <p class="detail-wip-desc">${p.title} is currently being built. Check back soon.</p>
          </div>
        `;
    return;
  }

  activeDetailTab = 'overview';

  const imgHtml = p.image
    ? `<div class="detail-image">
             <div class="detail-img-wrap">
               <div class="detail-img-blur"></div>
               <img src="${p.image}" alt="${p.title}" loading="lazy" decoding="async" onload="this.classList.add('loaded')" />
             </div>
             <div class="detail-image-overlay"></div>

           </div>`
    : '';

  const linksHtml = p.links.map(renderProjectLink).join('');

  panel.innerHTML = `
        ${imgHtml}
        <div class="detail-body">
          <div class="detail-header">
            <h3 class="detail-title">${p.title}</h3>
            <span class="detail-tech-badge">${p.tech}</span>
          </div>

          <div class="detail-tabs">
            ${['overview', 'problem', 'process', 'outcome', 'lesson'].map(t => `
              <button class="detail-tab-btn ${t === activeDetailTab ? 'active' : ''}" data-dtab="${t}">
                ${t}
              </button>
            `).join('')}
          </div>

          ${renderPanes(p)}
        </div>
        ${linksHtml ? `<div class="detail-footer">${linksHtml}</div>` : ''}
      `;

  /* bind detail tab clicks */
  panel.querySelectorAll('.detail-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeDetailTab = btn.dataset.dtab;
      panel.querySelectorAll('.detail-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.dtab === activeDetailTab));
      panel.querySelectorAll('.detail-pane').forEach(pane => pane.classList.toggle('active', pane.dataset.pane === activeDetailTab));
    });
  });
}

function renderPanes(p) {
  const tabKeys = ['overview', 'problem', 'process', 'outcome', 'lesson'];
  return tabKeys.map(key => {
    const data = p.tabs[key];
    const metricHtml = data.metric
      ? `<div class="pane-highlight">
               <div class="metric-val">${data.metric.val}</div>
               <div class="metric-label">${data.metric.sub}</div>
             </div>`
      : '';
    return `
          <div class="detail-pane ${key === activeDetailTab ? 'active' : ''}" data-pane="${key}">
            <p class="pane-label">${data.label}</p>
            <p class="pane-text">${data.text}</p>
            ${metricHtml}
          </div>
        `;
  }).join('');
}

/* ── TAB INDICATOR ── */
function updateTabIndicator(activeBtn, animate = true) {
  const indicator = document.getElementById('project-tab-indicator');
  if (!indicator || !activeBtn) return;

  const left = activeBtn.offsetLeft;
  const width = activeBtn.offsetWidth;

  if (!animate) {
    const prevTransition = indicator.style.transition;
    indicator.style.transition = 'none';
    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${width}px`;
    indicator.style.opacity = '1';
    void indicator.offsetHeight;
    indicator.style.transition = prevTransition;
  } else {
    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${width}px`;
    indicator.style.opacity = '1';
  }
}

/* ── TAB SWITCHING ── */
function switchTab(tab, animate = true) {
  activeTab = tab;
  activeProjectId = null;
  let activeBtn = null;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    if (isActive) activeBtn = btn;
  });

  if (activeBtn) {
    updateTabIndicator(activeBtn, animate);
    if (window.innerWidth <= 768) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }

  const projects = getProjectsByTab(tab);

  renderList(projects);
  renderMobile(projects);

  if (projects.length > 0) {
    selectProject(projects[0].id);
  } else {
    document.getElementById('project-detail').innerHTML = `
          <div class="detail-wip">
            <p class="detail-wip-title">No projects yet</p>
            <p class="detail-wip-desc">Projects in this category are coming soon.</p>
          </div>
        `;
  }
}

/* ── MOBILE RENDER ── */
function renderMobile(projects) {
  const container = document.getElementById('projects-mobile');
  container.innerHTML = '';

  projects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'mobile-project-card';
    card.dataset.id = p.id;

    const badgeHtml = (p.featured && activeTab !== 'featured')
      ? `<span class="badge-featured">Featured</span>`
      : p.wip ? `<span class="badge-wip">In Progress</span>` : '';

    const imgHtml = p.image
      ? `<div class="mobile-card-image">
               <img src="${p.image}" alt="${p.title}" loading="lazy" decoding="async" onload="this.classList.add('loaded')" />
               
             </div>`
      : '';

    const bodyHtml = p.wip
      ? `<div class="mobile-card-wip">
               <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
               </svg>
               <p>Work in Progress — check back soon.</p>
             </div>`
      : `${imgHtml}
             <div class="mobile-detail-tabs" id="mob-tabs-${p.id}">
               ${['overview', 'problem', 'process', 'outcome', 'lesson'].map((t, i) =>
        `<button class="mobile-detail-tab-btn ${i === 0 ? 'active' : ''}" data-pid="${p.id}" data-t="${t}">${t}</button>`
      ).join('')}
             </div>
             <div class="mobile-detail-panes">
               ${['overview', 'problem', 'process', 'outcome', 'lesson'].map((key, i) => {
        const d = p.tabs[key];
        const metric = d.metric
          ? `<div class="pane-highlight"><div class="metric-val">${d.metric.val}</div><div class="metric-label">${d.metric.sub}</div></div>`
          : '';
        return `<div class="mobile-detail-pane ${i === 0 ? 'active' : ''}" data-mob-pane="${p.id}-${key}">
                   <p class="pane-label">${d.label}</p>
                   <p class="pane-text">${d.text}</p>${metric}
                 </div>`;
      }).join('')}
             </div>
             ${p.links.length ? `<div class="mobile-card-footer">
               ${p.links.map(renderProjectLink).join('')}
             </div>` : ''}`;

    card.innerHTML = `
          <div class="mobile-card-header" onclick="toggleMobileCard('${p.id}')">
            <div class="mobile-card-header-left">
              <p class="mobile-card-title">${p.title}</p>
              <span class="mobile-card-tech">${p.tech}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              ${badgeHtml}
              <svg class="mobile-card-chevron" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
          <p class="mobile-card-desc">${p.shortDesc}</p>
          <div class="mobile-card-body">${bodyHtml}</div>
        `;

    container.appendChild(card);
  });

  /* bind mobile tab clicks */
  container.querySelectorAll('.mobile-detail-tab-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const pid = btn.dataset.pid;
      const t = btn.dataset.t;
      container.querySelectorAll(`.mobile-detail-tab-btn[data-pid="${pid}"]`).forEach(b =>
        b.classList.toggle('active', b.dataset.t === t)
      );
      container.querySelectorAll(`[data-mob-pane^="${pid}-"]`).forEach(pane =>
        pane.classList.toggle('active', pane.dataset.mobPane === `${pid}-${t}`)
      );
    });
  });
}

function toggleMobileCard(id) {
  const card = document.querySelector(`.mobile-project-card[data-id="${id}"]`);
  if (card) card.classList.toggle('open');
}

/* ── INIT ── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab, true));
});

switchTab('featured', false);

window.addEventListener('resize', () => {
  const currentActive = document.querySelector('.tab-btn.active');
  if (currentActive) updateTabIndicator(currentActive, false);
});

if (document.fonts) {
  document.fonts.ready.then(() => {
    const currentActive = document.querySelector('.tab-btn.active');
    if (currentActive) updateTabIndicator(currentActive, false);
  });
}


function toggleGroup(id) {
  document.getElementById(id).classList.toggle('open');
}


(function () {
  /* About spotlight */
  const section = document.getElementById('about');
  const spotlight = document.getElementById('about-spotlight');
  if (section && spotlight) {
    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      spotlight.style.setProperty('--mx', x + '%');
      spotlight.style.setProperty('--my', y + '%');
    });
  }

  /* Tab switcher */
  window.switchAboutTab = function (tab, btn) {
    document.querySelectorAll('.about-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.about-tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('about-panel-' + tab).classList.add('active');
  };
})();


(function () {
  /* ── Tag elements to animate ── */

  /* Helper: add anim-fade + optional delay class to an element */
  function tag(el, delayIndex) {
    if (!el) return;
    el.classList.add('anim-fade');
    if (delayIndex) el.classList.add('delay-' + delayIndex);
  }

  /* Helper: tag a NodeList with staggered delays */
  function tagAll(els, startDelay) {
    Array.from(els).forEach((el, i) => {
      tag(el, startDelay != null ? Math.min(startDelay + i, 6) : null);
    });
  }

  /* ── Section eyebrows & headings (every section) ── */
  document.querySelectorAll('.section-eyebrow').forEach(el => tag(el, null));
  document.querySelectorAll('.section-heading').forEach(el => tag(el, 1));

  /* ── Projects section ── */
  const projectsTabBar = document.querySelector('.projects-tabs');
  tag(projectsTabBar, 2);
  const projectsPanel = document.querySelector('.projects-layout');
  tag(projectsPanel, 3);

  /* ── Experience ── */
  document.querySelectorAll('.exp-card').forEach((el, i) => tag(el, i + 2));

  /* ── Certifications ── */
  const certsTier1 = document.querySelector('.certs-tier1');
  tag(certsTier1, 2);
  document.querySelectorAll('.tier-2-group').forEach((el, i) => tag(el, i + 3));

  /* ── Skills ── */
  document.querySelectorAll('.skill-card').forEach((el, i) => tag(el, i + 2));

  /* ── About ── */
  document.querySelectorAll('.about-col').forEach((el, i) => tag(el, i + 1));

  /* ── Footer ── */
  tag(document.querySelector('.footer-cta'), 1);
  tag(document.querySelector('.footer-links'), 2);
  tag(document.querySelector('.footer-bottom'), 3);

  /* ── Intersection Observer ── */
  /* Standard observer — for normal-sized elements */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px',
  });

  /* Sensitive observer — for short/thin elements like dividers and footer bar */
  const observerSensitive = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observerSensitive.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0,        /* trigger the moment even 1px is visible */
    rootMargin: '0px 0px 0px 0px',
  });

  /* Assign sensitive observer to footer-bottom and footer-divider */
  const sensitiveEls = new Set([
    document.querySelector('.footer-bottom'),
  ]);

  const fadeEls = document.querySelectorAll('.anim-fade');
  let remaining = fadeEls.length;

  /* Override callbacks to disconnect when all elements have animated */
  const originalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        originalObserver.unobserve(entry.target);
        remaining--;
        if (remaining <= 0) {
          originalObserver.disconnect();
          sensitiveObserver.disconnect();
        }
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  const sensitiveObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        sensitiveObserver.unobserve(entry.target);
        remaining--;
        if (remaining <= 0) {
          originalObserver.disconnect();
          sensitiveObserver.disconnect();
        }
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px 0px 0px' });

  fadeEls.forEach(el => {
    if (sensitiveEls.has(el)) {
      sensitiveObserver.observe(el);
    } else {
      originalObserver.observe(el);
    }
  });
})();


(function () {

  /* ══════════════════════════════════════
     D — ACTIVE NAV INDICATOR
  ══════════════════════════════════════ */
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = [];

  navLinks.forEach(link => {
    const id = link.getAttribute('href').replace('#', '');
    const section = document.getElementById(id);
    if (section) sections.push({ link, section });
  });

  const footer = document.querySelector('.site-footer');

  function updateActiveNav() {
    const scrollY = window.scrollY;
    const winH = window.innerHeight;
    const docH = document.documentElement.scrollHeight;

    /* If footer is visible — deactivate all */
    const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
    if (footerTop < winH * 0.6) {
      navLinks.forEach(l => l.classList.remove('nav-active'));
      return;
    }

    /* Find deepest section whose top has passed 40% of viewport */
    let activeLink = null;
    for (let i = sections.length - 1; i >= 0; i--) {
      const top = sections[i].section.getBoundingClientRect().top;
      if (top <= winH * 0.4) {
        activeLink = sections[i].link;
        break;
      }
    }

    navLinks.forEach(l => l.classList.remove('nav-active'));
    if (activeLink) activeLink.classList.add('nav-active');
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();


  /* ══════════════════════════════════════
     E — SMOOTH CUSTOM CURSOR
  ══════════════════════════════════════ */
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const ring = document.createElement('div');
  ring.id = 'cursor-ring';
  const dot = document.createElement('div');
  dot.id = 'cursor-dot';
  document.body.appendChild(ring);
  document.body.appendChild(dot);

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  /* Clickable elements — pointer state */
  const CLICKABLE = 'a, button, [role="button"], input, textarea, select, label, .skill-tag, .cert-card, .exp-card, .mobile-project-card, .tab-btn, .project-list-item, .accordion-trigger, .view-cert-btn, .project-link, .sub-tab-btn, [tabindex]';

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    document.body.classList.remove('cursor-out');

    /* Check what's under cursor and set state */
    const over = e.target.closest(CLICKABLE);
    if (over) {
      document.body.classList.add('cursor-pointer');
    } else {
      document.body.classList.remove('cursor-pointer');
    }
  });

  document.addEventListener('mouseleave', () => {
    document.body.classList.add('cursor-out');
  });

  /* Click feedback — shrink ring momentarily */
  document.addEventListener('mousedown', () => {
    document.body.classList.add('cursor-click');
  });
  document.addEventListener('mouseup', () => {
    document.body.classList.remove('cursor-click');
  });

  /* Lerp animation */
  const LERP = 0.12;
  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateCursor() {
    dot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
    ringX = lerp(ringX, mouseX, LERP);
    ringY = lerp(ringY, mouseY, LERP);
    ring.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
    requestAnimationFrame(animateCursor);
  }

  animateCursor();

})();


(function () {

  /* Footer spotlight */
  const footer = document.querySelector('.site-footer');
  const footerSpotlight = document.getElementById('footer-spotlight');
  if (footer && footerSpotlight) {
    footer.addEventListener('mousemove', (e) => {
      const rect = footer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      footerSpotlight.style.setProperty('--fx', x + '%');
      footerSpotlight.style.setProperty('--fy', y + '%');
    });
  }

  /* Hamburger / Drawer */
  const hamburger = document.getElementById('nav-hamburger');
  const drawer = document.getElementById('nav-drawer');
  const backdrop = document.getElementById('nav-backdrop');

  function openDrawer() {
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  window.closeDrawer = function () {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', () => {
    if (drawer.classList.contains('open')) closeDrawer();
    else openDrawer();
  });

  /* Close on Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });

  /* ── Back to Top ── */
  const btn = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

})();


(function () {
  if (!window.matchMedia('(hover: hover)').matches) return;

  const TILT = 8;    /* max tilt degrees */
  const SCALE = 1.02; /* slight scale up on hover */

  document.querySelectorAll('.skill-card-wrap').forEach(wrap => {
    const card = wrap.querySelector('.skill-card');

    wrap.addEventListener('mousemove', e => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;   /* 0–1 */
      const y = (e.clientY - r.top) / r.height;  /* 0–1 */

      const rotY = (x - 0.5) * TILT * 2;  /* left→right */
      const rotX = -(y - 0.5) * TILT * 2;  /* top→bottom */

      wrap.style.transform =
        `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${SCALE})`;

      /* Move outline flashlight to follow cursor */
      wrap.style.setProperty('--tx', (x * 100) + '%');
      wrap.style.setProperty('--ty', (y * 100) + '%');
    });

    wrap.addEventListener('mouseleave', () => {
      wrap.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
      wrap.style.transition = 'transform 0.45s cubic-bezier(0.22,1,0.36,1)';
      setTimeout(() => { wrap.style.transition = 'transform 0.08s ease'; }, 450);
    });

    wrap.addEventListener('mouseenter', () => {
      wrap.style.transition = 'transform 0.08s ease';
    });
  });
})();


(function () {

  /* ══════════════════════════════════════
     NAV ACTIVE INDICATOR
  ══════════════════════════════════════ */
  const SECTIONS = [
    { id: 'projects', label: 'Projects', index: 0 },
    { id: 'experience', label: 'Experience', index: 1 },
    { id: 'certifications', label: 'Certifications', index: 2 },
    { id: 'skills', label: 'Stack', index: 3 },
    { id: 'about', label: 'About', index: 4 },
  ];

  const navLinks = document.querySelectorAll('.nav-links a');
  const footer = document.querySelector('.site-footer');

  function updateNavProgress() {
    const winH = window.innerHeight;
    const scrollY = window.scrollY;

    /* Find active section index */
    let activeIdx = -1;
    const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
    if (footerTop < winH * 0.6) {
      /* In footer — clear all */
      navLinks.forEach(l => {
        l.classList.remove('nav-active');
        const p = l.querySelector('.nav-progress');
        if (p) p.style.transform = 'scaleX(0)';
      });
      return;
    }

    for (let i = SECTIONS.length - 1; i >= 0; i--) {
      const el = document.getElementById(SECTIONS[i].id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= winH * 0.4) { activeIdx = i; break; }
    }

    navLinks.forEach((link, i) => {
      const progress = link.querySelector('.nav-progress');
      if (!progress) return;

      if (i !== activeIdx) {
        link.classList.remove('nav-active');
        progress.style.transform = 'scaleX(0)';
        return;
      }

      link.classList.add('nav-active');

      /* Calculate how far through this section we are */
      const el = document.getElementById(SECTIONS[i].id);
      const nextEl = SECTIONS[i + 1] ? document.getElementById(SECTIONS[i + 1].id) : footer;
      if (!el) return;

      const sTop = el.getBoundingClientRect().top + scrollY;
      const sBot = nextEl
        ? nextEl.getBoundingClientRect().top + scrollY
        : document.documentElement.scrollHeight;
      const sLen = sBot - sTop;
      const pct = Math.min(Math.max((scrollY - sTop + winH * 0.4) / sLen, 0), 1);
      progress.style.transform = `scaleX(${pct})`;
    });
  }

  /* ══════════════════════════════════════
     3. MOBILE SECTION BREADCRUMB
  ══════════════════════════════════════ */
  const breadcrumb = document.getElementById('section-breadcrumb');
  const dotsEl = document.getElementById('breadcrumb-dots');
  const labelEl = document.getElementById('breadcrumb-label');
  const ALL_SECTIONS = [
    { id: null, label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'skills', label: 'Stack' },
    { id: 'about', label: 'About' },
  ];

  /* Build dots */
  ALL_SECTIONS.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'breadcrumb-dot';
    dotsEl.appendChild(dot);
  });

  const dots = dotsEl.querySelectorAll('.breadcrumb-dot');
  let breadcrumbTimeout;
  let lastActiveIdx = -1;

  function showBreadcrumb() {
    breadcrumb.classList.add('visible');
    clearTimeout(breadcrumbTimeout);
    breadcrumbTimeout = setTimeout(() => breadcrumb.classList.remove('visible'), 2000);
  }

  function updateBreadcrumb() {
    if (window.innerWidth >= 769) return;

    const winH = window.innerHeight;
    let activeIdx = 0; /* default: Home */

    for (let i = ALL_SECTIONS.length - 1; i >= 1; i--) {
      const el = document.getElementById(ALL_SECTIONS[i].id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= winH * 0.5) { activeIdx = i; break; }
    }

    /* Show breadcrumb on section change */
    if (activeIdx !== lastActiveIdx) {
      lastActiveIdx = activeIdx;
      labelEl.textContent = `${ALL_SECTIONS[activeIdx].label} (${activeIdx + 1}/${ALL_SECTIONS.length})`;
      dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
      if (window.scrollY > 100) showBreadcrumb();
    }
  }

  /* ── Combined scroll listener ── */
  window.addEventListener('scroll', () => {
    updateNavProgress();
    updateBreadcrumb();
  }, { passive: true });

  /* Initial state */
  updateNavProgress();
  updateBreadcrumb();

})();


// Product Hunt Badge Logic
document.addEventListener("DOMContentLoaded", () => {
  const badgeRef = document.getElementById("ph-award-badge");
  if (!badgeRef) return;
  const transformRef = badgeRef.querySelector(".award-badge-transform");
  const overlayPolys = badgeRef.querySelectorAll(".overlay-poly");

  const identityMatrix = "1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1";
  const maxRotate = 0.25;
  const minRotate = -0.25;
  const maxScale = 1;
  const minScale = 0.97;

  let firstOverlayPosition = 0;
  let currentMatrix = identityMatrix;
  let matrix = identityMatrix;
  let isTimeoutFinished = true; // initially true
  let disableInOutOverlayAnimation = true;
  let disableOverlayAnimation = false;

  let enterTimeout, leaveTimeout1, leaveTimeout2, leaveTimeout3;

  function getDimensions() {
    const rect = badgeRef.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  }

  function getMatrix(clientX, clientY) {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    const scale = [
      maxScale - (maxScale - minScale) * Math.abs(xCenter - clientX) / (xCenter - left),
      maxScale - (maxScale - minScale) * Math.abs(yCenter - clientY) / (yCenter - top),
      maxScale - (maxScale - minScale) * (Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY)) / (xCenter - left + yCenter - top)
    ];

    const rotate = {
      x1: 0.25 * ((yCenter - clientY) / yCenter - (xCenter - clientX) / xCenter),
      x2: maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left),
      x3: 0,
      y0: 0,
      y2: maxRotate - (maxRotate - minRotate) * (top - clientY) / (top - bottom),
      y3: 0,
      z0: -(maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left)),
      z1: (0.2 - (0.2 + 0.6) * (top - clientY) / (top - bottom)),
      z3: 0
    };
    return `${scale[0]}, ${rotate.y0}, ${rotate.z0}, 0, ` +
      `${rotate.x1}, ${scale[1]}, ${rotate.z1}, 0, ` +
      `${rotate.x2}, ${rotate.y2}, ${scale[2]}, 0, ` +
      `${rotate.x3}, ${rotate.y3}, ${rotate.z3}, 1`;
  }

  function getOppositeMatrix(_matrix, clientY, onMouseEnter) {
    const { top, bottom } = getDimensions();
    const oppositeY = bottom - clientY + top;
    const weakening = onMouseEnter ? 0.7 : 4;
    const multiplier = onMouseEnter ? -1 : 1;

    return _matrix.split(", ").map((item, index) => {
      if (index === 2 || index === 4 || index === 8) {
        return (-parseFloat(item) * multiplier / weakening).toString();
      } else if (index === 0 || index === 5 || index === 10) {
        return "1";
      } else if (index === 6) {
        return (multiplier * (maxRotate - (maxRotate - minRotate) * (top - oppositeY) / (top - bottom)) / weakening).toString();
      } else if (index === 9) {
        return ((maxRotate - (maxRotate - minRotate) * (top - oppositeY) / (top - bottom)) / weakening).toString();
      }
      return item;
    }).join(", ");
  }

  function updateDOM() {
    transformRef.style.transform = `perspective(700px) matrix3d(${matrix})`;
    overlayPolys.forEach((g, i) => {
      g.style.transform = `rotate(${firstOverlayPosition + (i * 10)}deg)`;
      g.style.transition = !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none";
      g.style.animation = disableOverlayAnimation ? "none" : `overlayAnimation${i + 1} 5s infinite`;
    });
  }

  function updateMatrixLoop() {
    if (isTimeoutFinished) {
      matrix = currentMatrix;
      updateDOM();
    }
    requestAnimationFrame(updateMatrixLoop);
  }
  requestAnimationFrame(updateMatrixLoop);

  badgeRef.addEventListener("mouseenter", (e) => {
    clearTimeout(leaveTimeout1);
    clearTimeout(leaveTimeout2);
    clearTimeout(leaveTimeout3);
    disableOverlayAnimation = true;

    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    disableInOutOverlayAnimation = false;
    enterTimeout = setTimeout(() => { disableInOutOverlayAnimation = true; updateDOM(); }, 350);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        firstOverlayPosition = (Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5;
        updateDOM();
      });
    });

    const tempMatrix = getMatrix(e.clientX, e.clientY);
    matrix = getOppositeMatrix(tempMatrix, e.clientY, true);
    isTimeoutFinished = false;
    updateDOM();

    setTimeout(() => {
      isTimeoutFinished = true;
    }, 200);
  });

  badgeRef.addEventListener("mousemove", (e) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setTimeout(() => {
      firstOverlayPosition = (Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5;
      updateDOM();
    }, 150);

    if (isTimeoutFinished) {
      currentMatrix = getMatrix(e.clientX, e.clientY);
    }
  });

  badgeRef.addEventListener("mouseleave", (e) => {
    const oppositeMatrix = getOppositeMatrix(matrix, e.clientY);
    clearTimeout(enterTimeout);

    currentMatrix = oppositeMatrix;
    setTimeout(() => { currentMatrix = identityMatrix; }, 200);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        disableInOutOverlayAnimation = false;
        leaveTimeout1 = setTimeout(() => { firstOverlayPosition = -firstOverlayPosition / 4; updateDOM(); }, 150);
        leaveTimeout2 = setTimeout(() => { firstOverlayPosition = 0; updateDOM(); }, 300);
        leaveTimeout3 = setTimeout(() => {
          disableOverlayAnimation = false;
          disableInOutOverlayAnimation = true;
          updateDOM();
        }, 500);
        updateDOM();
      });
    });
  });
});

