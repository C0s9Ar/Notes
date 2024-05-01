
// Input Fields
const signupNicknameInput = document.getElementById("nicknameInput");
const signupPasswordInput = document.getElementById("passwordInput");

// Buttons
const signupNotesBtn = document.getElementById("notesBtn");
const signupLoginBtn = document.getElementById("loginBtn");
const signupSignupBtn = document.getElementById("signupBtn");


// Error message
const signupErrorMsg = document.getElementById("signupErrorMsg");


// Go to main page if user is already logged in
if (localStorage.getItem('accessToken') != null)
    window.location.href = '/';


// Goto main page (notes.html)
signupNotesBtn.onclick = function(){
    window.location.href = '/';
}

// Goto login page (login.html)
signupLoginBtn.onclick = function(){
    window.location.href = 'loginPage';
}

// Sign up button
signupSignupBtn.onclick = function(){
    var nicknameText = String(signupNicknameInput.value).trim();
    var passwordText = String(signupPasswordInput.value).trim();

    // Check if nickname meets length requirement
    if (nicknameText.length < 4){
        displayErrorMSG("Your nickname must be at least 4 characters!");
        return;
    }

    // Check if password meets length requirement
    if (passwordText.length < 8){
        displayErrorMSG("Password must be at least 8 characters!");
        return;
    }

    // Send the registration data to the server
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            nickname: nicknameText, 
            password: passwordText
        })
    }).then(response => {
        // Check if the request was successful
        if (response.ok) {
            return response.json();  // Parse JSON data from the response
        }
        else if (response.status === 409){
            displayErrorMSG('User already exists');
            return response.json();
        }
        else {
            throw new Error('Failed to register');  // Handle HTTP error responses
        }
    }).then(data => {
        // Handle the data received from the server
        if (data.message === 'User registered successfully') {
            window.location.href = 'loginPage';
            return;
        } 
        console.log('Registration failed: ' + data.message);
    }).catch(error => {
        // Log and alert any errors that occurred during the process
        console.error('Error:', error);
    });
}


function displayErrorMSG(msg){
    signupErrorMsg.style.display = "block";
    signupErrorMsg.innerHTML = msg;
    signupErrorMsg.classList.add("shake");
}
