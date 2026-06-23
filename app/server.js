"use strict";

const express = require("express");
const { Pool } = require("pg");

const DB_CONFIG = {
  host: process.env.DB_HOST || "postgres-service",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "appdb",
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || "10", 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(DB_CONFIG);

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err.message);
});

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Employee Records</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: #111827;
      --panel-alt: #1f2937;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --primary: #38bdf8;
      --primary-dark: #0284c7;
      --danger: #f87171;
      --success: #34d399;
      --border: rgba(148, 163, 184, 0.2);
      --shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, Segoe UI, Arial, sans-serif;
      background: linear-gradient(135deg, #020617, #0f172a 45%, #111827);
      color: var(--text);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }
    .hero {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .hero h1 {
      margin: 0 0 8px;
      font-size: 2rem;
    }
    .hero p {
      margin: 0;
      color: var(--muted);
      max-width: 720px;
      line-height: 1.5;
    }
    .badge {
      background: rgba(56, 189, 248, 0.12);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 999px;
      padding: 10px 14px;
      font-size: 0.9rem;
      white-space: nowrap;
    }
    .grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 20px;
    }
    .card {
      background: rgba(17, 24, 39, 0.92);
      border: 1px solid var(--border);
      border-radius: 18px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .card-header {
      padding: 18px 20px;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.02);
    }
    .card-header h2 {
      margin: 0 0 6px;
      font-size: 1.1rem;
    }
    .card-header p {
      margin: 0;
      color: var(--muted);
      font-size: 0.92rem;
    }
    .card-body { padding: 20px; }
    form { display: grid; gap: 14px; }
    label {
      display: grid;
      gap: 6px;
      font-size: 0.92rem;
      color: var(--muted);
    }
    input {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--panel-alt);
      color: var(--text);
      padding: 12px 14px;
      font-size: 0.95rem;
      outline: none;
    }
    input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 6px;
    }
    button {
      border: 0;
      border-radius: 12px;
      padding: 12px 16px;
      font-weight: 600;
      cursor: pointer;
    }
    .primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
    }
    .secondary {
      background: #334155;
      color: white;
    }
    .ghost {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .danger {
      background: rgba(248, 113, 113, 0.16);
      color: #fecaca;
      border: 1px solid rgba(248, 113, 113, 0.25);
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    .status {
      min-height: 24px;
      color: var(--muted);
      font-size: 0.94rem;
    }
    .status.success { color: var(--success); }
    .status.error { color: var(--danger); }
    .table-wrap { overflow: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
    }
    th, td {
      text-align: left;
      padding: 14px 12px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    td .row-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .empty {
      padding: 36px 12px;
      text-align: center;
      color: var(--muted);
    }
    .footer-note {
      margin-top: 12px;
      color: var(--muted);
      font-size: 0.88rem;
    }
    @media (max-width: 960px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <div>
        <h1>Employee Records</h1>
      </div>
      <div class="badge" id="dbStatus">Checking API...</div>
    </div>

    <div class="grid">
      <section class="card">
        <div class="card-header">
          <h2 id="formTitle">Add New Record</h2>
          <p>Use this form to insert or update employee data in PostgreSQL.</p>
        </div>
        <div class="card-body">
          <form id="recordForm">
            <input type="hidden" id="recordId" />
            <label>Name<input id="name" name="name" maxlength="100" required /></label>
            <label>Department<input id="department" name="department" maxlength="100" required /></label>
            <label>Role<input id="role" name="role" maxlength="100" required /></label>
            <label>Salary<input id="salary" name="salary" type="number" step="0.01" min="0" required /></label>
            <label>Join Date<input id="join_date" name="join_date" type="date" required /></label>
            <div class="actions">
              <button class="primary" type="submit" id="submitButton">Create Record</button>
              <button class="secondary" type="button" id="resetButton">Reset</button>
            </div>
          </form>
          <div class="footer-note">Tip: editing fills the form with the selected row and updates in place.</div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h2>Current Records</h2>
          <p>The table refreshes automatically after every create, update, or delete action.</p>
        </div>
        <div class="card-body">
          <div class="toolbar">
            <button class="ghost" id="refreshButton" type="button">Refresh List</button>
            <div class="status" id="statusMessage"></div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Salary</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="recordsTableBody">
                <tr><td class="empty" colspan="7">Loading records...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </div>

  <script>
    const form = document.getElementById('recordForm');
    const recordId = document.getElementById('recordId');
    const formTitle = document.getElementById('formTitle');
    const submitButton = document.getElementById('submitButton');
    const statusMessage = document.getElementById('statusMessage');
    const recordsTableBody = document.getElementById('recordsTableBody');
    const dbStatus = document.getElementById('dbStatus');

    function setStatus(message, type = '') {
      statusMessage.textContent = message;
      statusMessage.className = type ? 'status ' + type : 'status';
    }

    function resetForm() {
      form.reset();
      recordId.value = '';
      formTitle.textContent = 'Add New Record';
      submitButton.textContent = 'Create Record';
    }

    function formatDate(value) {
      if (!value) return '';
      return new Date(value).toISOString().slice(0, 10);
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    async function loadStatus() {
      try {
        const response = await fetch('/ready');
        const data = await response.json();
        if (!response.ok) throw new Error(data.db || 'Readiness failed');
        dbStatus.textContent = 'DB Connected';
      } catch (error) {
        dbStatus.textContent = 'DB Not Ready';
      }
    }

    async function loadRecords() {
      setStatus('Refreshing records...');
      try {
        const response = await fetch('/api/records');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load records');

        if (!payload.data.length) {
          recordsTableBody.innerHTML = '<tr><td class="empty" colspan="7">No records found.</td></tr>';
        } else {
          recordsTableBody.innerHTML = '';
          for (const row of payload.data) {
            const tr = document.createElement('tr');

            const idCell = document.createElement('td');
            idCell.textContent = String(row.id);

            const nameCell = document.createElement('td');
            nameCell.textContent = String(row.name || '');

            const departmentCell = document.createElement('td');
            departmentCell.textContent = String(row.department || '');

            const roleCell = document.createElement('td');
            roleCell.textContent = String(row.role || '');

            const salaryCell = document.createElement('td');
            salaryCell.textContent = '$' + String(row.salary || '0');

            const joinDateCell = document.createElement('td');
            joinDateCell.textContent = formatDate(row.join_date);

            const actionCell = document.createElement('td');
            const actionWrap = document.createElement('div');
            actionWrap.className = 'row-actions';

            const editButton = document.createElement('button');
            editButton.className = 'ghost';
            editButton.type = 'button';
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => editRecord(row.id));

            const deleteButton = document.createElement('button');
            deleteButton.className = 'danger';
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteRecord(row.id));

            actionWrap.appendChild(editButton);
            actionWrap.appendChild(deleteButton);
            actionCell.appendChild(actionWrap);

            tr.appendChild(idCell);
            tr.appendChild(nameCell);
            tr.appendChild(departmentCell);
            tr.appendChild(roleCell);
            tr.appendChild(salaryCell);
            tr.appendChild(joinDateCell);
            tr.appendChild(actionCell);

            recordsTableBody.appendChild(tr);
          }
        }

        setStatus('Loaded ' + payload.count + ' record(s).', 'success');
      } catch (error) {
        recordsTableBody.innerHTML = '<tr><td class="empty" colspan="7">Failed to load records.</td></tr>';
        setStatus(error.message, 'error');
      }
    }

    async function editRecord(id) {
      try {
        const response = await fetch('/api/records/' + id);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to fetch record');
        const row = payload.data;
        recordId.value = row.id;
        document.getElementById('name').value = row.name;
        document.getElementById('department').value = row.department;
        document.getElementById('role').value = row.role;
        document.getElementById('salary').value = row.salary;
        document.getElementById('join_date').value = formatDate(row.join_date);
        formTitle.textContent = 'Edit Record #' + row.id;
        submitButton.textContent = 'Update Record';
        setStatus('Loaded record #' + row.id + ' for editing.', 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        setStatus(error.message, 'error');
      }
    }

    async function deleteRecord(id) {
      if (!window.confirm('Delete record #' + id + '?')) return;
      try {
        const response = await fetch('/api/records/' + id, { method: 'DELETE' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Delete failed');
        if (String(recordId.value) === String(id)) resetForm();
        setStatus(payload.message || 'Record deleted.', 'success');
        await loadRecords();
      } catch (error) {
        setStatus(error.message, 'error');
      }
    }

    window.editRecord = editRecord;
    window.deleteRecord = deleteRecord;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      const id = recordId.value;
      const method = id ? 'PUT' : 'POST';
      const url = id ? '/api/records/' + id : '/api/records';

      try {
        setStatus(id ? 'Updating record...' : 'Creating record...');
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || result.detail || 'Request failed');
        setStatus(result.message || (id ? 'Record updated.' : 'Record created.'), 'success');
        resetForm();
        await loadRecords();
      } catch (error) {
        setStatus(error.message, 'error');
      }
    });

    document.getElementById('resetButton').addEventListener('click', () => {
      resetForm();
      setStatus('Form reset.');
    });

    document.getElementById('refreshButton').addEventListener('click', loadRecords);

    resetForm();
    loadStatus();
    loadRecords();
  </script>
</body>
</html>`;

function normalizeRecordInput(input) {
  return {
    name: String(input.name || "").trim(),
    department: String(input.department || "").trim(),
    role: String(input.role || "").trim(),
    salary: String(input.salary || "").trim(),
    join_date: String(input.join_date || "").trim(),
  };
}

function validateRecordInput(record) {
  const requiredFields = ["name", "department", "role", "salary", "join_date"];
  for (const field of requiredFields) {
    if (!record[field]) return `${field} is required`;
  }

  const salary = Number(record.salary);
  if (Number.isNaN(salary) || salary < 0)
    return "salary must be a valid positive number";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.join_date))
    return "join_date must be in YYYY-MM-DD format";

  return null;
}

async function fetchRecordById(id) {
  const result = await pool.query(
    "SELECT id, name, department, role, salary, join_date FROM employees WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
}

app.get("/", (_req, res) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.type("html").send(UI_HTML);
});

// ── Health / Readiness probe ──────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Readiness probe: also checks DB connectivity ──────────────────────────────
app.get("/ready", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not ready", db: err.message });
  }
});

// ── GET /api/records — fetch all employee records from DB ────────────────────
app.get("/api/records", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, department, role, salary, join_date FROM employees ORDER BY id",
    );
    res.json({
      success: true,
      count: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    console.error("[GET /api/records] DB error:", err.message);
    res
      .status(500)
      .json({
        success: false,
        error: "Database query failed",
        detail: err.message,
      });
  }
});

// ── GET /api/records/:id ──────────────────────────────────────────────────────
app.get("/api/records/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id))
    return res.status(400).json({ success: false, error: "Invalid id" });

  try {
    const record = await fetchRecordById(id);
    if (!record)
      return res
        .status(404)
        .json({ success: false, error: "Record not found" });
    res.json({ success: true, data: record });
  } catch (err) {
    console.error("[GET /api/records/:id] DB error:", err.message);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

// ── POST /api/records — create a new employee record ───────────────────────
app.post("/api/records", async (req, res) => {
  const record = normalizeRecordInput(req.body);
  const validationError = validateRecordInput(record);
  if (validationError)
    return res.status(400).json({ success: false, error: validationError });

  try {
    const result = await pool.query(
      `INSERT INTO employees (name, department, role, salary, join_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, department, role, salary, join_date`,
      [
        record.name,
        record.department,
        record.role,
        record.salary,
        record.join_date,
      ],
    );
    res
      .status(201)
      .json({
        success: true,
        message: "Record created successfully",
        data: result.rows[0],
      });
  } catch (err) {
    console.error("[POST /api/records] DB error:", err.message);
    res
      .status(500)
      .json({
        success: false,
        error: "Database insert failed",
        detail: err.message,
      });
  }
});

// ── PUT /api/records/:id — update an employee record ───────────────────────
app.put("/api/records/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id))
    return res.status(400).json({ success: false, error: "Invalid id" });

  const record = normalizeRecordInput(req.body);
  const validationError = validateRecordInput(record);
  if (validationError)
    return res.status(400).json({ success: false, error: validationError });

  try {
    const result = await pool.query(
      `UPDATE employees
          SET name = $1,
              department = $2,
              role = $3,
              salary = $4,
              join_date = $5
        WHERE id = $6
      RETURNING id, name, department, role, salary, join_date`,
      [
        record.name,
        record.department,
        record.role,
        record.salary,
        record.join_date,
        id,
      ],
    );

    if (result.rowCount === 0)
      return res
        .status(404)
        .json({ success: false, error: "Record not found" });

    res.json({
      success: true,
      message: "Record updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("[PUT /api/records/:id] DB error:", err.message);
    res
      .status(500)
      .json({
        success: false,
        error: "Database update failed",
        detail: err.message,
      });
  }
});

// ── DELETE /api/records/:id — delete an employee record ────────────────────
app.delete("/api/records/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id))
    return res.status(400).json({ success: false, error: "Invalid id" });

  try {
    const result = await pool.query(
      "DELETE FROM employees WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rowCount === 0)
      return res
        .status(404)
        .json({ success: false, error: "Record not found" });

    res.json({
      success: true,
      message: "Record deleted successfully",
      data: { id },
    });
  } catch (err) {
    console.error("[DELETE /api/records/:id] DB error:", err.message);
    res
      .status(500)
      .json({
        success: false,
        error: "Database delete failed",
        detail: err.message,
      });
  }
});

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[API] Service running on port ${PORT}`);
  console.log(
    `[API] DB Host: ${DB_CONFIG.host}:${DB_CONFIG.port} / ${DB_CONFIG.database}`,
  );
});

module.exports = app;
