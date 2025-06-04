document.addEventListener('DOMContentLoaded', () => {
    // --- Existing DOM Elements (keep these) ---
    const personList = document.getElementById('person-list');
    const addPersonBtn = document.getElementById('add-new-person-btn');
    const addPersonModal = document.getElementById('add-person-modal');
    const newPersonNameInput = document.getElementById('new-person-name');
    const saveNewPersonBtn = document.getElementById('save-new-person-btn');
    const closeButtons = document.querySelectorAll('.close-button');
    const contentHeading = document.getElementById('content-heading');
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
    // FIX: appContainer will now correctly reference the div in HTML
    const appContainer = document.getElementById('app-container'); // The main app div


    // --- Firebase Initialization ---
    // PASTE YOUR FIREBASE CONFIG HERE
    const firebaseConfig = {
        apiKey: "AIzaSyCfEnI90pQnGBTyh_ecw94EkRkawG9M2_Y",
        authDomain: "personalloanmanagement-41554.firebaseapp.com",
        projectId: "personalloanmanagement-41554",
        storageBucket: "personalloanmanagement-41554.firebasestorage.app",
        messagingSenderId: "112089002774",
        appId: "1:112089002774:web:44c0d262a21ee04c4cd637"
    };

    // Make sure Firebase SDKs are loaded before this line
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth(); // Get Firebase Auth instance
    const db = firebase.firestore();

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
            userDisplayEmail.textContent = currentUser.email;
            authForms.style.display = 'none'; // Hide login/signup forms
            userInfo.style.display = 'block'; // Show user info (logged in as...)
            appContainer.style.display = 'flex'; // Show the main app
            authSection.style.backgroundColor = '#d4edda'; // Greenish for logged in
            authError.textContent = ''; // Clear any previous errors

            // Fetch data ONLY after user is logged in
            await fetchData();
        } else {
            // User is signed out.
            currentUser = null;
            userDisplayEmail.textContent = '';
            authForms.style.display = 'block'; // Show login/signup forms
            userInfo.style.display = 'none'; // Hide user info
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
        // No need to call renderPersonList() or renderAllTransactions() here,
        // as they will be called after data is fetched or by setActivePerson.
        // This avoids briefly showing empty lists while fetching.

        try {
            // Fetch persons belonging to the current user
            const personsSnapshot = await db.collection('persons').where('ownerId', '==', currentUser.uid).get();
            data.persons = personsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch transactions belonging to the current user
            const transactionsSnapshot = await db.collection('transactions').where('ownerId', '==', currentUser.uid).get();
            data.transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Initial render
            renderPersonList();
            setActivePerson(currentView); // Re-render the current view (all or a specific person)

        } catch (error) {
            console.error("Error fetching data:", error);
            authError.textContent = "Error loading data. Please try again or re-login.";
            // Consider logging out automatically if it's a permission error
            // auth.signOut(); // Uncomment if you want to force logout on data fetch error
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
            return;
        }

        sortedTransactions.forEach(transaction => {
            const person = data.persons.find(p => p.id === transaction.personId);
            const personName = person ? person.name : 'Unknown Person';

            const div = document.createElement('div');
            div.classList.add('transaction-item');
            div.innerHTML = `
                <p><strong>Person:</strong> ${personName}</p>
                <p><strong>Date:</strong> ${transaction.date}</p>
                <p><strong>Amount:</strong> $${transaction.amount.toFixed(2)}</p>
                <p><strong>Type:</strong> ${transaction.type}</p>
                <p><strong>Purpose:</strong> ${transaction.purpose || 'N/A'}</p>
                <p><strong>Method:</strong> ${transaction.method}</p>
            `;
            transactionDetails.appendChild(div);
        });
    };

    const renderPersonTransactions = (personId) => {
        transactionDetails.style.display = 'none';
        personSummary.style.display = 'block';

        const person = data.persons.find(p => p.id === personId);
        if (!person) {
            // This case might happen if a person was deleted but its transactions are still in local data,
            // or if the `personId` is somehow invalid. Refreshing to 'all' is a safe fallback.
            setActivePerson('all');
            return;
        }

        contentHeading.textContent = person.name;
        currentPersonNameHeading.textContent = person.name;
        personTransactionsTableBody.innerHTML = ''; // Clear previous content

        const personTransactions = data.transactions.filter(t => t.personId === personId);

        // Sort person's transactions by date (descending)
        const sortedPersonTransactions = [...personTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        let total = 0;
        if (sortedPersonTransactions.length === 0) {
            const row = personTransactionsTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 4;
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
            setActivePerson(personId);
        }
    });

    addPersonBtn.addEventListener('click', () => {
        if (!currentUser) { // Check if logged in
            alert('Please login to add a new person.');
            return;
        }
        // This line will no longer throw the TypeError now that app-container exists
        addPersonModal.style.display = 'flex';
        newPersonNameInput.value = '';
        newPersonNameInput.focus();
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            addPersonModal.style.display = 'none';
            addTransactionModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == addPersonModal) {
            addPersonModal.style.display = 'none';
        }
        if (event.target == addTransactionModal) {
            addTransactionModal.style.display = 'none';
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
        } catch (e) {
            console.error("Error adding transaction: ", e);
            authError.textContent = "Failed to add transaction. Please try again.";
        }
    });

    // Initial load will be triggered by onAuthStateChanged
    // No need to call fetchData() here, as onAuthStateChanged handles it.
});