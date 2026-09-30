(() => {
  const STORAGE_KEY = "todo-app-items";
  const CHECKIN_KEY = "todo-app-checkins";
  const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const countEl = document.getElementById("todo-count");
  const clearBtn = document.getElementById("clear-completed");
  const filterBtns = document.querySelectorAll(".filter");

  const checkinStatus = document.getElementById("checkin-status");
  const checkinBtn = document.getElementById("checkin-btn");
  const checkinStreak = document.getElementById("checkin-streak");
  const checkinTotal = document.getElementById("checkin-total");
  const checkinWeek = document.getElementById("checkin-week");

  /** @type {{ id: string, text: string, done: boolean }[]} */
  let todos = loadTodos();
  /** @type {string[]} */
  let checkins = loadCheckins();
  let filter = "all";

  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function loadCheckins() {
    try {
      const raw = localStorage.getItem(CHECKIN_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  function saveCheckins() {
    localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkins));
  }

  function streakCount() {
    const set = new Set(checkins);
    const cursor = new Date();
    if (!set.has(dateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
      if (!set.has(dateKey(cursor))) return 0;
    }
    let count = 0;
    while (set.has(dateKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  function renderCheckin() {
    const today = dateKey(new Date());
    const checkedToday = checkins.includes(today);
    checkinStatus.textContent = checkedToday ? "今天已打卡" : "今天还没打卡";
    checkinBtn.textContent = checkedToday ? "已打卡" : "打卡";
    checkinBtn.disabled = checkedToday;
    checkinStreak.textContent = `连续 ${streakCount()} 天`;
    checkinTotal.textContent = `累计 ${checkins.length} 次`;

    checkinWeek.innerHTML = "";
    const fragment = document.createDocumentFragment();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date();
      day.setDate(day.getDate() - offset);
      const key = dateKey(day);
      const li = document.createElement("li");
      li.className = "checkin-day";
      if (key === today) li.classList.add("is-today");
      if (checkins.includes(key)) li.classList.add("is-done");

      const label = document.createElement("span");
      label.className = "checkin-day-label";
      label.textContent = WEEKDAYS[day.getDay()];

      const mark = document.createElement("span");
      mark.className = "checkin-mark";
      mark.setAttribute("aria-hidden", "true");

      li.append(label, mark);
      li.setAttribute("aria-label", `${key} ${checkins.includes(key) ? "已打卡" : "未打卡"}`);
      fragment.appendChild(li);
    }
    checkinWeek.appendChild(fragment);
  }

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

  checkinBtn.addEventListener("click", () => {
    const today = dateKey(new Date());
    if (checkins.includes(today)) return;
    checkins.push(today);
    saveCheckins();
    renderCheckin();
  });

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
  renderCheckin();
  input.focus();
})();
