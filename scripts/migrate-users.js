import mongoose from 'mongoose';
import { connectDatabase } from '../server/database.js';
import { Expense } from '../server/models.js';

const userMapping = {
  'Person 1': 'Josh',
  'Person 2': 'Nicole',
  'Person 3': 'Trevor',
  'Person 4': 'Vee',
  'Person 5': 'Lily'
};

async function migrateUsers() {
  try {
    await connectDatabase();

    for (const [oldName, newName] of Object.entries(userMapping)) {
      const paidBy = await Expense.updateMany(
        { paid_by: oldName },
        { $set: { paid_by: newName } }
      );

      const owedBy = await Expense.updateMany(
        { owed_by: oldName },
        { $set: { owed_by: newName } }
      );

      console.log(
        `${oldName} → ${newName}:`,
        `${paidBy.modifiedCount + owedBy.modifiedCount} fields updated`
      );
    }

    console.log('User migration complete.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

migrateUsers();