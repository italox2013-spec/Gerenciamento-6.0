// Personal Dashboard
async function loadPessoalDashboard(container) {
    const data = await apiGet('/pessoal/dashboard');
    container.innerHTML = `
        <h2>Dashboard Pessoal</h2>
        <div class="dashboard-grid">
            <div class="card">
                <h3>Receitas Total</h3>
                <div class="value">R$ ${data.totalIncome.toFixed(2)}</div>
            </div>
            <div class="card">
                <h3>Despesas Total</h3>
                <div class="value">R$ ${data.totalExpenses.toFixed(2)}</div>
            </div>
            <div class="card">
                <h3>Saldo</h3>
                <div class="value">R$ ${data.balance.toFixed(2)}</div>
            </div>
            <div class="card">
                <h3>Metas Ativas</h3>
                <div class="value">${data.activeGoals}</div>
            </div>
            <div class="card">
                <h3>Total Investido</h3>
                <div class="value">R$ ${data.totalInvestments.toFixed(2)}</div>
            </div>
        </div>
    `;
}

// Finances Management
async function loadFinancas(container) {
    const finances = await apiGet('/pessoal/finances');
    container.innerHTML = `
        <h2>Gestão de Finanças</h2>
        <button class="btn" onclick="showAddFinanceModal()">➕ Adicionar Transação</button>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Descrição</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${finances.map(f => `
                    <tr>
                        <td>${formatDate(f.date)}</td>
                        <td>${f.type === 'income' ? '💰 Receita' : '💸 Despesa'}</td>
                        <td>${f.category}</td>
                        <td style="color: ${f.type === 'income' ? 'green' : 'red'}">R$ ${f.amount.toFixed(2)}</td>
                        <td>${f.description || '-'}</td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteFinance(${f.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showAddFinanceModal() {
    showModal('Adicionar Transação', `
        <div class="form-group">
            <label>Tipo</label>
            <select id="financeType">
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
            </select>
        </div>
        <div class="form-group">
            <label>Categoria</label>
            <input type="text" id="financeCategory" placeholder="Ex: Salário, Alimentação">
        </div>
        <div class="form-group">
            <label>Valor</label>
            <input type="number" id="financeAmount" step="0.01" placeholder="0.00">
        </div>
        <div class="form-group">
            <label>Descrição</label>
            <input type="text" id="financeDescription" placeholder="Opcional">
        </div>
        <div class="form-group">
            <label>Data</label>
            <input type="date" id="financeDate" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <button class="btn" onclick="addFinance()">Salvar</button>
    `);
}

async function addFinance() {
    const data = {
        type: document.getElementById('financeType').value,
        category: document.getElementById('financeCategory').value,
        amount: parseFloat(document.getElementById('financeAmount').value),
        description: document.getElementById('financeDescription').value,
        date: document.getElementById('financeDate').value
    };

    await apiPost('/pessoal/finances', data);
    closeModal();
    showAlert('Transação adicionada com sucesso!', 'success');
    loadTabContent('financas');
}

async function deleteFinance(id) {
    if (confirm('Deseja realmente excluir esta transação?')) {
        await apiDelete(`/pessoal/finances/${id}`);
        showAlert('Transação excluída com sucesso!', 'success');
        loadTabContent('financas');
    }
}

// Goals Management
async function loadMetas(container) {
    const goals = await apiGet('/pessoal/goals');
    container.innerHTML = `
        <h2>Gestão de Metas</h2>
        <button class="btn" onclick="showAddGoalModal()">➕ Adicionar Meta</button>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Título</th>
                    <th>Meta</th>
                    <th>Atual</th>
                    <th>Progresso</th>
                    <th>Prazo</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${goals.map(g => {
                    const progress = (g.current_amount / g.target_amount * 100).toFixed(1);
                    return `
                        <tr>
                            <td>${g.title}</td>
                            <td>R$ ${g.target_amount.toFixed(2)}</td>
                            <td>R$ ${g.current_amount.toFixed(2)}</td>
                            <td>${progress}%</td>
                            <td>${formatDate(g.deadline)}</td>
                            <td>${g.status}</td>
                            <td>
                                <button class="btn btn-success" onclick="updateGoalModal(${g.id}, ${g.current_amount}, '${g.status}')">✏️</button>
                                <button class="btn btn-danger" onclick="deleteGoal(${g.id})">🗑️</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function showAddGoalModal() {
    showModal('Adicionar Meta', `
        <div class="form-group">
            <label>Título</label>
            <input type="text" id="goalTitle" placeholder="Ex: Viagem, Carro">
        </div>
        <div class="form-group">
            <label>Valor Alvo</label>
            <input type="number" id="goalTarget" step="0.01" placeholder="0.00">
        </div>
        <div class="form-group">
            <label>Valor Atual</label>
            <input type="number" id="goalCurrent" step="0.01" value="0" placeholder="0.00">
        </div>
        <div class="form-group">
            <label>Prazo</label>
            <input type="date" id="goalDeadline">
        </div>
        <button class="btn" onclick="addGoal()">Salvar</button>
    `);
}

async function addGoal() {
    const data = {
        title: document.getElementById('goalTitle').value,
        target_amount: parseFloat(document.getElementById('goalTarget').value),
        current_amount: parseFloat(document.getElementById('goalCurrent').value),
        deadline: document.getElementById('goalDeadline').value
    };

    await apiPost('/pessoal/goals', data);
    closeModal();
    showAlert('Meta adicionada com sucesso!', 'success');
    loadTabContent('metas');
}

function updateGoalModal(id, currentAmount, status) {
    showModal('Atualizar Meta', `
        <div class="form-group">
            <label>Valor Atual</label>
            <input type="number" id="updateGoalCurrent" step="0.01" value="${currentAmount}">
        </div>
        <div class="form-group">
            <label>Status</label>
            <select id="updateGoalStatus">
                <option value="active" ${status === 'active' ? 'selected' : ''}>Ativa</option>
                <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completa</option>
                <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
            </select>
        </div>
        <button class="btn" onclick="updateGoal(${id})">Atualizar</button>
    `);
}

async function updateGoal(id) {
    const data = {
        current_amount: parseFloat(document.getElementById('updateGoalCurrent').value),
        status: document.getElementById('updateGoalStatus').value
    };

    await apiPut(`/pessoal/goals/${id}`, data);
    closeModal();
    showAlert('Meta atualizada com sucesso!', 'success');
    loadTabContent('metas');
}

async function deleteGoal(id) {
    if (confirm('Deseja realmente excluir esta meta?')) {
        await apiDelete(`/pessoal/goals/${id}`);
        showAlert('Meta excluída com sucesso!', 'success');
        loadTabContent('metas');
    }
}

// Investments Management
async function loadInvestimentos(container) {
    const investments = await apiGet('/pessoal/investments');
    container.innerHTML = `
        <h2>Gestão de Investimentos</h2>
        <button class="btn" onclick="showAddInvestmentModal()">➕ Adicionar Investimento</button>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Investido</th>
                    <th>Valor Atual</th>
                    <th>Retorno</th>
                    <th>Data Compra</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${investments.map(inv => {
                    const returnValue = inv.current_value - inv.amount;
                    const returnPercent = (returnValue / inv.amount * 100).toFixed(2);
                    return `
                        <tr>
                            <td>${inv.name}</td>
                            <td>${inv.type}</td>
                            <td>R$ ${inv.amount.toFixed(2)}</td>
                            <td>R$ ${inv.current_value.toFixed(2)}</td>
                            <td style="color: ${returnValue >= 0 ? 'green' : 'red'}">
                                ${returnValue >= 0 ? '+' : ''}R$ ${returnValue.toFixed(2)} (${returnPercent}%)
                            </td>
                            <td>${formatDate(inv.purchase_date)}</td>
                            <td>
                                <button class="btn btn-success" onclick="updateInvestmentModal(${inv.id}, ${inv.current_value})">✏️</button>
                                <button class="btn btn-danger" onclick="deleteInvestment(${inv.id})">🗑️</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function showAddInvestmentModal() {
    showModal('Adicionar Investimento', `
        <div class="form-group">
            <label>Nome</label>
            <input type="text" id="invName" placeholder="Ex: Ações PETR4">
        </div>
        <div class="form-group">
            <label>Tipo</label>
            <input type="text" id="invType" placeholder="Ex: Ações, CDB, Tesouro">
        </div>
        <div class="form-group">
            <label>Valor Investido</label>
            <input type="number" id="invAmount" step="0.01" placeholder="0.00">
        </div>
        <div class="form-group">
            <label>Valor Atual</label>
            <input type="number" id="invCurrentValue" step="0.01" placeholder="0.00">
        </div>
        <div class="form-group">
            <label>Data da Compra</label>
            <input type="date" id="invDate">
        </div>
        <button class="btn" onclick="addInvestment()">Salvar</button>
    `);
}

async function addInvestment() {
    const data = {
        name: document.getElementById('invName').value,
        type: document.getElementById('invType').value,
        amount: parseFloat(document.getElementById('invAmount').value),
        current_value: parseFloat(document.getElementById('invCurrentValue').value),
        purchase_date: document.getElementById('invDate').value
    };

    await apiPost('/pessoal/investments', data);
    closeModal();
    showAlert('Investimento adicionado com sucesso!', 'success');
    loadTabContent('investimentos');
}

function updateInvestmentModal(id, currentValue) {
    showModal('Atualizar Investimento', `
        <div class="form-group">
            <label>Valor Atual</label>
            <input type="number" id="updateInvValue" step="0.01" value="${currentValue}">
        </div>
        <button class="btn" onclick="updateInvestment(${id})">Atualizar</button>
    `);
}

async function updateInvestment(id) {
    const data = {
        current_value: parseFloat(document.getElementById('updateInvValue').value)
    };

    await apiPut(`/pessoal/investments/${id}`, data);
    closeModal();
    showAlert('Investimento atualizado com sucesso!', 'success');
    loadTabContent('investimentos');
}

async function deleteInvestment(id) {
    if (confirm('Deseja realmente excluir este investimento?')) {
        await apiDelete(`/pessoal/investments/${id}`);
        showAlert('Investimento excluído com sucesso!', 'success');
        loadTabContent('investimentos');
    }
}

// Personal Reports
async function loadRelatoriosPessoal(container) {
    const report = await apiGet('/relatorios/pessoal');
    container.innerHTML = `
        <h2>Relatórios Pessoal</h2>
        <div class="report-section">
            <h3>📊 Estatísticas de Receitas</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Média</div>
                    <div class="stat-value">R$ ${report.finances.income.average}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Desvio Padrão</div>
                    <div class="stat-value">R$ ${report.finances.income.stdDev}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total</div>
                    <div class="stat-value">R$ ${report.finances.income.total}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Quantidade</div>
                    <div class="stat-value">${report.finances.income.count}</div>
                </div>
            </div>
        </div>
        <div class="report-section">
            <h3>📉 Estatísticas de Despesas</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Média</div>
                    <div class="stat-value">R$ ${report.finances.expenses.average}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Desvio Padrão</div>
                    <div class="stat-value">R$ ${report.finances.expenses.stdDev}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total</div>
                    <div class="stat-value">R$ ${report.finances.expenses.total}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Quantidade</div>
                    <div class="stat-value">${report.finances.expenses.count}</div>
                </div>
            </div>
        </div>
        <div class="report-section">
            <h3>💰 Estatísticas de Investimentos</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Total Investido</div>
                    <div class="stat-value">R$ ${report.investments.totalInvested.toFixed(2)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Valor Atual</div>
                    <div class="stat-value">R$ ${report.investments.currentValue.toFixed(2)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Retorno Médio</div>
                    <div class="stat-value">${report.investments.returns.average}%</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Desvio Padrão</div>
                    <div class="stat-value">${report.investments.returns.stdDev}%</div>
                </div>
            </div>
        </div>
        <p style="margin-top: 20px; color: #666;">
            <strong>Gerado em:</strong> ${new Date(report.generatedAt).toLocaleString('pt-BR')}
        </p>
    `;
}
