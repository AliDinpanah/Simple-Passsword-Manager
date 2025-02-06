// Server URL (update this to your server URL)
const serverUrl = 'http://localhost:3000';

// Generate and persist the encryption key
// Generate and persist the encryption key
let encryptionKey;

const DEFAULT_MASTER_PASSWORD = 'master';

async function generateKey() {
  return new Promise(async (resolve, reject) => {
    // Check if the key already exists in localStorage
    const storedKey = localStorage.getItem('encryptionKey');
    if (storedKey) {
      // Import the existing key
      const keyData = Uint8Array.from(JSON.parse(storedKey));
      encryptionKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      console.log('Encryption key loaded from localStorage.');
      resolve();
    } else {
      // Generate a new key and save it to localStorage
      encryptionKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true, // Whether the key is extractable
        ['encrypt', 'decrypt'] // Key usages
      );
      const exportedKey = await crypto.subtle.exportKey('raw', encryptionKey);
      const keyArray = Array.from(new Uint8Array(exportedKey));
      localStorage.setItem('encryptionKey', JSON.stringify(keyArray));
      console.log('Encryption key generated and saved to localStorage.');
      resolve();
    }
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

// Function to fetch all passwords
async function getAllPasswords() {
  try {
    const response = await fetch(`${serverUrl}/api/get-passwords`);
    const data = await response.json();
    
    if (data) {
      await displayPasswords(data);
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
      response = await fetch(`${serverUrl}/api/passwords/search/${encodeURIComponent(searchQuery)}`);
    } else {
      response = await fetch(`${serverUrl}/api/get-passwords`);
    }
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data) {
      await displayPasswords(data);
    } else {
      showModal('No passwords found');
    }
  } catch (error) {
    showModal('Error connecting to server');
    console.error('Error:', error);
  }
}

// Updated displayPasswords function that decrypts the password before displaying it
async function displayPasswords(passwords) {
  const passwordList = document.getElementById('password-list');
  passwordList.innerHTML = '<h2>Stored Passwords</h2>';

  if (passwords.length === 0) {
    const div = document.createElement('div');
    div.textContent = 'No passwords found';
    passwordList.appendChild(div);
    return;
  }

  // Use a for…of loop to await decryption for each entry
  for (const entry of passwords) {
    // Decrypt the password before displaying it
    const decryptedPassword = await decryptPassword(entry.password);

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="password-entry">
        <p><strong>Site:</strong> ${entry.siteName}</p>
        <p><strong>Username:</strong> ${entry.username}</p>
        <p><strong>Password:</strong> 
          <span class="password-hidden">********</span>
          <span class="password-visible" style="display:none">${decryptedPassword}</span>
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
      fillFormOnCurrentTab(entry.username, decryptedPassword);
    });

    deleteBtn.addEventListener('click', () => {
      deletePassword(entry.id);
    });

    passwordList.appendChild(div);
  }
}

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
      getAllPasswords(); // Load passwords after verification
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
