const XLSX = require('xlsx');
const _ = require('lodash');
const chalk = require('chalk');
const rateTable = require('./rate');

const args = process.argv;
const workbook = XLSX.readFile(args[2]);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const wsjson = XLSX.utils.sheet_to_json(worksheet, {
  header: 
  [
  'shop_date',
  'pay_date',
  'card',
  'amount',
  'detail',
  'currency',
  'category',
  'comment'
  ]
});
const baseRate = 0.005;
const isBinding = true;
const bindingBonusRate = isBinding ? 0.01 : 0;
let bills = _.drop(wsjson, 1);
let finalBills = [];
let validTotal = 0;
let validBonus = 0;

const cashCalc = function (bill, amount, bounsRate) {
  bill.cash = {};
  bill.cash.base = Math.round(amount * baseRate);
  bill.cash.binding = Math.round(amount * bindingBonusRate);
  bill.cash.bonus = Math.round(amount * bounsRate);

  return bill;
}

_.map(bills, function (bill) {
  bill.amount = parseInt(bill.amount.replace('NT$', '').replace(',', ''));
  return bill;
});

_.each(_.take(bills, args[3]), function (bill) {

  if (bill.amount < 0) {
    let isCashBack = false;
    let amount = Math.abs(bill.amount);

    _.each(rateTable, function (rate) {
      if (rate.match.test(bill.detail)) {
        if (rate.rate !== 0) {
          validTotal += amount;
          validBonus += amount;
          finalBills.push(cashCalc(bill, amount, rate.rate));
        } else {
          finalBills.push(cashCalc(bill, 0, 0));
        }
        isCashBack = true;
        return false;
      }
    });
    if (!isCashBack) {
      validTotal += amount;
      finalBills.push(cashCalc(bill, amount, 0));
    }
  } else {
    finalBills.push(cashCalc(bill, 0, 0));
  }
});

const cashBasic = Math.round(validTotal * baseRate);
const cashBinding = Math.round(validTotal * bindingBonusRate);
const cashBonus = Math.round(validBonus * 0.02);

console.log(finalBills);
console.log('\n基本回饋：', cashBasic);
if (cashBinding + cashBonus >= 500) {
  console.log(chalk.dim.strikethrough('\n綁定加碼：', cashBinding));
  console.log(chalk.dim.strikethrough('指定數位：', cashBonus));
  console.log('加碼回饋到達上限，以500計');
} else {
  console.log('綁定加碼：', cashBinding);
  console.log('指定數位：', cashBonus);
}
