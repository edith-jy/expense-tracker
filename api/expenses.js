
import mongoose from 'mongoose';
import { connectDatabase } from '../server/database.js';
import { Expense } from '../server/models.js';

export async function GET() {
  try {
    await connectDatabase();

    const expenses = await Expense.find().lean();

    return Response.json(expenses);
  } catch (error) {
    console.error('Expenses API error:', error.name);

    return Response.json(
      { error: 'Unable to load expenses. Please try again later.' },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.participants) || body.participants.length === 0) {
      return Response.json(
        { error: 'At least one participant is required.' },
        { status: 400 }
      );
    }

    // Validate participant information first
    for (const person of body.participants) {
      if (
        !person ||
        typeof person.name !== 'string' ||
        !person.name.trim() ||
        !Number.isFinite(Number(person.share)) ||
        Number(person.share) <= 0 ||
        typeof person.is_paid !== 'boolean'
      ) {
        return Response.json(
          { error: 'Invalid participant information.' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate participants
    const participantNames = body.participants.map(
      person => person.name
    );

    if (new Set(participantNames).size !== participantNames.length) {
      return Response.json(
        { error: 'A participant can only be included once.' },
        { status: 400 }
      );
    }

    // Check that participant shares equal the total expense
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

    await connectDatabase();

    const expense = new Expense(body);
    await expense.save();

    return Response.json(expense, { status: 201 });

  } catch (error) {
    console.error('Expense creation error:', error.name);

    if (
      error instanceof mongoose.Error.ValidationError ||
      error instanceof mongoose.Error.CastError ||
      error instanceof SyntaxError
    ) {
      return Response.json(
        { error: 'Invalid expense data. Please check the fields.' },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Unable to create expense. Please try again later.' },
      { status: 500 }
    );
  }
}
