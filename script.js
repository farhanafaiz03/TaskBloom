const storageKey = "dailyPlannerTasks";

const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskPriorityInput = document.getElementById("taskPriority");
const taskTimeInput = document.getElementById("taskTime");
const taskDateInput = document.getElementById("taskDate");
const taskList = document.getElementById("taskList");
const suggestionText = document.getElementById("suggestionText");

const totalTasksEl = document.getElementById("totalTasks");
const doneTasksEl = document.getElementById("doneTasks");
const leftTasksEl = document.getElementById("leftTasks");
const todayDateEl = document.getElementById("todayDate");

const filterButtons = document.querySelectorAll(".filter-btn");

let currentFilter = "all";
let tasks = JSON.parse(localStorage.getItem(storageKey)) || [];

function setDefaultDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  taskDateInput.value = `${yyyy}-${mm}-${dd}`;
}

function updateTodayDate() {
  const now = new Date();
  const options = { weekday: "short", month: "short", day: "numeric" };
  todayDateEl.textContent = now.toLocaleDateString("en-US", options);
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function getPriorityClass(priority) {
  return {
    high: "priority-high",
    medium: "priority-medium",
    low: "priority-low",
  }[priority];
}

function getFilteredTasks() {
  const today = new Date().toISOString().split("T")[0];

  switch (currentFilter) {
    case "today":
      return tasks.filter((task) => task.date === today);
    case "high":
      return tasks.filter((task) => task.priority === "high");
    case "pending":
      return tasks.filter((task) => !task.completed);
    default:
      return tasks;
  }
}

function getSuggestion() {
  const remaining = tasks.filter((task) => !task.completed);

  if (remaining.length === 0) {
    return "Excellent! You completed everything for today.";
  }

  const highPriority = remaining.filter((task) => task.priority === "high");

  if (highPriority.length > 0) {
    return `Start with "${highPriority[0].title}" — it is your most important task today.`;
  }

  if (remaining.length >= 3) {
    return "You have multiple tasks. Focus on the hardest one first and keep momentum.";
  }

  return "Nice progress. Keep your energy on the next task and finish strong.";
}

function updateSummary() {
  const total = tasks.length;
  const done = tasks.filter((task) => task.completed).length;
  const left = total - done;

  totalTasksEl.textContent = total;
  doneTasksEl.textContent = done;
  leftTasksEl.textContent = left;

  suggestionText.textContent = getSuggestion();
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `
      <li class="empty-state">
        No tasks in this view. Add a new task to get started.
      </li>
    `;
    return;
  }

  taskList.innerHTML = filteredTasks
    .sort((a, b) => {
      if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .map(
      (task) => `
        <li class="task-item">
          <div class="task-main">
            <input
              type="checkbox"
              class="task-check"
              data-id="${task.id}"
              ${task.completed ? "checked" : ""}
            />
            <div class="task-text">
              <div class="task-title ${task.completed ? "done" : ""}">
                ${task.title}
              </div>
              <div class="task-meta">
                ${task.date || "No date"} ${task.time ? "• " + task.time : ""}
              </div>
            </div>
          </div>

          <div class="task-actions">
            <span class="priority-badge ${getPriorityClass(task.priority)}">
              ${task.priority}
            </span>
            <button class="delete-btn" data-id="${task.id}">Delete</button>
          </div>
        </li>
      `
    )
    .join("");
}

function addTask(event) {
  event.preventDefault();

  const title = taskTitleInput.value.trim();
  const priority = taskPriorityInput.value;
  const time = taskTimeInput.value;
  const date = taskDateInput.value || new Date().toISOString().split("T")[0];

  if (!title) return;

  const newTask = {
    id: Date.now(),
    title,
    priority,
    time,
    date,
    completed: false,
  };

  tasks.unshift(newTask);
  saveTasks();
  updateSummary();
  renderTasks();

  taskForm.reset();
  taskPriorityInput.value = "medium";
  setDefaultDate();
}

function toggleTaskComplete(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );

  saveTasks();
  updateSummary();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  updateSummary();
  renderTasks();
}

taskForm.addEventListener("submit", addTask);

taskList.addEventListener("click", (event) => {
  const deleteBtn = event.target.closest(".delete-btn");
  if (deleteBtn) {
    deleteTask(Number(deleteBtn.dataset.id));
    return;
  }
});

taskList.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".task-check");
  if (checkbox) {
    toggleTaskComplete(Number(checkbox.dataset.id));
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    renderTasks();
  });
});

setDefaultDate();
updateTodayDate();
updateSummary();
renderTasks();
