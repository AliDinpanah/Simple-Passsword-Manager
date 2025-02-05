// Server URL (update this to your server URL)
const serverUrl = 'http://localhost:3000';

// Generate and persist the encryption key
let encryptionKey;

// Default master password
const DEFAULT_MASTER_PASSWORD = 'master';

async function generateKey() {
  return new Promise(async (resolve, reject) => {
    // Check if the key already exists in storage
    chrome.storage.local.get(['encryptionKey'], async (result) => {
      if (result.encryptionKey) {
        // Import the existing key
        const keyData = Uint8Array.from(result.encryptionKey);
        encryptionKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        console.log('Encryption key loaded from storage.');
        resolve();
      } else {
        // Generate a new key and save it to storage
        encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true, // Whether the key is extractable
          ['encrypt', 'decrypt'] // Key usages
        );
        const exportedKey = await crypto.subtle.exportKey('raw', encryptionKey);
        const keyArray = Array.from(new Uint8Array(exportedKey));
        chrome.storage.local.set({ encryptionKey: keyArray }, () => {
          console.log('Encryption key generated and saved to storage.');
          resolve();
        });
      }
    });
  });
}

// Encrypt the password
async function encryptPassword(password) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      data
    );
    console.log('Encrypted password:', encrypted); // Debugging line
    return { encrypted: Array.from(new Uint8Array(encrypted)), iv: Array.from(iv) };
  } catch (error) {
    console.error('Encryption failed:', error); // Debugging line
    return null;
  }
}

// Decrypt the password
async function decryptPassword(encryptedData) {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
      encryptionKey,
      new Uint8Array(encryptedData.encrypted)
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error); // Debugging line
    return null;
  }
}

// Save password to the server
async function savePassword() {
  console.log('Save button clicked!'); // Debugging line
  const siteName = document.getElementById('site-name').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (siteName && username && password) {
    // Encrypt the password
    const encryptedPassword = await encryptPassword(password);

    if (encryptedPassword) {
      // Send encrypted data to the server
      console.log('Sending data to server:', { siteName, username, password: encryptedPassword }); // Debugging line
      try {
        const response = await fetch(`${serverUrl}/api/save-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteName, username, password: encryptedPassword }),
        });

        console.log('Server response:', response); // Debugging line

        if (response.ok) {
          showModal('Password saved to server!');
        } else {
          const errorText = await response.text();
          console.error('Server error:', errorText); // Debugging line
          showModal('Failed to save password to server. Check console for details.');
        }
      } catch (error) {
        console.error('Fetch error:', error); // Debugging line
        showModal('Failed to send data to server. Check console for details.');
      }
    } else {
      showModal('Failed to encrypt password. Please try again.');
    }
  } else {
    showModal('Please fill in all fields.');
  }
}

// Add these functions to your popup.js

// Function to fetch all passwords
async function getAllPasswords() {
  try {
    const response = await fetch('http://localhost:3000/api/passwords');
    const data = await response.json();
    
    if (data.success) {
      await displayPasswords(data.data);
    } else {
      showModal('Failed to fetch passwords');
    }
  } catch (error) {
    showModal('Error connecting to server');
    console.error('Error:', error);
  }
}

// Function to search passwords
async function searchPasswords() {
  const searchQuery = document.getElementById('search-query').value.trim();
  
  try {
    let response;
    if (searchQuery) {
      response = await fetch(`http://localhost:3000/api/passwords/search/${encodeURIComponent(searchQuery)}`);
    } else {
      response = await fetch('http://localhost:3000/api/passwords');
    }
    
    const data = await response.json();
    
    if (data.success) {
      await displayPasswords(data.data);
    } else {
      showModal('Failed to search passwords');
    }
  } catch (error) {
    showModal('Error connecting to server');
    console.error('Error:', error);
  }
}

// Updated display passwords function
async function displayPasswords(passwords) {
  const passwordList = document.getElementById('password-list');
  passwordList.innerHTML = '<h2>Stored Passwords</h2>';

  if (passwords.length === 0) {
    const div = document.createElement('div');
    div.textContent = 'No passwords found';
    passwordList.appendChild(div);
    return;
  }

  passwords.forEach(entry => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="password-entry">
        <p><strong>Site:</strong> ${entry.siteName}</p>
        <p><strong>Username:</strong> ${entry.username}</p>
        <p><strong>Password:</strong> 
          <span class="password-hidden">********</span>
          <span class="password-visible" style="display:none">${entry.password}</span>
        </p>
        <button class="toggle-password">Show Password</button>
        <button class="fill-form">Fill Form</button>
        <button class="delete-password">Delete</button>
      </div>
    `;

    // Add event listeners
    const toggleBtn = div.querySelector('.toggle-password');
    const fillFormBtn = div.querySelector('.fill-form');
    const deleteBtn = div.querySelector('.delete-password');
    const hiddenPass = div.querySelector('.password-hidden');
    const visiblePass = div.querySelector('.password-visible');

    toggleBtn.addEventListener('click', () => {
      if (hiddenPass.style.display !== 'none') {
        hiddenPass.style.display = 'none';
        visiblePass.style.display = 'inline';
        toggleBtn.textContent = 'Hide Password';
      } else {
        hiddenPass.style.display = 'inline';
        visiblePass.style.display = 'none';
        toggleBtn.textContent = 'Show Password';
      }
    });

    fillFormBtn.addEventListener('click', () => {
      fillFormOnCurrentTab(entry.username, entry.password);
    });

    deleteBtn.addEventListener('click', () => {
      deletePassword(entry.id);
    });

    passwordList.appendChild(div);
  });
}

// Update the event listeners in your existing code
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('search-button').addEventListener('click', searchPasswords);
  
  // Initial load of passwords
  const masterPasswordVerified = document.getElementById('verify-password').style.display === 'none';
  if (masterPasswordVerified) {
    getAllPasswords();
  }
});
// Delete password from the server
async function deletePassword(id) {
  try {
    const response = await fetch(`${serverUrl}/api/delete-password/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      showModal('Password deleted from server!');
      searchPasswords(); // Refresh the password list
    } else {
      showModal('Failed to delete password from server.');
    }
  } catch (error) {
    console.error('Fetch error:', error); // Debugging line
  }
}

// Generate a strong, random password
function generatePassword() {
  const length = parseInt(document.getElementById('password-length').value, 10);
  const includeUppercase = document.getElementById('include-uppercase').checked;
  const includeLowercase = document.getElementById('include-lowercase').checked;
  const includeNumbers = document.getElementById('include-numbers').checked;
  const includeSymbols = document.getElementById('include-symbols').checked;

  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = '';
  if (includeUppercase) charset += uppercaseChars;
  if (includeLowercase) charset += lowercaseChars;
  if (includeNumbers) charset += numberChars;
  if (includeSymbols) charset += symbolChars;

  if (!charset) {
    showModal('Please select at least one character type.');
    return '';
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

// Display the generated password
document.getElementById('generate-button').addEventListener('click', () => {
  const generatedPassword = generatePassword();
  if (generatedPassword) {
    document.getElementById('generated-password').value = generatedPassword;
  }
});

// Use the generated password in the "Add Password" form
document.getElementById('use-password').addEventListener('click', () => {
  const generatedPassword = document.getElementById('generated-password').value;
  if (generatedPassword) {
    document.getElementById('password').value = generatedPassword;
  } else {
    showModal('Please generate a password first.');
  }
});

// Load the master password UI
function loadMasterPasswordUI() {
  chrome.storage.local.get(['masterPassword'], (data) => {
    if (!data.masterPassword) {
      // If no master password is set, use the default one
      chrome.storage.local.set({ masterPassword: DEFAULT_MASTER_PASSWORD }, () => {
        console.log('Default master password set:', DEFAULT_MASTER_PASSWORD); // Debugging line
      });
    }

    // Show the verification UI
    document.getElementById('verify-password').innerHTML = `
      <h2>Verify Identity</h2>
      <input type="password" id="master-password" placeholder="Enter Master Password">
      <button id="verify-button">Verify</button>
    `;
    document.getElementById('verify-button').addEventListener('click', verifyMasterPassword);
  });
}

// Verify the master password
function verifyMasterPassword() {
  const masterPasswordInput = document.getElementById('master-password');
  if (!masterPasswordInput) {
    console.error('Master password input field not found!');
    return;
  }

  const inputPassword = masterPasswordInput.value;
  console.log('Master Password Input Value:', inputPassword); // Debugging line

  if (!inputPassword) {
    showModal('Please enter the master password.');
    return;
  }

  chrome.storage.local.get(['masterPassword'], (data) => {
    const storedPassword = data.masterPassword || DEFAULT_MASTER_PASSWORD;
    console.log('Stored Password:', storedPassword); // Debugging line
    console.log('Entered Password:', inputPassword); // Debugging line

    if (inputPassword === storedPassword) {
      document.getElementById('content').style.display = 'block';
      document.getElementById('verify-password').style.display = 'none';
    } else {
      showModal('Incorrect master password.');
    }
  });
}

// Event listeners
document.getElementById('save-password').addEventListener('click', savePassword);
document.getElementById('search-button').addEventListener('click', searchPasswords);

// Initialize the encryption key when the popup loads
generateKey().then(() => {
  console.log('Encryption key initialized!');
  // Load the master password UI
  loadMasterPasswordUI();
}).catch((error) => {
  console.error('Initialization failed:', error);
});


// Add a new function to fill the form on the current tab
function fillFormOnCurrentTab(username, password) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;
    chrome.tabs.sendMessage(
      activeTab,
      { action: "fillForm", username, password },
      (response) => {
        if (response && response.success) {
          showModal('Form filled successfully!');
        } else {
          showModal('Failed to fill the form. Make sure you are on a login page.');
        }
      }
    );
  });
}

// Modify the displayPasswords function to add a "Fill Form" button
async function displayPasswords(passwords) {
  const passwordList = document.getElementById('password-list');
  passwordList.innerHTML = '<h2>Stored Passwords</h2>';
  for (let i = 0; i < passwords.length; i++) {
    const entry = passwords[i];
    const div = document.createElement('div');
    const decryptedPassword = await decryptPassword(entry.password);
    if (decryptedPassword) {
      div.textContent = `Site: ${entry.siteName}, Username: ${entry.username}, Password: ${decryptedPassword}`;

      // Add a "Fill Form" button
      const fillFormButton = document.createElement('button');
      fillFormButton.textContent = 'Fill Form';
      fillFormButton.addEventListener('click', () =>
        fillFormOnCurrentTab(entry.username, decryptedPassword)
      );
      div.appendChild(fillFormButton);

      // Add a delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => deletePassword(entry.id));
      div.appendChild(deleteButton);

      passwordList.appendChild(div);
    } else {
      console.error('Failed to decrypt password for:', entry.siteName);
    }
  }
}

// Custom Modal Functions
function showModal(message) {
  const modal = document.getElementById('custom-modal');
  const modalMessage = document.getElementById('modal-message');
  modalMessage.textContent = message;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('custom-modal');
  modal.style.display = 'none';
}

// Attach Event Listeners
document.getElementById('modal-close').addEventListener('click', closeModal);