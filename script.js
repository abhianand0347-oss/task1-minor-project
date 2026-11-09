
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskPriority = document.getElementById("taskPriority");
const taskDueDate = document.getElementById("taskDueDate");

const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const sortSelect = document.getElementById("sortSelect");

const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const formHeading = document.getElementById("formHeading");

// Load saved tasks from Local Storage
let tasks = JSON.parse(localStorage.getItem("taskflowTasks")) || [];
let editingTaskId = null;

// Today's date
const today = new Date().toISOString().split("T")[0];

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

taskDueDate.min = today;

// Save tasks in Local Storage
function saveTasks() {
    localStorage.setItem("taskflowTasks", JSON.stringify(tasks));
}

// Check whether task is overdue
function isOverdue(task) {
    return task.status === "Pending" && task.dueDate < today;
}

// Update dashboard statistics
function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === "Completed").length;
    const pending = tasks.filter(task => task.status === "Pending").length;
    const overdue = tasks.filter(isOverdue).length;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("overdueTasks").textContent = overdue;
}

// Display tasks
function renderTasks() {
    const searchText = searchInput.value.toLowerCase().trim();

    let filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchText) ||
            task.description.toLowerCase().includes(searchText);

        const matchesStatus =
            statusFilter.value === "All" ||
            task.status === statusFilter.value;

        const matchesPriority =
            priorityFilter.value === "All" ||
            task.priority === priorityFilter.value;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sorting
    if (sortSelect.value === "newest") {
        filteredTasks.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortSelect.value === "oldest") {
        filteredTasks.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortSelect.value === "dueDate") {
        filteredTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    } else if (sortSelect.value === "priority") {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };

        filteredTasks.sort(
            (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
        );
    }

    taskList.innerHTML = "";

    document.getElementById("taskCount").textContent =
        `${filteredTasks.length} tasks`;

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <h3>No tasks found</h3>
                <p>Add a task or change your filters.</p>
            </div>
        `;

        updateDashboard();
        return;
    }

    filteredTasks.forEach(task => {
        const card = document.createElement("article");

        card.className =
            `task-card ${task.status === "Completed" ? "completed" : ""}`;

        const title = document.createElement("h3");
        title.className = "task-title";
        title.textContent = task.title;

        const description = document.createElement("p");
        description.className = "task-description";
        description.textContent = task.description || "No description";

        const top = document.createElement("div");
        top.className = "task-top";

        top.append(title);

        const status = document.createElement("span");
        status.className = "tag";
        status.textContent = task.status;

        top.append(status);

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const priority = document.createElement("span");
        priority.className = `tag priority-${task.priority}`;
        priority.textContent = `${task.priority} Priority`;

        const dueDate = document.createElement("span");
        dueDate.className = "tag";
        dueDate.textContent = `Due: ${task.dueDate}`;

        const createdDate = document.createElement("span");
        createdDate.className = "tag";
        createdDate.textContent = `Created: ${task.createdDate}`;

        meta.append(priority, dueDate, createdDate);

        if (isOverdue(task)) {
            const overdueTag = document.createElement("span");
            overdueTag.className = "tag overdue";
            overdueTag.textContent = "Overdue";
            meta.append(overdueTag);
        }

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const toggleButton = document.createElement("button");
        toggleButton.textContent =
            task.status === "Completed" ? "Mark Pending" : "Complete";

        toggleButton.addEventListener("click", () => {
            toggleTask(task.id);
        });

        const editButton = document.createElement("button");
        editButton.className = "edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editTask(task.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        actions.append(toggleButton, editButton, deleteButton);

        card.append(top, description, meta, actions);

        taskList.append(card);
    });

    updateDashboard();
}

// Add or update task
taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const priority = taskPriority.value;
    const dueDate = taskDueDate.value;

    if (!title) {
        alert("Please enter a task title.");
        return;
    }

    if (!dueDate || dueDate < today) {
        alert("Please select today or a future due date.");
        return;
    }

    if (editingTaskId !== null) {
        const task = tasks.find(task => task.id === editingTaskId);

        task.title = title;
        task.description = description;
        task.priority = priority;
        task.dueDate = dueDate;
    } else {
        const newTask = {
            id: Date.now(),
            title: title,
            description: description,
            priority: priority,
            createdDate: today,
            createdAt: Date.now(),
            dueDate: dueDate,
            status: "Pending"
        };

        tasks.push(newTask);
    }

    saveTasks();
    resetForm();
    renderTasks();
});

// Edit task
function editTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    editingTaskId = id;

    taskTitle.value = task.title;
    taskDescription.value = task.description;
    taskPriority.value = task.priority;
    taskDueDate.value = task.dueDate;

    formHeading.textContent = "Edit Task";
    saveButton.textContent = "Update Task";
    cancelButton.hidden = false;

    document.querySelector(".task-form-section").scrollIntoView({
        behavior: "smooth"
    });
}

// Reset form
function resetForm() {
    taskForm.reset();

    editingTaskId = null;

    formHeading.textContent = "Create a New Task";
    saveButton.textContent = "Add Task";
    cancelButton.hidden = true;

    taskPriority.value = "Medium";
    taskDueDate.min = today;
}

// Cancel edit
cancelButton.addEventListener("click", resetForm);

// Complete or pending
function toggleTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) return;

    task.status =
        task.status === "Completed" ? "Pending" : "Completed";

    saveTasks();
    renderTasks();
}

// Delete task
function deleteTask(id) {
    const confirmed = confirm(
        "Are you sure you want to permanently delete this task?"
    );

    if (!confirmed) return;

    tasks = tasks.filter(task => task.id !== id);

    saveTasks();
    renderTasks();
}

// Search, filter and sorting events
searchInput.addEventListener("input", renderTasks);
statusFilter.addEventListener("change", renderTasks);
priorityFilter.addEventListener("change", renderTasks);
sortSelect.addEventListener("change", renderTasks);

// Initial display
renderTasks();
