# ThriftGram

A fullstack "Instagram for Thrifting" application.

## Tech Stack
- **Backend**: Django 5, Django REST Framework
- **Frontend**: Next.js 14, Tailwind CSS
- **Database**: PostgreSQL

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### 1. Database Setup
Create a PostgreSQL database named `thriftgram`.
```bash
createdb thriftgram
```
*Note: If you don't have `createdb`, use pgAdmin or DataGrip to create the database manually.*

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
