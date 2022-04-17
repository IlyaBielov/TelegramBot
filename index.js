const TeleBot = require('telebot');
const TELEGRAM_BOT_TOKEN = '5354309374:AAF_2qMy3yebVyvAo_FMot9EsLyhDE3xQgw'
const bot = new TeleBot({token: TELEGRAM_BOT_TOKEN});
const axios = require('axios');

const url = 'https://jollymanager.com'

const headers = {
  'Content-Type': 'application/json',
  'Authorization': null
}

const volunteerBtn = 'Волонтер';
const helpBtn = 'Запит';
const sendBtn = 'Відправити';
const loginBtn = 'Авторизуватися';

const persons = ['Гуманітарний відділ', 'Військовий відділ']

let loginButtons = createButton([loginBtn]);
let startButtons = createButton([volunteerBtn, helpBtn]);
let sendButton = createButton([sendBtn]);
let personsButton = createButton(persons);

let IsVolunteer = false;
let stepVolunteer = 0;

const user = {
  name: '',
  organization: '',
  speciality: '',
}

const volunteer = {
  "first_name": "",
  "last_name": "",
  "phone_number": "",
  "patronymic": "",
  "comment": "",
  "city": 1,
  "departament": ""
}

let IsLogin = false;
let stepLogin = 0;
const loginUser = {
  "email": null,
  "password": null,
  'chat_id': null
}

bot.on('/start', msg => {
  IsLogin = true;
  loginUser.chat_id = msg.from.id
  return bot.sendMessage(msg.from.id, 'Авторизація. Ведіть email', { markup: loginButtons });
});

bot.on('text', msg => {
  parseAuth(msg);
  parseVolunteer(msg);
});

async function parseAuth(msg) {
  if (IsLogin && stepLogin === 0) {
    stepLogin += 1
    loginUser.email = msg.text;
    return bot.sendMessage(msg.from.id, 'Ведіть пароль');
  }

  if (stepLogin === 1) {
    stepLogin = 0
    IsLogin = false
    loginUser.password = msg.text;
    return bot.sendMessage(msg.from.id, 'Натисніть авторизуватись');
  }

  if (msg.text === loginBtn) {
    const req = await axios.post(url + '/api/v1/login/', loginUser)
    headers.Authorization = 'Bearer ' + req.data.access_token;

    user.name = req.data.user.full_name
    user.organization = req.data.user.permissions.organization
    user.speciality = req.data.user.permissions.speciality

    if (req.data.user.permissions.is_admin) {
      return bot.sendMessage(msg.from.id, 'Вітаємо!' + user.organization + ' Callcentr ' + user.name, { markup: startButtons });
    } else {
      return bot.sendMessage(msg.from.id, 'Вітаємо!' + user.organization + ' ' + user.speciality + ' ' + user.name);
    }
  }
}

async function parseVolunteer(msg) {
  if (msg.text === volunteerBtn) {
    IsVolunteer = true;
    return bot.sendMessage(msg.from.id, 'Ведіть ім\'я', { markup: sendButton });
  }

  if (IsVolunteer) {
    stepVolunteer += 1;
    if (stepVolunteer === 1) {
      volunteer.first_name = msg.text
      return bot.sendMessage(msg.from.id, 'Ведіть призвіще');
    }
    if (stepVolunteer === 2) {
      volunteer.last_name = msg.text
      return bot.sendMessage(msg.from.id, 'Ведіть Побатькові');
    }
    if (stepVolunteer === 3) {
      volunteer.patronymic = msg.text
      return bot.sendMessage(msg.from.id, 'Ведіть номер телефону');
    }
    if (stepVolunteer === 4) {
      volunteer.phone_number = msg.text
      return bot.sendMessage(msg.from.id, 'Ведіть Коментар');
    }
    if (stepVolunteer === 5) {
      volunteer.comment = msg.text
      return bot.sendMessage(msg.from.id, parseData(volunteer));
    }
    if (stepVolunteer === 6 && msg.text === sendBtn) {
      return bot.sendMessage(msg.from.id, 'Віберіть кому', { markup: personsButton });
    }
    if (stepVolunteer === 7) {
      if (msg.text === persons[0]) {
        user.departament = 2
      }
      if (msg.text === persons[1]) {
        user.departament = 3
      }
      IsVolunteer = false;
      stepVolunteer = 0;
      const req = await axios.post(url + '/api/v1/volunteer/', volunteer, { headers })
      return bot.sendMessage(msg.from.id, 'Відправленно: ' + req.status, { markup: startButtons });
    }
  }
}

function createButton(buttons) {
  return bot.keyboard([buttons], { resize: true });
}

function parseData(data) {
  return `Ім\'я: ${data.first_name},
Призвіще: ${data.last_name},
Побатькові: ${data.patronymic},
Пелефон: ${data.phone_number},
Коментар: ${data.comment},`
}

bot.start();