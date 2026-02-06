const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Get all todos
app.get('/api/todos', (req, res) => {
  const todos = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all();
  res.json(todos);
});

// Create a todo
app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const result = db.prepare('INSERT INTO todos (title) VALUES (?)').run(title.trim());
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(todo);
});

// Update a todo
app.patch('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newCompleted = completed !== undefined ? (completed ? 1 : 0) : existing.completed;

  if (title !== undefined && !newTitle) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  db.prepare(
    "UPDATE todos SET title = ?, completed = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(newTitle, newCompleted, id);

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  res.json(todo);
});

// Delete a todo
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`TODO app running at http://localhost:${PORT}`);
});
