const TagElements=(function(){

    function idAndClass()
    {
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

        return [personList, addPersonBtn, addPersonModal, newPersonNameInput, saveNewPersonBtn, deletePersonBtn, deletePersonModal, deletePersonLi, submitDeletion, closeButtons, contentHeading, balance_amount_display, transactionDetails, personSummary, currentPersonNameHeading, personTransactionsTableBody, personTotalSpan, resetPersonBtn, addTransactionModal, transactionForm, transactionPersonNameSelect, transactionDateInput, transactionAmountInput, transactionPurposeInput, authSection, authForms, authEmailInput, authPasswordInput, loginBtn, signupBtn, authError, userInfo, userDisplayEmail, logoutBtn, appContainer]
    }

    return {
        idAndClass:idAndClass
    }

})

export default TagElements;