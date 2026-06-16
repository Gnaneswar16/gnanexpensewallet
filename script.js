const api = "SCRIPT API";

let expenseChart, trendChart, categoryChart;

/* Default Date */
document.getElementById("date").valueAsDate = new Date();

const categorySelect = document.getElementById("category");
const typeSelect = document.getElementById("type");

/* CATEGORY LIST */
const categories = {
  Income: [
    "💵Savings",
    "💼Salary",
    "🏢Business",
    "📈Investment",
    "🧑‍💻Freelance",
    "🎁Gift",
    "➕Other"
  ],

  Expense: [
    "🍔Food",
    "🎀Gifts",
    "🏥Health/medical",
    "🏠Home",
    "🚌Transportation",
    "🧴Personal",
    "🐾Pets",
    "💡Utilities",
    "🚙Travel",
    "💳Debt",
    "➖Other",
    "📊Stocks",
    "🏡💸Sending home"
  ]
};

/* Populate Categories */
typeSelect.addEventListener("change", () => {

  const selectedType = typeSelect.value;

  categorySelect.innerHTML =
    `<option value="">Select Category</option>`;

  if (categories[selectedType]) {

    categories[selectedType].forEach(cat => {

      const option = document.createElement("option");

      option.value = cat;
      option.textContent = cat;

      categorySelect.appendChild(option);

    });

  }

});

/* Currency Formatter */
function formatCurrency(amount) {

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);

}

/* Format Date */
function formatDate(dateString) {

  const date = new Date(dateString);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

}

/* Modal */
function openModal() {
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

/* Add Transaction */
document
  .getElementById("expenseForm")
  .addEventListener("submit", async e => {

    e.preventDefault();

    const data = {
      date: document.getElementById("date").value,
      type: document.getElementById("type").value,
      category: document.getElementById("category").value,
      amount: Number(document.getElementById("amount").value),
      note: document.getElementById("note").value
    };

    await fetch(api, {
      method: "POST",
      body: new URLSearchParams({
        data: JSON.stringify(data)
      })
    });

    closeModal();

    document.getElementById("expenseForm").reset();
    document.getElementById("date").valueAsDate = new Date();

    loadData();

  });

/* Delete Transaction */
async function deleteRow(rowNumber) {

  await fetch(api, {
    method: "POST",
    body: new URLSearchParams({
      data: JSON.stringify({
        action: "delete",
        row: rowNumber
      })
    })
  });

  loadData();

}

/* Dark Mode */
document
  .getElementById("darkToggle")
  .addEventListener("click", () => {

    document.body.classList.toggle("dark");

  });

/* Month Filter */
document
  .getElementById("monthFilter")
  .addEventListener("change", loadData);

/* Load Data */
async function loadData() {

  const res = await fetch(api);
  let rows = await res.json();

  rows.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const filterMonth =
    document.getElementById("monthFilter").value;

  let income = 0;
  let expense = 0;

  let monthlyIncome = {};
  let monthlyExpense = {};
  let categoryData = {};

  const list = document.getElementById("list");
  list.innerHTML = "";

  rows.forEach(r => {

    if (!r.date) return;

    if (
      filterMonth &&
      !r.date.startsWith(filterMonth)
    ) {
      return;
    }

    const monthKey = r.date.slice(0, 7);
    const amount = Number(r.amount);
    const category = r.category;

    if (!monthlyIncome[monthKey])
      monthlyIncome[monthKey] = 0;

    if (!monthlyExpense[monthKey])
      monthlyExpense[monthKey] = 0;

    if (!categoryData[category])
      categoryData[category] = 0;

    if (r.type === "Income") {

      income += amount;
      monthlyIncome[monthKey] += amount;

    } else {

      expense += amount;
      monthlyExpense[monthKey] += amount;
      categoryData[category] += amount;

    }

    const li = document.createElement("li");

    li.classList.add("transaction");

    li.innerHTML = `
      <div class="left">
        <div class="category">${category}</div>

        <div class="meta">
          ${formatDate(r.date)}
          ${r.note ? " • " + r.note : ""}
        </div>
      </div>

      <div class="right ${
        r.type === "Income"
          ? "income"
          : "expense"
      }">

      ${
        r.type === "Income"
          ? "+"
          : "-"
      }

      ${formatCurrency(amount)}

      <button
        class="delete-btn"
        onclick="deleteRow(${r.rowNumber})">
        ✖
      </button>

      </div>
    `;

    list.appendChild(li);

  });

  document.getElementById("income").innerText =
    formatCurrency(income);

  document.getElementById("expense").innerText =
    formatCurrency(expense);

  document.getElementById("balance").innerText =
    formatCurrency(income - expense);

  if (expenseChart) expenseChart.destroy();
  if (trendChart) trendChart.destroy();
  if (categoryChart) categoryChart.destroy();

  /* Income vs Expense */

  expenseChart = new Chart(
    document.getElementById("expenseChart"),
    {
      type: "doughnut",

      data: {
        labels: ["Income", "Expense"],

        datasets: [{
          data: [income, expense],
          backgroundColor: [
            "#2ecc71",
            "#ff4d6d"
          ]
        }]
      }
    }
  );

  /* Monthly Trend */

  const allMonths = [
    ...new Set([
      ...Object.keys(monthlyIncome),
      ...Object.keys(monthlyExpense)
    ])
  ].sort(
    (a, b) => new Date(a) - new Date(b)
  );

  trendChart = new Chart(
    document.getElementById("trendChart"),
    {
      type: "line",

      data: {
        labels: allMonths.map(month => {

          const date =
            new Date(month + "-01");

          return date.toLocaleString(
            "en-IN",
            {
              month: "short",
              year: "numeric"
            }
          );

        }),

        datasets: [

          {
            label: "Income",
            data: allMonths.map(
              m => monthlyIncome[m] || 0
            ),
            borderColor: "#2ecc71",
            backgroundColor:
              "rgba(46,204,113,0.15)",
            fill: true,
            tension: 0.4
          },

          {
            label: "Expense",
            data: allMonths.map(
              m => monthlyExpense[m] || 0
            ),
            borderColor: "#ff4d6d",
            backgroundColor:
              "rgba(255,77,109,0.15)",
            fill: true,
            tension: 0.4
          }

        ]
      },

      options: {
        responsive: true,

        interaction: {
          mode: "index",
          intersect: false
        },

        plugins: {
          legend: {
            position: "top"
          }
        }
      }
    }
  );

  /* Category Breakdown */

  const sortedCategories =
    Object.entries(categoryData)
      .sort((a, b) => b[1] - a[1]);

  categoryChart = new Chart(
    document.getElementById("categoryChart"),
    {
      type: "bar",

      data: {
        labels: sortedCategories.map(
          item => item[0]
        ),

        datasets: [{
          data: sortedCategories.map(
            item => item[1]
          ),

          borderRadius: 12,

          backgroundColor: [
            "#6366F1",
            "#8B5CF6",
            "#EC4899",
            "#F97316",
            "#FACC15",
            "#22C55E",
            "#14B8A6",
            "#06B6D4",
            "#3B82F6",
            "#64748B",
            "#EF4444",
            "#84CC16",
            "#A855F7"
          ]
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",

        plugins: {
          legend: {
            display: false
          }
        }
      }
    }
  );

}

loadData();
