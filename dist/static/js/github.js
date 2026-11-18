(function () {
  'use strict';

  const CONFIG = {
    GITHUB_USERNAME: window.SITE_CONFIG?.GITHUB_USERNAME || 'QxQx55',
    CACHE_DURATION: 60 * 60 * 1000,
    LANGUAGE_CACHE_KEY: 'github_languages_cache',
    MAX_LANGUAGE_REPOS: 50,
    MAX_LANGUAGE_REPOS_UNAUTH: 10,
    FETCH_TIMEOUT_MS: 10_000,
    FRESH_CACHE_MS: 45 * 60 * 1000,  // skip API call entirely if cache is < 45 min old
  };

  let isLoading = false;

  const AUTH_HEADERS = window.GITHUB_TOKEN
    ? { Authorization: `Bearer ${window.GITHUB_TOKEN}` }
    : {};

  function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT_MS);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  // Rate Limit Handler
  const RateLimitHandler = {
    checkRateLimit(response) {
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const limit = response.headers.get('X-RateLimit-Limit');
      const reset = response.headers.get('X-RateLimit-Reset');

      if (remaining && limit) {
        if (parseInt(remaining) < 10) {
          console.warn('⚠️ Low rate limit! Only', remaining, 'requests remaining');
        }

        if (parseInt(remaining) === 0 && reset) {
          const resetDate = new Date(parseInt(reset) * 1000);
          console.error('🚫 Rate limit exceeded! Resets at:', resetDate.toLocaleString());
          return { exceeded: true, resetTime: resetDate };
        }
      }

      return { exceeded: false };
    },

    async handleRateLimitError(resetTime) {
      const waitMinutes = Math.ceil((resetTime - new Date()) / 1000 / 60);
      console.error(`⏳ Rate limit exceeded. Please wait ${waitMinutes} minutes.`);
      return CacheManager.get(CONFIG.LANGUAGE_CACHE_KEY);
    },
  };

  // UI Status Manager
  const UIStatusManager = {
    show(message, type = 'info') {
      const statusBar = document.getElementById('githubStatusBar');
      const statusMessage = document.getElementById('statusMessage');
      if (!statusBar || !statusMessage) return;

      statusBar.style.opacity = '';
      statusBar.style.display = 'flex';
      statusMessage.textContent = message;
      statusBar.classList.remove('error', 'success', 'warning', 'info');
      statusBar.classList.add(type);
    },

    hide() {
      const statusBar = document.getElementById('githubStatusBar');
      if (!statusBar) return;
      statusBar.style.opacity = '0';
      setTimeout(() => {
        statusBar.style.display = 'none';
        statusBar.style.opacity = '';
      }, 300);
    },

    showLoading() {
      this.show('Loading GitHub language data...', 'info');
    },

    showSuccess(isCached = false) {
      const cacheAge = CacheManager.getAge(CONFIG.LANGUAGE_CACHE_KEY);
      const ageMinutes = cacheAge ? Math.round(cacheAge / 1000 / 60) : 0;
      const message = isCached
        ? `Language data loaded from cache (${ageMinutes} min old)`
        : `Language data updated! • Next refresh in ${Math.round(CONFIG.CACHE_DURATION / 1000 / 60)} min`;
      this.show(message, 'success');
      setTimeout(() => this.hide(), 5000);
    },

    showError(message) {
      this.show(`⚠️ ${message} • Click refresh to try again`, 'error');
    },

    showRateLimit(resetTime) {
      const waitMinutes = Math.ceil((resetTime - new Date()) / 1000 / 60);
      this.show(`Rate limit reached • Resets in ${waitMinutes} minutes`, 'warning');
    },
  };

  // GitHub API names that should be displayed under a canonical key in LANGUAGE_ICONS.
  const LANGUAGE_ALIASES = {
    'Jupyter Notebook': 'Jupyter',
  };

  // Language icon mapping
  const LANGUAGE_ICONS = {
    JavaScript: { icon: 'devicon-javascript-plain', color: '#f7df1e' },
    TypeScript: { icon: 'devicon-typescript-plain', color: '#3178c6' },
    Python: { icon: 'devicon-python-plain', color: '#3776ab' },
    Java: { icon: 'devicon-java-plain', color: '#007396' },
    'C++': { icon: 'devicon-cplusplus-plain', color: '#00599c' },
    C: { icon: 'devicon-c-plain', color: '#a8b9cc' },
    'C#': { icon: 'devicon-csharp-plain', color: '#239120' },
    PHP: { icon: 'devicon-php-plain', color: '#777bb4' },
    Ruby: { icon: 'devicon-ruby-plain', color: '#cc342d' },
    Go: { icon: 'devicon-go-plain', color: '#00add8' },
    Rust: { icon: 'devicon-rust-plain', color: '#000000' },
    Swift: { icon: 'devicon-swift-plain', color: '#fa7343' },
    Kotlin: { icon: 'devicon-kotlin-plain', color: '#7f52ff' },
    Dart: { icon: 'devicon-dart-plain', color: '#0175c2' },
    HTML: { icon: 'devicon-html5-plain', color: '#e34f26' },
    CSS: { icon: 'devicon-css3-plain', color: '#1572b6' },
    Shell: { icon: 'devicon-bash-plain', color: '#89e051' },
    Vue: { icon: 'devicon-vuejs-plain', color: '#4fc08d' },
    React: { icon: 'devicon-react-original', color: '#61dafb' },
    Jupyter: { icon: 'devicon-jupyter-plain', color: '#f37726' },
    SCSS: { icon: 'devicon-sass-plain', color: '#c6538c' },
    PowerShell: { icon: 'devicon-powershell-plain', color: '#5391e8' },
    Batchfile: { icon: 'devicon-windows8-original', color: '#00adef' },
  };

  // Aggregate raw { name, bytes } entries into the languageData shape
  function aggregateLanguages(entries) {
    const languageData = {};
    let totalBytes = 0;

    for (const { name: rawName, bytes } of entries) {
      const name = LANGUAGE_ALIASES[rawName] || rawName;
      languageData[name] = (languageData[name] || 0) + bytes;
      totalBytes += bytes;
    }

    const languages = Object.entries(languageData)
      .map(([language, bytes]) => ({
        name: language,
        bytes,
        percentage: ((bytes / totalBytes) * 100).toFixed(2),
        icon: LANGUAGE_ICONS[language]?.icon || 'devicon-github-plain',
        color: LANGUAGE_ICONS[language]?.color || '#8892b0',
      }))
      .sort((a, b) => b.bytes - a.bytes);

    return {
      languages,
      totalBytes,
      topLanguage: languages[0]?.name || 'Unknown',
      languageCount: languages.length,
    };
  }

  // Single GraphQL request — 1 call instead of N+1. Requires GITHUB_TOKEN.
  async function fetchLanguageDataGraphQL(username) {
    const query = `{
      user(login: "${username}") {
        repositories(first: ${CONFIG.MAX_LANGUAGE_REPOS}, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
          nodes {
            languages(first: 20, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node { name }
              }
            }
          }
        }
      }
    }`;

    const response = await fetchWithTimeout('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...AUTH_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const rateLimit = RateLimitHandler.checkRateLimit(response);
    if (rateLimit.exceeded) return { rateLimit };

    if (!response.ok) throw new Error(`GraphQL API Error: ${response.status}`);

    const { data, errors } = await response.json();
    if (errors?.length) throw new Error(errors[0].message);

    const entries = data.user.repositories.nodes.flatMap(repo =>
      repo.languages.edges.map(e => ({ name: e.node.name, bytes: e.size }))
    );

    return aggregateLanguages(entries);
  }

  // REST fallback — used when no token is present. Sequential to avoid exhausting
  // the 60 req/hour unauthenticated rate limit; capped at MAX_LANGUAGE_REPOS_UNAUTH.
  async function fetchLanguageDataREST(username) {
    const reposResponse = await fetchWithTimeout(
      `https://api.github.com/users/${username}/repos?per_page=100`,
      { headers: AUTH_HEADERS }
    );

    const rateLimit = RateLimitHandler.checkRateLimit(reposResponse);
    if (rateLimit.exceeded) return { rateLimit };

    if (!reposResponse.ok) throw new Error(`API Error: Repos ${reposResponse.status}`);

    const repos = await reposResponse.json();
    const selectedRepos = repos
      .filter(repo => !repo.fork)
      .sort((a, b) => b.size - a.size)
      .slice(0, CONFIG.MAX_LANGUAGE_REPOS_UNAUTH);

    const entries = [];
    for (const repo of selectedRepos) {
      try {
        const res = await fetchWithTimeout(
          `https://api.github.com/repos/${username}/${repo.name}/languages`,
          { headers: AUTH_HEADERS }
        );
        if (!res.ok) {
          console.warn(`⚠️ Failed to fetch languages for ${repo.name}`);
          continue;
        }
        const langs = await res.json();
        for (const [name, bytes] of Object.entries(langs)) {
          entries.push({ name, bytes });
        }
      } catch (err) {
        console.warn(`⚠️ Skipped ${repo.name}:`, err.message);
      }
    }

    return aggregateLanguages(entries);
  }

  function updateLanguageUI(languageData) {
    const topLanguagesContainer = document.getElementById('topLanguages');

    if (!topLanguagesContainer) {
      console.warn('⚠️ Language UI elements not found');
      return;
    }

    topLanguagesContainer.innerHTML = languageData.languages.slice(0, 10).map((lang) => `
      <div class="top-language-badge"
           data-tooltip="${(lang.bytes / 1024).toFixed(1)} KB of code • ${lang.percentage}% of total">
        <i class="${lang.icon}"></i>
        <div class="badge-info">
          <span class="badge-name">${lang.name}</span>
          <span class="badge-percentage">${lang.percentage}%</span>
        </div>
      </div>
    `).join('');

    // Set per-language colors via CSSOM so no inline style attributes appear in HTML
    topLanguagesContainer.querySelectorAll('.top-language-badge').forEach((badge, i) => {
      badge.style.setProperty('--lang-color', languageData.languages[i].color);
    });
  }

  async function fetchGitHubLanguages() {
    if (isLoading) return;

    isLoading = true;
    UIStatusManager.showLoading();

    try {
      // Stale-while-revalidate: check cache first
      const cachedLanguages = CacheManager.get(CONFIG.LANGUAGE_CACHE_KEY, CONFIG.CACHE_DURATION);
      const cacheAge = CacheManager.getAge(CONFIG.LANGUAGE_CACHE_KEY);

      // Fresh cache (<45 min): skip the API call entirely
      if (cachedLanguages && cacheAge < CONFIG.FRESH_CACHE_MS) {
        updateLanguageUI(cachedLanguages);
        UIStatusManager.showSuccess(true);
        isLoading = false;
        return;
      }

      // Stale cache (45–60 min): render immediately, then fetch fresh below
      if (cachedLanguages) {
        updateLanguageUI(cachedLanguages);
        UIStatusManager.showSuccess(true);
      }

      const result = window.GITHUB_TOKEN
        ? await fetchLanguageDataGraphQL(CONFIG.GITHUB_USERNAME)
        : await fetchLanguageDataREST(CONFIG.GITHUB_USERNAME);

      if (result.rateLimit) {
        UIStatusManager.showRateLimit(result.rateLimit.resetTime);
        const fallback = await RateLimitHandler.handleRateLimitError(result.rateLimit.resetTime);
        if (fallback) updateLanguageUI(fallback);
        return;
      }

      CacheManager.set(CONFIG.LANGUAGE_CACHE_KEY, result);
      updateLanguageUI(result);
      UIStatusManager.showSuccess(false);
    } catch (error) {
      const reason =
        error.name === 'AbortError' ? 'Request timed out - check your connection'
        : error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') ? 'Network error - check your internet connection'
        : error.message?.includes('404') ? 'GitHub user not found'
        : error.message?.includes('403') ? 'GitHub API rate limit exceeded'
        : error.message?.includes('500') || error.message?.includes('502') ? 'GitHub API server error - try again later'
        : 'Unknown error occurred';

      console.error('❌ GitHub API Error:', {
        message: error.message,
        type: error.name,
        reason,
        username: CONFIG.GITHUB_USERNAME,
        timestamp: new Date().toISOString(),
      });

      const cached = CacheManager.get(CONFIG.LANGUAGE_CACHE_KEY);
      if (cached) {
        updateLanguageUI(cached);
        UIStatusManager.showError('Failed to fetch fresh data, showing cached data');
      } else {
        UIStatusManager.showError('Unable to load language data. Please try refreshing.');
      }
    } finally {
      isLoading = false;
    }
  }

  function init() {
    fetchGitHubLanguages();

    const refreshBtn = document.getElementById('statusRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => window.GitHubLanguageCache?.refresh());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GitHubLanguageCache = {
    refresh: fetchGitHubLanguages,
    clear: () => CacheManager.clear(CONFIG.LANGUAGE_CACHE_KEY),
    getAge: () => {
      const age = CacheManager.getAge(CONFIG.LANGUAGE_CACHE_KEY);
      return age ? Math.round(age / 1000 / 60) + ' minutes' : 'No cache';
    },
    viewCache: () => CacheManager.get(CONFIG.LANGUAGE_CACHE_KEY),
  };
})();
