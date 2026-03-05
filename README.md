# IDG2100-2025-group-exam-group9

## Project structure 
- Frontend: Build with React and Vite
- Backend: Build with Express.js, Node.js and FastAPI
- Database: MongoDb

## Prerequisites
To run this project, it's necessary to have the following installed on your system:
- Node.js and npm: Used for running the frontend and backend setup scripts.

## Setup Instructions
### 1. Backend setup
1. Open terminal
2. Navigate to the backend directory:
```bash
cd backend
```
3. Install dependencies:
```bash
npm install
```
4. Start the backend server:
```bash
npm run start
```

The server will be accessible at `http://localhost:5000`

### 2. Frontend setup
1. Open a new terminal window
2. Navigate to the frontend directory:
```bash
cd frontend
```
3. Install dependencies 
```bash
npm install
```
4. Start the frontend development server
```bash
npm run dev
```

The frontend React server will run at `http://localhost:5173`

## Database setup
This project uses MongoDB localhost as database. When running the backend server, the `server.js` automatically connects to the MongoDB database. 
To seed the database with pre coded dummyData, one admin user, one researcher and three quizzes:
1. Open a new terminal window
2. Navigate to the backend directory:
```bash
cd backend
```
3. Run the seeding script:
```bash
npm run seed
```

In the terminal you will get an conformation message telling that your database is successfully seeded. 

## Future Improvements
For a future upgrade of Ailuminate we have some planed improvements. 
For a future version we would like to implement:
- Edit username button on the profile page
- Edit email button on the profile page
- Fully implement the delete button on researcher profile 
 
