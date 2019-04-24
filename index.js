const Telegraf = require('telegraf');
var jsforce = require('jsforce');
const Markup = require('telegraf/markup')
const Calendar = require('telegraf-calendar-telegram');
const API_TOKEN = process.env.API_TOKEN || '816160560:AAF6MXIxXmMaURbCAUA2swJLg6hbBymRmqo';
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || 'https://your-heroku-app.herokuapp.com';


const bot = new Telegraf(API_TOKEN);
bot.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);
expressApp.use(bot.webhookCallback(`/bot${API_TOKEN}`));


var conn = new jsforce.Connection();
conn.login('fibee94@k4.com', '100694Artem', function (err, res) {
  if (err) { return console.error(err); }
  console.log(res);
});

let login = new String()
let password = new String()
let userId = new String()
var user = [];
var balanceListUser = [];
var spentAmountUser = [];
var todayIs = ''
var amountUser = ''
var descriptionUser = ''
var todayDescriptionUser = ''
var dateUser = ''

const replyKeyboard = () => Markup.keyboard([
  Markup.button('Balance'),
  Markup.button('Add card')
]).extra()

const replyKeyboardAddCard = () => Markup.keyboard([
  Markup.button('Today'),
  Markup.button('The calendar'),
  Markup.button('Cancel')
]).extra()

const replyKeyboardAddCardCancel = () => Markup.keyboard([
  Markup.button('Cancel')
]).extra()




const calendar = new Calendar(bot, {
  startWeekDay: 1,
  weekDayNames: ["L", "M", "M", "G", "V", "S", "D"],
  monthNames: [
    "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
    "Lug", "Ago", "Set", "Ott", "Nov", "Dic"
  ]
});
calendar.setDateListener((context, date) => {
  dateUser = date
  context.reply("Date selected!", replyKeyboardAddCardCancel())
  context.reply('Enter amount!')

});

bot.hears('Today', (ctx) => {
  ctx.reply("Enter amount!", replyKeyboardAddCardCancel())
  todayIs = 'isToday'
})
bot.hears('The calendar', (ctx) => {
  todayIs = 'isCalendar'
  const today = new Date();
  const minDate = new Date();
  minDate.setMonth(today.getMonth() - 200);
  const maxDate = new Date();
  maxDate.setMonth(today.getMonth() + 200);
  maxDate.setDate(today.getDate());

  ctx.reply("Pick a date!", calendar.setMinDate(minDate).setMaxDate(maxDate).getCalendar())
})



bot.start((ctx) => {
  ctx.reply('Welcome! Enter your Login.')
  login = ''
  console.log(login);
  password = ''
  console.log(password);

})
bot.command('/cancel', (ctx) => {
  login = ''
  password = ''
  ctx.reply('Enter your Login', Markup.removeKeyboard().extra())
  console.log(login)

})





bot.hears('Cancel', (ctx) => {
  dateUser = ''
  amountUser = ''
  descriptionUser = ''
  ctx.reply("Done!", replyKeyboard())
})

bot.hears('Balance', ctx => {
  ctx.reply('Loading...')
  console.log(userId)
  var balance = 0
  var spentAmount = 0
  var records = [];
  conn.query("SELECT Balance__c, SpentAmount__c FROM Monthly_Expense__c WHERE  Keeper__c ='" + userId + "'", function (err, res) {
    if (err) { return console.error(err); }
    balanceListUser = res.records
    for (var i = 0; i < balanceListUser.length; i++) {
      var balanceFull = balance + balanceListUser[i].Balance__c
      balance = balanceFull
    }
    for (var i = 0; i < balanceListUser.length; i++) {
      var spentAmountFull = spentAmount + balanceListUser[i].SpentAmount__c
      spentAmount = spentAmountFull
    }

    var balanceUser = balanceFull - spentAmountFull
    ctx.reply("Balance :" + balanceUser)
  })


})
bot.hears('Add card', ctx => ctx.reply("What day would you like to create a card?", replyKeyboardAddCard()))

bot.on('text', (ctx) => {
  if (todayDescriptionUser == 'IsCalendarDescriptionUser') {
    descriptionUser = ctx.message.text
    ctx.reply('Loading...')
    todayDescriptionUser = ''
    conn.sobject("Expense_Card__c").create({
      CardDate__c: dateUser,
      Amount__c: amountUser,
      Description__c: descriptionUser,
      CardKeeper__c: userId,

    }, function (err, ret) {
      if (err || !ret.success) {
        console.error(err, ret);
        ctx.reply('Error! Incorrect data entry format', replyKeyboardAddCard())
        amountUser = ''
        descriptionUser = ''
        dateUser = ''
        return
      }

      ctx.reply('Completed', replyKeyboardAddCard())
      ctx.reply("Created record id : " + ret.id)
      amountUser = ''
      descriptionUser = ''
      dateUser = ''
    });
  } else {

    if (todayIs == 'isCalendar' && dateUser != '') {
      amountUser = ctx.message.text
      todayIs = ''
      todayDescriptionUser = 'IsCalendarDescriptionUser'
      ctx.reply('Enter a description')

    } else {
      if (todayDescriptionUser == 'IstodayDescriptionUser') {
        descriptionUser = ctx.message.text
        console.log(amountUser);
        console.log(descriptionUser);
        ctx.reply('Loading...')
        var todayDate = new Date();
        todayDescriptionUser = ''

        console.log(todayDate);
        conn.sobject("Expense_Card__c").create({
          CardDate__c: todayDate,
          Amount__c: amountUser,
          Description__c: descriptionUser,
          CardKeeper__c: userId,

        }, function (err, ret) {
          if (err || !ret.success) {
            console.error(err, ret);
            ctx.reply('Error! Incorrect data entry format', replyKeyboardAddCard())
            amountUser = ''
            descriptionUser = ''
            return
          }

          ctx.reply('Completed', replyKeyboardAddCard())
          ctx.reply("Created record id : " + ret.id)
          amountUser = ''
          descriptionUser = ''
        });



      } else {

        if (todayIs == 'isToday') {
          amountUser = ctx.message.text
          ctx.reply('Enter a description.')
          todayIs = ''
          console.log(amountUser);
          todayDescriptionUser = 'IstodayDescriptionUser'
        } else {

          if (login != '' && password != '') {

            ctx.reply('Unknown command')

          } else {

            if (login == '') {

              login = ctx.message.text
              ctx.reply('Enter your Password')
              loginUser = login
              console.log(login);
              console.log(password);
            }

            else {
              password = ctx.message.text
              passwordUser = password
              console.log(login);
              console.log(password);
              ctx.reply('Loading...')
              var records = [];
              conn.query("SELECT Id, Name, Email, Password__c FROM Contact WHERE Email ='" + login + "'  AND Password__c ='" + password + "'", function (err, res) {
                if (err) { return console.error(err); }
                if (res.totalSize < 1) {
                  ctx.reply('Wrong login or password')
                  login = ''
                  password = ''
                  ctx.reply('Enter your Login')
                } else {
                  user = res.records
                  ctx.reply("To end the session, enter /cancel  Welcome! :" + user[0].Name, replyKeyboard())
                  userId = user[0].Id
                }
              });
            }
          }
        }
      }
    }
  }

})


bot.launch()

expressApp.get('/', (req, res) => {
  res.send('Hello World!');
});
expressApp.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});














