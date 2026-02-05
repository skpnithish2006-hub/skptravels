/**
 * SKP Travels - Main JavaScript
 * Theme, navigation, toast, and utilities
 */

// Theme Management
const ThemeManager = {
    init() {
        const saved = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        this.updateIcon(saved);
    },
    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        this.updateIcon(next);
    },
    updateIcon(theme) {
        const btn = document.querySelector('.theme-toggle');
        if (btn) {
            btn.innerHTML = theme === 'dark'
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
        }
    }
};

// Mobile Navigation
const MobileNav = {
    init() {
        const toggle = document.querySelector('.navbar-toggle');
        const menu = document.querySelector('.navbar-menu');
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('active');
            });
            document.addEventListener('click', (e) => {
                if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                    menu.classList.remove('active');
                }
            });
        }
    }
};

// Toast Notifications
const Toast = {
    container: null,
    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },
    show(message, type = 'success', duration = 4000) {
        const icons = { success: '✓', error: '✕', warning: '⚠' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
        this.container.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); }
};

// Form Validation
const FormValidator = {
    validateEmail: (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
    validatePhone: (p) => /^[\d\s\-\+\(\)]{10,}$/.test(p),
    showError(input, msg) {
        const group = input.closest('.form-group');
        let err = group.querySelector('.form-error');
        if (!err) { err = document.createElement('span'); err.className = 'form-error'; group.appendChild(err); }
        err.textContent = msg;
        input.style.borderColor = 'var(--error)';
    },
    clearError(input) {
        const err = input.closest('.form-group')?.querySelector('.form-error');
        if (err) err.remove();
        input.style.borderColor = '';
    },
    validateForm(form) {
        let valid = true;
        form.querySelectorAll('[required]').forEach(input => {
            this.clearError(input);
            if (!input.value.trim()) { this.showError(input, 'Required'); valid = false; }
            else if (input.type === 'email' && !this.validateEmail(input.value)) { this.showError(input, 'Invalid email'); valid = false; }
            else if (input.type === 'tel' && !this.validatePhone(input.value)) { this.showError(input, 'Invalid phone'); valid = false; }
        });
        return valid;
    }
};

// Loading States
const Loading = {
    show() { document.querySelector('.loading-overlay')?.classList.remove('hidden'); },
    hide() { document.querySelector('.loading-overlay')?.classList.add('hidden'); }
};

// WhatsApp Integration - Click-to-Chat (Manual Send)
// NOTE: This is NOT automated messaging - it opens WhatsApp with pre-filled text
// User or owner must manually click send button
const WhatsApp = {
    ownerName: 'S.K.Panneerselvam',
    ownerNumber: '+919843775939',

    /**
     * Open WhatsApp click-to-chat with pre-filled message
     * User must manually send the message
     * 
     * @param {string} msg - Message to pre-fill
     * 
     * FUTURE ENHANCEMENT: WhatsApp Cloud API Integration
     * Replace click-to-chat with API calls:
     * 
     * async sendAPI(to, templateName, params) {
     *   const response = await fetch('https://graph.facebook.com/v17.0/PHONE_NUMBER_ID/messages', {
     *     method: 'POST',
     *     headers: {
     *       'Authorization': 'Bearer ACCESS_TOKEN',
     *       'Content-Type': 'application/json'
     *     },
     *     body: JSON.stringify({
     *       messaging_product: 'whatsapp',
     *       to: to,
     *       type: 'template',
     *       template: { name: templateName, language: { code: 'en' }, components: params }
     *     })
     *   });
     *   return response.json();
     * }
     */
    sendMessage(msg) {
        // Click-to-chat: Opens WhatsApp with pre-filled message (manual send required)
        window.open(`https://wa.me/${this.ownerNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    },

    /**
     * Generate click-to-chat URL for a specific number
     * @param {string} phone - Phone number with country code
     * @param {string} msg - Message to pre-fill
     * @returns {string} WhatsApp URL
     */
    getClickToChatUrl(phone, msg) {
        return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    }
};

// Utilities
const Utils = {
    formatDate: (d) => new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(d),
    formatShortDate: (d) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d),
    generateId: () => 'id_' + Math.random().toString(36).substr(2, 9)
};

// Van Gallery Slider
const VanGallery = {
    currentIndex: 0,
    slides: [],
    dots: [],
    thumbnails: [],
    autoPlayInterval: null,
    autoPlayDelay: 5000,

    init() {
        const slider = document.getElementById('gallerySlider');
        if (!slider) return;

        this.slides = document.querySelectorAll('.gallery-slide');
        this.dots = document.querySelectorAll('.gallery-dot');
        this.thumbnails = document.querySelectorAll('.thumbnail');

        // Navigation buttons
        document.getElementById('galleryPrev')?.addEventListener('click', () => this.prev());
        document.getElementById('galleryNext')?.addEventListener('click', () => this.next());

        // Dots navigation
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goTo(index));
        });

        // Thumbnails navigation
        this.thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => this.goTo(index));
        });

        // Touch/Swipe support
        let startX = 0;
        let endX = 0;

        slider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            this.pauseAutoPlay();
        }, { passive: true });

        slider.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? this.next() : this.prev();
            }
            this.startAutoPlay();
        }, { passive: true });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });

        // Auto-play
        this.startAutoPlay();

        // Pause on hover
        const galleryMain = document.querySelector('.gallery-main');
        galleryMain?.addEventListener('mouseenter', () => this.pauseAutoPlay());
        galleryMain?.addEventListener('mouseleave', () => this.startAutoPlay());
    },

    goTo(index) {
        if (index < 0) index = this.slides.length - 1;
        if (index >= this.slides.length) index = 0;

        // Update slides
        this.slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });

        // Update dots
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        // Update thumbnails
        this.thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        this.currentIndex = index;
    },

    next() {
        this.goTo(this.currentIndex + 1);
    },

    prev() {
        this.goTo(this.currentIndex - 1);
    },

    startAutoPlay() {
        this.pauseAutoPlay();
        this.autoPlayInterval = setInterval(() => this.next(), this.autoPlayDelay);
    },

    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    MobileNav.init();
    Toast.init();
    VanGallery.init();
    setTimeout(() => Loading.hide(), 500);
    document.querySelector('.theme-toggle')?.addEventListener('click', () => ThemeManager.toggle());
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-link').forEach(link => {
        if (link.getAttribute('href') === page) link.classList.add('active');
    });
});

window.SKP = { Toast, FormValidator, Loading, WhatsApp, Utils, VanGallery };
