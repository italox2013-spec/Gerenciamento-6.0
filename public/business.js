// Entrepreneur Dashboard
async function loadEmpreendedorDashboard(container) {
    const data = await apiGet('/empreendedor/dashboard');
    container.innerHTML = `
        <h2>Dashboard Empreendedor</h2>
        <div class="dashboard-grid">
            <div class="card">
                <h3>Vendas Total</h3>
                <div class="value">R$ ${data.totalSales.toFixed(2)}</div>
            </div>
            <div class="card">
                <h3>Número de Vendas</h3>
                <div class="value">${data.salesCount}</div>
            </div>
            <div class="card">
                <h3>Valor do Estoque</h3>
                <div class="value">R$ ${data.inventoryValue.toFixed(2)}</div>
            </div>
            <div class="card">
                <h3>Itens Baixo Estoque</h3>
                <div class="value">${data.lowStockItems}</div>
            </div>
        </div>
    `;
}

// Sales Management
async function loadVendas(container) {
    const sales = await apiGet('/empreendedor/sales');
    container.innerHTML = `
        <h2>Gestão de Vendas</h2>
        <button class="btn" onclick="showAddSaleModal()">➕ Registrar Venda</button>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Preço Unit.</th>
                    <th>Total</th>
                    <th>Cliente</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${sales.map(s => `
                    <tr>
                        <td>${formatDate(s.sale_date)}</td>
                        <td>${s.product_name}</td>
                        <td>${s.quantity}</td>
                        <td>R$ ${s.unit_price.toFixed(2)}</td>
                        <td>R$ ${s.total_amount.toFixed(2)}</td>
                        <td>${s.customer_name || '-'}</td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteSale(${s.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showAddSaleModal() {
    showModal('Registrar Venda', `
        <div class="form-group">
            <label>Produto</label>
            <input type="text" id="saleProduct" placeholder="Nome do produto">
        </div>
        <div class="form-group">
            <label>Quantidade</label>
            <input type="number" id="saleQuantity" value="1">
        </div>
        <div class="form-group">
            <label>Preço Unitário</label>
            <input type="number" id="salePrice" step="0.01" placeholder="0.00">
        </div>
        <div class="form-group">
            <label>Cliente (Opcional)</label>
            <input type="text" id="saleCustomer" placeholder="Nome do cliente">
        </div>
        <div class="form-group">
            <label>Data</label>
            <input type="date" id="saleDate" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <button class="btn" onclick="addSale()">Salvar</button>
    `);
}

async function addSale() {
    const data = {
        product_name: document.getElementById('saleProduct').value,
        quantity: parseInt(document.getElementById('saleQuantity').value),
        unit_price: parseFloat(document.getElementById('salePrice').value),
        customer_name: document.getElementById('saleCustomer').value,
        sale_date: document.getElementById('saleDate').value
    };

    await apiPost('/empreendedor/sales', data);
    closeModal();
    showAlert('Venda registrada com sucesso!', 'success');
    loadTabContent('vendas');
}

async function deleteSale(id) {
    if (confirm('Deseja realmente excluir esta venda?')) {
        await apiDelete(`/empreendedor/sales/${id}`);
        showAlert('Venda excluída com sucesso!', 'success');
        loadTabContent('vendas');
    }
}

// Inventory Management
async function loadEstoque(container) {
    const inventory = await apiGet('/empreendedor/inventory');
    container.innerHTML = `
        <h2>Gestão de Estoque</h2>
        <button class="btn" onclick="showAddInventoryModal()">➕ Adicionar Produto</button>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Quantidade</th>
                    <th>Custo Unit.</th>
                    <th>Preço Unit.</th>
                    <th>Valor Total</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${inventory.map(item => {
                    const totalValue = item.quantity * item.unit_cost;
                    const lowStock = item.quantity < 10;
                    return `
                        <tr style="${lowStock ? 'background-color: #fff3cd;' : ''}">
                            <td>${item.product_name} ${lowStock ? '⚠️' : ''}</td>
                            <td>${item.category || '-'}</td>
                            <td>${item.quantity}</td>
                            <td>R$ ${item.unit_cost.toFixed(2)}</td>
                            <td>R$ ${item.unit_price.toFixed(2)}</td>
                            <td>R$ ${totalValue.toFixed(2)}</td>
                            <td>
                                <button class="btn btn-success" onclick="updateInventoryModal(${item.id}, ${item.quantity}, ${item.unit_cost}, ${item.unit_price})">✏️</button>
                                <button class="btn btn-danger" onclick="deleteInventory(${item.id})">🗑️</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function showAddInventoryModal() {
    showModal('Adicionar Produto', `
        <div class="form-group">
            <label>Nome do Produto</label>
            <input type="text" id="invProductName" placeholder="Nome do produto">
        </div>
        <div class="form-group">
            <label>Categoria</label>
            <input type="text" id="invCategory" placeholder="Categoria">
        </div>
        <div class="form-group">
            <label>Quantidade</label>
            <input type="number" id="invQuantity" value="0">
        </div>
        <div class="form-group">
            <label>Custo Unitário</label>
            <input type="number" id="invUnitCost" step="0.01" placeholder="0.00">
        </div>
        <div class="form-group">
            <label>Preço de Venda</label>
            <input type="number" id="invUnitPrice" step="0.01" placeholder="0.00">
        </div>
        <button class="btn" onclick="addInventory()">Salvar</button>
    `);
}

async function addInventory() {
    const data = {
        product_name: document.getElementById('invProductName').value,
        category: document.getElementById('invCategory').value,
        quantity: parseInt(document.getElementById('invQuantity').value),
        unit_cost: parseFloat(document.getElementById('invUnitCost').value),
        unit_price: parseFloat(document.getElementById('invUnitPrice').value)
    };

    await apiPost('/empreendedor/inventory', data);
    closeModal();
    showAlert('Produto adicionado com sucesso!', 'success');
    loadTabContent('estoque');
}

function updateInventoryModal(id, quantity, unitCost, unitPrice) {
    showModal('Atualizar Produto', `
        <div class="form-group">
            <label>Quantidade</label>
            <input type="number" id="updateInvQuantity" value="${quantity}">
        </div>
        <div class="form-group">
            <label>Custo Unitário</label>
            <input type="number" id="updateInvUnitCost" step="0.01" value="${unitCost}">
        </div>
        <div class="form-group">
            <label>Preço de Venda</label>
            <input type="number" id="updateInvUnitPrice" step="0.01" value="${unitPrice}">
        </div>
        <button class="btn" onclick="updateInventory(${id})">Atualizar</button>
    `);
}

async function updateInventory(id) {
    const data = {
        quantity: parseInt(document.getElementById('updateInvQuantity').value),
        unit_cost: parseFloat(document.getElementById('updateInvUnitCost').value),
        unit_price: parseFloat(document.getElementById('updateInvUnitPrice').value)
    };

    await apiPut(`/empreendedor/inventory/${id}`, data);
    closeModal();
    showAlert('Produto atualizado com sucesso!', 'success');
    loadTabContent('estoque');
}

async function deleteInventory(id) {
    if (confirm('Deseja realmente excluir este produto?')) {
        await apiDelete(`/empreendedor/inventory/${id}`);
        showAlert('Produto excluído com sucesso!', 'success');
        loadTabContent('estoque');
    }
}

// Entrepreneur Reports
async function loadRelatoriosEmpreendedor(container) {
    const report = await apiGet('/relatorios/empreendedor');
    container.innerHTML = `
        <h2>Relatórios Empreendedor</h2>
        <div class="report-section">
            <h3>💵 Estatísticas de Vendas</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Receita Média</div>
                    <div class="stat-value">R$ ${report.sales.revenue.average}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Desvio Padrão</div>
                    <div class="stat-value">R$ ${report.sales.revenue.stdDev}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total de Vendas</div>
                    <div class="stat-value">R$ ${report.sales.revenue.total}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Qtd. Vendas</div>
                    <div class="stat-value">${report.sales.revenue.count}</div>
                </div>
            </div>
        </div>
        <div class="report-section">
            <h3>📦 Estatísticas de Estoque</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Valor Médio</div>
                    <div class="stat-value">R$ ${report.inventory.values.average}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Desvio Padrão</div>
                    <div class="stat-value">R$ ${report.inventory.values.stdDev}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total em Estoque</div>
                    <div class="stat-value">${report.inventory.totalItems}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Valor Total</div>
                    <div class="stat-value">R$ ${report.inventory.totalValue.toFixed(2)}</div>
                </div>
            </div>
        </div>
        <p style="margin-top: 20px; color: #666;">
            <strong>Gerado em:</strong> ${new Date(report.generatedAt).toLocaleString('pt-BR')}
        </p>
    `;
}

// Admin - User Management
async function loadUsuarios(container) {
    const users = await apiGet('/admin/users');
    container.innerHTML = `
        <h2>Gestão de Usuários</h2>
        <button class="btn" onclick="showAddUserModal()">➕ Criar Usuário</button>
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Perfil</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td>${u.username}</td>
                        <td>${getRoleLabel(u.role)}</td>
                        <td>${new Date(u.created_at).toLocaleString('pt-BR')}</td>
                        <td>
                            <button class="btn btn-success" onclick="showResetPasswordModal(${u.id}, '${u.username}')">🔑 Redefinir Senha</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showAddUserModal() {
    showModal('Criar Novo Usuário', `
        <div class="form-group">
            <label>Usuário</label>
            <input type="text" id="newUsername" placeholder="Nome de usuário">
        </div>
        <div class="form-group">
            <label>Senha</label>
            <input type="password" id="newPassword" placeholder="Senha">
        </div>
        <div class="form-group">
            <label>Perfil</label>
            <select id="newUserRole">
                <option value="pessoal">Pessoal</option>
                <option value="empreendedor">Empreendedor</option>
                <option value="administrador">Administrador</option>
            </select>
        </div>
        <button class="btn" onclick="createUser()">Criar</button>
    `);
}

async function createUser() {
    const data = {
        username: document.getElementById('newUsername').value,
        password: document.getElementById('newPassword').value,
        role: document.getElementById('newUserRole').value
    };

    await apiPost('/admin/users', data);
    closeModal();
    showAlert('Usuário criado com sucesso!', 'success');
    loadTabContent('usuarios');
}

function showResetPasswordModal(userId, username) {
    showModal(`Redefinir Senha - ${username}`, `
        <div class="form-group">
            <label>Nova Senha</label>
            <input type="password" id="resetPassword" placeholder="Digite a nova senha">
        </div>
        <button class="btn" onclick="resetPassword(${userId})">Redefinir</button>
    `);
}

async function resetPassword(userId) {
    const newPassword = document.getElementById('resetPassword').value;
    await apiPut(`/admin/users/${userId}/password`, { newPassword });
    closeModal();
    showAlert('Senha redefinida com sucesso!', 'success');
}

// Admin - Backup Management
async function loadBackups(container) {
    const backups = await apiGet('/admin/backups');
    container.innerHTML = `
        <h2>Gestão de Backups</h2>
        <button class="btn" onclick="createBackup()">💾 Criar Backup</button>
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome do Arquivo</th>
                    <th>Criado em</th>
                </tr>
            </thead>
            <tbody>
                ${backups.map(b => `
                    <tr>
                        <td>${b.id}</td>
                        <td>${b.filename}</td>
                        <td>${new Date(b.created_at).toLocaleString('pt-BR')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function createBackup() {
    await apiPost('/admin/backups', {});
    showAlert('Backup criado com sucesso!', 'success');
    loadTabContent('backups');
}

// Admin - Complete Reports
async function loadRelatoriosCompleto(container) {
    const report = await apiGet('/relatorios/completo');
    container.innerHTML = `
        <h2>Relatório Completo do Sistema</h2>
        <div class="report-section">
            <h3>💰 Finanças Pessoais - Receitas</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Média</div>
                    <div class="stat-value">R$ ${report.personal.income.average}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Desvio Padrão</div>
                    <div class="stat-value">R$ ${report.personal.income.stdDev}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total</div>
                    <div class="stat-value">R$ ${report.personal.income.total}</div>
                </div>
            </div>
        </div>
        <div class="report-section">
            <h3>💸 Finanças Pessoais - Despesas</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Média</div>
                    <div class="stat-value">R$ ${report.personal.expenses.average}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Desvio Padrão</div>
                    <div class="stat-value">R$ ${report.personal.expenses.stdDev}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total</div>
                    <div class="stat-value">R$ ${report.personal.expenses.total}</div>
                </div>
            </div>
        </div>
        <div class="report-section">
            <h3>🏢 Negócios - Vendas</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Média</div>
                    <div class="stat-value">R$ ${report.business.sales.average}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Desvio Padrão</div>
                    <div class="stat-value">R$ ${report.business.sales.stdDev}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total</div>
                    <div class="stat-value">R$ ${report.business.sales.total}</div>
                </div>
            </div>
        </div>
        <div class="report-section">
            <h3>📈 Investimentos Totais</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Total Investido</div>
                    <div class="stat-value">R$ ${report.investments.total.toFixed(2)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Valor Atual</div>
                    <div class="stat-value">R$ ${report.investments.currentValue.toFixed(2)}</div>
                </div>
            </div>
        </div>
        <p style="margin-top: 20px; color: #666;">
            <strong>Gerado em:</strong> ${new Date(report.generatedAt).toLocaleString('pt-BR')}
        </p>
    `;
}
