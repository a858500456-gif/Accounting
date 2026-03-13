// ============ 資料狀態管理 ============
let currentAccount = 'personal';
let currentType = 'income';
let currentTheme = localStorage.getItem('theme') || 'light';
let currency = localStorage.getItem('currency') || 'TWD';
let webhookUrl = localStorage.getItem('webhookUrl') || '';

// 載入資料
function loadData(account) {
    return JSON.parse(localStorage.getItem(`transactions_${account}`)) || [];
}

function loadBudgets(account) {
    return JSON.parse(localStorage.getItem(`budgets_${account}`)) || [];
}

function saveData(account, data) {
    localStorage.setItem(`transactions_${account}`, JSON.stringify(data));
}

function saveBudgets(account, budgets) {
    localStorage.setItem(`budgets_${account}`, JSON.stringify(budgets));
}

let transactions = loadData(currentAccount);
let budgets = loadBudgets(currentAccount);

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', () => {
    // 設定今天日期
    document.getElementById('date').valueAsDate = new Date();
    
    // 載入主題
    applyTheme(currentTheme);
    
    // 載入幣別
    document.getElementById('currencySelect').value = currency;
    
    // 載入 webhook
    document.getElementById('webhookUrlInput').value = webhookUrl;
    
    // 初始化圖表
    initCharts();
    
    // 更新所有數據
    updateDashboard();
    renderTransactions();
    renderBudgets();
    
    // 綁定事件
    bindEvents();
});

// ============ 事件綁定 ============
function bindEvents() {
    // 導航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            switchPage(page);
        });
    });
    
    // 帳本切換
    document.getElementById('accountSelect').addEventListener('change', (e) => {
        currentAccount = e.target.value;
        transactions = loadData(currentAccount);
        budgets = loadBudgets(currentAccount);
        updateDashboard();
        renderTransactions();
        renderBudgets();
    });
    
    // 主題切換
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });
    
    // 幣別
    document.getElementById('currencySelect').addEventListener('change', (e) => {
        currency = e.target.value;
        localStorage.setItem('currency', currency);
        updateDashboard();
        renderTransactions();
    });
    
    // Modal 控制
    document.getElementById('addTransactionBtn').addEventListener('click', openTransactionModal);
    document.getElementById('addTransactionBtn2').addEventListener('click', openTransactionModal);
    document.getElementById('closeTransactionModal').addEventListener('click', closeTransactionModal);
    document.getElementById('addBudgetBtn').addEventListener('click', openBudgetModal);
    document.getElementById('closeBudgetModal').addEventListener('click', closeBudgetModal);
    
    // 類型選擇
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.dataset.type;
        });
    });
    
    // 表單提交
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    document.getElementById('budgetForm').addEventListener('submit', handleBudgetSubmit);
    
    // 快速記帳
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const category = btn.dataset.category;
            const desc = btn.dataset.desc;
            openQuickAdd(type, category, desc);
        });
    });
    
    // 搜尋
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderTransactions(e.target.value);
    });
    
    // 資料管理
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('backupBtn').addEventListener('click', backupData);
    document.getElementById('restoreBtn').addEventListener('click', restoreData);
    document.getElementById('clearBtn').addEventListener('click', clearAllData);
    
    // Webhook 設定
    document.getElementById('saveWebhookBtn').addEventListener('click', () => {
        webhookUrl = document.getElementById('webhookUrlInput').value.trim();
        localStorage.setItem('webhookUrl', webhookUrl);
        showToast('✅ Google Sheets 設定已儲存');
    });
    
    // 檔案上傳
    document.getElementById('fileUpload').addEventListener('click', () => {
        document.getElementById('receiptFile').click();
    });
    
    document.getElementById('receiptFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            showToast(`📷 已選擇：${file.name}`);
        }
    });
}

// ============ 頁面切換 ============
function switchPage(pageName) {
    // 更新導航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    // 更新頁面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');
    
    // 更新對應數據
    if (pageName === 'analytics') {
        updateAnalytics();
    }
}

// ============ 主題管理 ============
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
}

function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.getElementById('themeToggle');
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    
    document.getElementById('themeSelect').value = theme;
    
    // 重繪圖表
    if (window.trendChart) {
        updateCharts();
    }
}

// ============ Modal 控制 ============
function openTransactionModal() {
    document.getElementById('transactionModal').classList.add('active');
    document.getElementById('date').valueAsDate = new Date();
}

function closeTransactionModal() {
    document.getElementById('transactionModal').classList.remove('active');
    document.getElementById('transactionForm').reset();
}

function openBudgetModal() {
    document.getElementById('budgetModal').classList.add('active');
}

function closeBudgetModal() {
    document.getElementById('budgetModal').classList.remove('active');
    document.getElementById('budgetForm').reset();
}

function openQuickAdd(type, category, desc) {
    currentType = type;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.type-btn[data-type="${type}"]`).classList.add('active');
    document.getElementById('description').value = desc;
    document.getElementById('category').value = category;
    openTransactionModal();
    document.getElementById('amount').focus();
}

// ============ 交易處理 ============
async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: currentType,
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t),
        notes: document.getElementById('notes').value,
        account: currentAccount,
        timestamp: new Date().toISOString()
    };
    
    // 處理收據照片
    const file = document.getElementById('receiptFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            transaction.receipt = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    transactions.unshift(transaction);
    saveData(currentAccount, transactions);
    
    // 同步到 Google Sheets
    if (webhookUrl) {
        await syncToGoogleSheets(transaction);
    }
    
    showToast(`✅ 成功新增${currentType === 'income' ? '收入' : '支出'}記錄`);
    
    closeTransactionModal();
    updateDashboard();
    renderTransactions();
    updateCharts();
}

// 同步到 Google Sheets
async function syncToGoogleSheets(transaction) {
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: transaction.date,
                type: transaction.type,
                description: transaction.description,
                category: transaction.category,
                amount: transaction.amount
            })
        });
    } catch (error) {
        console.error('同步失敗:', error);
    }
}

// 刪除交易
function deleteTransaction(id) {
    if (confirm('確定要刪除此交易嗎？')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData(currentAccount, transactions);
        showToast('🗑️ 已刪除交易');
        updateDashboard();
        renderTransactions();
        updateCharts();
    }
}

// ============ 預算處理 ============
function handleBudgetSubmit(e) {
    e.preventDefault();
    
    const budget = {
        id: Date.now(),
        category: document.getElementById('budgetCategory').value,
        amount: parseFloat(document.getElementById('budgetAmount').value),
        period: document.getElementById('budgetPeriod').value,
        account: currentAccount
    };
    
    budgets.push(budget);
    saveBudgets(currentAccount, budgets);
    
    showToast('✅ 預算設定成功');
    closeBudgetModal();
    renderBudgets();
}

function deleteBudget(id) {
    if (confirm('確定要刪除此預算嗎？')) {
        budgets = budgets.filter(b => b.id !== id);
        saveBudgets(currentAccount, budgets);
        showToast('🗑️ 已刪除預算');
        renderBudgets();
    }
}

// ============ 數據更新 ============
function updateDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 計算總收入、總支出
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    
    // 本月交易數
    const monthlyTrans = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    // 更新顯示
    document.getElementById('totalIncome').textContent = formatCurrency(income);
    document.getElementById('totalExpense').textContent = formatCurrency(expense);
    document.getElementById('balance').textContent = formatCurrency(balance);
    document.getElementById('balance').className = `stat-value ${balance >= 0 ? 'income' : 'expense'}`;
    document.getElementById('monthlyTransactions').textContent = `${monthlyTrans.length} 筆`;
    
    updateCharts();
}

// ============ 渲染交易列表 ============
function renderTransactions(searchQuery = '') {
    const table = document.getElementById('transactionsTable');
    
    let filtered = transactions.filter(t => t.account === currentAccount);
    
    if (searchQuery) {
        filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }
    
    if (filtered.length === 0) {
        table.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p>尚無交易記錄</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-header">
            <span>日期</span>
            <span>描述</span>
            <span>分類</span>
            <span>金額</span>
            <span>類型</span>
            <span>操作</span>
        </div>
    `;
    
    filtered.forEach(t => {
        html += `
            <div class="transaction-row">
                <span>${t.date}</span>
                <span>${t.description}${t.notes ? '<br><small style="color: var(--text-secondary);">' + t.notes + '</small>' : ''}</span>
                <span>${t.category}</span>
                <span style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--accent-${t.type === 'income' ? 'green' : 'red'});">
                    ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
                </span>
                <span><span class="tag ${t.type}">${t.type === 'income' ? '收入' : '支出'}</span></span>
                <span>
                    <button class="icon-btn" onclick="deleteTransaction(${t.id})" style="width: 36px; height: 36px;">🗑️</button>
                </span>
            </div>
        `;
    });
    
    table.innerHTML = html;
}

// ============ 渲染預算 ============
function renderBudgets() {
    const container = document.getElementById('budgetList');
    const accountBudgets = budgets.filter(b => b.account === currentAccount);
    
    if (accountBudgets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <p>尚未設定預算<br>點擊右上角 + 號新增預算</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    accountBudgets.forEach(budget => {
        const spent = calculateSpent(budget);
        const percentage = (spent / budget.amount) * 100;
        const status = percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : '';
        
        html += `
            <div class="budget-card">
                <div class="budget-header">
                    <span class="budget-name">${budget.category} (${getPeriodName(budget.period)})</span>
                    <span class="budget-amount">${formatCurrency(spent)} / ${formatCurrency(budget.amount)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="budget-info">
                    <span>${percentage.toFixed(1)}% 已使用</span>
                    <span>剩餘 ${formatCurrency(Math.max(0, budget.amount - spent))}</span>
                </div>
                <button class="icon-btn" onclick="deleteBudget(${budget.id})" style="margin-top: 12px; width: 100%;">🗑️ 刪除預算</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function calculateSpent(budget) {
    const now = new Date();
    let startDate;
    
    if (budget.period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (budget.period === 'weekly') {
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
    } else {
        startDate = new Date(now.getFullYear(), 0, 1);
    }
    
    return transactions
        .filter(t => 
            t.type === 'expense' &&
            t.category === budget.category &&
            new Date(t.date) >= startDate &&
            new Date(t.date) <= now
        )
        .reduce((sum, t) => sum + t.amount, 0);
}

function getPeriodName(period) {
    const names = { monthly: '每月', weekly: '每週', yearly: '每年' };
    return names[period] || period;
}

// ============ 圖表 ============
let trendChart, categoryChart, monthlyComparisonChart, categoryTrendChart;

function initCharts() {
    const isDark = currentTheme === 'dark';
    const textColor = isDark ? '#e8e4de' : '#4a4238';
    const gridColor = isDark ? '#3d362d' : '#e5ddd4';
    
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    
    // 收支趨勢圖
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '收入',
                data: [],
                borderColor: '#8b9d83',
                backgroundColor: 'rgba(139, 157, 131, 0.1)',
                tension: 0.4
            }, {
                label: '支出',
                data: [],
                borderColor: '#c08681',
                backgroundColor: 'rgba(192, 134, 129, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    
    // 支出分布圖
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#a0826d', '#c9a88a', '#d4a574', '#8b9d83',
                    '#c08681', '#7b9cb5', '#d4b896', '#9ab0a0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    // 月度對比圖
    const monthlyCtx = document.getElementById('monthlyComparisonChart').getContext('2d');
    monthlyComparisonChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '收入',
                data: [],
                backgroundColor: '#8b9d83'
            }, {
                label: '支出',
                data: [],
                backgroundColor: '#c08681'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    
    // 分類趨勢圖
    const categoryTrendCtx = document.getElementById('categoryTrendChart').getContext('2d');
    categoryTrendChart = new Chart(categoryTrendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function updateCharts() {
    if (!trendChart) return;
    
    // 收支趨勢 - 最近7天
    const last7Days = getLast7Days();
    const incomeByDay = Array(7).fill(0);
    const expenseByDay = Array(7).fill(0);
    
    transactions.forEach(t => {
        const index = last7Days.findIndex(d => d === t.date);
        if (index !== -1) {
            if (t.type === 'income') {
                incomeByDay[index] += t.amount;
            } else {
                expenseByDay[index] += t.amount;
            }
        }
    });
    
    trendChart.data.labels = last7Days.map(d => new Date(d).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }));
    trendChart.data.datasets[0].data = incomeByDay;
    trendChart.data.datasets[1].data = expenseByDay;
    trendChart.update();
    
    // 支出分布
    const categoryData = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
        });
    
    categoryChart.data.labels = Object.keys(categoryData);
    categoryChart.data.datasets[0].data = Object.values(categoryData);
    categoryChart.update();
}

function updateAnalytics() {
    // 月度對比 - 最近6個月
    const last6Months = getLast6Months();
    const incomeByMonth = Array(6).fill(0);
    const expenseByMonth = Array(6).fill(0);
    
    transactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const index = last6Months.findIndex(m => m === monthKey);
        
        if (index !== -1) {
            if (t.type === 'income') {
                incomeByMonth[index] += t.amount;
            } else {
                expenseByMonth[index] += t.amount;
            }
        }
    });
    
    monthlyComparisonChart.data.labels = last6Months.map(m => {
        const [y, mon] = m.split('-');
        return `${mon}月`;
    });
    monthlyComparisonChart.data.datasets[0].data = incomeByMonth;
    monthlyComparisonChart.data.datasets[1].data = expenseByMonth;
    monthlyComparisonChart.update();
    
    // 分類趨勢
    const categories = ['餐飲', '交通', '購物', '娛樂'];
    const colors = ['#a0826d', '#c9a88a', '#d4a574', '#8b9d83'];
    const datasets = categories.map((cat, i) => {
        const data = last6Months.map(month => {
            return transactions
                .filter(t => {
                    const date = new Date(t.date);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    return t.type === 'expense' && t.category === cat && monthKey === month;
                })
                .reduce((sum, t) => sum + t.amount, 0);
        });
        
        return {
            label: cat,
            data: data,
            borderColor: colors[i],
            backgroundColor: colors[i] + '30',
            tension: 0.4
        };
    });
    
    categoryTrendChart.data.labels = last6Months.map(m => {
        const [y, mon] = m.split('-');
        return `${mon}月`;
    });
    categoryTrendChart.data.datasets = datasets;
    categoryTrendChart.update();
}

// ============ 資料管理 ============
function exportData() {
    const data = transactions.filter(t => t.account === currentAccount);
    
    let csv = '日期,類型,描述,分類,金額,標籤,備註\n';
    data.forEach(t => {
        csv += `${t.date},${t.type === 'income' ? '收入' : '支出'},${t.description},${t.category},${t.amount},"${t.tags.join(',')}","${t.notes || ''}"\n`;
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `記帳資料_${currentAccount}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('📥 已匯出 CSV 檔案');
}

function backupData() {
    const backup = {
        transactions: localStorage.getItem(`transactions_${currentAccount}`),
        budgets: localStorage.getItem(`budgets_${currentAccount}`),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `備份_${currentAccount}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('📦 已建立備份檔案');
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const backup = JSON.parse(event.target.result);
                localStorage.setItem(`transactions_${currentAccount}`, backup.transactions);
                localStorage.setItem(`budgets_${currentAccount}`, backup.budgets);
                
                transactions = loadData(currentAccount);
                budgets = loadBudgets(currentAccount);
                
                updateDashboard();
                renderTransactions();
                renderBudgets();
                
                showToast('✅ 資料還原成功');
            } catch (error) {
                showToast('❌ 還原失敗：檔案格式錯誤');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllData() {
    if (confirm('⚠️ 警告：此操作將清除所有資料且無法復原！\n\n確定要繼續嗎？')) {
        if (confirm('真的確定嗎？建議先備份資料！')) {
            localStorage.removeItem(`transactions_${currentAccount}`);
            localStorage.removeItem(`budgets_${currentAccount}`);
            transactions = [];
            budgets = [];
            
            updateDashboard();
            renderTransactions();
            renderBudgets();
            
            showToast('🗑️ 已清除所有資料');
        }
    }
}

// ============ 工具函數 ============
function formatCurrency(amount) {
    const symbols = {
        TWD: 'NT$',
        USD: 'US$',
        JPY: '¥',
        EUR: '€'
    };
    
    return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }
    return days;
}

function getLast6Months() {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============ 點擊外部關閉 Modal ============
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});