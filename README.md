# loanManagement
# Personal Loan Management System

The **Personal Loan Management System** is a web-based application designed to help users efficiently manage personal loans and financial transactions. The system includes features for user authentication, managing persons, adding and tracking transactions, and generating summaries. It utilizes **Firebase** for backend services, including authentication and Firestore for database management.

---

## Features

### Authentication
- **User Login/Signup**: Secure Firebase Authentication to manage user sessions.
- **Logout Functionality**: Allows users to securely sign out of the application.
- **Error Handling**: Informative messages for login/signup errors.

### Data Management
- **Persons**: Add, view, and delete persons related to transactions.
- **Transactions**: Track loans and repayments with detailed records.
- **Reset Transactions**: Clear all transactions for a specific person.

### Interactive User Interface
- Dynamic rendering of persons and transactions.
- Interactive modals for adding persons and transactions.
- Real-time updates synced with Firebase Firestore.

### Firebase Integration
- Firestore Database for managing users' data securely.
- Authentication for session management and data security.
- Owner-based data isolation, ensuring each user's data is private.

### Summary and Insights
- Summarized financial details for each person.
- Highlights the total outstanding loan amount with intuitive styling.

---

## Technologies Used

- **HTML5** and **CSS3** for the user interface.
- **JavaScript (ES6)** for client-side functionality.
- **Firebase** for backend services:
  - **Authentication**
  - **Firestore Database**
- **Responsive Design** for compatibility across devices.

---

## Getting Started

### Prerequisites
- A Firebase account to configure the Firebase backend.
- Node.js installed (optional, for hosting or advanced development).

### Firebase Configuration
Replace the Firebase configuration in the script with your project's Firebase details:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

personal-loan-management/
├── index.html        # Main HTML file
├── style.css         # Stylesheet
├── script.js         # JavaScript logic
└── README.md         # Project description (this file)
