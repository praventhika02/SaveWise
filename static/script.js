// SaveWise reads the form and updates the result cards live.
const formInputs = document.querySelectorAll("input");
const monthsSlider = document.querySelector("#goalMonths");
const monthsValue = document.querySelector("#months-value");

const totalExpensesCard = document.querySelector("#totalExpenses");
const remainingMoneyCard = document.querySelector("#remainingMoney");
const monthlySavingsNeededCard = document.querySelector("#monthlySavingsNeeded");
const goalStatusCard = document.querySelector("#goalStatus");

function getNumber(id) {
    // Number("") becomes 0, so empty fields are safe for beginners to leave blank.
    return Number(document.querySelector(`#${id}`).value) || 0;
}

function formatMoney(amount) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
    });
}

function updateMonthsLabel() {
    const months = monthsSlider.value;
    const label = months === "1" ? "1 month" : `${months} months`;

    monthsValue.textContent = label;
}

function calculatePlan() {
    // Read income and starting money from the page.
    const balance = getNumber("balance");
    const income = getNumber("income");

    // Read each spending category from the page.
    const transport = getNumber("transport");
    const food = getNumber("food");
    const entertainment = getNumber("entertainment");
    const shopping = getNumber("shopping");
    const others = getNumber("others");

    // Read the savings goal details from the page.
    const goalName = document.querySelector("#goalName").value.trim();
    const goalPrice = getNumber("goalPrice");
    const goalMonths = getNumber("goalMonths");

    // Add all expense categories to find the full monthly spending amount.
    const totalExpenses = transport + food + entertainment + shopping + others;

    // Money available after adding balance and income, then subtracting expenses.
    const availableToSave = balance + income - totalExpenses;

    // Divide the goal price by the number of months to find the monthly target.
    const monthlySavingsNeeded = goalPrice / goalMonths;

    totalExpensesCard.textContent = formatMoney(totalExpenses);
    remainingMoneyCard.textContent = formatMoney(availableToSave);
    monthlySavingsNeededCard.textContent = formatMoney(monthlySavingsNeeded);

    if (goalPrice === 0) {
        goalStatusCard.textContent = "Enter a goal to begin planning.";
    } else if (availableToSave >= monthlySavingsNeeded) {
        goalStatusCard.textContent = "Achievable — you can reach this goal in time.";
    } else {
        goalStatusCard.textContent = "Not achievable yet — reduce spending or increase the timeline.";
    }
}

formInputs.forEach((input) => {
    input.addEventListener("input", () => {
        updateMonthsLabel();
        calculatePlan();
    });
});

// Show the correct starting values as soon as the page loads.
updateMonthsLabel();
calculatePlan();
