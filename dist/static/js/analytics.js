(function () {
  function track(name, data) {
    window.va?.('event', { name, data });
  }

  // Track interactions once DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    // Featured and other noteworthy project link clicks
    document.querySelectorAll('.project-title a, .other-project-title a').forEach(function (link) {
      link.addEventListener('click', function () {
        var name = (this.textContent || '').trim().replace(/\s+/g, ' ');
        track('project_click', { project: name });
      });
    });

    // Contact "Say Hello" button
    var contactBtn = document.querySelector('.contact-button');
    if (contactBtn) {
      contactBtn.addEventListener('click', function () {
        track('contact_click');
      });
    }

    // Email link in right sidebar
    var emailLink = document.querySelector('.email-link');
    if (emailLink) {
      emailLink.addEventListener('click', function () {
        track('email_click');
      });
    }

    // GitHub "View Full Profile" button
    var githubProfileBtn = document.querySelector('.github-profile-btn');
    if (githubProfileBtn) {
      githubProfileBtn.addEventListener('click', function () {
        track('github_profile_click');
      });
    }

    // Hero CTA "Check out my work!"
    var heroCta = document.querySelector('.hero-cta-button');
    if (heroCta) {
      heroCta.addEventListener('click', function () {
        track('hero_cta_click');
      });
    }

    // Press / Featured In article links
    document.querySelectorAll('.press-title a').forEach(function (link) {
      link.addEventListener('click', function () {
        var publication = this.closest('.press-card')
          ?.querySelector('.press-publication')?.textContent?.trim() || 'Unknown';
        track('press_click', { publication: publication });
      });
    });

    // Cal.com "Book a Consultation" button
    var bookBtn = document.querySelector('[data-cal-link]');
    if (bookBtn) {
      bookBtn.addEventListener('click', function () {
        track('booking_click');
      });
    }
  });

  // Event delegation for links generated dynamically by main.js (resume + social icons)
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;

    // Resume button — desktop (.resume-btn) and mobile (.mobile-resume-btn > a)
    if (link.classList.contains('resume-btn') || link.closest('.mobile-resume-btn')) {
      track('resume_view');
      return;
    }

    // Social media links in left sidebar and mobile footer
    if (link.closest('.social-icons-list') || link.closest('.social-media-icons-footer')) {
      var platform = (link.getAttribute('aria-label') || '')
        .replace('Visit Maxwel Khadambi on ', '');
      track('social_click', { platform: platform });
    }
  });
})();
