const form = document.getElementById("holdingForm");
const holdingsBody = document.getElementById("holdingsBody");
const allocationGrid = document.getElementById("allocationGrid");
const totalValue = document.getElementById("totalValue");
const totalCost = document.getElementById("totalCost");
const totalGain = document.getElementById("totalGain");
const clearAllButton = document.getElementById("clearAll");
const seedDataButton = document.getElementById("seedData");
const allocationTemplate = document.getElementById("allocationCardTemplate");

const STORAGE_KEY = "portfolio-holdings";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);

const loadHoldings = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse holdings", error);
    return [];
  }
};

const saveHoldings = (holdings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
};

const calculateTotals = (holdings) => {
  return holdings.reduce(
    (acc, holding) => {
      acc.cost += holding.shares * holding.cost;
      acc.value += holding.shares * holding.price;
      return acc;
    },
    { cost: 0, value: 0 }
  );
};

const renderTotals = (holdings) => {
  const totals = calculateTotals(holdings);
  const gain = totals.value - totals.cost;

  totalValue.textContent = formatCurrency(totals.value);
  totalCost.textContent = formatCurrency(totals.cost);
  totalGain.textContent = formatCurrency(gain);
  totalGain.classList.remove("positive", "negative", "neutral");
  if (gain > 0) {
    totalGain.classList.add("positive");
  } else if (gain < 0) {
    totalGain.classList.add("negative");
  } else {
    totalGain.classList.add("neutral");
  }
};

const renderHoldings = (holdings) => {
  holdingsBody.innerHTML = "";

  holdings.forEach((holding, index) => {
    const row = document.createElement("tr");
    const costBasis = holding.shares * holding.cost;
    const marketValue = holding.shares * holding.price;
    const gain = marketValue - costBasis;

    row.innerHTML = `
      <td>
        <strong>${holding.name}</strong><br />
        <span class="muted">${holding.ticker}</span>
      </td>
      <td>${holding.category}</td>
      <td>${formatNumber(holding.shares)}</td>
      <td>${formatCurrency(costBasis)}</td>
      <td>${formatCurrency(marketValue)}</td>
      <td class="${gain >= 0 ? "positive" : "negative"}">${formatCurrency(gain)}</td>
      <td>${holding.notes || "—"}</td>
      <td><button class="ghost" data-index="${index}">Remove</button></td>
    `;

    holdingsBody.appendChild(row);
  });

  if (holdings.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="8" class="empty">No holdings yet. Add your first investment above.</td>
    `;
    holdingsBody.appendChild(emptyRow);
  }
};

const renderAllocation = (holdings) => {
  allocationGrid.innerHTML = "";
  const totals = calculateTotals(holdings);

  if (holdings.length === 0 || totals.value === 0) {
    allocationGrid.innerHTML =
      "<p class=\"muted\">Add holdings to see allocation by asset class.</p>";
    return;
  }

  const allocation = holdings.reduce((acc, holding) => {
    const value = holding.shares * holding.price;
    acc[holding.category] = (acc[holding.category] || 0) + value;
    return acc;
  }, {});

  Object.entries(allocation)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, value]) => {
      const clone = allocationTemplate.content.cloneNode(true);
      const percentage = (value / totals.value) * 100;
      clone.querySelector(".allocation-label").textContent = category;
      clone.querySelector(".allocation-value").textContent = `${percentage.toFixed(
        1
      )}%`;
      clone.querySelector(".allocation-bar span").style.width = `${percentage}%`;
      allocationGrid.appendChild(clone);
    });
};

const render = (holdings) => {
  renderTotals(holdings);
  renderHoldings(holdings);
  renderAllocation(holdings);
};

const addHolding = (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const holding = {
    name: formData.get("name").trim(),
    ticker: formData.get("ticker").trim().toUpperCase(),
    category: formData.get("category"),
    shares: Number(formData.get("shares")),
    cost: Number(formData.get("cost")),
    price: Number(formData.get("price")),
    notes: formData.get("notes").trim(),
  };

  const holdings = loadHoldings();
  holdings.push(holding);
  saveHoldings(holdings);
  form.reset();
  render(holdings);
};

const removeHolding = (event) => {
  const button = event.target.closest("button[data-index]");
  if (!button) {
    return;
  }
  const index = Number(button.dataset.index);
  const holdings = loadHoldings();
  holdings.splice(index, 1);
  saveHoldings(holdings);
  render(holdings);
};

const seedData = () => {
  const sample = [
    {
      name: "Apple Inc.",
      ticker: "AAPL",
      category: "Equity",
      shares: 18,
      cost: 148.21,
      price: 182.42,
      notes: "Core growth holding",
    },
    {
      name: "Vanguard Total Stock Market ETF",
      ticker: "VTI",
      category: "ETF",
      shares: 10,
      cost: 205.3,
      price: 222.18,
      notes: "Broad market exposure",
    },
    {
      name: "Ethereum",
      ticker: "ETH",
      category: "Crypto",
      shares: 1.8,
      cost: 1780,
      price: 2035,
      notes: "Long-term thesis",
    },
    {
      name: "iShares Core U.S. Aggregate Bond ETF",
      ticker: "AGG",
      category: "Bond",
      shares: 12,
      cost: 96.4,
      price: 98.12,
      notes: "Stability anchor",
    },
  ];

  saveHoldings(sample);
  render(sample);
};

form.addEventListener("submit", addHolding);
clearAllButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  render([]);
});
seedDataButton.addEventListener("click", seedData);
holdingsBody.addEventListener("click", removeHolding);

render(loadHoldings());
