
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

    const updates = {
      description: body.description,
      paid_by: body.paid_by,
      amount: body.amount,
      date: body.date
    };

    const updateOperation = { $set: updates };

    if (Array.isArray(body.participants)) {
      // Validate participant information
      if (
        body.participants.length === 0 ||
        body.participants.some(person =>
          !person ||
          typeof person.name !== 'string' ||
          !person.name.trim() ||
          !Number.isFinite(Number(person.share)) ||
          Number(person.share) <= 0 ||
          typeof person.is_paid !== 'boolean'
        )
      ) {
        return Response.json(
          { error: 'Invalid participant information.' },
          { status: 400 }
        );
      }

      const names = body.participants.map(person => person.name);

      if (new Set(names).size !== names.length) {
        return Response.json(
          { error: 'A participant can only be included once.' },
          { status: 400 }
        );
      }

      const totalShares = body.participants.reduce(
        (sum, person) =>
          sum + Math.round(Number(person.share) * 100),
        0
      );

      const totalAmount = Math.round(Number(body.amount) * 100);

      if (totalShares !== totalAmount) {
        return Response.json(
          { error: 'Participant shares must add up to the total expense.' },
          { status: 400 }
        );
      }

      updates.participants = body.participants;

      // Remove the old single-person fields
      updateOperation.$unset = {
        owed_by: 1,
        is_paid: 1
      };

    } else {
      // Preserve compatibility with older expenses
      updates.owed_by = body.owed_by;
      updates.is_paid = body.is_paid;
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      updateOperation,
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

// Update a participant's payment status
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

    const expense = await Expense.findById(id);

    if (!expense) {
      return Response.json(
        { error: 'Expense not found.' },
        { status: 404 }
      );
    }

    if (Array.isArray(expense.participants) && expense.participants.length > 0) {
      if (typeof body.participantName !== 'string') {
        return Response.json(
          { error: 'A participant name is required.' },
          { status: 400 }
        );
      }

      const participant = expense.participants.find(
        person => person.name === body.participantName
      );

      if (!participant) {
        return Response.json(
          { error: 'Participant not found.' },
          { status: 404 }
        );
      }

      participant.is_paid = body.is_paid;
    } else {
      // Keep whole-expense payment updates for legacy records
      expense.is_paid = body.is_paid;
    }

    await expense.save();

    return Response.json(expense);

  } catch (error) {
    console.error('Payment status error:', error.name);

    if (
      error instanceof mongoose.Error.ValidationError ||
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
