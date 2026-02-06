const STORAGE_KEY = 'todo-app-data';
let nextId = 1;
let todos = [];
let currentFilter = 'all';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const footer = document.getElementById('todo-footer');
const countEl = document.getElementById('todo-count');
const clearBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

// --- Storage helpers ---

function loadTodos() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(data)) {
      todos = data;
      nextId = todos.reduce((max, t) => Math.max(max, t.id + 1), 1);
    }
  } catch {}
  render();
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function addTodo(title) {
  const todo = {
    id: nextId++,
    title,
    completed: false,
    created_at: new Date().toISOString(),
  };
  todos.unshift(todo);
  saveTodos();
  render();
}

function updateTodo(id, data) {
  todos = todos.map((t) => (t.id === id ? { ...t, ...data } : t));
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  render();
}

// --- Rendering ---

function getFiltered() {
  if (currentFilter === 'active') return todos.filter((t) => !t.completed);
  if (currentFilter === 'completed') return todos.filter((t) => t.completed);
  return todos;
}

function render() {
  const filtered = getFiltered();
  list.innerHTML = '';

  if (todos.length === 0) {
    list.innerHTML = '<li class="empty-state">No todos yet. Add one above!</li>';
    footer.classList.add('hidden');
    return;
  }

  if (filtered.length === 0) {
    list.innerHTML = `<li class="empty-state">No ${currentFilter} todos.</li>`;
  }

  filtered.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
      <span class="todo-title">${escapeHtml(todo.title)}</span>
      <div class="todo-actions">
        <button class="btn-edit">Edit</button>
        <button class="btn-delete">Delete</button>
      </div>
    `;

    list.appendChild(li);
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  footer.classList.remove('hidden');
  countEl.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
  clearBtn.classList.toggle('hidden', completedCount === 0);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Edit mode ---

function startEdit(li, todo) {
  const titleEl = li.querySelector('.todo-title');
  const actionsEl = li.querySelector('.todo-actions');

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value = todo.title;
  editInput.maxLength = 200;

  titleEl.replaceWith(editInput);
  actionsEl.classList.add('hidden');
  editInput.focus();
  editInput.select();

  const finish = () => {
    const newTitle = editInput.value.trim();
    if (newTitle && newTitle !== todo.title) {
      updateTodo(todo.id, { title: newTitle });
    } else {
      render();
    }
  };

  editInput.addEventListener('blur', finish);
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') editInput.blur();
    if (e.key === 'Escape') {
      editInput.removeEventListener('blur', finish);
      render();
    }
  });
}

// --- Event listeners ---

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  addTodo(title);
  input.value = '';
});

list.addEventListener('click', (e) => {
  const li = e.target.closest('.todo-item');
  if (!li) return;
  const id = Number(li.dataset.id);
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  if (e.target.classList.contains('todo-checkbox')) {
    updateTodo(id, { completed: !todo.completed });
  } else if (e.target.classList.contains('btn-edit')) {
    startEdit(li, todo);
  } else if (e.target.classList.contains('btn-delete')) {
    deleteTodo(id);
  }
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

clearBtn.addEventListener('click', () => {
  todos = todos.filter((t) => !t.completed);
  saveTodos();
  render();
});

// --- Init ---
loadTodos();
