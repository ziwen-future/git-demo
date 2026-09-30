(() => {
  const STORAGE_KEY = "todo-app-items";

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const countEl = document.getElementById("todo-count");
  const clearBtn = document.getElementById("clear-completed");
  const filterBtns = document.querySelectorAll(".filter");

  /** @type {{ id: string, text: string, done: boolean }[]} */
  let todos = loadTodos();
  let filter = "all";

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function visibleTodos() {
    if (filter === "active") return todos.filter((t) => !t.done);
    if (filter === "completed") return todos.filter((t) => t.done);
    return todos;
  }

  function updateMeta() {
    const active = todos.filter((t) => !t.done).length;
    const done = todos.length - active;
    countEl.textContent =
      todos.length === 0
        ? "还没有待办"
        : `${active} 项未完成${done ? ` · ${done} 项已完成` : ""}`;
    clearBtn.hidden = done === 0;

    const fill = document.getElementById("progress-fill");
    if (fill) {
      const ratio = todos.length === 0 ? 0 : done / todos.length;
      fill.style.width = `${Math.round(ratio * 100)}%`;
    }
  }

  function render() {
    const items = visibleTodos();
    list.innerHTML = "";

    if (items.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.setAttribute("role", "status");
      empty.textContent =
        filter === "completed"
          ? "暂无已完成的待办"
          : filter === "active"
            ? "全部完成了，真棒"
            : "列表是空的，在上方添加第一件事吧";
      list.appendChild(empty);
      updateMeta();
      return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((todo) => {
      const li = document.createElement("li");
      li.className = `todo-item${todo.done ? " is-done" : ""}`;
      li.dataset.id = todo.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "toggle";
      checkbox.checked = todo.done;
      checkbox.setAttribute("aria-label", todo.done ? "标记为未完成" : "标记为已完成");

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn-delete";
      del.textContent = "删除";
      del.setAttribute("aria-label", `删除：${todo.text}`);

      li.append(checkbox, text, del);
      fragment.appendChild(li);
    });

    list.appendChild(fragment);
    updateMeta();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    todos.unshift({ id: uid(), text, done: false });
    saveTodos();
    input.value = "";
    input.focus();
    render();
  });

  list.addEventListener("change", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement) || !target.classList.contains("toggle")) {
      return;
    }
    const item = target.closest(".todo-item");
    if (!item) return;
    const id = item.dataset.id;
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    todo.done = target.checked;
    saveTodos();
    render();
  });

  list.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains("btn-delete")) {
      return;
    }
    const item = target.closest(".todo-item");
    if (!item) return;
    const id = item.dataset.id;

    item.classList.add("is-leaving");
    window.setTimeout(() => {
      todos = todos.filter((t) => t.id !== id);
      saveTodos();
      render();
    }, 220);
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filter = btn.dataset.filter || "all";
      filterBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      render();
    });
  });

  clearBtn.addEventListener("click", () => {
    todos = todos.filter((t) => !t.done);
    saveTodos();
    render();
  });

  render();
  input.focus();
})();
