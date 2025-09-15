class PromptManager {
  constructor() {
    this.prompts = [];
    this.currentPrompt = null;
    this.isEditing = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadPrompts();
  }

  bindEvents() {
    const newPromptBtn = document.getElementById('new-prompt-btn');
    const searchInput = document.getElementById('search');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    newPromptBtn?.addEventListener('click', () => this.createNewPrompt());
    searchInput?.addEventListener('input', e => this.filterPrompts(e.target.value));
    saveBtn?.addEventListener('click', () => this.savePrompt());
    cancelBtn?.addEventListener('click', () => this.cancelEdit());
    deleteBtn?.addEventListener('click', () => this.showDeleteModal());
    confirmDeleteBtn?.addEventListener('click', () => this.deletePrompt());
    cancelDeleteBtn?.addEventListener('click', () => this.hideDeleteModal());

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', e => this.switchTab(e.target.dataset.tab));
    });

    const contentTextarea = document.getElementById('content');
    contentTextarea?.addEventListener('input', () => this.updatePreview());
  }

  async loadPrompts() {
    try {
      const response = await fetch('/api/prompts');
      this.prompts = await response.json();
      this.renderPromptsList();
    } catch (error) {
      this.showToast('Failed to load prompts', 'error');
    }
  }

  renderPromptsList(filter = '') {
    const container = document.getElementById('prompts-list');
    if (!container) return;

    const filteredPrompts = this.prompts.filter(
      prompt =>
        prompt.name.toLowerCase().includes(filter.toLowerCase()) ||
        (prompt.frontmatter.tags &&
          Array.isArray(prompt.frontmatter.tags) &&
          prompt.frontmatter.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase())))
    );

    container.innerHTML = filteredPrompts
      .map(
        prompt => `
      <div class="prompt-item" data-name="${prompt.name}" onclick="promptManager.selectPrompt('${prompt.name}')">
        <div class="prompt-item-title">${prompt.name}</div>
        <div class="prompt-item-meta">
          ${prompt.frontmatter.model ? `Model: ${prompt.frontmatter.model}` : ''}
          ${prompt.frontmatter.version ? ` • v${prompt.frontmatter.version}` : ''}
        </div>
        ${
          prompt.frontmatter.tags
            ? `
          <div class="prompt-item-tags">
            ${
              Array.isArray(prompt.frontmatter.tags)
                ? prompt.frontmatter.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
                : prompt.frontmatter.tags
                    .split(',')
                    .map(tag => `<span class="tag">${tag.trim()}</span>`)
                    .join('')
            }
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('');
  }

  filterPrompts(query) {
    this.renderPromptsList(query);
  }

  async selectPrompt(name) {
    if (this.isEditing && !confirm('You have unsaved changes. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`/api/prompts/${name}`);
      const prompt = await response.json();
      this.currentPrompt = prompt;
      this.loadPromptIntoEditor(prompt);
      this.showEditor();

      document.querySelectorAll('.prompt-item').forEach(item => {
        item.classList.remove('active');
      });
      document.querySelector(`[data-name="${name}"]`)?.classList.add('active');
    } catch (error) {
      this.showToast('Failed to load prompt', 'error');
    }
  }

  loadPromptIntoEditor(prompt) {
    document.getElementById('prompt-name').value = prompt.name;
    document.getElementById('content').value = prompt.content;

    const frontmatter = prompt.frontmatter || {};
    document.getElementById('model').value = frontmatter.model || '';
    document.getElementById('tags').value = Array.isArray(frontmatter.tags)
      ? frontmatter.tags.join(', ')
      : frontmatter.tags || '';
    document.getElementById('argument-hint').value = frontmatter['argument-hint'] || '';
    document.getElementById('version').value = frontmatter.version || '';

    const allowedTools = frontmatter['allowed-tools'];
    document.getElementById('allowed-tools').value = Array.isArray(allowedTools)
      ? allowedTools.map(tool => `- ${tool}`).join('\n')
      : allowedTools || '';

    document.getElementById('aliases').value = Array.isArray(frontmatter.aliases)
      ? frontmatter.aliases.join(', ')
      : frontmatter.aliases || '';

    document.getElementById('targets').value = Array.isArray(frontmatter.targets)
      ? frontmatter.targets.join(', ')
      : frontmatter.targets || '';

    this.updatePreview();
    this.isEditing = false;
  }

  createNewPrompt() {
    if (this.isEditing && !confirm('You have unsaved changes. Continue?')) {
      return;
    }

    this.currentPrompt = null;
    this.clearEditor();
    this.showEditor();
    document.getElementById('prompt-name').focus();
  }

  clearEditor() {
    document.getElementById('prompt-name').value = '';
    document.getElementById('content').value = '';
    document.getElementById('model').value = '';
    document.getElementById('tags').value = '';
    document.getElementById('argument-hint').value = '';
    document.getElementById('version').value = '';
    document.getElementById('allowed-tools').value = '';
    document.getElementById('aliases').value = '';
    document.getElementById('targets').value = '';

    document.querySelectorAll('.prompt-item').forEach(item => {
      item.classList.remove('active');
    });

    this.isEditing = false;
    this.updatePreview();
  }

  showEditor() {
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('editor').style.display = 'flex';
    document.getElementById('delete-btn').style.display = this.currentPrompt
      ? 'inline-flex'
      : 'none';
  }

  hideEditor() {
    document.getElementById('empty-state').style.display = 'flex';
    document.getElementById('editor').style.display = 'none';
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    if (tabName === 'preview') {
      this.updatePreview();
    }
  }

  updatePreview() {
    const content = document.getElementById('content').value;
    const previewContainer = document.getElementById('preview-content');

    if (!content.trim()) {
      previewContainer.innerHTML =
        '<p>Select the content tab and add some content to see the preview.</p>';
      return;
    }

    const html = this.markdownToHtml(content);
    previewContainer.innerHTML = html;
  }

  markdownToHtml(markdown) {
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hul])/gm, '<p>')
      .replace(/(?<!>)$/gm, '</p>')
      .replace(/<p><\/p>/g, '');
  }

  async savePrompt() {
    const name = document.getElementById('prompt-name').value.trim();
    const content = document.getElementById('content').value.trim();

    if (!name || !content) {
      this.showToast('Name and content are required', 'error');
      return;
    }

    const frontmatter = {
      model: document.getElementById('model').value.trim() || undefined,
      tags: this.parseArray(document.getElementById('tags').value),
      'argument-hint': document.getElementById('argument-hint').value.trim() || undefined,
      version: parseInt(document.getElementById('version').value) || undefined,
      'allowed-tools': this.parseAllowedTools(document.getElementById('allowed-tools').value),
      aliases: this.parseArray(document.getElementById('aliases').value),
      targets: this.parseArray(document.getElementById('targets').value),
    };

    Object.keys(frontmatter).forEach(key => {
      if (
        frontmatter[key] === undefined ||
        frontmatter[key] === null ||
        (Array.isArray(frontmatter[key]) && frontmatter[key].length === 0)
      ) {
        delete frontmatter[key];
      }
    });

    const isNew = !this.currentPrompt;
    const url = isNew ? '/api/prompts' : `/api/prompts/${this.currentPrompt.name}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, frontmatter }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      this.showToast(
        isNew ? 'Prompt created successfully' : 'Prompt updated successfully',
        'success'
      );
      this.isEditing = false;
      await this.loadPrompts();

      if (isNew) {
        this.currentPrompt = { name, content, frontmatter };
      } else {
        this.currentPrompt.content = content;
        this.currentPrompt.frontmatter = frontmatter;
      }

      this.selectPrompt(name);
    } catch (error) {
      this.showToast(error.message || 'Failed to save prompt', 'error');
    }
  }

  parseArray(value) {
    if (!value.trim()) return undefined;
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item);
  }

  parseAllowedTools(value) {
    if (!value.trim()) return undefined;
    return value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.startsWith('- '))
      .map(line => line.substring(2));
  }

  cancelEdit() {
    if (this.isEditing && !confirm('You have unsaved changes. Continue?')) {
      return;
    }

    if (this.currentPrompt) {
      this.loadPromptIntoEditor(this.currentPrompt);
    } else {
      this.hideEditor();
    }
    this.isEditing = false;
  }

  showDeleteModal() {
    document.getElementById('delete-modal').style.display = 'flex';
  }

  hideDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
  }

  async deletePrompt() {
    if (!this.currentPrompt) return;

    try {
      const response = await fetch(`/api/prompts/${this.currentPrompt.name}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      this.showToast('Prompt deleted successfully', 'success');
      this.hideDeleteModal();
      this.hideEditor();
      this.currentPrompt = null;
      await this.loadPrompts();
    } catch (error) {
      this.showToast(error.message || 'Failed to delete prompt', 'error');
      this.hideDeleteModal();
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }
}

document.addEventListener('input', e => {
  if (e.target.matches('#prompt-name, #content, input, textarea')) {
    promptManager.isEditing = true;
  }
});

window.promptManager = new PromptManager();
