async function sendRequest(url, method, data) {
    url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`;

    const options = {
        method,
        headers: {
            'Accept': 'application/json',
        }
    };

    if (method === "POST") {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    } else if (method === "GET") {
        url += "?" + new URLSearchParams(data);
    }

    let response = await fetch(url, options);
    return await response.json();
}

let username;
let balance;
let points = 1000;
let authorizationForm = document.getElementById("authorization");
let game_id;

authorizationForm.addEventListener("submit", authorization);

async function authorization(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    username = formData.get('username');

        let response = await sendRequest("user", "GET", { username });
        
        if (response.error) {
            let regResponse = await sendRequest("user", "POST", { username });
            
            if (regResponse.error) {
                alert(regResponse.message);
            } else {
                balance = regResponse.balance;
                showUser();
            }
        } else {
            balance = response.balance;
            showUser();
        }
}
    
 


function showUser() {
    let popUpSection = document.querySelector('section');
    popUpSection.style.display = "none";
    let userInfo = document.querySelector("header span");
    userInfo.innerHTML = `[${username}, ${balance}]`;
    localStorage.setItem("username", username);

    let gameButton = document.getElementById("gameButton");
    if (localStorage.getItem("game_id")) {
        gameButton.setAttribute("data-game", "stop");
    } else {
        gameButton.setAttribute("data-game", "start");
    }
}

document.querySelector('.exit').addEventListener("click", exit);

function exit() {
    let popUpSection = document.querySelector('section');
    popUpSection.style.display = "flex";

    let userInfo = document.querySelector("header span");
    userInfo.innerHTML = `[]`;

    localStorage.removeItem("username");
}

async function checkUser() {
    if (localStorage.getItem("username")) {
        username = localStorage.getItem("username");
        let response = await sendRequest("user", "GET", { username });
        if (response.error) {
            alert(response.message);
        } else {
            balance = response.balance;
            showUser();
        }
    } else {
        let popUpSection = document.querySelector('section');
        popUpSection.style.display = "flex";
    }
}

let pointBtns = document.getElementsByName("point");
pointBtns.forEach(elem => {
    elem.addEventListener('input', setPoints);
});

function setPoints() {
    let checkedBtn = document.querySelector("input:checked");
    if (checkedBtn) {
        points = +checkedBtn.value;
    }
}

let gameButton = document.getElementById("gameButton");
if (gameButton) {
    gameButton.addEventListener("click", startOrStopGame);
}

function startOrStopGame() {
    let option = gameButton.getAttribute("data-game");
    if (option === "start") {
        if (points > 0) {
            startGame();
        }
    } else if (option === "stop") {
        stopGame();
    }
}

async function startGame() {
        let response = await sendRequest("new_game", "POST", { username, points });
        if (response.error) {
            alert(response.message);
        } else {
            console.log(response);
            game_id = response.game_id;
            gameButton.setAttribute("data-game", "stop");
            gameButton.innerHTML = "Завершить игру";
            activateArea();
        }
} 



function activateArea() {
    let cells = document.querySelectorAll(".cell");
    let rows = 8;
    let columns = 10;

    cells.forEach((cell, i) => {
        setTimeout(() => {
            if (cell) {
                cell.classList.add("active");
                cell.addEventListener("contextmenu", setFlag);
                cell.addEventListener("click", makeStep);
            } else {
                console.error("Cell is undefined for index:", i);
            }
        }, 30 * i);
    });
    
    
}

function setFlag(event) {
    event.preventDefault();
    let cell = event.target;
    cell.classList.toggle("flag");
}

async function makeStep() {
    let cell = event.target
    let row = +cell.getAttribute("data-row")
    let column = +cell.getAttribute("data-column")

    let response = await sendRequest("game_step", "POST", {game_id, row, column})
    if(response.error) {
        alert(response.message)
    } else {
        //Получен успешный ответ
        if(response.status == "Won") {
            //Выиграл
            updateArea(response.table)
            balance = response.balance
            showUser()
            alert("Ты выиграл!")
            clearArea()
            gameButton.setAttribute("data-game", "start")
            gameButton.innerHTML = "Игать"
        } else if(response.status == "Failed") {
            //Проиграл
            updateArea(response.table)
            balance = response.balance
            showUser()
            alert("Ты проиграл :(")
            clearArea()
            gameButton.setAttribute("data-game", "start")
            gameButton.innerHTML = "Играть"

        } else if(response.status == "Ok") {
            //Играем
            updateArea(response.table)
        }
    }
}


function updateArea(table) {
    let cells = document.querySelectorAll(".cell");
    let j = 0;
    for (let row = 0; row < table.length; row++) {
        for (let column = 0; column < table[row].length; column++) {
            let value = table[row][column];
            if (value === 0) {
                cells[j].classList.remove("active");
                cells[j].classList.remove("flag");
            } else if (value >= 1) {
                cells[j].classList.remove("active");
                cells[j].classList.remove("flag");
                cells[j].innerHTML = value;
            } else if (value === "BOMB") {
                cells[j].classList.remove("active");
                cells[j].classList.remove("flag");
                cells[j].classList.add("bomb");
            }
            j++;
        }
    }
}

async function stopGame() {
    try {
        let response = await sendRequest("stop_game", "POST", { username, game_id });
        if (response.error) {
            alert(response.message);
        } else {
            console.log(response);
            balance = response.balance;
            showUser();
            game_id = "";
            gameButton.setAttribute("data-game", "start");
            gameButton.innerHTML = "Играть";
            clearArea();
        }
    } catch (error) {
        console.error("Error during stopGame request:", error);
        alert("Произошла ошибка при остановке игры.");
    }
}

function clearArea() {
    let area = document.querySelector(".area");
    area.innerHTML = ""; // Очистка области перед добавлением новых ячеек
    for (let i = 0; i < 80; i++) {
        area.innerHTML += `<div class="cell"></div>`;
    }
}
