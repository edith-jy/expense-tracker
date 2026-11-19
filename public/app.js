
const form = document.querySelector('#expense-form');
const formMessage = document.querySelector('#form-message');
const expensesList = document.querySelector('#expenses-list');
const outstandingTotal = document.querySelector('#outstanding-total');
const submitButton = form.querySelector('button[type="submit"]');
const cancelEditButton = document.querySelector('#cancel-edit');
const fields = [...form.querySelectorAll('input')]; 
const deleteDialog = document.querySelector('#delete-dialog');
const deleteMessage = document.querySelector('#delete-message');
const cancelDeleteButton = document.querySelector('#cancel-delete');
const confirmDeleteButton = document.querySelector('#confirm-delete');

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
  const total = expenses
    .filter(expense => !expense.is_paid)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  outstandingTotal.textContent = formatCurrency(total);
}

function createExpenseCard(expense) {
  const article = document.createElement('article');
  article.className = 'expense-card';

  const description = document.createElement('h3');
  description.textContent = expense.description;

  const details = document.createElement('p');
  details.textContent =
    `${expense.paid_by} paid ${formatCurrency(expense.amount)} · ${expense.owed_by} owes`;

  const date = document.createElement('p');
  date.textContent = new Date(expense.date).toLocaleDateString('en-CA');

  const status = document.createElement('p');
  status.textContent = expense.is_paid ? 'Paid' : 'Unpaid';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => editExpense(expense));

  const paymentButton = document.createElement('button');
  paymentButton.type = 'button';
  paymentButton.textContent = expense.is_paid ? 'Mark unpaid' : 'Mark paid';
  paymentButton.addEventListener('click', () => togglePayment(expense));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => deleteExpense(expense));

  article.append(
    description,
    details,
    date,
    status,
    editButton,
    paymentButton,
    deleteButton
  );

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

async function togglePayment(expense) {
  if (busy) return;

  setBusy(true);
  formMessage.textContent = 'Updating payment status...';

  try {
    const response = await fetch(`/api/expenses/${encodeURIComponent(expense._id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_paid: !expense.is_paid })
    });

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
  const data = Object.fromEntries(new FormData(form));
  data.amount = Number(data.amount);

  if (!isEditing) {
    data.is_paid = false;
  }

  const url = isEditing
    ? `/api/expenses/${encodeURIComponent(editingId)}`
    : '/api/expenses';

  setBusy(true);
  formMessage.textContent = isEditing ? 'Saving changes...' : 'Adding expense...';

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
    formMessage.textContent = isEditing ? 'Expense updated.' : 'Expense added.';
    await loadExpenses();
  } catch (error) {
    formMessage.textContent = error.message;
  } finally {
    setBusy(false);
  }
});


loadExpenses();
