
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
