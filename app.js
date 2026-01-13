// Notes data structure
let notes = [];
let currentNoteId = null;
let autoSaveTimeout = null;

// DOM elements
const notesList = document.getElementById('notesList');
const noteTextarea = document.getElementById('noteTextarea');
const newNoteBtn = document.getElementById('newNoteBtn');
const searchInput = document.getElementById('searchInput');
const editorPlaceholder = document.getElementById('editorPlaceholder');
const editorContent = document.getElementById('editorContent');
const noteDate = document.getElementById('noteDate');
const charCount = document.getElementById('charCount');

// Initialize app
function init() {
    loadNotes();
    renderNotes();
    attachEventListeners();
}

// Load notes from localStorage
function loadNotes() {
    const stored = localStorage.getItem('supernotes');
    if (stored) {
        notes = JSON.parse(stored);
    }
}

// Save notes to localStorage
function saveNotes() {
    localStorage.setItem('supernotes', JSON.stringify(notes));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Extract title from content (first line)
function extractTitle(content) {
    if (!content || content.trim() === '') {
        return 'Untitled Note';
    }
    const firstLine = content.split('\n')[0].trim();
    return firstLine || 'Untitled Note';
}

// Format date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Create new note
function createNote() {
    const note = {
        id: generateId(),
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    notes.unshift(note);
    saveNotes();
    renderNotes();
    selectNote(note.id);
}

// Update note
function updateNote(id, content) {
    const note = notes.find(n => n.id === id);
    if (note) {
        note.content = content;
        note.updatedAt = Date.now();
        saveNotes();
        renderNotes();
        updateNoteInfo();
    }
}

// Delete note
function deleteNote(id) {
    if (confirm('Delete this note?')) {
        notes = notes.filter(n => n.id !== id);
        saveNotes();

        if (currentNoteId === id) {
            currentNoteId = null;
            showPlaceholder();
        }

        renderNotes();
    }
}

// Select note
function selectNote(id) {
    currentNoteId = id;
    const note = notes.find(n => n.id === id);

    if (note) {
        editorPlaceholder.style.display = 'none';
        editorContent.style.display = 'flex';
        noteTextarea.value = note.content;
        noteTextarea.focus();
        updateNoteInfo();
        renderNotes(); // Re-render to update active state
    }
}

// Show placeholder
function showPlaceholder() {
    editorPlaceholder.style.display = 'flex';
    editorContent.style.display = 'none';
    noteTextarea.value = '';
}

// Update note info (date and char count)
function updateNoteInfo() {
    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        noteDate.textContent = formatDate(note.updatedAt);
        charCount.textContent = `${note.content.length} characters`;
    }
}

// Render notes list
function renderNotes(filter = '') {
    const filteredNotes = filter
        ? notes.filter(note => note.content.toLowerCase().includes(filter.toLowerCase()))
        : notes;

    if (filteredNotes.length === 0) {
        notesList.innerHTML = '<div class="empty-state">No notes yet.<br>Create your first note!</div>';
        return;
    }

    notesList.innerHTML = filteredNotes.map(note => {
        const title = extractTitle(note.content);
        const preview = note.content.split('\n').slice(1).join(' ').substring(0, 60);
        const isActive = note.id === currentNoteId ? 'active' : '';

        return `
            <div class="note-item ${isActive}" data-id="${note.id}">
                <div class="note-item-title">${escapeHtml(title)}</div>
                <div class="note-item-preview">${escapeHtml(preview)}</div>
                <div class="note-item-meta">
                    <span>${formatDate(note.updatedAt)}</span>
                    <button class="delete-btn" data-id="${note.id}">DELETE</button>
                </div>
            </div>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-save with debounce
function scheduleAutoSave() {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }

    autoSaveTimeout = setTimeout(() => {
        if (currentNoteId) {
            updateNote(currentNoteId, noteTextarea.value);
        }
    }, 500);
}

// Attach event listeners
function attachEventListeners() {
    // New note button
    newNoteBtn.addEventListener('click', createNote);

    // Note textarea - auto-save
    noteTextarea.addEventListener('input', scheduleAutoSave);

    // Search input
    searchInput.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });

    // Notes list - delegation for click events
    notesList.addEventListener('click', (e) => {
        const noteItem = e.target.closest('.note-item');
        const deleteBtn = e.target.closest('.delete-btn');

        if (deleteBtn) {
            e.stopPropagation();
            const id = deleteBtn.dataset.id;
            deleteNote(id);
        } else if (noteItem) {
            const id = noteItem.dataset.id;
            selectNote(id);
        }
    });
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
