/**
 * LeadScope Portfolio - Main Application Logic
 * Handles interactive template catalog rendering, category filtering, search,
 * live preview iframe modal with device toggles, tilt effects, and form submission.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const templatesGrid = document.getElementById('templates-grid');
  const searchInput = document.getElementById('search-input');
  const filterPillsContainer = document.getElementById('filter-pills');
  const templateCountBadge = document.getElementById('template-count-badge');
  
  // Modal Elements
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalCategory = document.getElementById('modal-category');
  const modalIframe = document.getElementById('modal-iframe');
  const modalBody = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const deviceBtns = document.querySelectorAll('.device-btn');
  const externalRepoBtn = document.getElementById('modal-external-btn');

  let currentCategory = 'all';
  let currentSearchQuery = '';

  // Initialize Portfolio
  initPortfolio();

  function initPortfolio() {
    updateCategoryPillCounts();
    renderTemplates();
    setupEventListeners();
    setupScrollAnimations();
    setupStatsCounter();
    setupBottomSheet();
  }

  function updateCategoryPillCounts() {
    if (!filterPillsContainer) return;
    const counts = { all: TEMPLATES_DATA.length };
    TEMPLATES_DATA.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });

    filterPillsContainer.querySelectorAll('.filter-pill').forEach(pill => {
      const cat = pill.dataset.category;
      const count = counts[cat] || 0;
      const baseLabel = pill.textContent.replace(/\s\(\d+\)$/, '');
      pill.textContent = `${baseLabel} (${count})`;
    });
  }

  /**
   * Render Template Cards
   */
  function renderTemplates() {
    if (!templatesGrid) return;

    const filtered = TEMPLATES_DATA.filter(template => {
      const matchesCategory = currentCategory === 'all' || template.category === currentCategory;
      const searchTarget = `${template.title} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
      const matchesSearch = searchTarget.includes(currentSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (templateCountBadge) {
      templateCountBadge.textContent = `${filtered.length} Template${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
      templatesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-glass);">
          <i class="fa-solid fa-folder-open" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 16px;"></i>
          <h3 style="font-size: 1.5rem; margin-bottom: 8px;">No Templates Found</h3>
          <p style="color: var(--text-muted);">Try adjusting your search query or switching categories.</p>
        </div>
      `;
      return;
    }

    templatesGrid.innerHTML = filtered.map(template => createTemplateCardHTML(template)).join('');
    attachCardListeners();
  }

  /**
   * Generate Template Card HTML
   */
  function createTemplateCardHTML(template) {
    return `
      <div class="template-card" data-id="${template.id}" data-category="${template.category}">
        <div class="card-header-banner" style="position: relative; overflow: hidden; height: 200px;">
          <img src="${template.image}" alt="${template.title}" class="card-photo-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; filter: brightness(0.75);">
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7, 10, 18, 0.3) 0%, rgba(7, 10, 18, 0.9) 100%);"></div>
          
          <div style="position: absolute; top: 12px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: center; z-index: 2;">
            <span class="card-badge">${template.badge}</span>
            <span class="card-badge" style="background: rgba(16, 185, 129, 0.85); color: #fff;"><i class="fa-solid fa-star" style="color: #fbbf24; margin-right: 4px;"></i> 4.9</span>
          </div>

          <!-- Quick Demo Touch Overlay Button -->
          <button class="quick-demo-overlay-btn btn-card-preview" data-id="${template.id}" title="Instant Quick Demo">
            <i class="fa-solid fa-play"></i> Quick Demo
          </button>

          <div class="card-icon-wrapper" style="position: relative; z-index: 2; background: ${template.gradient}; border: 1px solid rgba(255, 255, 255, 0.3);">
            <i class="fa-solid ${template.icon}"></i>
          </div>
        </div>
        <div class="card-body">
          <span class="card-category-label">${template.categoryLabel}</span>
          <h3 class="card-title">${template.title}</h3>
          <p class="card-desc">${template.description}</p>
          <div class="card-features-list">
            ${template.tags.map(tag => `<span class="feature-pill">#${tag}</span>`).join('')}
          </div>
          <div class="card-footer">
            <button class="btn-card-preview" data-action="preview" data-id="${template.id}">
              <i class="fa-solid fa-eye"></i> Live Demo
            </button>
            <a href="https://github.com/pms5566/my-leadscope-templates/tree/main/${encodeURIComponent(template.folder)}" target="_blank" class="btn-card-code" title="View Source on GitHub">
              <i class="fa-brands fa-github"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach Card Click Listeners & Tilt Effects
   */
  function attachCardListeners() {
    document.querySelectorAll('.btn-card-preview').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openPreviewModal(id);
      });
    });

    // Subtle 3D Card Tilt Effect
    document.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('mousemove', handleCardTilt);
      card.addEventListener('mouseleave', resetCardTilt);
    });
  }

  function handleCardTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  }

  function resetCardTilt(e) {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  }

  function setupEventListeners() {
    // Mobile Navigation Drawer Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
    const drawerCloseBtn = document.getElementById('drawer-close-btn');
    
    if (mobileMenuBtn && mobileNavDrawer) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileNavDrawer.classList.add('active');
      });
    }
    if (drawerCloseBtn && mobileNavDrawer) {
      drawerCloseBtn.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('active');
      });
    }

    document.querySelectorAll('.drawer-link').forEach(link => {
      link.addEventListener('click', () => {
        if (mobileNavDrawer) mobileNavDrawer.classList.remove('active');
      });
    });
    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        renderTemplates();
      });
    }

    // Category Filter Pills
    if (filterPillsContainer) {
      filterPillsContainer.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
          filterPillsContainer.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          e.currentTarget.classList.add('active');
          currentCategory = e.currentTarget.dataset.category;
          renderTemplates();
        });
      });
    }

    // Modal Close
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closePreviewModal);
    }
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closePreviewModal();
      });
    }

    // Keyboard ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closePreviewModal();
      }
    });

    // Modal Device Switcher
    deviceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        deviceBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const view = e.currentTarget.dataset.view;
        
        modalBody.className = 'modal-body view-' + view;
      });
    });

    // Contact Form Handler
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
        
        setTimeout(() => {
          alert('Thank you! Your message has been sent successfully. I will get back to you shortly.');
          contactForm.reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }, 1200);
      });
    }
  }

  /**
   * Open Preview Modal with Live Template Content
   */
  function openPreviewModal(templateId) {
    const template = TEMPLATES_DATA.find(t => t.id === templateId);
    if (!template) return;

    modalTitle.textContent = template.title;
    modalCategory.textContent = template.categoryLabel;
    
    if (externalRepoBtn) {
      externalRepoBtn.href = `https://github.com/pms5566/my-leadscope-templates/tree/main/${encodeURIComponent(template.folder)}`;
    }

    // Construct raw GitHub demo viewer path
    const rawDemoUrl = `https://raw.githack.com/pms5566/my-leadscope-templates/main/${encodeURIComponent(template.folder)}/index.html`;
    modalIframe.src = rawDemoUrl;

    // Reset default view to desktop
    modalBody.className = 'modal-body view-desktop';
    deviceBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.device-btn[data-view="desktop"]').classList.add('active');

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close Preview Modal
   */
  function closePreviewModal() {
    modalOverlay.classList.remove('active');
    modalIframe.src = 'about:blank';
    document.body.style.overflow = '';
  }

  /**
   * Animated Counter for Statistics
   */
  function setupStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.target, 10);
          animateCountUp(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => observer.observe(stat));
  }

  function animateCountUp(element, target) {
    let start = 0;
    const duration = 1500;
    const stepTime = Math.abs(Math.floor(duration / target));
    
    const timer = setInterval(() => {
      start += 1;
      element.textContent = start + (target === 100 ? '%' : '+');
      if (start >= target) {
        element.textContent = target + (target === 100 ? '%' : '+');
        clearInterval(timer);
      }
    }, stepTime);
  }

  /**
   * Mobile One-Tap Quick Inquiry Bottom Sheet Setup
   */
  function setupBottomSheet() {
    const sheetOverlay = document.getElementById('sheet-overlay');
    const sheetCloseBtn = document.getElementById('sheet-close-btn');
    const sheetQuickForm = document.getElementById('sheet-quick-form');
    const searchClearBtn = document.getElementById('search-clear-btn');

    // Search Clear Button Logic
    if (searchInput && searchClearBtn) {
      searchInput.addEventListener('input', () => {
        searchClearBtn.style.display = searchInput.value ? 'block' : 'none';
      });
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchQuery = '';
        searchClearBtn.style.display = 'none';
        renderTemplates();
      });
    }

    // Trigger Bottom Sheet on Hire Me buttons on mobile screens
    document.querySelectorAll('.btn-contact-nav, .btn-primary[href="#contact"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          openBottomSheet();
        }
      });
    });

    if (sheetCloseBtn && sheetOverlay) {
      sheetCloseBtn.addEventListener('click', closeBottomSheet);
      sheetOverlay.addEventListener('click', (e) => {
        if (e.target === sheetOverlay) closeBottomSheet();
      });
    }

    if (sheetQuickForm) {
      sheetQuickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = sheetQuickForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
        
        setTimeout(() => {
          alert('Thank you! Your quick inquiry has been received. I will get back to you shortly.');
          sheetQuickForm.reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Instant Inquiry';
          closeBottomSheet();
        }, 1200);
      });
    }
  }

  function openBottomSheet() {
    const sheetOverlay = document.getElementById('sheet-overlay');
    if (sheetOverlay) {
      sheetOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeBottomSheet() {
    const sheetOverlay = document.getElementById('sheet-overlay');
    if (sheetOverlay) {
      sheetOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});
