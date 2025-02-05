
# Simple Password Manager

## Overview

**Simple Password Manager** is a lightweight and easy-to-use password management tool designed to securely store and retrieve passwords. It allows users to store their passwords in an encrypted format, ensuring that sensitive data remains safe. The app is built with an emphasis on simplicity, security, and user-friendliness.

This project uses modern encryption techniques to protect passwords, making it suitable for individual use, small projects, or anyone looking for a simple yet secure solution to manage their passwords.

## Features

- **Secure Encryption:** Passwords are encrypted using industry-standard encryption algorithms, ensuring that even if the password database is exposed, the data remains unreadable.
- **User-Friendly Interface:** The app is designed with a simple and clean interface, making it easy for users to store and retrieve passwords.
- **Password Storage:** Store usernames, passwords, and associated notes for each entry.
- **Search Functionality:** Quickly search for stored passwords by service name.
- **Password Generation:** Generate strong passwords to enhance security for your accounts.
- **Cross-Platform Compatibility:** The application is designed to run on multiple platforms.

## Tech Stack

This project is built using the following technologies:

- **Backend:** Node.js
- **Encryption:** AES (Advanced Encryption Standard)
- **Database:** JSON or local storage (for simple use cases)
- **Frontend:** HTML/CSS/JavaScript (Vanilla)

## Installation

To get started with the Simple Password Manager, follow these steps:

### Prerequisites

- **Node.js:** Ensure you have Node.js installed on your system. You can download it from [Node.js Official Site](https://nodejs.org/).
- **Git:** You'll need Git to clone this repository.

### Clone the Repository

```bash
git clone https://github.com/AliDinpanah/Simple-Passsword-Manager.git
```

### Install Dependencies

Navigate into the project directory and install the necessary dependencies:

```bash
cd Simple-Passsword-Manager
npm install
```

### Run the Application

After installing dependencies, you can start the application by running:

```bash
npm start
```

The application will start, and you should be able to access it via your browser at `http://localhost:3000` (or another port if configured differently).

## Usage

### 1. Create a New Account

When you first launch the application, you'll be prompted to create a master password. This password is used to encrypt and decrypt your stored passwords. Make sure to choose a strong password that you can remember.

### 2. Add a New Password

Once logged in, you can add a new password entry by clicking on the "Add Password" button. For each entry, you'll need to provide:

- **Service Name:** The name of the service or website (e.g., Google, Facebook).
- **Username:** The username associated with the account.
- **Password:** The password associated with the account (this will be encrypted).
- **Notes:** Any additional information you'd like to store (optional).

### 3. Search for a Password

Use the search bar to quickly locate any of your saved passwords by entering the service name or username.

### 4. Password Generation

You can generate strong passwords by using the built-in password generator. It will create a random, secure password for you based on your desired length and complexity.

### 5. View Passwords

You can view your saved passwords (in a secure manner) by clicking on any of the entries. The application will decrypt the password for you after verifying your master password.

### 6. Backup and Restore

While not currently implemented, you should regularly backup your password database (the local storage or JSON file). To restore it, simply replace the existing file with your backup.

## Security

- **Encryption:** Passwords are stored in an encrypted format using AES encryption. Your master password is never stored; only a salted hash of it is saved. This ensures that even if the storage file is compromised, your data remains safe.
- **Password Hashing:** The app uses a secure hashing algorithm to protect your master password.
