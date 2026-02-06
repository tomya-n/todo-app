const API = '/api/todos';

let todos = [];
let currentFilter = 'all';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const footer = document.getElementById('todo-footer');
const countEl = document.getElementById('todo-count');
const clearBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

// --- API helpers ---

async function fetchTodos() {
  const res = await fetch(API);
  todos = await res.json();
  render();
}

async function addTodo(title) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (res.ok) {
    const todo = await res.json();
    todos.unshift(todo);
    render();
  }
}

async function updateTodo(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.ok) {
    const updated = await res.json();
    todos = todos.map((t) => (t.id === id ? updated : t));
    render();
  }
}

async function deleteTodo(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (res.ok) {
    todos = todos.filter((t) => t.id !== id);
    render();
  }
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

  // Footer
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

clearBtn.addEventListener('click', async () => {
  const completed = todos.filter((t) => t.completed);
  await Promise.all(completed.map((t) => fetch(`${API}/${t.id}`, { method: 'DELETE' })));
  todos = todos.filter((t) => !t.completed);
  render();
});

// --- Init ---
fetchTodos();
