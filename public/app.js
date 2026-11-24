
const form = document.querySelector('#expense-form');
const formMessage = document.querySelector('#form-message');
const expensesList = document.querySelector('#expenses-list');
const outstandingTotal = document.querySelector('#outstanding-total');
const individualBalances = document.querySelector('#individual-balances');
const currentUser = document.querySelector('#current-user');
const paidBy = document.querySelector('#paid_by');
const owedByOptions = document.querySelectorAll('input[name="owed_by"]');
const includePayer = document.querySelector('#include-payer');
  let previousPayer = paidBy.value;
const personalBalance = document.querySelector('#personal-balance');
const submitButton = form.querySelector('button[type="submit"]');
const cancelEditButton = document.querySelector('#cancel-edit');
const fields = [...form.querySelectorAll('input, select')];

function validateParticipants() {
  const selectedParticipants = [...owedByOptions]
    .filter(option => option.checked)
    .map(option => option.value);

  const hasOtherParticipants = selectedParticipants.some(
    person => person !== paidBy.value
  );

  paidBy.setCustomValidity(
    hasOtherParticipants
      ? ''
      : 'Select at least one person other than the person who paid.'
  );
}



function updatePayerSelection() {
  // Remove the previous payer if the payer has changed
  if (previousPayer && previousPayer !== paidBy.value) {
    const previousOption = [...owedByOptions].find(
      option => option.value === previousPayer
    );

    if (previousOption) {
      previousOption.checked = false;
    }
  }

  // Re-enable all participant options
  owedByOptions.forEach(option => {
    option.disabled = false;
  });

  const payerOption = [...owedByOptions].find(
    option => option.value === paidBy.value
  );

  if (payerOption) {
    payerOption.checked = includePayer.checked;
    payerOption.disabled = includePayer.checked;
  }

  previousPayer = paidBy.value;

  validateParticipants();
}

paidBy.addEventListener('change', updatePayerSelection);
includePayer.addEventListener('change', updatePayerSelection);

owedByOptions.forEach(option => {
  option.addEventListener('change', validateParticipants);
});

updatePayerSelection();

const deleteDialog = document.querySelector('#delete-dialog');
const deleteMessage = document.querySelector('#delete-message');
const cancelDeleteButton = document.querySelector('#cancel-delete');
const confirmDeleteButton = document.querySelector('#confirm-delete');
const users = ['Josh', 'Nicole', 'Trevor', 'Vee', 'Lily'];

let expenseToDelete = null;
let expenses = [];
let editingId = null;
let busy = false;

function setBusy(value) {
  busy = value;
  form.querySelector('button[type="submit"]').disabled = value;

  for (const button of expensesList.querySelectorAll('button')) {
    button.disabled = value;
  }
}


function clearForm() {
  editingId = null;
  form.reset();

  // Restore the payer's default selection
  owedByOptions.forEach(option => {
    option.disabled = false;
  });

  updatePayerSelection();

  submitButton.textContent = 'Add expense';
  cancelEditButton.hidden = true;
}

function editExpense(expense) {
  if (busy) return;

  editingId = expense._id;

  for (const field of fields) {
    field.value = field.name === 'date'
      ? new Date(expense.date).toISOString().slice(0, 10)
      : expense[field.name] ?? '';
  }

  submitButton.textContent = 'Save changes';
  cancelEditButton.hidden = false;
  formMessage.textContent = `Editing "${expense.description}".`;

  fields[0].focus();
}


function showInlineEditor(article, expense) {
  if (busy) return;

  const editForm = document.createElement('form');
  editForm.className = 'expense-edit-form';

  const fields = [
    { name: 'description', label: 'Description', type: 'text' },
    { name: 'amount', label: 'Amount', type: 'number' },
    { name: 'date', label: 'Date', type: 'date' }
  ];

  for (const field of fields) {
    const label = document.createElement('label');
    const input = document.createElement('input');

    input.type = field.type;
    input.name = field.name;
    input.required = true;
    input.value = field.name === 'date'
      ? new Date(expense.date).toISOString().slice(0, 10)
      : expense[field.name] ?? '';

    if (field.name === 'amount') {
      input.min = '0.01';
      input.step = '0.01';
    }

    label.textContent = field.label;
    label.htmlFor = `edit-${field.name}-${expense._id}`;
    input.id = label.htmlFor;

    editForm.append(label, input);
  }

  // Create the payer dropdown
  const payerLabel = document.createElement('label');
  const payerSelect = document.createElement('select');

  payerSelect.name = 'paid_by';
  payerSelect.required = true;
  payerSelect.id = `edit-paid_by-${expense._id}`;

  payerLabel.textContent = 'Who paid?';
  payerLabel.htmlFor = payerSelect.id;

  for (const user of users) {
    const option = document.createElement('option');
    option.value = user;
    option.textContent = user;
    payerSelect.append(option);
  }

  payerSelect.value = expense.paid_by;
  editForm.append(payerLabel, payerSelect);

  // Get existing participants and their payment statuses
  const existingParticipants = expense.participants?.length
    ? expense.participants
    : [{
        name: expense.owed_by,
        share: expense.amount,
        is_paid: expense.is_paid
      }];

  const existingStatuses = Object.fromEntries(
    existingParticipants.map(person => [person.name, person.is_paid])
  );

  const selectedNames = new Set(
    existingParticipants.map(person => person.name)
  );

  // Create participant checkboxes
  const participantFieldset = document.createElement('fieldset');
  const participantLegend = document.createElement('legend');

  participantLegend.textContent = 'Who was paid for?';
  participantFieldset.append(participantLegend);

  const participantOptions = [];

  for (const user of users) {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.name = 'participants';
    checkbox.value = user;
    checkbox.checked = selectedNames.has(user);

    label.append(checkbox, document.createTextNode(` ${user}`));
    participantFieldset.append(label);

    participantOptions.push(checkbox);
  }

  editForm.append(participantFieldset);

  const saveButton = document.createElement('button');
  saveButton.type = 'submit';
  saveButton.textContent = 'Save changes';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  cancelButton.classList.add('secondary');

  const message = document.createElement('p');

  editForm.append(saveButton, cancelButton, message);

  cancelButton.addEventListener('click', () => {
    article.replaceWith(createExpenseCard(expense));
  });

  editForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (busy) return;

    const data = Object.fromEntries(new FormData(editForm));
    data.amount = Number(data.amount);

    const selectedParticipants = participantOptions
      .filter(option => option.checked)
      .map(option => option.value);

    if (
      selectedParticipants.length === 0 ||
      !selectedParticipants.some(name => name !== data.paid_by)
    ) {
      message.textContent =
        'Select at least one person other than the person who paid.';
      return;
    }

    const totalCents = Math.round(data.amount * 100);
    const baseShare = Math.floor(
      totalCents / selectedParticipants.length
    );
    const remainder = totalCents % selectedParticipants.length;

    data.participants = selectedParticipants.map((name, index) => ({
      name,
      share: (
        baseShare + (index < remainder ? 1 : 0)
      ) / 100,
      is_paid: name === data.paid_by
        ? true
        : existingStatuses[name] ?? false
    }));

    delete data.owed_by;
    delete data.is_paid;

    setBusy(true);
    message.textContent = 'Saving changes...';

    try {
      const response = await fetch(
        `/api/expenses/${encodeURIComponent(expense._id)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to save expense.');
      }

      await loadExpenses();

    } catch (error) {
      message.textContent = error.message;

    } finally {
      setBusy(false);
    }
  });

  article.replaceChildren(editForm);
}

cancelEditButton.addEventListener('click', () => {
  clearForm();
  formMessage.textContent = 'Edit cancelled.';
  fields[0].focus();
});

cancelDeleteButton.addEventListener('click', () => {
  deleteDialog.close();
  expenseToDelete = null;
});

function formatCurrency(amount) {
  return Number(amount).toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD'
  });
}


function updateOutstanding() {
  const balances = Object.fromEntries(
    users.map(user => [user, 0])
  );

  let totalOutstandingCents = 0;

  for (const expense of expenses) {
    if (expense.participants?.length) {
      for (const person of expense.participants) {
        if (person.is_paid) continue;

        const shareCents = Math.round(Number(person.share) * 100);

        balances[expense.paid_by] += shareCents;
        balances[person.name] -= shareCents;

        totalOutstandingCents += shareCents;
      }
    } else if (!expense.is_paid) {
      // Support older expenses
      const amountCents = Math.round(Number(expense.amount) * 100);

      balances[expense.paid_by] += amountCents;
      balances[expense.owed_by] -= amountCents;

      totalOutstandingCents += amountCents;
    }
  }

  outstandingTotal.textContent = formatCurrency(
    totalOutstandingCents / 100
  );

  // Display the selected user's personal balance
  const selectedUser = currentUser.value;
  const personalBalanceCents = balances[selectedUser];

  const balanceHeading = document.createElement('h3');
  const balanceAmount = document.createElement('p');

  if (personalBalanceCents > 0) {
    balanceHeading.textContent = "You're owed";
  } else if (personalBalanceCents < 0) {
    balanceHeading.textContent = 'You owe';
  } else {
    balanceHeading.textContent = 'Settled';
  }

  balanceAmount.textContent = formatCurrency(
    Math.abs(personalBalanceCents) / 100
  );

  personalBalance.replaceChildren(balanceHeading, balanceAmount);

  // Display individual balances relative to the selected user
  individualBalances.replaceChildren();

  for (const user of users) {
    if (user === selectedUser) continue;

    const balanceCents = balances[user];

    if (balanceCents === 0) continue;

    const item = document.createElement('div');
    item.className = 'individual-balance';

    const name = document.createElement('span');
    name.textContent = user;

    const amount = document.createElement('span');

    if (balanceCents < 0) {
      amount.textContent =
        `Owes you ${formatCurrency(Math.abs(balanceCents) / 100)}`;
      amount.className = 'balance-positive';
    } else {
      amount.textContent =
        `You owe ${formatCurrency(balanceCents / 100)}`;
      amount.className = 'balance-negative';
    }

    item.append(name, amount);
    individualBalances.append(item);
  }
}


function createExpenseCard(expense) {
  const article = document.createElement('article');
  article.className = 'expense-card';

  const content = document.createElement('div');
  content.className = 'expense-card-content';

  const info = document.createElement('div');
  info.className = 'expense-card-info';

  const actions = document.createElement('div');
  actions.className = 'expense-card-actions';

  const description = document.createElement('h3');
  description.textContent = expense.description;

  const amount = document.createElement('h4');
  amount.className = 'expense-card-amount';
  amount.textContent = formatCurrency(expense.amount);

  const details = document.createElement('p');
  details.textContent = `${expense.paid_by} bought`;

  const date = document.createElement('p');
  date.textContent = new Date(expense.date).toLocaleDateString('en-CA');

  // Support both new and older expenses
  const participants = expense.participants?.length
    ? expense.participants
    : [{
        name: expense.owed_by,
        share: expense.amount,
        is_paid: expense.is_paid
      }];

  const paidCount = participants.filter(
    person => person.is_paid
  ).length;

  const paymentSummary = document.createElement('p');
  paymentSummary.textContent =
    `${paidCount} of ${participants.length} paid`;

  const participantList = document.createElement('div');
  participantList.className = 'expense-participants';

  participants.forEach(person => {
    const participant = document.createElement('div');
    participant.className = 'expense-participant';

    const participantInfo = document.createElement('span');
    participantInfo.textContent =
      `${person.name} · ${formatCurrency(person.share)}`;

    const status = document.createElement('span');
    status.className = person.is_paid
      ? 'expense-paid'
      : 'expense-unpaid';
    status.textContent = person.is_paid ? 'Paid' : 'Unpaid';

    participant.append(participantInfo, status);

    // Add a payment button for both new and older expenses
    const paymentButton = document.createElement('button');
    paymentButton.type = 'button';
    paymentButton.className = 'primary';
    paymentButton.textContent = person.is_paid
      ? 'Mark unpaid'
      : 'Mark paid';

    paymentButton.addEventListener('click', () => {
      togglePayment(expense, person.name);
    });

    participant.append(paymentButton);

    participantList.append(participant);
  });

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.textContent = 'Edit';
  editButton.className = 'secondary';
  editButton.addEventListener('click', () => {
    showInlineEditor(article, expense);
  });

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.textContent = 'Delete';
  deleteButton.className = 'danger';
  deleteButton.addEventListener('click', () => {
    deleteExpense(expense);
  });

  info.append(
    details,
    description,
    amount,
    date,
    paymentSummary,
    participantList
  );

  actions.append(editButton, deleteButton);

  content.append(info, actions);
  article.append(content);

  return article;
}

function renderExpenses() {
  updateOutstanding();

  if (!expenses.length) {
    expensesList.textContent = 'No expenses yet. Add your first expense above.';
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const expense of expenses) {
    fragment.append(createExpenseCard(expense));
  }

  expensesList.replaceChildren(fragment);
}

async function loadExpenses() {
  expensesList.textContent = 'Loading expenses...';

  try {
    const response = await fetch('/api/expenses');

    if (!response.ok) {
      throw new Error('Unable to load expenses.');
    }

    expenses = await response.json();
    renderExpenses();
  } catch (error) {
    expensesList.textContent = error.message;
  }
}


async function togglePayment(expense, participantName) {
  if (busy) return;

  const hasParticipants = expense.participants?.length > 0;

  const participant = hasParticipants
    ? expense.participants.find(person => person.name === participantName)
    : null;

  if (hasParticipants && !participant) return;

  setBusy(true);
  formMessage.textContent = 'Updating payment status...';

  try {
    const response = await fetch(
      `/api/expenses/${encodeURIComponent(expense._id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          hasParticipants
            ? {
                participantName,
                is_paid: !participant.is_paid
              }
            : {
                is_paid: !expense.is_paid
              }
        )
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Unable to update payment status.');
    }

    formMessage.textContent = 'Payment status updated.';
    await loadExpenses();

  } catch (error) {
    formMessage.textContent = error.message;

  } finally {
    setBusy(false);
  }
}

async function deleteExpense(expense) {
  if (busy) return;

expenseToDelete = expense;
deleteMessage.textContent = `Are you sure you want to delete "${expense.description}"?`;
deleteDialog.showModal();
return;
}

async function confirmDelete() {
  if (busy || !expenseToDelete) return;

  const expense = expenseToDelete;
  deleteDialog.close();
  expenseToDelete = null;

  setBusy(true);
  formMessage.textContent = 'Deleting expense...';

  try {
    const response = await fetch(`/api/expenses/${encodeURIComponent(expense._id)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Unable to delete expense.');
    }

    formMessage.textContent = 'Expense deleted.';
    await loadExpenses();
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    setBusy(false);
  }
}

confirmDeleteButton.addEventListener('click', confirmDelete);

form.addEventListener('submit', async event => {
  event.preventDefault();

  if (busy) return;

  const isEditing = editingId !== null;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Get all selected participants
  const selectedParticipants = [...owedByOptions]
    .filter(option => option.checked)
    .map(option => option.value);

  data.amount = Number(data.amount);

  // Convert the total into cents before splitting
  const totalCents = Math.round(data.amount * 100);
  const baseShare = Math.floor(
    totalCents / selectedParticipants.length
  );
  const remainder = totalCents % selectedParticipants.length;

  // Create an individual share for each participant
  data.participants = selectedParticipants.map((name, index) => ({
    name,
    share: (
      baseShare + (index < remainder ? 1 : 0)
    ) / 100,
    is_paid: name === data.paid_by
  }));

  // Remove the old single-person field
  delete data.owed_by;

  const url = isEditing
    ? `/api/expenses/${encodeURIComponent(editingId)}`
    : '/api/expenses';

  setBusy(true);
  formMessage.textContent = isEditing
    ? 'Saving changes...'
    : 'Adding expense...';

  try {
    const response = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Unable to save expense.');
    }

    clearForm();

    formMessage.textContent = isEditing
      ? 'Expense updated.'
      : 'Expense added.';

    await loadExpenses();

  } catch (error) {
    formMessage.textContent = error.message;

  } finally {
    setBusy(false);
  }
});


loadExpenses();

currentUser.addEventListener('change', updateOutstanding);