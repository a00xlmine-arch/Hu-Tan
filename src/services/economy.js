'use strict';

const { msToText } = require('../utils/format');
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

class EconomyService {
  constructor(db, limits) { this.db = db; this.limits = limits; }

  daily(user) {
    const remaining = this.limits.dailyCooldownMs - (Date.now() - Number(user.lastDaily || 0));
    if (remaining > 0) return { ok: false, message: `استلمتِ اليومية مسبقًا. عودي بعد ${msToText(remaining)}.` };
    const reward = rand(250, 450);
    user.coins += reward;
    user.lastDaily = Date.now();
    this.db.addTransaction(user.id, 'يومية', reward, '', 'المكافأة اليومية');
    this.db.scheduleSave();
    return { ok: true, reward };
  }

  work(user) {
    const remaining = this.limits.workCooldownMs - (Date.now() - Number(user.lastWork || 0));
    if (remaining > 0) return { ok: false, message: `الوظيفة متاحة مجددًا بعد ${msToText(remaining)}.` };
    const reward = rand(80, 220);
    user.coins += reward;
    user.lastWork = Date.now();
    this.db.addTransaction(user.id, 'عمل', reward, '', 'مكافأة وظيفة');
    this.db.scheduleSave();
    return { ok: true, reward };
  }

  transfer(from, to, amount) {
    if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, message: 'المبلغ يجب أن يكون رقمًا صحيحًا موجبًا.' };
    if (from.coins < amount) return { ok: false, message: 'رصيدكِ النقدي لا يكفي.' };
    from.coins -= amount;
    to.coins += amount;
    this.db.addTransaction(from.id, 'تحويل', -amount, to.id, 'تحويل مرسل');
    this.db.addTransaction(to.id, 'تحويل', amount, from.id, 'تحويل مستلم');
    this.db.scheduleSave();
    return { ok: true };
  }

  deposit(user, amount) {
    if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, message: 'المبلغ يجب أن يكون رقمًا صحيحًا موجبًا.' };
    if (user.coins < amount) return { ok: false, message: 'لا تملكين هذا المبلغ نقدًا.' };
    user.coins -= amount; user.bank += amount;
    this.db.addTransaction(user.id, 'إيداع', amount, '', 'إيداع في البنك');
    this.db.scheduleSave();
    return { ok: true };
  }

  withdraw(user, amount) {
    if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, message: 'المبلغ يجب أن يكون رقمًا صحيحًا موجبًا.' };
    if (user.bank < amount) return { ok: false, message: 'رصيد البنك لا يكفي.' };
    user.bank -= amount; user.coins += amount;
    this.db.addTransaction(user.id, 'سحب', -amount, '', 'سحب من البنك');
    this.db.scheduleSave();
    return { ok: true };
  }
}

module.exports = EconomyService;
