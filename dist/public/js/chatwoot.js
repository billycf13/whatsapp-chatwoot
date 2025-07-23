// Chatwoot Module
const Chatwoot = {
    configs: [],
    editingConfigId: null,
    
    // Initialize Chatwoot module
    init() {
        this.setupEventListeners();
    },
    
    // Setup Chatwoot-specific event listeners
    setupEventListeners() {
        // Add config button
        document.getElementById('add-config-btn').addEventListener('click', () => {
            this.showConfigModal();
        });
        
        // Config form submission
        document.getElementById('config-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConfig();
        });
        
        // Test config button
        document.getElementById('test-config-btn').addEventListener('click', () => {
            this.testConfig();
        });
    },
    
    // Show config modal
    async showConfigModal(configId = null) {
        this.editingConfigId = configId;
        
        // Load available sessions for dropdown
        await this.loadSessionsForDropdown();
        
        if (configId) {
            // Edit mode
            document.getElementById('config-modal-title').textContent = 'Edit Chatwoot Configuration';
            await this.loadConfigForEdit(configId);
        } else {
            // Add mode
            document.getElementById('config-modal-title').textContent = 'Add Chatwoot Configuration';
            this.resetConfigForm();
        }
        
        App.showModal('config-modal');
    },
    
    // Load sessions for dropdown
    async loadSessionsForDropdown() {
        try {
            const response = await App.apiCall('/whatsapp/sessions');
            const sessions = response.sessions || [];
            
            const select = document.getElementById('session-select');
            select.innerHTML = '<option value="">Select Session</option>';
            
            sessions.forEach(session => {
                const option = document.createElement('option');
                option.value = session.sessionId;
                option.textContent = `${session.name || 'Unknown'} (${session.phoneNumber || 'N/A'})`;
                select.appendChild(option);
            });
        } catch (error) {
            App.showToast('Failed to load sessions', 'error');
        }
    },
    
    // Load config for editing
    async loadConfigForEdit(sessionId) {
        try {
            const response = await App.apiCall(`/chatwoot-config/session/${sessionId}`);
            const config = response;
            
            // Populate form
            document.getElementById('session-select').value = config.sessionId;
            document.getElementById('base-url').value = config.baseUrl;
            document.getElementById('agent-api-key').value = config.agentApiToken;  // Ubah dari 'agent-api-token' ke 'agent-api-key'
            document.getElementById('bot-api-key').value = config.botApiToken;      // Ubah dari 'bot-api-token' ke 'bot-api-key'
            document.getElementById('account-id').value = config.accountId;
            document.getElementById('inbox-identifier').value = config.inboxIdentifier;
            
            // Disable session select in edit mode
            document.getElementById('session-select').disabled = true;
        } catch (error) {
            App.showToast('Failed to load configuration', 'error');
        }
    },
    
    // Save configuration
    async saveConfig() {
        try {
            const formData = this.getFormData();
            console.log(formData)
            
            if (!this.validateForm(formData)) {
                return;
            }
            
            App.showLoading();
            
            let response;
            if (this.editingConfigId) {
                // Update existing config by sessionId
                response = await App.apiCall(`/chatwoot-config/session/${this.editingConfigId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new config
                response = await App.apiCall('/chatwoot-config', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }
            
            App.showToast(
                this.editingConfigId ? 'Configuration updated successfully' : 'Configuration created successfully',
                'success'
            );
            
            App.hideModal('config-modal');
            this.loadConfigs();
        } catch (error) {
            App.showToast(error.message, 'error');
        } finally {
            App.hideLoading();
        }
    },
    
    // Get form data
    getFormData() {
        return {
            sessionId: document.getElementById('session-select').value,
            baseUrl: document.getElementById('base-url').value.trim(),
            agentApiToken: document.getElementById('agent-api-key').value.trim(),
            botApiToken: document.getElementById('bot-api-key').value.trim(),
            accountId: document.getElementById('account-id').value.trim(),
            inboxIdentifier: document.getElementById('inbox-identifier').value.trim()
        };
    },
    
    // Validate form
    validateForm(data) {
        if (!data.sessionId) {
            App.showToast('Please select a WhatsApp session', 'warning');
            return false;
        }
        
        if (!data.baseUrl) {
            App.showToast('Please enter Chatwoot base URL', 'warning');
            return false;
        }
        
        if (!data.baseUrl.match(/^https?:\/\/.+/)) {
            App.showToast('Please enter a valid URL', 'warning');
            return false;
        }
        
        if (!data.agentApiToken) {
            App.showToast('Please enter agent API token', 'warning');
            return false;
        }
        
        if (!data.botApiToken) {
            App.showToast('Please enter bot API token', 'warning');
            return false;
        }
        
        if (!data.accountId) {
            App.showToast('Please enter account ID', 'warning');
            return false;
        }
        
        if (!data.inboxIdentifier) {
            App.showToast('Please enter inbox identifier', 'warning');
            return false;
        }
        
        return true;
    },
    
    // Test configuration
    async testConfig() {
        try {
            const formData = this.getFormData();
            
            if (!formData.sessionId) {
                App.showToast('Please select a session first', 'warning');
                return;
            }
            
            App.showLoading();
            
            // Note: Test endpoint needs to be implemented in controller
            const response = await App.apiCall(`/chatwoot-config/test/${formData.sessionId}`, {
                method: 'POST'
            });
            
            if (response.status === 'success') {
                App.showToast('Connection test successful!', 'success');
            } else {
                App.showToast(`Connection test failed: ${response.error}`, 'error');
            }
        } catch (error) {
            App.showToast(`Connection test failed: ${error.message}`, 'error');
        } finally {
            App.hideLoading();
        }
    },
    
    // Load configurations
    async loadConfigs() {
        try {
            const response = await App.apiCall('/chatwoot-config');
            this.configs = response || [];
            this.renderConfigs();
        } catch (error) {
            App.showToast('Failed to load configurations', 'error');
            console.error('Load configs error:', error);
        }
    },
    
    // Render configurations
    renderConfigs() {
        const container = document.getElementById('configs-container');
        
        if (this.configs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments" style="font-size: 48px; color: #3b82f6; margin-bottom: 16px;"></i>
                    <h3>No Chatwoot Configurations</h3>
                    <p>Click "Add Configuration" to set up Chatwoot integration</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.configs.map(config => `
            <div class="config-card">
                <div class="card-header">
                    <div class="card-title">Session: ${config.sessionId}</div>
                    <div class="card-status status-connected">Active</div>
                </div>
                <div class="card-info">
                    <div class="info-item">
                        <span class="info-label">Base URL:</span>
                        <span class="info-value">${config.baseUrl}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Account ID:</span>
                        <span class="info-value">${config.accountId}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Inbox:</span>
                        <span class="info-value">${config.inboxIdentifier}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Created:</span>
                        <span class="info-value">${new Date(config.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary" onclick="Chatwoot.testConfigById('${config.sessionId}')">
                        <i class="fas fa-vial"></i>
                        Test
                    </button>
                    <button class="btn btn-primary" onclick="Chatwoot.showConfigModal('${config.sessionId}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-danger" onclick="Chatwoot.deleteConfig('${config._id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    // Test config by ID
    async testConfigById(sessionId) {
        try {
            App.showLoading();
            
            const response = await App.apiCall(`/chatwoot-config/test/${sessionId}`, {
                method: 'POST'
            });
            
            if (response.status === 'success') {
                App.showToast('Connection test successful!', 'success');
            } else {
                App.showToast(`Connection test failed: ${response.error}`, 'error');
            }
        } catch (error) {
            App.showToast(`Connection test failed: ${error.message}`, 'error');
        } finally {
            App.hideLoading();
        }
    },
    
    // Delete configuration
    async deleteConfig(configId) {
        if (!confirm('Are you sure you want to delete this configuration?')) {
            return;
        }
        
        try {
            App.showLoading();
            
            await App.apiCall(`/chatwoot-config/${configId}`, {
                method: 'DELETE'
            });
            
            App.showToast('Configuration deleted successfully', 'success');
            this.loadConfigs();
        } catch (error) {
            App.showToast(error.message, 'error');
        } finally {
            App.hideLoading();
        }
    },
    
    // Reset config form
    resetConfigForm() {
        document.getElementById('config-form').reset();
        document.getElementById('session-select').disabled = false;
        this.editingConfigId = null;
    },
    
    // Reset config modal
    resetConfigModal() {
        this.resetConfigForm();
    }
};

// Initialize Chatwoot module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Chatwoot.init();
});