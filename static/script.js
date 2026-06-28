// SaveWise reads the form and updates the result cards live.
const formInputs = document.querySelectorAll("input");
const monthsSlider = document.querySelector("#goalMonths");
const monthsValue = document.querySelector("#months-value");

const totalExpensesCard = document.querySelector("#totalExpenses");
const remainingMoneyCard = document.querySelector("#remainingMoney");
const monthlySavingsNeededCard = document.querySelector("#monthlySavingsNeeded");
const savingsRateCard = document.querySelector("#savingsRate");
const goalStatusCard = document.querySelector("#goalStatus");
const recommendationTextCard = document.querySelector("#recommendationText");

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

function formatPercent(amount) {
    return `${amount.toFixed(1)}%`;
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

    // Savings rate shows what percentage of monthly income is still available.
    const savingsRate = income > 0 ? (availableToSave / income) * 100 : 0;

    totalExpensesCard.textContent = formatMoney(totalExpenses);
    remainingMoneyCard.textContent = formatMoney(availableToSave);
    monthlySavingsNeededCard.textContent = formatMoney(monthlySavingsNeeded);
    savingsRateCard.textContent = formatPercent(savingsRate);

    if (goalPrice === 0) {
        goalStatusCard.textContent = "Enter a goal to begin planning.";
    } else if (availableToSave >= monthlySavingsNeeded) {
        goalStatusCard.textContent = "Achievable — you can reach this goal in time.";
    } else {
        goalStatusCard.textContent = "Not achievable yet — reduce spending or increase the timeline.";
    }

    const recommendations = [];

    if (goalPrice === 0) {
        recommendations.push("Set a goal to receive a personalised savings plan.");
    } else if (availableToSave >= monthlySavingsNeeded) {
        recommendations.push("You are on track. Try saving this amount consistently each month and avoid unnecessary spending.");
    } else {
        // Shortfall is the extra amount needed each month to meet the goal on time.
        const shortfall = monthlySavingsNeeded - availableToSave;

        recommendations.push(`You need an extra ${formatMoney(shortfall)} per month. Consider reducing food, entertainment or shopping expenses, or increasing your timeline.`);
    }

    // Wants spending combines entertainment and shopping, then compares it to income.
    if (income > 0 && entertainment + shopping > income * 0.3) {
        recommendations.push("Your wants spending is quite high. Cutting small lifestyle expenses can help you reach your goal faster.");
    }

    if (income > 0 && savingsRate < 20) {
        recommendations.push("Your savings rate is below 20%. A stronger savings habit will improve your financial stability.");
    }

    recommendationTextCard.textContent = recommendations.join(" ");
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
