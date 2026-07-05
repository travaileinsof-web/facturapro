CREATE TABLE IF NOT EXISTS Account (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NULL,
    companyName VARCHAR(255) NOT NULL,
    firstName VARCHAR(255) NULL,
    lastName VARCHAR(255) NULL,
    slogan VARCHAR(255) NULL,
    address TEXT NULL,
    phone VARCHAR(50) NULL,
    website VARCHAR(255) NULL,
    taxId VARCHAR(100) NULL,
    bankName VARCHAR(255) NULL,
    bankAccount VARCHAR(255) NULL,
    logo TEXT NULL,
    stamp TEXT NULL,
    signature TEXT NULL,
    primaryColor VARCHAR(20) DEFAULT '#B38E36',
    secondaryColor VARCHAR(20) NULL,
    accentColor VARCHAR(20) NULL,
    whatsappMessage TEXT NULL,
    smtpHost VARCHAR(255) NULL,
    smtpPort VARCHAR(10) NULL,
    smtpEncryption VARCHAR(50) DEFAULT 'tls',
    smtpUser VARCHAR(255) NULL,
    smtpPass VARCHAR(255) NULL,
    -- Gemini Key removed from user fields, kept as system level or legacy
    geminiKey VARCHAR(255) NULL, 
    openrouterKey VARCHAR(255) NULL,
    -- Abonnement
    subscriptionPlan VARCHAR(50) DEFAULT 'free',
    subscriptionStatus VARCHAR(50) DEFAULT 'trial',
    subscriptionExpiresAt TIMESTAMP NULL,
    subscriptionAmount DECIMAL(10,2) DEFAULT 0,
    lastPaymentDate TIMESTAMP NULL,
    adminNotes TEXT NULL,
    isSuspended INTEGER DEFAULT 0,
    role VARCHAR(20) DEFAULT 'user',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS SubscriptionPayment (
    id VARCHAR(50) PRIMARY KEY,
    accountId VARCHAR(50) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    djomyTransactionId VARCHAR(100) NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AdminLog (
    id SERIAL PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    targetAccountId VARCHAR(50) NULL,
    details TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS Client (
    id VARCHAR(50) PRIMARY KEY,
    accountId VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    notes TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ProformaInvoice (
    id VARCHAR(50) PRIMARY KEY,
    accountId VARCHAR(50) NOT NULL,
    number VARCHAR(100) NOT NULL,
    clientId VARCHAR(50) NOT NULL,
    items TEXT NOT NULL,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    taxRate DECIMAL(5, 2) DEFAULT 0,
    taxAmount DECIMAL(15, 2) DEFAULT 0,
    discount DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'brouillon',
    type VARCHAR(50) DEFAULT 'facture',
    issueDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dueDate TIMESTAMP NULL,
    lastReminderDate TIMESTAMP NULL,
    notes TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE,
    FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Receipt (
    id VARCHAR(50) PRIMARY KEY,
    accountId VARCHAR(50) NOT NULL,
    number VARCHAR(100) NOT NULL,
    proformaInvoiceId VARCHAR(50) NULL,
    clientId VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    paymentMethod VARCHAR(50) NULL,
    paymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE,
    FOREIGN KEY (proformaInvoiceId) REFERENCES ProformaInvoice(id) ON DELETE RESTRICT,
    FOREIGN KEY (clientId) REFERENCES Client(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS CatalogItem (
    id VARCHAR(50) PRIMARY KEY,
    accountId VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type VARCHAR(50) DEFAULT 'service',
    unitPrice DECIMAL(15, 2) DEFAULT 0,
    category VARCHAR(100) DEFAULT 'Général',
    components TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Expense (
    id VARCHAR(50) PRIMARY KEY,
    accountId VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    expenseDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT NULL,
    receiptUrl TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Document (
    id VARCHAR(50) PRIMARY KEY,
    accountId VARCHAR(50) NOT NULL,
    entityType VARCHAR(50) NOT NULL,
    entityId VARCHAR(50) NOT NULL,
    fileName VARCHAR(255) NOT NULL,
    fileUrl TEXT NOT NULL,
    fileType VARCHAR(50) NULL,
    fileSize INTEGER DEFAULT 0,
    uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
);
