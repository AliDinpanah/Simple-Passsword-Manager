// content.js

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillForm") {
    const { username, password } = request;

    // Find the username field using flexible selectors
    const usernameField = findUsernameField();
    const passwordField = document.querySelector('input[type="password"]');

    if (usernameField && passwordField) {
      // Fill the fields with the provided credentials
      usernameField.value = username;
      passwordField.value = password;

      // Optionally, trigger any events that might be needed (e.g., input or change events)
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));

      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, message: "Username or password field not found." });
    }
  }
});

// Helper function to find the username field
function findUsernameField() {
  // Common selectors for username fields
  const usernameSelectors = [
    'input[type="text"]',
    'input[type="email"]',
    'input[name="username"]',
    'input[name="user"]',
    'input[name="login"]',
    'input[name="email"]',
    'input[id="username"]',
    'input[id="user"]',
    'input[id="login"]',
    'input[id="email"]',
  ];

  // Try each selector until a match is found
  for (const selector of usernameSelectors) {
    const field = document.querySelector(selector);
    if (field) {
      return field;
    }
  }

  // If no match is found, return null
  return null;
}