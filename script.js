import { auth, db } from '../JS-Files/fDatabase.js'; 
import TagElements from '../JS-Files/getElement.js';
console.log(TagElements.idAndClass.personList)
document.addEventListener('DOMContentLoaded', () => {
    // --- Existing DOM Elements (keep these) ---
    const personList = document.getElementById('person-list');
    const addPersonBtn = document.getElementById('add-new-person-btn');
    const addPersonModal = document.getElementById('add-person-modal');
    const newPersonNameInput = document.getElementById('new-person-name');
    const saveNewPersonBtn = document.getElementById('save-new-person-btn');

    const deletePersonBtn = document.getElementById('delete-person-btn');
    const deletePersonModal = document.getElementById('delete-person-modal');
    const deletePersonLi = document.getElementById('delete-person-name');
    const submitDeletion = document.getElementById('submit-Deletion-btn');

    const closeButtons = document.querySelectorAll('.close-button');
    const contentHeading = document.getElementById('content-heading');
    const balance_amount_display = document.getElementById("Balance-amount");
    const transactionDetails = document.getElementById('transaction-details');
    const personSummary = document.getElementById('person-summary');
    const currentPersonNameHeading = document.getElementById('current-person-name');
    const personTransactionsTableBody = document.querySelector('#person-transactions-table tbody');
    const personTotalSpan = document.getElementById('person-total');
    const resetPersonBtn = document.getElementById('reset-person-btn');
    const addTransactionModal = document.getElementById('add-transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const transactionPersonNameSelect = document.getElementById('transaction-person-name');
    const transactionDateInput = document.getElementById('transaction-date');
    const transactionAmountInput = document.getElementById('transaction-amount');
    const transactionPurposeInput = document.getElementById('transaction-purpose');

    // --- New/Updated Auth DOM Elements ---
    const authSection = document.getElementById('auth-section');
    const authForms = document.getElementById('auth-forms'); // Contains login/signup inputs/buttons
    const authEmailInput = document.getElementById('auth-email'); // Unified email input
    const authPasswordInput = document.getElementById('auth-password'); // Unified password input
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn'); // New signup button
    const authError = document.getElementById('auth-error'); // Unified error display
    const userInfo = document.getElementById('user-info');
    const userDisplayEmail = document.getElementById('user-display-email');
    const logoutBtn = document.getElementById('logout-btn');
    const appContainer = document.getElementById('app-container'); // The main app div


    let currentUser = null; // Store the logged-in user

    let data = {
        persons: [],
        transactions: []
    };

    let currentView = 'all';

    // --- Authentication State Observer ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in.
            currentUser = user;
            // userDisplayEmail.textContent = currentUser.email; // Uncomment if you have this element
            authSection.style.display = 'none'; // Hide login/signup forms
            // userInfo.style.display = 'block'; // Show user info (logged in as...)
            appContainer.style.display = 'flex'; // Show the main app
            authSection.style.backgroundColor = '#d4edda'; // Greenish for logged in
            authError.textContent = ''; // Clear any previous errors

            // Fetch data ONLY after user is logged in
            await fetchData();
        } else {
            // User is signed out.
            currentUser = null;
            // userDisplayEmail.textContent = '';
            authSection.style.display = 'block'; // Show login/signup forms
            // userInfo.style.display = 'none'; // Hide user info
            appContainer.style.display = 'none'; // Hide the main app
            authSection.style.backgroundColor = '#e6f2ff'; // Default light blue
            // Clear local data if logged out
            data.persons = [];
            data.transactions = [];
            renderPersonList(); // Clear UI
            renderAllTransactions(); // Clear UI
            contentHeading.textContent = 'Please login or sign up to manage your loans.';
            transactionDetails.innerHTML = '';
            personSummary.style.display = 'none';
        }
    });


    // --- Data Management (Firebase Fetching/Saving - filtered by ownerId) ---

    const fetchData = async () => {
        if (!currentUser) { // Ensure user is logged in before fetching
            console.log("No user logged in, cannot fetch data.");
            return;
        }
        // Clear previous data before fetching new user's data
        data.persons = [];
        data.transactions = [];

        try {
            // Fetch persons belonging to the current user
            const personsSnapshot = await db.collection('persons').where('ownerId', '==', currentUser.uid).get();
            data.persons = personsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(data.persons)
            // Fetch transactions belonging to the current user
            const transactionsSnapshot = await db.collection('transactions').where('ownerId', '==', currentUser.uid).get();
            data.transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Initial render
            renderPersonList();
            setActivePerson(currentView); // Re-render the current view (all or a specific person)

        } catch (error) {
            console.error("Error fetching data:", error);
            authError.textContent = "Error loading data. Please try again or re-login.";
        }
    };


    // --- UI Update Functions (mostly unchanged, but data comes from `data` object populated by Firebase) ---

    const renderPersonList = () => {
        personList.innerHTML = ''; // Clear existing list items
        const allLi = document.createElement('li');
        allLi.classList.add('person-item');
        if (currentView === 'all') allLi.classList.add('active');
        allLi.dataset.personId = 'all';
        allLi.textContent = 'All';
        personList.appendChild(allLi);

        data.persons.forEach(person => {
            const li = document.createElement('li');
            li.classList.add('person-item');
            if (currentView === person.id) li.classList.add('active');
            li.dataset.personId = person.id;
            li.textContent = person.name;
            personList.appendChild(li);
        });
        // Ensure "Add New Transaction" button is at the end
        const addTransactionButtonLi = document.createElement('li');
        addTransactionButtonLi.innerHTML = '<button id="add-transaction-main-btn">Add New Transaction</button>';
        addTransactionButtonLi.querySelector('button').addEventListener('click', () => {
            openAddTransactionModal();
        });
        personList.appendChild(addTransactionButtonLi);
    };

    const renderAllTransactions = () => {
        transactionDetails.style.display = 'block';
        personSummary.style.display = 'none';
        contentHeading.textContent = 'All Transactions';
        transactionDetails.innerHTML = ''; // Clear previous content

        // Sort transactions by date (descending)
        const sortedTransactions = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedTransactions.length === 0) {
            transactionDetails.innerHTML = '<p>No transactions to display.</p>';
            balance_amount_display.innerHTML = `Net Owed By: <span>$0.00</span>`;
            balance_amount_display.className = "balance-amount total-positive";
            return;
        }

        transactionDetails.innerHTML = `
            <table id="transaction-table" class="transaction-table">
                <thead>
                    <tr>
                        <th>Person</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Purpose</th>
                        <th>Method</th>
                    </tr>
                </thead>
                <tbody id="transaction-tbody">
                </tbody>
            </table>
        `;
        const transaction_tbody = document.getElementById("transaction-tbody");
        let balance_amount = 0
        sortedTransactions.forEach(transaction => {
            const person = data.persons.find(p => p.id === transaction.personId);
            const personName = person ? person.name : 'Unknown Person';

            const tr = document.createElement('tr');
            console.log(typeof (transaction.amount), transaction.amount)

            tr.innerHTML = `
                <td>${personName}</td>
                <td>${transaction.date}</td>
                <td>$${transaction.amount.toFixed(2)}</td>
                <td>${transaction.type}</td>
                <td>${transaction.purpose || 'N/A'}</td>
                <td>${transaction.method}</td>
            `;

            if (transaction.type === "Loan") {
                balance_amount = balance_amount + transaction.amount;
            }
            else {
                balance_amount = balance_amount - transaction.amount;
            }

            transaction_tbody.appendChild(tr);
        });

        if (balance_amount > 0) {
            balance_amount_display.innerHTML = `Net Owed By: <span>$${balance_amount.toFixed(2)}</span>`;
            balance_amount_display.className = "balance-amount total-positive";
        }
        else {
            balance_amount_display.innerHTML = `Net Outstanding: <span>$${balance_amount.toFixed(2)}</span>`
            balance_amount_display.className = "balance-amount total-negative";
        }
    };

    const renderPersonTransactions = (personId) => {
        transactionDetails.style.display = 'none';
        personSummary.style.display = 'block';

        const person = data.persons.find(p => p.id === personId);
        if (!person) {
            setActivePerson('all');
            return;
        }

        contentHeading.textContent = person.name;
        personTransactionsTableBody.innerHTML = ''; // Clear previous content

        const personTransactions = data.transactions.filter(t => t.personId === personId);

        // Sort person's transactions by date (descending)
        const sortedPersonTransactions = [...personTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        let total = 0;
        if (sortedPersonTransactions.length === 0) {
            const row = personTransactionsTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5; // Adjusted colspan to match 5 columns (Amount, Purpose, Type, Method, Date)
            cell.textContent = 'No transactions for this person.';
            cell.style.textAlign = 'center';
        } else {
            sortedPersonTransactions.forEach(transaction => {
                const row = personTransactionsTableBody.insertRow();
                row.innerHTML = `
                    <td>$${transaction.amount.toFixed(2)}</td>
                    <td>${transaction.purpose || 'N/A'}</td>
                    <td>${transaction.type}</td>
                    <td>${transaction.method}</td>
                    <td>${transaction.date}</td>
                `;
                if (transaction.type === 'Loan') {
                    total += transaction.amount;
                } else if (transaction.type === 'Return') {
                    total -= transaction.amount;
                }
            });
        }


        personTotalSpan.textContent = `$${total.toFixed(2)}`;
        personTotalSpan.classList.remove('total-positive', 'total-negative');
        if (total >= 0) {
            personTotalSpan.classList.add('total-positive');
        } else {
            personTotalSpan.classList.add('total-negative');
        }
    };

    const setActivePerson = (personId) => {
        document.querySelectorAll('.person-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`.person-item[data-person-id="${personId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        currentView = personId;
        if (personId === 'all') {
            renderAllTransactions();
        } else {
            renderPersonTransactions(personId);
        }
    };


    // --- Authentication Event Listeners ---
    loginBtn.addEventListener('click', async () => {
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        authError.textContent = '';

        if (!email || !password) {
            authError.textContent = 'Please enter both email and password.';
            return;
        }

        try {
            await auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged will handle UI update
        } catch (error) {
            console.error("Login failed:", error.message);
            authError.textContent = 'Login failed: ' + error.message;
        }
    });

    signupBtn.addEventListener('click', async () => {
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        authError.textContent = '';

        if (!email || !password) {
            authError.textContent = 'Please enter both email and password.';
            return;
        }

        if (password.length < 6) { // Firebase requires min 6 chars for password
            authError.textContent = 'Password must be at least 6 characters long.';
            return;
        }

        try {
            await auth.createUserWithEmailAndPassword(email, password);
            // onAuthStateChanged will handle UI update
            alert('Account created successfully! You are now logged in.'); // User-friendly message
        } catch (error) {
            console.error("Signup failed:", error.message);
            authError.textContent = 'Sign up failed: ' + error.message;
        }
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            // onAuthStateChanged will handle UI update
        } catch (error) {
            console.error("Logout failed:", error.message);
            authError.textContent = "Logout failed: " + error.message;
        }
    });

    // --- Existing App Event Listeners (ensure they use currentUser.uid when adding data) ---

    personList.addEventListener('click', (e) => {
        const targetLi = e.target.closest('.person-item');
        if (targetLi) {
            const personId = targetLi.dataset.personId;
            console.log(typeof (personId))
            setActivePerson(personId);
        }
    });

    addPersonBtn.addEventListener('click', () => {
        if (!currentUser) { // Check if logged in
            alert('Please login to add a new person.');
            return;
        }
        addPersonModal.style.display = 'flex';
        newPersonNameInput.value = '';
        newPersonNameInput.focus();
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            addPersonModal.style.display = 'none';
            addTransactionModal.style.display = 'none';
            deletePersonModal.style.display = 'none'; // Added for delete modal
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == addPersonModal) {
            addPersonModal.style.display = 'none';
        }
        if (event.target == addTransactionModal) {
            addTransactionModal.style.display = 'none';
        }
        if (event.target == deletePersonModal) { // Added for delete modal
            deletePersonModal.style.display = 'none';
        }
    });

    saveNewPersonBtn.addEventListener('click', async () => {
        if (!currentUser) {
            alert('You must be logged in to add a person.');
            return;
        }
        const newPersonName = newPersonNameInput.value.trim();
        if (newPersonName) {
            try {
                // Add new person to Firestore with ownerId
                const docRef = await db.collection('persons').add({
                    name: newPersonName,
                    ownerId: currentUser.uid // IMPORTANT: Add ownerId
                });
                // Add to local data object for immediate UI update
                data.persons.push({ id: docRef.id, name: newPersonName, ownerId: currentUser.uid });

                renderPersonList();
                addPersonModal.style.display = 'none';
                setActivePerson(docRef.id);
            } catch (e) {
                console.error("Error adding document: ", e);
                authError.textContent = "Failed to add person. Please try again.";
            }
        } else {
            alert('Please enter a person name.');
        }
    });

    resetPersonBtn.addEventListener('click', async () => {
        if (!currentUser) {
            alert('You must be logged in to clear transactions.');
            return;
        }
        const personIdToClear = currentView;
        if (personIdToClear && personIdToClear !== 'all' && confirm(`Are you sure you want to clear all transactions for ${contentHeading.textContent}? This action cannot be undone.`)) {
            try {
                // Get all transactions for this person AND owned by the current user
                const snapshot = await db.collection('transactions')
                    .where('personId', '==', personIdToClear)
                    .where('ownerId', '==', currentUser.uid) // IMPORTANT: Filter by ownerId
                    .get();
                const batch = db.batch();

                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });

                await batch.commit();

                // Update local data
                data.transactions = data.transactions.filter(t => t.personId !== personIdToClear);

                renderPersonTransactions(personIdToClear);
                alert('Transactions cleared successfully!');
            } catch (e) {
                console.error("Error clearing transactions: ", e);
                authError.textContent = "Failed to clear transactions. Please try again.";
            }
        }
    });

    // --- Page 2 Functionality (Add New Transaction) ---

    const openAddTransactionModal = (personIdToPreselect = null) => {
        if (!currentUser) {
            alert('You must be logged in to add a transaction.');
            return;
        }
        addTransactionModal.style.display = 'flex';
        transactionForm.reset();

        transactionPersonNameSelect.innerHTML = '';
        if (data.persons.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No persons added yet. Add a person first!';
            option.disabled = true;
            option.selected = true;
            transactionPersonNameSelect.appendChild(option);
        } else {
            data.persons.forEach(person => {
                const option = document.createElement('option');
                option.value = person.id;
                option.textContent = person.name;
                transactionPersonNameSelect.appendChild(option);
            });
            // Pre-select if a personId is provided or if a person is currently selected
            if (personIdToPreselect && data.persons.some(p => p.id === personIdToPreselect)) {
                transactionPersonNameSelect.value = personIdToPreselect;
            } else if (currentView !== 'all' && data.persons.some(p => p.id === currentView)) {
                transactionPersonNameSelect.value = currentView;
            } else if (data.persons.length > 0) {
                transactionPersonNameSelect.value = data.persons[0].id; // Default to first person
            }
        }

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        transactionDateInput.value = `${yyyy}-${mm}-${dd}`;
    };


    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('You must be logged in to add a transaction.');
            return;
        }
        if (!transactionPersonNameSelect.value) {
            alert('Please select a person.');
            return;
        }


        const newTransactionData = {
            personId: transactionPersonNameSelect.value,
            date: transactionDateInput.value,
            amount: parseFloat(transactionAmountInput.value),
            type: document.querySelector('input[name="transaction-type"]:checked').value,
            purpose: transactionPurposeInput.value.trim(),
            method: document.querySelector('input[name="transaction-method"]:checked').value,
            ownerId: currentUser.uid // IMPORTANT: Add ownerId
        };

        if (isNaN(newTransactionData.amount) || newTransactionData.amount <= 0) {
            alert('Please enter a valid positive amount.');
            return;
        }

        try {
            const docRef = await db.collection('transactions').add(newTransactionData);
            data.transactions.push({ id: docRef.id, ...newTransactionData });

            addTransactionModal.style.display = 'none';
            setActivePerson(currentView);
            alert('Transaction added successfully!');

            const span = balance_amount_display.querySelector("span");
            if (span) {
                let balance_amount = parseFloat(span.innerHTML.replace('$', '')); // Remove $ before parsing
                balance_amount = newTransactionData.type === "Loan" ? balance_amount + newTransactionData.amount : balance_amount - newTransactionData.amount;

                if (balance_amount > 0) {
                    balance_amount_display.innerHTML = `Net Owed By: <span>$${balance_amount.toFixed(2)}</span>`;
                    balance_amount_display.className = "balance-amount total-positive";
                }
                else {
                    balance_amount_display.innerHTML = `Net Outstanding: <span>$${balance_amount.toFixed(2)}</span>`
                    balance_amount_display.className = "balance-amount total-negative";
                }
            }

        } catch (e) {
            console.error("Error adding transaction: ", e);
            authError.textContent = "Failed to add transaction. Please try again.";
        }
    });

    // --- Delete Person Functionality ---
    deletePersonBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert('You must be logged in to delete a person.');
            return;
        }

        const currentSelectedPersonId = currentView;
        if (currentSelectedPersonId === 'all' || !currentSelectedPersonId) {
            alert('Please select a specific person to delete.');
            return;
        }

        const personToDelete = data.persons.find(p => p.id === currentSelectedPersonId);

        if (!personToDelete) {
            alert('Selected person not found.');
            return;
        }

        deletePersonLi.textContent = personToDelete.name;
        deletePersonModal.style.display = 'flex';
    });

    submitDeletion.addEventListener('click', async () => {
        if (!currentUser) {
            alert('You must be logged in to delete a person.');
            return;
        }

        const personIdToDelete = currentView;

        try {
            // Delete all transactions associated with the person and owned by the user
            const transactionsSnapshot = await db.collection('transactions')
                .where('personId', '==', personIdToDelete)
                .where('ownerId', '==', currentUser.uid)
                .get();

            const batch = db.batch();
            transactionsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Delete the person from Firestore
            await db.collection('persons').doc(personIdToDelete).delete();

            await batch.commit(); // Commit all deletions

            // Update local data by filtering out the deleted person and their transactions
            data.persons = data.persons.filter(p => p.id !== personIdToDelete);
            data.transactions = data.transactions.filter(t => t.personId !== personIdToDelete);

            deletePersonModal.style.display = 'none';
            alert(`${deletePersonLi.textContent} and all their transactions have been successfully deleted.`);
            setActivePerson('all'); // Go back to "All Transactions" view
            renderPersonList(); // Re-render the person list
        } catch (error) {
            console.error("Error deleting person and transactions:", error);
            authError.textContent = "Failed to delete person and transactions: " + error.message;
        }
    });

    // Initial load will be triggered by onAuthStateChanged
    // No need to call fetchData() here, as onAuthStateChanged handles it.
});