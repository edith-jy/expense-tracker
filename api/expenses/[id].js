
import mongoose from 'mongoose';
import { connectDatabase } from '../../server/database.js';
import { Expense } from '../../server/models.js';

function getExpenseId(request) {
  return new URL(request.url).pathname.split('/').pop();
}

// Update an entire expense
export async function PUT(request) {
  try {
    const id = getExpenseId(request);
    const body = await request.json();

    await connectDatabase();

    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        $set: {
          description: body.description,
          paid_by: body.paid_by,
          owed_by: body.owed_by,
          amount: body.amount,
          date: body.date,
          is_paid: body.is_paid
        }
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return Response.json(
        { error: 'Expense not found.' },
        { status: 404 }
      );
    }

    return Response.json(expense);

  } catch (error) {
    console.error('Expense update error:', error.name);

    if (
      error instanceof mongoose.Error.ValidationError ||
      error instanceof mongoose.Error.CastError ||
      error instanceof SyntaxError
    ) {
      return Response.json(
        { error: 'Invalid expense data or ID.' },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Unable to update expense.' },
      { status: 500 }
    );
  }
}

// Update only the payment status
export async function PATCH(request) {
  try {
    const id = getExpenseId(request);
    const body = await request.json();

    if (typeof body.is_paid !== 'boolean') {
      return Response.json(
        { error: 'Payment status must be true or false.' },
        { status: 400 }
      );
    }

    await connectDatabase();

    const expense = await Expense.findByIdAndUpdate(
      id,
      { $set: { is_paid: body.is_paid } },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return Response.json(
        { error: 'Expense not found.' },
        { status: 404 }
      );
    }

    return Response.json(expense);

  } catch (error) {
    console.error('Payment status error:', error.name);

    if (
      error instanceof mongoose.Error.CastError ||
      error instanceof SyntaxError
    ) {
      return Response.json(
        { error: 'Invalid expense ID or request data.' },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Unable to update payment status.' },
      { status: 500 }
    );
  }
}

// Delete an expense
export async function DELETE(request) {
  try {
    const id = getExpenseId(request);

    await connectDatabase();

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return Response.json(
        { error: 'Expense not found.' },
        { status: 404 }
      );
    }

    return Response.json({
      message: 'Expense deleted successfully.',
      id: expense._id
    });

  } catch (error) {
    console.error('Expense deletion error:', error.name);

    if (error instanceof mongoose.Error.CastError) {
      return Response.json(
        { error: 'Invalid expense ID.' },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Unable to delete expense.' },
      { status: 500 }
    );
  }
}
