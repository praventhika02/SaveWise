const inputs = document.querySelectorAll("input");
const goalForm = document.querySelector(".goal-form");
const clearDataBtn = document.querySelector("#clearDataBtn");

let savingsGoals = JSON.parse(localStorage.getItem("savewiseGoals")) || [];

let expenseChart;
let incomeChart;
let goalChart;
let distributionChart;

const colours = ["#2f7df6", "#18a16f", "#f59e0b", "#7c3aed", "#94a3b8"];

function getNumber(id) {
  return Number(document.querySelector(`#${id}`).value) || 0;
}

function money(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

function percent(value) {
  return `${value.toFixed(1)}%`;
}

function setText(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = value;
}

function setBar(id, value) {
  const bar = document.querySelector(`#${id}`);
  if (bar) bar.style.width = `${Math.min(Math.max(value, 0), 100)}%`;
}

function saveData() {
  const data = {};
  inputs.forEach(input => {
    data[input.id] = input.value;
  });

  localStorage.setItem("savewiseInputs", JSON.stringify(data));
  localStorage.setItem("savewiseGoals", JSON.stringify(savingsGoals));
}

function loadData() {
  const savedInputs = JSON.parse(localStorage.getItem("savewiseInputs")) || {};

  Object.keys(savedInputs).forEach(id => {
    const input = document.querySelector(`#${id}`);
    if (input) input.value = savedInputs[id];
  });
}

function goalStatus(needed, available) {
  if (available >= needed) return "Achievable";
  if (available >= needed * 0.5) return "Challenging";
  return "Not achievable";
}

function statusClass(status) {
  if (status === "Achievable") return "status-achievable";
  if (status === "Challenging") return "status-challenging";
  if (status === "Not achievable") return "status-not-achievable";
  return "status-neutral";
}

function goalsWithDetails(availableToSave) {
  return savingsGoals.map(goal => {
    const monthlySavingsNeeded = goal.price / goal.months;
    const status = goalStatus(monthlySavingsNeeded, availableToSave);

    return {
      ...goal,
      monthlySavingsNeeded,
      status
    };
  });
}

function rankedGoals(availableToSave) {
  const order = {
    "Achievable": 0,
    "Challenging": 1,
    "Not achievable": 2
  };

  return goalsWithDetails(availableToSave).sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    if (a.monthlySavingsNeeded !== b.monthlySavingsNeeded) return a.monthlySavingsNeeded - b.monthlySavingsNeeded;
    return a.months - b.months;
  });
}

function renderGoals(availableToSave) {
  const goalsList = document.querySelector("#goalsList");
  goalsList.innerHTML = "";

  if (savingsGoals.length === 0) {
    goalsList.textContent = "No goals added yet.";
    return;
  }

  goalsWithDetails(availableToSave).forEach(goal => {
    const item = document.createElement("div");
    item.className = "goal-item";

    item.innerHTML = `
      <div>
        <strong>${goal.name}</strong>
        <span>${money(goal.price)} over ${goal.months} months • ${money(goal.monthlySavingsNeeded)} / month</span>
        <span class="goal-status-badge ${statusClass(goal.status)}">${goal.status}</span>
      </div>
      <button class="delete-goal-button" type="button">Delete</button>
    `;

    item.querySelector("button").addEventListener("click", () => {
      savingsGoals = savingsGoals.filter(savedGoal => savedGoal.id !== goal.id);
      calculate();
    });

    goalsList.appendChild(item);
  });
}

function renderPriority(availableToSave) {
  const priorityList = document.querySelector("#priorityList");
  const priorityRecommendation = document.querySelector("#priorityRecommendation");

  priorityList.innerHTML = "";

  if (savingsGoals.length === 0) {
    priorityList.textContent = "Add goals to see your priority ranking.";
    priorityRecommendation.textContent = "Your first goal recommendation will appear here.";
    return null;
  }

  const ranked = rankedGoals(availableToSave);

  ranked.forEach((goal, index) => {
    const item = document.createElement("div");
    item.className = "priority-item";
    item.innerHTML = `
      <strong>${index + 1}. ${goal.name}</strong>
      <span>${money(goal.monthlySavingsNeeded)} / month • ${goal.status}</span>
    `;
    priorityList.appendChild(item);
  });

  const topGoal = ranked[0];

  if (topGoal.status === "Achievable") {
    priorityRecommendation.textContent = `Start with ${topGoal.name}. It fits your current student budget.`;
  } else {
    priorityRecommendation.textContent = `Delay ${topGoal.name} or increase the timeline so it becomes easier to afford.`;
  }

  return topGoal;
}

function addGoal(event) {
  event.preventDefault();

  const nameInput = document.querySelector("#goalName");
  const priceInput = document.querySelector("#goalPrice");
  const monthsInput = document.querySelector("#goalMonths");

  const name = nameInput.value.trim() || "Untitled goal";
  const price = Number(priceInput.value) || 0;
  const months = Number(monthsInput.value) || 0;

  if (price <= 0 || months <= 0) {
    alert("Please enter a valid goal price and target months.");
    return;
  }

  savingsGoals.push({
    id: Date.now(),
    name,
    price,
    months
  });

  nameInput.value = "";
  priceInput.value = "";
  monthsInput.value = "";

  calculate();
}

function updateTimeline(goal, availableToSave) {
  const container = document.querySelector("#timelineContainer");
  container.innerHTML = "";

  if (!goal) {
    container.textContent = "Add a goal to view your savings timeline.";
    return;
  }

  if (availableToSave <= 0) {
    container.textContent = "You currently do not have enough remaining money to build a timeline.";
    return;
  }

  for (let month = 1; month <= goal.months; month++) {
    const saved = availableToSave * month;
    const progress = Math.min((saved / goal.price) * 100, 100);

    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <div class="timeline-label">
        <span>Month ${month}: ${money(saved)} saved</span>
        <strong>${percent(progress)}</strong>
      </div>
      <div class="bar"><div style="width:${progress}%"></div></div>
    `;

    container.appendChild(item);
  }
}

function updateOptimiser(goal, availableToSave, expenses) {
  const optimiserText = document.querySelector("#optimiserText");
  optimiserText.innerHTML = "";

  if (!goal) {
    optimiserText.textContent = "Add a goal to see suggested spending cuts.";
    return;
  }

  const shortfall = goal.monthlySavingsNeeded - availableToSave;

  if (shortfall <= 0) {
    optimiserText.textContent = "You are already on track. No spending cuts are needed.";
    return;
  }

  let remaining = shortfall;

  const categories = [
    { name: "entertainment", amount: expenses.entertainment, limit: 0.5 },
    { name: "shopping", amount: expenses.shopping, limit: 0.5 },
    { name: "others", amount: expenses.others, limit: 0.4 },
    { name: "food", amount: expenses.food, limit: 0.2 }
  ];

  categories.forEach(category => {
    const cut = Math.min(remaining, category.amount * category.limit);

    if (cut > 0) {
      const item = document.createElement("div");
      item.className = "optimiser-item";
      item.textContent = `Reduce ${category.name} by ${money(cut)}`;
      optimiserText.appendChild(item);
      remaining -= cut;
    }
  });

  if (remaining > 0.01) {
    const item = document.createElement("div");
    item.className = "optimiser-item";
    item.textContent = `You still need ${money(remaining)} more. Try extending your timeline.`;
    optimiserText.appendChild(item);
  }
}

function updateHealthScore(savingsPercent, safetyMonths, balanced, topGoal) {
  const savingsPoints = Math.min(Math.max(savingsPercent, 0) / 20, 1) * 40;
  const safetyPoints = Math.min(Math.max(safetyMonths, 0) / 2, 1) * 25;
  const budgetPoints = balanced ? 20 : 10;

  let goalPoints = 0;
  if (topGoal?.status === "Achievable") goalPoints = 15;
  else if (topGoal?.status === "Challenging") goalPoints = 8;
  else if (topGoal) goalPoints = 3;

  const score = Math.round(savingsPoints + safetyPoints + budgetPoints + goalPoints);

  let grade = "Needs Improvement";
  if (score >= 85) grade = "Excellent";
  else if (score >= 70) grade = "Good";
  else if (score >= 50) grade = "Fair";

  setText("healthScore", `${score} / 100`);
  setText("healthGrade", grade);

  if (score >= 85) {
    setText("healthSummary", "Excellent work. You are managing your student money very well.");
  } else if (savingsPercent < 20) {
    setText("healthSummary", "Your savings rate can improve. Try setting aside a small amount whenever you receive allowance or income.");
  } else if (safetyMonths < 1) {
    setText("healthSummary", "Your student safety buffer is still light. Keep some money aside for sudden school costs.");
  } else if (!topGoal) {
    setText("healthSummary", "Your basics look steady. Add a goal to make your plan more focused.");
  } else {
    setText("healthSummary", "You are building good money habits. Keep tracking your goals consistently.");
  }
}

function coachMessage(topGoal, income, savingsPercent, availableToSave, expenses) {
  if (income === 0) return "Enter your allowance or part-time income so SaveWise can analyse your student budget.";
  if (!topGoal) return "Add a savings goal to receive a personalised student finance plan.";

  const largest = Object.entries(expenses).sort((a, b) => b[1] - a[1])[0];
  const largestName = largest[0];
  const largestAmount = largest[1];
  const largestPercent = income > 0 ? (largestAmount / income) * 100 : 0;

  if (topGoal.status === "Achievable") {
    return `You can reach your ${topGoal.name} goal in ${topGoal.months} months by saving ${money(topGoal.monthlySavingsNeeded)} monthly. Your largest expense is ${largestName}, using ${percent(largestPercent)} of your income.`;
  }

  return `Your ${topGoal.name} goal needs more planning. You need ${money(topGoal.monthlySavingsNeeded)} monthly, but currently have ${money(availableToSave)} available. Try reducing ${largestName} spending slightly or extending the timeline.`;
}

function createCharts() {
  expenseChart = new Chart(document.querySelector("#expenseChart"), {
    type: "doughnut",
    data: {
      labels: ["Food", "Transport", "Entertainment", "Shopping", "Others"],
      datasets: [{ data: [0, 0, 0, 0, 0], backgroundColor: colours }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  incomeChart = new Chart(document.querySelector("#incomeChart"), {
    type: "bar",
    data: {
      labels: ["Income", "Expenses", "Remaining"],
      datasets: [{ data: [0, 0, 0], backgroundColor: colours }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  goalChart = new Chart(document.querySelector("#goalChart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Projected Savings", data: [], borderColor: "#18a16f", tension: 0.35 },
        { label: "Goal Price", data: [], borderColor: "#f59e0b", borderDash: [6, 6] }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  distributionChart = new Chart(document.querySelector("#distributionChart"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [{ data: [], backgroundColor: colours }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

function updateCharts(income, totalExpenses, availableToSave, expenses, topGoal) {
  if (!expenseChart) createCharts();

  expenseChart.data.datasets[0].data = [
    expenses.food,
    expenses.transport,
    expenses.entertainment,
    expenses.shopping,
    expenses.others
  ];

  incomeChart.data.datasets[0].data = [income, totalExpenses, availableToSave];

  const distribution = Object.entries(expenses)
    .map(([name, amount]) => ({ name, value: income > 0 ? (amount / income) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  distributionChart.data.labels = distribution.map(item => item.name);
  distributionChart.data.datasets[0].data = distribution.map(item => item.value.toFixed(1));

  if (topGoal && availableToSave > 0) {
    goalChart.data.labels = [];
    goalChart.data.datasets[0].data = [];
    goalChart.data.datasets[1].data = [];

    for (let month = 1; month <= topGoal.months; month++) {
      goalChart.data.labels.push(`M${month}`);
      goalChart.data.datasets[0].data.push(availableToSave * month);
      goalChart.data.datasets[1].data.push(topGoal.price);
    }
  } else {
    goalChart.data.labels = [];
    goalChart.data.datasets[0].data = [];
    goalChart.data.datasets[1].data = [];
  }

  expenseChart.update();
  incomeChart.update();
  goalChart.update();
  distributionChart.update();
}

function calculate() {
  const balance = getNumber("balance");
  const income = getNumber("income");

  const expenses = {
    transport: getNumber("transport"),
    food: getNumber("food"),
    entertainment: getNumber("entertainment"),
    shopping: getNumber("shopping"),
    others: getNumber("others")
  };

  const totalExpenses = Object.values(expenses).reduce((sum, value) => sum + value, 0);
  const availableToSave = balance + income - totalExpenses;

  const needs = expenses.transport + expenses.food;
  const wants = expenses.entertainment + expenses.shopping + expenses.others;

  const needsPercent = income > 0 ? (needs / income) * 100 : 0;
  const wantsPercent = income > 0 ? (wants / income) * 100 : 0;
  const savingsPercent = income > 0 ? (availableToSave / income) * 100 : 0;
  const safetyMonths = totalExpenses > 0 ? balance / totalExpenses : 0;
  const balanced = needsPercent <= 50 && wantsPercent <= 30 && savingsPercent >= 20;

  renderGoals(availableToSave);
  const topGoal = renderPriority(availableToSave);

  setText("incomeDisplay", money(income));
  setText("totalExpenses", money(totalExpenses));
  setText("remainingMoney", money(availableToSave));
  setText("savingsRate", percent(savingsPercent));
  setText("monthlySavingsNeeded", money(topGoal ? topGoal.monthlySavingsNeeded : 0));

  setText("needsPercent", percent(needsPercent));
  setText("wantsPercent", percent(wantsPercent));
  setText("savingsPercent", percent(savingsPercent));

  setBar("needsBar", needsPercent);
  setBar("wantsBar", wantsPercent);
  setBar("savingsBar", savingsPercent);

  if (!topGoal) {
    setText("goalStatus", "Enter a goal");
    document.querySelector("#goalStatus").className = "status-pill status-neutral";
  } else {
    setText("goalStatus", topGoal.status);
    document.querySelector("#goalStatus").className = `status-pill ${statusClass(topGoal.status)}`;
  }

  if (income === 0) {
    setText("budgetRuleStatus", "Enter monthly income to analyse your budget.");
  } else if (balanced) {
    setText("budgetRuleStatus", "Healthy student budget balance.");
  } else if (savingsPercent < 20) {
    setText("budgetRuleStatus", "Savings are below 20%. Try reducing wants spending.");
  } else if (needsPercent > 50) {
    setText("budgetRuleStatus", "Needs spending is high. Review food and transport costs.");
  } else {
    setText("budgetRuleStatus", "Wants spending is high. Reduce lifestyle expenses to save faster.");
  }

  setText("safetyBufferMonths", `Your current balance can cover ${safetyMonths.toFixed(1)} months of your usual student expenses.`);
  setBar("safetyBufferBar", (safetyMonths / 2) * 100);

  if (totalExpenses === 0) setText("safetyBufferStatus", "Enter your usual monthly expenses to check your safety buffer.");
  else if (safetyMonths < 0.5) setText("safetyBufferStatus", "Low buffer — keep some money aside for unexpected student expenses.");
  else if (safetyMonths < 1) setText("safetyBufferStatus", "Basic buffer — you can cover about half to one month of expenses.");
  else if (safetyMonths < 2) setText("safetyBufferStatus", "Good buffer — you can handle most small unexpected costs.");
  else setText("safetyBufferStatus", "Strong buffer — you are managing your student finances well.");

  if (!topGoal) {
    setText("recommendationText", "Set a goal to receive a personalised savings plan.");
  } else if (topGoal.status === "Achievable") {
    setText("recommendationText", `You are on track for ${topGoal.name}. Save ${money(topGoal.monthlySavingsNeeded)} each month.`);
  } else {
    setText("recommendationText", `You need more room for ${topGoal.name}. Reduce spending or increase the timeline.`);
  }

  updateTimeline(topGoal, availableToSave);
  updateOptimiser(topGoal, availableToSave, expenses);
  updateHealthScore(savingsPercent, safetyMonths, balanced, topGoal);
  setText("coachMessage", coachMessage(topGoal, income, savingsPercent, availableToSave, expenses));
  updateCharts(income, totalExpenses, availableToSave, expenses, topGoal);
  saveData();
}

inputs.forEach(input => input.addEventListener("input", calculate));
goalForm.addEventListener("submit", addGoal);

clearDataBtn.addEventListener("click", () => {
  localStorage.removeItem("savewiseInputs");
  localStorage.removeItem("savewiseGoals");
  savingsGoals = [];
  inputs.forEach(input => input.value = "");
  calculate();
});

loadData();
calculate();