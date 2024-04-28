
// Inputs
const noteTitleInput = document.getElementById("noteTitle");
const noteTextInput = document.getElementById("noteText");

// Buttons
const noteAddBtn = document.getElementById("addBtn");

// Username/Login field
const noteUserInfoBox = document.getElementById("userInfo");

// Notes field
const noteList = document.getElementById("notes");

// Combobox
const noteCombobox = document.getElementById('combobox');
noteCombobox.insertAdjacentHTML("beforeend", `<option value="Everyone">Everyone</option>`);

//Filter
const noteFilterBtn = document.getElementById("filterBtn");
const noteStartDate = document.getElementById("startDate");
const noteEndDate = document.getElementById("endDate");

// Auth token
const token = localStorage.getItem('accessToken');

var nickname = '';
var notesArray = [];

var usersArray = new Set();
var min_date = getCurrentDate();
var max_date = getCurrentDate();

var add = 0;
var elementDeleting = false;

var filterName = "Everyone";
var filterStartDate = "";
var filterEndDate = "";

loadUserInfo();
const noteLogoutBtn = document.getElementById("logoutBtn");
const noteSignupBtn = document.getElementById("signupBtn");
const noteLoginBtn = document.getElementById("loginBtn");


function render() {
    noteList.innerHTML = "";
    if (notesArray.length === 0) {
        noteList.insertAdjacentHTML("beforeend",`<h2>There is no notes!</h2>`);
        return;
    }

    min_date = notesArray[0].date;
    max_date = notesArray[notesArray.length - 1].date;
    usersArray.clear();
    usersArray.add("Everyone");
    for (i = 0; i < notesArray.length; i++) {
        var appear = "";
        if ((i + 1 == notesArray.length) & (add)) {
            appear = "fade-in";
            add = 0;
        }

        // Add to users set
        usersArray.add(notesArray[i].author);

        if (notesArray[i].author != filterName && filterName != "Everyone"){
            continue;
        }

        if (filterStartDate != ""){
            var startDate = new Date(filterStartDate);
            var noteDate = new Date(notesArray[i].date);
            if (noteDate < startDate){
                continue;
            }
        }

        if (filterEndDate != ""){
            var endDate = new Date(filterEndDate);
            var noteDate = new Date(notesArray[i].date);
            if (noteDate > endDate){
                continue;
            }
        }


        // Display Note
        let noteHTML = `
        <div class="noteBG ${appear}">
        <div class="note">
            <input class="inputTitleList" placeholder="Title" maxlength="35" readonly="1" value="${notesArray[i].title}">
            <textarea class="inputTextList" placeholder="Sample text" maxlength="400" readonly="1">${notesArray[i].text}</textarea>
            <input class="nicknameText" placeholder="Nickname" maxlength="35" readonly="1" value="${notesArray[i].author}">
        `;

        if (token !== null && notesArray[i].author === nickname) {
            if ((new Date(getCurrentDate()) - new Date(notesArray[i].date)) / (1000 * 60 * 60 * 24) < 1){
                noteHTML += `
                <button data-index="${i}" class="editBtn listBtns">Edit</button>
                `;
            }

            noteHTML += `
                <button data-index="${i}" class="removeBtn listBtns">Delete</button>
            `;
        }

        // Закрытие тегов div
        noteHTML += `</div></div>`;

        // Вставка HTML в список заметок
        noteList.insertAdjacentHTML("beforeend", noteHTML);

    }
    noteCombobox.innerHTML = '';

    usersArray.forEach((user) => {
        noteCombobox.insertAdjacentHTML("beforeend",
            `
            <option value="${user}">${user}</option>
            `
        );
    });
}

noteTitleInput.onclick = function() {
    noteTitleInput.classList.remove("shake"); 
    noteTitleInput.style.color = "#0F0F0F"; 
    noteTitleInput.placeholder = "Title";
}

noteList.onclick = function(event) {
    console.log(min_date);
    console.log(max_date);
    console.log(usersArray);

    if (event.target.dataset.index === undefined)
        return;
    var element = event.target;
    var elementIndex = event.target.dataset.index;
    if (element.textContent === "Delete" && !elementDeleting) {
        elementDeleting = true;
        element = element.closest(".noteBG");
        element.innerHTML = "";
        element.style.height = "0px";
        element.style.margin = "0px auto";
        setTimeout(function() {
            element.style.display = "none";
            notesArray.splice(elementIndex, 1);
            render();
            elementDeleting = false;
        }, 1000);

        fetch(`/delete_note/${elementIndex + 1}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`  // Добавление токена в заголовки запроса
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();  // Обработка успешного ответа
            } else {
                throw new Error('Failed to delete note');  // Обработка ошибок ответа
            }
        })
        .then(data => {
            console.log('Delete success:', data);  // Вывод успешного удаления
        })
        .catch(error => console.error('Error:', error));
    }

    else if(element.textContent === "Edit") {
        element.textContent = "Save";
        element = element.closest(".noteBG");
        var textField = element.querySelector("textarea");

        textField.readOnly = false;
        textField.focus();
    }

    else if(element.textContent === "Save") {
        element.textContent = "Edit";
        element = element.closest(".noteBG");
        var textField = element.querySelector("textarea");
        notesArray[elementIndex].text = textField.value;

        textField.readOnly = true;
        textField.focus();

        fetch(`/update_note/${elementIndex + 1}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // Добавление токена в заголовки запроса
            },
            body: JSON.stringify({
                title: notesArray[elementIndex].title,  // Убедитесь, что здесь правильное свойство для заголовка
                text: textField.value  // Обновленный текст заметки
            })
        })
        .then(response => {
            if (!response.ok) {  // Проверка успешности HTTP запроса
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Update success:', data);  // Вывод успешного обновления
        })
        .catch(error => console.error('Error:', error));
    }

};


noteAddBtn.onclick = function() {
    // Go to login page if user is undefined
    if (token === null){
        window.location.href = 'loginPage';
        return;
    }


    if (String(noteTitleInput.value).trim() === "") {
        noteTitleInput.placeholder = "Title mustn't be empty!";
        noteTitleInput.style.color = "red";
        noteTitleInput.classList.add("shake");
        noteTitleInput.value = "";
        return;
    }

    let note = {
        id: notesArray.length,
        title: noteTitleInput.value.trim(),
        text: noteTextInput.value.trim(),
        author: getNickname(),
        date: getCurrentDate()
    }
    
    fetch('/add_note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            title: note.title, 
            text: note.text,
            author: note.author,
            date: note.date
        })
    }).then(response => response.json()).catch(error => console.error('Error loading the notes:', error));


    noteTitleInput.value = "";
    noteTextInput.value = "";
    add = 1;
    notesArray.push(note);
    render();
}

document.addEventListener("DOMContentLoaded", function() {
    fetch('/get_notes')
    .then(response => response.json())
    .then(data => {
        const notesContainer = document.getElementById('notes');
        notesContainer.innerHTML = '';
        if (data.length != 0) {
            data.forEach(note => {
                let note_struct = {
                    id: notesArray.length,
                    title: note.title,
                    text: note.text,
                    author: note.author,
                    date: note.date
                }
                notesArray.push(note_struct);
                render();
            });
        }
        render();
    }).catch(error => console.error('Error loading the notes:', error));
});

function getNickname() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.log('No token found');
        return null;
    }

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    console.log('Username from token:', payload.sub);
    return payload.sub; 
}


function loadUserInfo(){
    if (token === null){
        noteUserInfoBox.insertAdjacentHTML("beforeend", 
        `
        <button class="signupBtn" id="signupBtn" >Sign up</button>
        <button class="loginBtn" id="loginBtn" >Log in</button>
        `
        );
    }
    else {
        nickname = getNickname();
        noteUserInfoBox.insertAdjacentHTML("beforeend", 
        `
        <h3>${nickname}</h3>
        <button class="loginBtn" id="logoutBtn" >Log out</button>
        `
        );
    }
    
}

if (noteLogoutBtn) {
    noteLogoutBtn.addEventListener('click', function() {
        localStorage.removeItem('accessToken'); 
        window.location.href = '/';
    });
}

if (noteSignupBtn) {
    noteSignupBtn.onclick = function() {
        window.location.href = 'signupPage';
    };
}

if (noteLoginBtn) { 
    noteLoginBtn.onclick = function() {
        window.location.href = 'loginPage'; 
    };
}


function getCurrentDate() {
    var currentDate = new Date();

    var year = currentDate.getFullYear();
    var month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    var day = ('0' + currentDate.getDate()).slice(-2);
    var hours = ('0' + currentDate.getHours()).slice(-2);
    var minutes = ('0' + currentDate.getMinutes()).slice(-2);
    var seconds = ('0' + currentDate.getSeconds()).slice(-2);
    var formattedDate = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
    return formattedDate;
}


noteFilterBtn.onclick = function(){
    filterName = noteCombobox.value;
    if (isValidDate(noteStartDate.value)){
        filterStartDate = noteStartDate.value;
    }
    else {
        filterStartDate = "";
    }
    if (isValidDate(noteEndDate.value)){
        filterEndDate = noteEndDate.value;
    }  
    else {
        filterEndDate = "";
    }
    render();
}


function isValidDate(dateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;  

    if (dateStr.match(regex) === null) {
        return false;  
    }

    const date = new Date(dateStr);
    const timestamp = date.getTime();

    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
        return false;  
    }

    return date.toISOString().startsWith(dateStr); 
}