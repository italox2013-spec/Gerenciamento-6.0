const API_URL = window.location.origin + '/api';
let token = localStorage.getItem('token');
let currentUser = null;

// Check if user is logged in
if (token) {
    verifyToken();
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            currentUser = await response.json();
            showDashboard();
        } else {
            localStorage.removeItem('token');
            token = null;
        }
    } catch (error) {
        console.error('Error verifying token:', error);
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('token', token);
            showDashboard();
        } else {
            showError('loginError', data.error);
        }
    } catch (error) {
        showError('loginError', 'Erro ao conectar com o servidor');
    }
}

function logout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('dashboard').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('currentUser').textContent = currentUser.username;
    document.getElementById('currentRole').textContent = getRoleLabel(currentUser.role);
    
    loadDashboardTabs();
}

function getRoleLabel(role) {
    const labels = {
        'pessoal': 'Pessoal',
        'empreendedor': 'Empreendedor',
        'administrador': 'Administrador'
    };
    return labels[role] || role;
}

function loadDashboardTabs() {
    const tabButtons = document.getElementById('tabButtons');
    const tabContents = document.getElementById('tabContents');
    tabButtons.innerHTML = '';
    tabContents.innerHTML = '';

    const tabs = getTabsForRole(currentUser.role);
    
    tabs.forEach((tab, index) => {
        // Create tab button
        const button = document.createElement('button');
        button.className = 'tab' + (index === 0 ? ' active' : '');
        button.textContent = tab.name;
        button.onclick = () => switchTab(tab.id, button);
        tabButtons.appendChild(button);

        // Create tab content
        const content = document.createElement('div');
        content.id = tab.id;
        content.className = 'tab-content' + (index === 0 ? ' active' : '');
        tabContents.appendChild(content);
    });

    // Load first tab
    if (tabs.length > 0) {
        loadTabContent(tabs[0].id);
    }
}

function getTabsForRole(role) {
    const allTabs = {
        'pessoal': [
            { id: 'dashboard-pessoal', name: 'Dashboard' },
            { id: 'financas', name: 'Finanças' },
            { id: 'metas', name: 'Metas' },
            { id: 'investimentos', name: 'Investimentos' },
            { id: 'relatorios-pessoal', name: 'Relatórios' }
        ],
        'empreendedor': [
            { id: 'dashboard-empreendedor', name: 'Dashboard' },
            { id: 'vendas', name: 'Vendas' },
            { id: 'estoque', name: 'Estoque' },
            { id: 'relatorios-empreendedor', name: 'Relatórios' }
        ],
        'administrador': [
            { id: 'usuarios', name: 'Usuários' },
            { id: 'backups', name: 'Backups' },
            { id: 'relatorios-completo', name: 'Relatórios Completo' }
        ]
    };
    return allTabs[role] || [];
}

function switchTab(tabId, button) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Update tab contents
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    loadTabContent(tabId);
}


async function loadTabContent(tabId) {
    const container = document.getElementById(tabId);
    
    switch(tabId) {
        case 'dashboard-pessoal':
            await loadPessoalDashboard(container);
            break;
        case 'financas':
            await loadFinancas(container);
            break;
        case 'metas':
            await loadMetas(container);
            break;
        case 'investimentos':
            await loadInvestimentos(container);
            break;
        case 'relatorios-pessoal':
            await loadRelatoriosPessoal(container);
            break;
        case 'dashboard-empreendedor':
            await loadEmpreendedorDashboard(container);
            break;
        case 'vendas':
            await loadVendas(container);
            break;
        case 'estoque':
            await loadEstoque(container);
            break;
        case 'relatorios-empreendedor':
            await loadRelatoriosEmpreendedor(container);
            break;
        case 'usuarios':
            await loadUsuarios(container);
            break;
        case 'backups':
            await loadBackups(container);
            break;
        case 'relatorios-completo':
            await loadRelatoriosCompleto(container);
            break;
    }
}

// Utility Functions
async function apiGet(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('API Error');
    return await response.json();
}

async function apiPost(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('API Error');
    return await response.json();
}

async function apiPut(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('API Error');
    return await response.json();
}

async function apiDelete(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('API Error');
    return await response.json();
}

function showModal(title, body) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.getElementById('alertContainer');
    container.innerHTML = '';
    container.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}
