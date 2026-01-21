// State management
let kanbanCards = [];
let todos = [];
let notes = '';
let draggedCard = null;
let currentEditingColumn = null;
let selectedPriority = 'medium';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupEventListeners();
    renderKanbanBoard();
    renderTodoList();
    renderNotes();
});

// Local Storage
function saveToLocalStorage() {
    localStorage.setItem('kanbanCards', JSON.stringify(kanbanCards));
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('notes', notes);
}

function loadFromLocalStorage() {
    const savedCards = localStorage.getItem('kanbanCards');
    const savedTodos = localStorage.getItem('todos');
    const savedNotes = localStorage.getItem('notes');

    if (savedCards) kanbanCards = JSON.parse(savedCards);
    if (savedTodos) todos = JSON.parse(savedTodos);
    if (savedNotes) notes = savedNotes;
}

// Event Listeners
function setupEventListeners() {
    // Kanban add card buttons
    document.querySelectorAll('.add-card-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const column = e.target.dataset.column;
            openCardModal(column);
        });
    });

    // Modal buttons
    document.getElementById('save-card-btn').addEventListener('click', saveCard);
    document.getElementById('cancel-card-btn').addEventListener('click', closeCardModal);

    // Click outside modal to close
    document.getElementById('card-modal').addEventListener('click', (e) => {
        if (e.target.id === 'card-modal') {
            closeCardModal();
        }
    });

    // Todo list
    document.getElementById('add-todo-btn').addEventListener('click', addTodo);
    document.getElementById('todo-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // Notes
    const notesArea = document.getElementById('notes-area');
    notesArea.addEventListener('input', (e) => {
        notes = e.target.value;
        saveToLocalStorage();
    });

    // Priority selector
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedPriority = e.target.dataset.priority;
        });
    });

    // Setup drag and drop
    setupDragAndDrop();
}

// Kanban Board Functions
function renderKanbanBoard() {
    const columns = ['todo', 'in-progress', 'complete'];

    columns.forEach(column => {
        const container = document.getElementById(`${column}-cards`);
        container.innerHTML = '';

        const columnCards = kanbanCards.filter(card => card.status === column);

        columnCards.forEach(card => {
            const cardElement = createCardElement(card);
            container.appendChild(cardElement);
        });
    });
}

function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'kanban-card';
    cardDiv.draggable = true;
    cardDiv.dataset.id = card.id;

    // Priority badge
    const priorityBadge = document.createElement('div');
    priorityBadge.className = `priority-badge priority-${card.priority || 'medium'}`;
    priorityBadge.textContent = (card.priority || 'medium').toUpperCase();
    cardDiv.appendChild(priorityBadge);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'card-title';
    titleDiv.textContent = card.title;
    cardDiv.appendChild(titleDiv);

    if (card.description) {
        const descDiv = document.createElement('div');
        descDiv.className = 'card-description';
        descDiv.textContent = card.description;
        cardDiv.appendChild(descDiv);
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCard(card.id);
    });

    actionsDiv.appendChild(deleteBtn);
    cardDiv.appendChild(actionsDiv);

    return cardDiv;
}

function openCardModal(column) {
    currentEditingColumn = column;
    selectedPriority = 'medium';
    document.getElementById('modal-title').textContent = 'New Task';
    document.getElementById('card-title-input').value = '';
    document.getElementById('card-description-input').value = '';

    // Reset priority buttons
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.priority === 'medium') {
            btn.classList.add('active');
        }
    });

    document.getElementById('card-modal').classList.add('active');
    document.getElementById('card-title-input').focus();
}

function closeCardModal() {
    document.getElementById('card-modal').classList.remove('active');
    currentEditingColumn = null;
}

function saveCard() {
    const title = document.getElementById('card-title-input').value.trim();
    const description = document.getElementById('card-description-input').value.trim();

    if (!title) return;

    const newCard = {
        id: Date.now().toString(),
        title,
        description,
        status: currentEditingColumn,
        priority: selectedPriority
    };

    kanbanCards.push(newCard);
    saveToLocalStorage();
    renderKanbanBoard();
    setupDragAndDrop();
    closeCardModal();
}

function deleteCard(id) {
    kanbanCards = kanbanCards.filter(card => card.id !== id);
    saveToLocalStorage();
    renderKanbanBoard();
    setupDragAndDrop();
}

// Drag and Drop
function setupDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const containers = document.querySelectorAll('.cards-container');

    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    containers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        container.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedCard = e.target;
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedCard = null;
}

function handleDragOver(e) {
    e.preventDefault();
    const container = e.currentTarget;

    if (!container.classList.contains('drag-over')) {
        container.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.currentTarget === e.target) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const container = e.currentTarget;
    container.classList.remove('drag-over');

    if (!draggedCard) return;

    const cardId = draggedCard.dataset.id;
    const newStatus = container.id.replace('-cards', '');

    const card = kanbanCards.find(c => c.id === cardId);
    if (card) {
        card.status = newStatus;
        saveToLocalStorage();
        renderKanbanBoard();
        setupDragAndDrop();
    }
}

// Todo List Functions
function renderTodoList() {
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item' + (todo.completed ? ' completed' : '');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.id = `todo-${todo.id}`;
        checkbox.addEventListener('change', () => toggleTodo(todo.id));

        const label = document.createElement('label');
        label.htmlFor = `todo-${todo.id}`;
        label.textContent = todo.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'todo-delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

        li.appendChild(checkbox);
        li.appendChild(label);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
    });
}

function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();

    if (!text) return;

    const newTodo = {
        id: Date.now().toString(),
        text,
        completed: false
    };

    todos.push(newTodo);
    input.value = '';
    saveToLocalStorage();
    renderTodoList();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveToLocalStorage();
        renderTodoList();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTodoList();
}

// Notes Functions
function renderNotes() {
    document.getElementById('notes-area').value = notes;
}
