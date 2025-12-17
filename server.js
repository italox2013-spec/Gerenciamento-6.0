const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initializeDatabase } = require('./database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable must be set in production');
    process.exit(1);
  }
  return 'dev-secret-key-not-for-production';
})();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database
initializeDatabase();

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Role-based authorization
function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

// ==================== Authentication Routes ====================

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// ==================== Admin Routes ====================

// Create user (Admin only)
app.post('/api/admin/users', authenticateToken, authorizeRole('administrador'), (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hashedPassword, role],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Username already exists or invalid role' });
      }
      res.status(201).json({ id: this.lastID, username, role });
    }
  );
});

// List users (Admin only)
app.get('/api/admin/users', authenticateToken, authorizeRole('administrador'), (req, res) => {
  db.all('SELECT id, username, role, created_at FROM users', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Reset password (Admin only)
app.put('/api/admin/users/:id/password', authenticateToken, authorizeRole('administrador'), (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Password reset successfully' });
  });
});

// Create backup (Admin only)
app.post('/api/admin/backups', authenticateToken, authorizeRole('administrador'), (req, res) => {
  const fs = require('fs');
  const filename = `backup_${Date.now()}.db`;
  const userId = req.user.id;

  // Create actual backup file
  try {
    fs.copyFileSync('./gerenciamento.db', `./backups/${filename}`);
  } catch (err) {
    // Create backups directory if it doesn't exist
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups');
      fs.copyFileSync('./gerenciamento.db', `./backups/${filename}`);
    } else {
      return res.status(500).json({ error: 'Failed to create backup file' });
    }
  }

  db.run(
    'INSERT INTO backups (filename, created_by) VALUES (?, ?)',
    [filename, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, filename, message: 'Backup created successfully' });
    }
  );
});

// List backups (Admin only)
app.get('/api/admin/backups', authenticateToken, authorizeRole('administrador'), (req, res) => {
  db.all('SELECT * FROM backups ORDER BY created_at DESC', [], (err, backups) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(backups);
  });
});

// ==================== Personal (Pessoal) Routes ====================

// Get personal dashboard
app.get('/api/pessoal/dashboard', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const userId = req.user.id;

  const queries = {
    totalIncome: new Promise((resolve, reject) => {
      db.get(
        'SELECT SUM(amount) as total FROM finances WHERE user_id = ? AND type = "income"',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row.total || 0))
      );
    }),
    totalExpenses: new Promise((resolve, reject) => {
      db.get(
        'SELECT SUM(amount) as total FROM finances WHERE user_id = ? AND type = "expense"',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row.total || 0))
      );
    }),
    activeGoals: new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = "active"',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row.count || 0))
      );
    }),
    totalInvestments: new Promise((resolve, reject) => {
      db.get(
        'SELECT SUM(current_value) as total FROM investments WHERE user_id = ?',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row.total || 0))
      );
    })
  };

  Promise.all(Object.values(queries))
    .then(([totalIncome, totalExpenses, activeGoals, totalInvestments]) => {
      res.json({
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        activeGoals,
        totalInvestments
      });
    })
    .catch(() => res.status(500).json({ error: 'Database error' }));
});

// Finance CRUD operations
app.get('/api/pessoal/finances', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM finances WHERE user_id = ? ORDER BY date DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.post('/api/pessoal/finances', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const { type, category, amount, description, date } = req.body;
  const userId = req.user.id;

  db.run(
    'INSERT INTO finances (user_id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, type, category, amount, description, date],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.delete('/api/pessoal/finances/:id', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM finances WHERE id = ? AND user_id = ?', [id, userId], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  });
});

// Goals CRUD operations
app.get('/api/pessoal/goals', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.post('/api/pessoal/goals', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const { title, target_amount, current_amount, deadline } = req.body;
  const userId = req.user.id;

  db.run(
    'INSERT INTO goals (user_id, title, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)',
    [userId, title, target_amount, current_amount || 0, deadline],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/pessoal/goals/:id', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const { id } = req.params;
  const { current_amount, status } = req.body;
  const userId = req.user.id;

  db.run(
    'UPDATE goals SET current_amount = ?, status = ? WHERE id = ? AND user_id = ?',
    [current_amount, status, id, userId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Updated successfully' });
    }
  );
});

app.delete('/api/pessoal/goals/:id', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  });
});

// Investments CRUD operations
app.get('/api/pessoal/investments', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM investments WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.post('/api/pessoal/investments', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const { name, type, amount, current_value, purchase_date } = req.body;
  const userId = req.user.id;

  db.run(
    'INSERT INTO investments (user_id, name, type, amount, current_value, purchase_date) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, name, type, amount, current_value, purchase_date],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/pessoal/investments/:id', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const { id } = req.params;
  const { current_value } = req.body;
  const userId = req.user.id;

  db.run(
    'UPDATE investments SET current_value = ? WHERE id = ? AND user_id = ?',
    [current_value, id, userId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Updated successfully' });
    }
  );
});

app.delete('/api/pessoal/investments/:id', authenticateToken, authorizeRole('pessoal'), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM investments WHERE id = ? AND user_id = ?', [id, userId], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  });
});

// ==================== Entrepreneur (Empreendedor) Routes ====================

// Get entrepreneur dashboard
app.get('/api/empreendedor/dashboard', authenticateToken, authorizeRole('empreendedor'), (req, res) => {
  const userId = req.user.id;

  const queries = {
    totalSales: new Promise((resolve, reject) => {
      db.get(
        'SELECT SUM(total_amount) as total FROM sales WHERE user_id = ?',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row.total || 0))
      );
    }),
    salesCount: new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM sales WHERE user_id = ?',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row.count || 0))
      );
    }),
    inventoryValue: new Promise((resolve, reject) => {
      db.get(
        'SELECT SUM(quantity * unit_cost) as total FROM inventory WHERE user_id = ?',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row.total || 0))
      );
    }),
    lowStockItems: new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM inventory WHERE user_id = ? AND quantity < 10',
        [userId],
        (err, row) => (err ? reject(err) : resolve(row.count || 0))
      );
    })
  };

  Promise.all(Object.values(queries))
    .then(([totalSales, salesCount, inventoryValue, lowStockItems]) => {
      res.json({
        totalSales,
        salesCount,
        inventoryValue,
        lowStockItems
      });
    })
    .catch(() => res.status(500).json({ error: 'Database error' }));
});

// Sales CRUD operations
app.get('/api/empreendedor/sales', authenticateToken, authorizeRole('empreendedor'), (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM sales WHERE user_id = ? ORDER BY sale_date DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.post('/api/empreendedor/sales', authenticateToken, authorizeRole('empreendedor'), (req, res) => {
  const { product_name, quantity, unit_price, sale_date, customer_name } = req.body;
  const userId = req.user.id;
  const total_amount = quantity * unit_price;

  db.run(
    'INSERT INTO sales (user_id, product_name, quantity, unit_price, total_amount, sale_date, customer_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, product_name, quantity, unit_price, total_amount, sale_date, customer_name],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.delete('/api/empreendedor/sales/:id', authenticateToken, authorizeRole('empreendedor'), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM sales WHERE id = ? AND user_id = ?', [id, userId], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  });
});

// Inventory CRUD operations
app.get('/api/empreendedor/inventory', authenticateToken, authorizeRole('empreendedor'), (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM inventory WHERE user_id = ? ORDER BY product_name', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.post('/api/empreendedor/inventory', authenticateToken, authorizeRole('empreendedor'), (req, res) => {
  const { product_name, quantity, unit_cost, unit_price, category } = req.body;
  const userId = req.user.id;

  db.run(
    'INSERT INTO inventory (user_id, product_name, quantity, unit_cost, unit_price, category) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, product_name, quantity, unit_cost, unit_price, category],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/empreendedor/inventory/:id', authenticateToken, authorizeRole('empreendedor'), (req, res) => {
  const { id } = req.params;
  const { quantity, unit_cost, unit_price } = req.body;
  const userId = req.user.id;

  db.run(
    'UPDATE inventory SET quantity = ?, unit_cost = ?, unit_price = ? WHERE id = ? AND user_id = ?',
    [quantity, unit_cost, unit_price, id, userId],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Updated successfully' });
    }
  );
});

app.delete('/api/empreendedor/inventory/:id', authenticateToken, authorizeRole('empreendedor'), (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run('DELETE FROM inventory WHERE id = ? AND user_id = ?', [id, userId], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  });
});

// ==================== Reports Routes ====================

// Calculate statistics
function calculateStats(values) {
  if (values.length === 0) return { average: 0, stdDev: 0, min: 0, max: 0, total: 0, count: 0 };

  const total = values.reduce((sum, val) => sum + val, 0);
  const average = total / values.length;
  
  // Use sample standard deviation (n-1) for better statistical accuracy
  const squaredDiffs = values.map(val => Math.pow(val - average, 2));
  const variance = values.length > 1 
    ? squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);

  return {
    average: parseFloat(average.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    min: Math.min(...values),
    max: Math.max(...values),
    total: parseFloat(total.toFixed(2)),
    count: values.length
  };
}

// Personal reports
app.get('/api/relatorios/pessoal', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Get finances data
  db.all(
    'SELECT * FROM finances WHERE user_id = ? ORDER BY date DESC',
    [userId],
    (err, finances) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      const incomes = finances.filter(f => f.type === 'income').map(f => f.amount);
      const expenses = finances.filter(f => f.type === 'expense').map(f => f.amount);

      // Get investments data
      db.all(
        'SELECT * FROM investments WHERE user_id = ?',
        [userId],
        (err, investments) => {
          if (err) return res.status(500).json({ error: 'Database error' });

          const investmentReturns = investments
            .filter(inv => inv.amount > 0)  // Avoid division by zero
            .map(inv => ((inv.current_value - inv.amount) / inv.amount) * 100);

          res.json({
            finances: {
              income: calculateStats(incomes),
              expenses: calculateStats(expenses)
            },
            investments: {
              returns: calculateStats(investmentReturns),
              totalInvested: investments.reduce((sum, inv) => sum + inv.amount, 0),
              currentValue: investments.reduce((sum, inv) => sum + inv.current_value, 0)
            },
            generatedAt: new Date().toISOString()
          });
        }
      );
    }
  );
});

// Entrepreneur reports
app.get('/api/relatorios/empreendedor', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Get sales data
  db.all(
    'SELECT * FROM sales WHERE user_id = ? ORDER BY sale_date DESC',
    [userId],
    (err, sales) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      const salesAmounts = sales.map(s => s.total_amount);
      const salesQuantities = sales.map(s => s.quantity);

      // Get inventory data
      db.all(
        'SELECT * FROM inventory WHERE user_id = ?',
        [userId],
        (err, inventory) => {
          if (err) return res.status(500).json({ error: 'Database error' });

          const inventoryValues = inventory.map(i => i.quantity * i.unit_cost);

          res.json({
            sales: {
              revenue: calculateStats(salesAmounts),
              quantities: calculateStats(salesQuantities)
            },
            inventory: {
              values: calculateStats(inventoryValues),
              totalItems: inventory.reduce((sum, i) => sum + i.quantity, 0),
              totalValue: inventory.reduce((sum, i) => sum + (i.quantity * i.unit_cost), 0)
            },
            generatedAt: new Date().toISOString()
          });
        }
      );
    }
  );
});

// Combined report (Admin only)
app.get('/api/relatorios/completo', authenticateToken, authorizeRole('administrador'), (req, res) => {
  const queries = {
    allFinances: new Promise((resolve, reject) => {
      db.all('SELECT * FROM finances', [], (err, rows) => err ? reject(err) : resolve(rows));
    }),
    allSales: new Promise((resolve, reject) => {
      db.all('SELECT * FROM sales', [], (err, rows) => err ? reject(err) : resolve(rows));
    }),
    allInvestments: new Promise((resolve, reject) => {
      db.all('SELECT * FROM investments', [], (err, rows) => err ? reject(err) : resolve(rows));
    }),
    allInventory: new Promise((resolve, reject) => {
      db.all('SELECT * FROM inventory', [], (err, rows) => err ? reject(err) : resolve(rows));
    })
  };

  Promise.all(Object.values(queries))
    .then(([finances, sales, investments, inventory]) => {
      const incomes = finances.filter(f => f.type === 'income').map(f => f.amount);
      const expenses = finances.filter(f => f.type === 'expense').map(f => f.amount);
      const salesAmounts = sales.map(s => s.total_amount);
      const inventoryValues = inventory.map(i => i.quantity * i.unit_cost);

      res.json({
        personal: {
          income: calculateStats(incomes),
          expenses: calculateStats(expenses)
        },
        business: {
          sales: calculateStats(salesAmounts),
          inventoryValue: calculateStats(inventoryValues)
        },
        investments: {
          total: investments.reduce((sum, inv) => sum + inv.amount, 0),
          currentValue: investments.reduce((sum, inv) => sum + inv.current_value, 0)
        },
        generatedAt: new Date().toISOString()
      });
    })
    .catch(() => res.status(500).json({ error: 'Database error' }));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
  console.log('\nDefault admin credentials:');
  console.log('Username: admin');
  console.log('Password: admin123');
});
