# Tabloom

Tabloom is a shared expense tracker that helps a group keep track of expenses and who still owes money. Users can add expenses, divide the cost between participants, and track each person's payment status.

The application uses a native HTML, CSS, and JavaScript frontend, Vercel API routes, and MongoDB with Mongoose. Users can add, view, edit, and delete expenses, as well as view balances based on recorded expenses.

The app uses a fixed group of users and does not include authentication. Anyone with access to the application can view and manage the shared expenses. Use fictional or non-sensitive data.

## Prerequisites

- Node.js and npm.
- A MongoDB Atlas cluster and database user with permission to read and write to the intended database.
- MongoDB network access configured to allow connections from your development environment and Vercel.
- A MongoDB connection string for the intended database.

## Run locally

1. Create a `.env.local` file in the project root and set `MONGODB_URI` to your MongoDB connection string. Do not commit or share your credentials.
2. Install the project dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local URL provided by the development server.

Use the application to add an expense, select the participants, and choose whether the person who paid is included in the split. The expense will be saved to MongoDB and displayed in the expense list.

Each participant has an individual share and payment status. Users can mark a participant's share as paid or unpaid. Expenses can also be edited or deleted.

## Features

- Add, view, edit, and delete expenses.
- Select a payer and participants for each expense.
- Include or exclude the payer from the expense split.
- Divide expenses between participants, including handling remaining cents.
- Track each participant's payment status separately.
- View personal and individual balances.
- View the application as one of the fixed group members.

## API

The API routes are located in the `api` directory and connect the frontend to MongoDB through Mongoose. Expense data is stored in the `expenses` collection.

- `GET /api/expenses` retrieves expenses from the database.
- `POST /api/expenses` creates a new expense.
- `PUT /api/expenses/[id]` updates an existing expense.
- `DELETE /api/expenses/[id]` deletes an expense.

Each expense contains information such as its description, payer, amount, date, and participants. Participant records include each person's name, share, and payment status.

The API validates expense data before saving changes to the database. MongoDB generates an `_id` for each expense, which is used to identify the record when updating or deleting it.

## Deploy on Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the `MONGODB_URI` environment variable in Vercel's project settings.
4. Ensure the environment variable is available to the application and API routes.
5. Deploy the project.

After deployment, add a test expense and reload the application to confirm that the data persists.

The application uses a shared MongoDB database, so changes made in the local and deployed versions may affect the same data. Be careful when testing create, update, or delete functionality.

## Limitations

Tabloom does not currently include user authentication. The application uses a fixed group of users, and anyone with access can manage the shared expense records.

Automated tests are outside the current scope of the project.
