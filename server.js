const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

const STATUS_FILE = path.join(__dirname, 'public', 'status.json');

const defaultState = {
  "Downstairs": "NOT OK",
  "Upstairs": "NOT OK",
  "Across the Road": "OK"
};

async function readStatus() {
  try {
    const raw = await fs.readFile(STATUS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch (e) {
    console.warn('Cannot read status.json, using default:', e.message);
    return { ...defaultState };
  }
}

async function writeStatus(state) {
  await fs.writeFile(STATUS_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// API: получить текущее состояние
app.get('/status', async (req, res) => {
  try {
    const status = await readStatus();
    res.json(status);
  } catch (e) {
    console.error('Error in GET /status:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: сохранить новое состояние
app.post('/status', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid body' });
    }

    const merged = { ...defaultState, ...body };
    await writeStatus(merged);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error in POST /status:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Раздача статики
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
