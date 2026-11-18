// Configuration objects to eliminate duplication
const CONFIG = {
  NAVIGATION: [
    { number: '01', label: 'About', section: 'about' },
    { number: '02', label: 'Skills', section: 'skills' },
    { number: '03', label: 'Experience', section: 'experience' },
    { number: '04', label: 'Work', section: 'work' },
    { number: '05', label: 'Documents', section: 'press' },
    { number: '06', label: 'GitHub', section: 'github' },
    { number: '07', label: 'Contact', section: 'contact' }
  ],

  SOCIAL_MEDIA: [
    { platform: 'GitHub', icon: 'bi-github', url: 'https://github.com/' + (window.SITE_CONFIG?.GITHUB_USERNAME || 'QxQx55') },
    { platform: 'LinkedIn', icon: 'bi-linkedin', url: 'https://www.linkedin.com/in/wendayew-fkadu-451483440/' },
    { platform: 'Telegram', icon: 'bi-telegram', url: 'https://t.me/Wendayew' },
    { platform: 'Email', icon: 'bi-envelope-at', url: 'mailto:' + (window.SITE_CONFIG?.EMAIL || 'wen1260h@gmail.com') }
  ],

  RESUME_URL: 'static/documents/Wendayew_Fkadu_Resume.pdf',
  EMAIL: window.SITE_CONFIG?.EMAIL || 'wen1260h@gmail.com',
};

const SCROLL = {
  HIGHLIGHT_OFFSET: 150,    // px added to scrollY when testing which section is active
  TOP_THRESHOLD: 300,       // don't activate any nav link until scrolled past the hero
  NAVBAR_COMPENSATION: 100,
  INDICATOR_HIDE_AT: 80,
};

const TIMING = {
  LOADER_FALLBACK_MS: 6000,
  CARD_STAGGER_MS: 100,
};

// Utility: Generate navigation links
function generateNavLinks(container, isMobile = false) {
  const baseUrl = document.body.dataset.baseUrl || '';
  const links = CONFIG.NAVIGATION.map((nav, i) => {
    if (isMobile) {
      return `
        <li>
          <a href="${baseUrl}#${nav.section}" data-section="${nav.section}">
            <span class="nav-number">${nav.number}.</span>
            ${nav.label}
          </a>
        </li>
      `;
    } else {
      return `
        <a class="nav-link" href="${baseUrl}#${nav.section}" data-section="${nav.section}"
           aria-label="Navigate to ${nav.label.toLowerCase()} section">
          <span class="nav-number">${nav.number}.</span> ${nav.label}
        </a>
      `;
    }
  }).join('');

  const resumeLink = isMobile
    ? `<div class="mobile-resume-btn"><a href="${CONFIG.RESUME_URL}" target="_blank" rel="noopener noreferrer">Resume</a></div>`
    : `<a class="resume-btn" href="${CONFIG.RESUME_URL}" target="_blank" rel="noopener noreferrer" aria-label="View Resume">Resume</a>`;

  if (isMobile) {
    container.innerHTML = links;
    container.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i));
    const mobileMenu = container.closest('.mobile-menu-overlay');
    const existingResumeBtn = mobileMenu.querySelector('.mobile-resume-btn');
    if (existingResumeBtn) {
      existingResumeBtn.remove();
    }
    mobileMenu.insertAdjacentHTML('beforeend', resumeLink);
  } else {
    container.innerHTML = links + resumeLink;
  }
}

// Utility: Generate social media links
function generateSocialLinks(container, isFooter = false) {
  const links = CONFIG.SOCIAL_MEDIA.map(social => {
    const className = isFooter ? 'social-icon-footer' : '';
    const ariaLabel = isFooter
      ? `Visit Wendayew Fkadu on ${social.platform}`
      : social.platform;

    if (isFooter) {
      return `
        <a href="${social.url}" target="_blank" rel="noopener noreferrer"
           class="${className}" aria-label="${ariaLabel}">
          <i class="bi ${social.icon}" aria-hidden="true"></i>
        </a>
      `;
    } else {
      return `
        <li>
          <a href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${ariaLabel}">
            <i class="bi ${social.icon}" aria-hidden="true"></i>
          </a>
        </li>
      `;
    }
  }).join('');

  container.innerHTML = links;
}

// Inject the footer HTML into the #site-footer placeholder shared by all pages.
// Called synchronously so the DOM is ready before DOMContentLoaded queries run.
function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  footer.className = 'footer-section mt-5';
  footer.innerHTML = `
    <div class="container">
      <div class="row">
        <div class="col-12 text-center">
          <div class="social-media-icons-footer mt-3 d-lg-none" role="navigation" aria-label="Social media links"></div>
          <div class="copyright">
            <p>Built by Wendayew Fkadu</p>
            <p class="copyright-year">
              &copy; <span id="copyright-year"></span> All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Inject the email link into the right sidebar from CONFIG.EMAIL.
function renderEmailSidebar() {
  const sidebar = document.querySelector('.email-sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = `<a href="mailto:${CONFIG.EMAIL}" class="email-link" aria-label="Email ${CONFIG.EMAIL}">${CONFIG.EMAIL}</a>`;
}

// Enhanced error logging utility
const ErrorLogger = {
  warn(context, error, additionalInfo = {}) {
    console.warn(`⚠️ ${context}:`, {
      message: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    });
  },

  error(context, error, additionalInfo = {}) {
    console.error(`❌ ${context}:`, {
      message: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    });
  },

  info(context, message, additionalInfo = {}) {
    console.log(`ℹ️ ${context}:`, message, additionalInfo);
  }
};

// Utility: Safe error handler wrapper with enhanced logging
function safeExecute(fn, context = 'Operation') {
  try {
    return fn();
  } catch (error) {
    ErrorLogger.warn(context, error);
    return null;
  }
}

// Utility: Add event listener with cleanup
function addManagedListener(element, event, handler, options = {}) {
  if (!element) {
    console.warn(`Cannot add listener: element is ${element}`);
    return;
  }

  const mergedOptions = { ...options };

  // If signal is provided in options, use it; otherwise passive by default
  if (!mergedOptions.signal) {
    mergedOptions.passive = mergedOptions.passive !== undefined ? mergedOptions.passive : true;
  }

  element.addEventListener(event, handler, mergedOptions);
}

// Utility: Add event listeners to multiple elements
function addListenersToAll(elements, event, handler, options = {}) {
  if (!elements || elements.length === 0) return;

  elements.forEach(element => {
    addManagedListener(element, event, handler, options);
  });
}

// Global cleanup system for memory leak prevention
const globalCleanup = {
  controllers: [],
  timeoutIds: [],

  addController(controller) {
    this.controllers.push(controller);
  },

  addTimeout(id) {
    this.timeoutIds.push(id);
  },

  cleanup() {
    // Abort all event listeners
    this.controllers.forEach(ctrl => ctrl.abort());
    this.controllers = [];

    // Clear all timeouts
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds = [];
  }
};

// Register global cleanup on page unload
window.addEventListener('beforeunload', () => globalCleanup.cleanup(), { once: true });

// Global error handlers for unhandled errors and promise rejections
window.addEventListener('error', (event) => {
  ErrorLogger.error('Unhandled Error', event.error || event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  ErrorLogger.error('Unhandled Promise Rejection', event.reason, {
    promise: 'Promise rejected without handler'
  });
  // Prevent default to avoid "Unhandled promise rejection" console spam
  event.preventDefault();
});

// Render shared chrome synchronously — elements are in the DOM before any
// DOMContentLoaded handler queries them (e.g. #copyright-year, .social-media-icons-footer).
renderFooter();
renderEmailSidebar();

// Enhanced Navigation functionality with sophisticated scroll detection
document.addEventListener('DOMContentLoaded', function () {
  safeExecute(() => {
    const navbar = document.getElementById('main-nav');

    if (!navbar) {
      return;
    }

    // Initialize navigation and social media links from config
    const desktopNav = document.querySelector('.desktop-nav');
    const mobileMenuItems = document.querySelector('.mobile-menu-items');
    const sidebarSocialList = document.querySelector('.social-icons-list');
    const footerSocialIcons = document.querySelector('.social-media-icons-footer');
    const copyrightYear = document.getElementById('copyright-year');

    if (desktopNav) generateNavLinks(desktopNav, false);
    if (mobileMenuItems) generateNavLinks(mobileMenuItems, true);
    if (sidebarSocialList) generateSocialLinks(sidebarSocialList, false);
    if (footerSocialIcons) generateSocialLinks(footerSocialIcons, true);
    if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

    // Memory leak prevention: AbortController for event listener cleanup
    const controller = new AbortController();
    const signal = controller.signal;
    globalCleanup.addController(controller);

    // Debounce utility for performance
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // Active link highlighting based on scroll position
    // Query after navigation is generated
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section], .mobile-menu-items a[data-section]');

    // Performance optimization: Cache section positions and navLink references
    let sectionCache = [];
    let navLinkMap = new Map();
    let currentActiveSectionId = null;
    let ticking = false;

    // Build navLink map — store all links (desktop + mobile) per section
    navLinks.forEach(link => {
      const sectionId = link.getAttribute('data-section');
      if (sectionId) {
        if (!navLinkMap.has(sectionId)) {
          navLinkMap.set(sectionId, []);
        }
        navLinkMap.get(sectionId).push(link);
      }
    });

    // Calculate and cache section positions (avoids layout thrashing)
    function cacheSectionPositions() {
      sectionCache = Array.from(sections).map(section => ({
        id: section.id,
        top: section.offsetTop,
        bottom: section.offsetTop + section.offsetHeight
      }));
    }

    function highlightNavLink() {
      try {
        const scrollPosition = window.scrollY + SCROLL.HIGHLIGHT_OFFSET;

        // If at the top of the page, remove all active states
        if (scrollPosition < SCROLL.TOP_THRESHOLD) {
          if (currentActiveSectionId) {
            navLinkMap.get(currentActiveSectionId)?.forEach(l => l.classList.remove('active'));
            currentActiveSectionId = null;
          }
          return;
        }

        // Find the current section using cached positions (no DOM queries)
        let activeSection = null;
        for (let i = sectionCache.length - 1; i >= 0; i--) {
          const section = sectionCache[i];
          if (scrollPosition >= section.top && scrollPosition < section.bottom) {
            activeSection = section;
            break;
          }
        }

        // Update active links only if section changed (prevents unnecessary DOM updates)
        if (activeSection && activeSection.id !== currentActiveSectionId) {
          if (currentActiveSectionId) {
            navLinkMap.get(currentActiveSectionId)?.forEach(l => l.classList.remove('active'));
          }
          navLinkMap.get(activeSection.id)?.forEach(l => l.classList.add('active'));
          currentActiveSectionId = activeSection.id;
        }
      } catch (error) {
        console.warn('Navigation highlighting error:', error);
      }
      ticking = false;
    }

    // Unified scroll handler using RAF for optimal performance
    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(highlightNavLink);
        ticking = true;
      }
    }

    // Cache positions on load
    cacheSectionPositions();

    // Recalculate cache on resize (debounced to avoid excessive recalculations)
    const debouncedRecache = debounce(cacheSectionPositions, 250);
    addManagedListener(window, 'resize', debouncedRecache, { passive: true, signal });

    // Single optimized scroll listener using requestAnimationFrame
    addManagedListener(window, 'scroll', handleScroll, { passive: true, signal });
    highlightNavLink(); // Initial check

    // Mobile menu functionality
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-items a');

    if (hamburgerBtn && mobileMenu && menuBackdrop) {
      // Toggle menu
      function toggleMenu() {
        hamburgerBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        menuBackdrop.classList.toggle('active');

        // Update ARIA attributes
        const isExpanded = hamburgerBtn.classList.contains('active');
        hamburgerBtn.setAttribute('aria-expanded', isExpanded);
        mobileMenu.setAttribute('aria-hidden', !isExpanded);
        menuBackdrop.setAttribute('aria-hidden', !isExpanded);

        // Prevent body scroll when menu is open
        if (isExpanded) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }

      // Close menu
      function closeMenu() {
        hamburgerBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        menuBackdrop.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuBackdrop.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }

      // Event listeners
      addManagedListener(hamburgerBtn, 'click', toggleMenu, { signal });
      addManagedListener(menuBackdrop, 'click', closeMenu, { signal });

      // Close menu when link is clicked
      addListenersToAll(mobileMenuLinks, 'click', closeMenu, { signal });

      // Close menu on escape key
      addManagedListener(document, 'keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
          closeMenu();
        }
      }, { signal });
    }

    // Add smooth scroll behavior
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    addListenersToAll(anchorLinks, 'click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#main-content') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offsetTop = target.offsetTop - SCROLL.NAVBAR_COMPENSATION;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }, { signal });

  }, 'Navigation initialization');
});

// Spinner loader — shows until window.load fires, skipped on return visits.
(function loaderInit() {
  document.body.setAttribute('aria-busy', 'true');

  if (sessionStorage.getItem('wf_loaded')) {
    function skipLoader() {
      const overlay = document.getElementById('loading-overlay');
      if (overlay) overlay.style.display = 'none';
      document.body.removeAttribute('aria-busy');
    }
    function skipAOS() {
      if (typeof AOS !== 'undefined') AOS.init({ duration: 1000, once: true, offset: 100 });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', skipLoader, { once: true });
    } else {
      skipLoader();
    }
    if (document.readyState === 'complete') {
      skipAOS();
    } else {
      window.addEventListener('load', skipAOS, { once: true });
    }
    return;
  }

  let animDone  = false;
  let pageLoaded = false;
  let aosReady = false;
  let fallbackTimeoutId;

  function dismissOverlay() {
    clearTimeout(fallbackTimeoutId);
    const overlay = document.getElementById('loading-overlay');
    if (!overlay || overlay.style.display === 'none') return;
    overlay.style.opacity = 0;
    overlay.addEventListener('transitionend', (e) => {
      if (e.propertyName !== 'opacity') return;
      overlay.style.visibility = 'hidden';
      overlay.style.display = 'none';
      document.body.removeAttribute('aria-busy');
      sessionStorage.setItem('wf_loaded', '1');
      if (typeof AOS !== 'undefined') {
        if (!aosReady) {
          AOS.init({ duration: 1000, once: true, offset: 100 });
          aosReady = true;
        } else {
          AOS.refresh();
        }
      }
    }, { once: true });
  }

  function tryDismiss() {
    if (animDone && pageLoaded) safeExecute(dismissOverlay, 'Loading overlay hide');
  }

  // Last stroke finishes at ~1.06s; add 340ms pause = 1400ms total.
  // On slow connections the animation plays while the page continues loading,
  // and the overlay waits for window.load before fading out.
  const animTimer = setTimeout(() => { animDone = true; tryDismiss(); }, 1400);
  globalCleanup.addTimeout(animTimer);

  window.addEventListener('load', () => { pageLoaded = true; tryDismiss(); }, { once: true });

  fallbackTimeoutId = setTimeout(() => {
    safeExecute(dismissOverlay, 'Fallback loading overlay hide');
  }, TIMING.LOADER_FALLBACK_MS);
  globalCleanup.addTimeout(fallbackTimeoutId);
})();

// Scroll-down indicator — hide once user scrolls past the hero
safeExecute(() => {
  const indicator = document.querySelector('.scroll-down-indicator');
  if (!indicator) return;
  const onScroll = () => {
    indicator.classList.toggle('hidden', window.scrollY > SCROLL.INDICATOR_HIDE_AT);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}, 'Scroll indicator');

// Experience Tabs Script
document.addEventListener('DOMContentLoaded', function () {
  safeExecute(() => {
    // Create AbortController for this section
    const tabsController = new AbortController();
    globalCleanup.addController(tabsController);

    const tabs = document.querySelectorAll('.experience-tab');
    const panels = document.querySelectorAll('.experience-panel');

    addListenersToAll(tabs, 'click', function () {
      safeExecute(() => {
        // Remove active class from all tabs and panels
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => p.classList.remove('active'));

        // Add active class to clicked tab and corresponding panel
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');
        const panelId = this.getAttribute('data-tab');
        document.getElementById(panelId).classList.add('active');
      }, 'Experience tab click');
    }, { signal: tabsController.signal });
  }, 'Experience tabs initialization');
});

// Show More / Less — Other Noteworthy Projects
safeExecute(() => {
  const btn = document.getElementById('showMoreBtn');
  const extraCards = document.querySelectorAll('.extra-card');
  if (!btn || !extraCards.length) return;

  let expanded = false;

  btn.addEventListener('click', () => {
    expanded = !expanded;

    if (expanded) {
      extraCards.forEach((card, i) => {
        setTimeout(() => card.classList.add('card-visible'), i * TIMING.CARD_STAGGER_MS);
      });
      btn.querySelector('.show-more-btn-text').textContent = 'Show Less';
      btn.classList.add('expanded');
    } else {
      extraCards.forEach(card => card.classList.remove('card-visible'));
      btn.querySelector('.show-more-btn-text').textContent = 'Show More';
      btn.classList.remove('expanded');
      document.querySelector('.other-noteworthy-section')
        .scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}, 'Show more/less projects');
