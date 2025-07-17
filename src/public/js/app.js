// Global App State
const App = {
    currentPage: 'whatsapp',
    sessions: [],
    configs: [],
    
    // Initialize the application
    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.showPage('whatsapp');
    },
    
    // Setup global event listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });
        
        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshCurrentPage();
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });
        
        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    },
    
    // Show specific page
    showPage(pageName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
        
        // Update page content
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        document.getElementById(`${pageName}-page`).classList.remove('hidden');
        
        this.currentPage = pageName;
        
        // Load page-specific data
        if (pageName === 'whatsapp') {
            WhatsApp.loadSessions();
        } else if (pageName === 'chatwoot') {
            Chatwoot.loadConfigs();
        }
    },
    
    // Refresh current page data
    refreshCurrentPage() {
        this.showLoading();
        if (this.currentPage === 'whatsapp') {
            WhatsApp.loadSessions();
        } else if (this.currentPage === 'chatwoot') {
            Chatwoot.loadConfigs();
        }
        setTimeout(() => this.hideLoading(), 500);
    },
    
    // Load initial application data
    async loadInitialData() {
        this.showLoading();
        try {
            await Promise.all([
                WhatsApp.loadSessions(),
                Chatwoot.loadConfigs()
            ]);
        } catch (error) {
            this.showToast('Error loading initial data', 'error');
        } finally {
            this.hideLoading();
        }
    },
    
    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    },
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Reset modal content
        if (modalId === 'login-modal') {
            WhatsApp.resetLoginModal();
        } else if (modalId === 'config-modal') {
            Chatwoot.resetConfigModal();
        }
    },
    
    // Loading overlay
    showLoading() {
        document.getElementById('loading-overlay').classList.add('show');
    },
    
    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('show');
    },
    
    // Toast notifications
    showToast(message, type = 'info', title = '') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const toastId = 'toast-' + Date.now();
        toast.id = toastId;
        
        toast.innerHTML = `
            <div class="toast-header">
                <div class="toast-title">${title || this.getToastTitle(type)}</div>
                <button class="toast-close" onclick="App.hideToast('${toastId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto hide after 5 seconds
        setTimeout(() => this.hideToast(toastId), 5000);
    },
    
    hideToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    },
    
    getToastTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Notification';
    },
    
    // API helper methods
    async apiCall(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            console.log(url, options)
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.message || 'API call failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});