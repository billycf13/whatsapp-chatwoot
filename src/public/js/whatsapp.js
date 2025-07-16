// WhatsApp Module
const WhatsApp = {
    sessions: [],
    currentLoginType: 'qr',
    
    // Initialize WhatsApp module
    init() {
        this.setupEventListeners();
    },
    
    // Setup WhatsApp-specific event listeners
    setupEventListeners() {
        // Add session button
        document.getElementById('add-session-btn').addEventListener('click', () => {
            App.showModal('login-modal');
        });
        
        // Login tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchLoginTab(tab);
            });
        });
        
        // QR Code generation
        document.getElementById('generate-qr-btn').addEventListener('click', () => {
            this.generateQRCode();
        });
        
        // Pairing code form
        document.getElementById('pairing-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generatePairingCode();
        });
    },
    
    // Switch between QR and Pairing tabs
    switchLoginTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tab}-tab`).classList.remove('hidden');
        
        this.currentLoginType = tab;
    },
    
    // Generate QR Code for login
    async generateQRCode() {
        try {
            App.showLoading();
            
            const response = await App.apiCall('/whatsapp/login/qr', {
                method: 'POST'
            });
            
            if (response.qr) {
                this.displayQRCode(response.qr);
                App.showToast('QR Code generated. Scan with WhatsApp.', 'success');
            }
        } catch (error) {
            App.showToast(error.message, 'error');
        } finally {
            App.hideLoading();
        }
    },
    
    // Display QR Code
    displayQRCode(qrData) {
        const canvas = document.getElementById('qr-canvas');
        const display = document.getElementById('qr-display');
        
        new QRious({
            element: canvas,
            value: qrData,
            size: 250,
            background: 'white',
            foreground: 'black'
        });
        
        display.classList.add('show');
    },
    
    // Generate Pairing Code
    async generatePairingCode() {
        try {
            const phoneNumber = document.getElementById('phone-number').value.trim();
            
            if (!phoneNumber) {
                App.showToast('Please enter phone number', 'warning');
                return;
            }
            
            App.showLoading();
            
            const response = await App.apiCall('/whatsapp/login/pairing', {
                method: 'POST',
                body: JSON.stringify({ phoneNumber })
            });
            
            if (response.pairingCode) {
                this.displayPairingCode(response.pairingCode);
                App.showToast('Pairing code generated. Enter in WhatsApp.', 'success');
            }
        } catch (error) {
            App.showToast(error.message, 'error');
        } finally {
            App.hideLoading();
        }
    },
    
    // Display Pairing Code
    displayPairingCode(code) {
        const codeElement = document.getElementById('pairing-code');
        const display = document.getElementById('pairing-code-display');
        
        codeElement.textContent = code;
        display.classList.add('show');
    },
    
    // Load sessions from API
    async loadSessions() {
        try {
            const response = await App.apiCall('/whatsapp/sessions');
            this.sessions = response.sessions || [];
            this.renderSessions();
        } catch (error) {
            App.showToast('Failed to load sessions', 'error');
            console.error('Load sessions error:', error);
        }
    },
    
    // Render sessions in the UI
    renderSessions() {
        const container = document.getElementById('sessions-container');
        
        if (this.sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fab fa-whatsapp" style="font-size: 48px; color: #25d366; margin-bottom: 16px;"></i>
                    <h3>No WhatsApp Sessions</h3>
                    <p>Click "Add Session" to connect your WhatsApp account</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.sessions.map(session => `
            <div class="session-card">
                <div class="card-header">
                    <div class="card-title">${session.name || 'Unknown'}</div>
                    <div class="card-status status-connected">Connected</div>
                </div>
                <div class="card-info">
                    <div class="info-item">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${session.phoneNumber || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Session ID:</span>
                        <span class="info-value">${session.sessionId}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Webhook URL:</span>
                        <span class="info-value">${window.location.origin}/webhook/${session.sessionId}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary" onclick="WhatsApp.updateInboxIdentifier('${session.sessionId}')">
                        <i class="fas fa-edit"></i>
                        Update Inbox
                    </button>
                    <button class="btn btn-danger" onclick="WhatsApp.logoutSession('${session.sessionId}')">
                        <i class="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    // Update inbox identifier for session
    async updateInboxIdentifier(sessionId) {
        const inboxIdentifier = prompt('Enter Inbox Identifier:');
        if (!inboxIdentifier) return;
        
        try {
            App.showLoading();
            
            await App.apiCall(`/whatsapp/session/${sessionId}`, {
                method: 'PATCH',
                body: JSON.stringify({ inbox_identifier: inboxIdentifier })
            });
            
            App.showToast('Inbox identifier updated successfully', 'success');
            this.loadSessions();
        } catch (error) {
            App.showToast(error.message, 'error');
        } finally {
            App.hideLoading();
        }
    },
    
    // Logout session
    async logoutSession(sessionId) {
        if (!confirm('Are you sure you want to logout this session?')) {
            return;
        }
        
        try {
            App.showLoading();
            
            await App.apiCall('/whatsapp/logout', {
                method: 'POST',
                body: JSON.stringify({ sessionId })
            });
            
            App.showToast('Session logged out successfully', 'success');
            this.loadSessions();
        } catch (error) {
            App.showToast(error.message, 'error');
        } finally {
            App.hideLoading();
        }
    },
    
    // Reset login modal
    resetLoginModal() {
        // Reset QR display
        document.getElementById('qr-display').classList.remove('show');
        
        // Reset pairing code display
        document.getElementById('pairing-code-display').classList.remove('show');
        document.getElementById('phone-number').value = '';
        
        // Reset to QR tab
        this.switchLoginTab('qr');
    }
};

// Initialize WhatsApp module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    WhatsApp.init();
});