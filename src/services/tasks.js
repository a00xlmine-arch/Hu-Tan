'use strict';

const { progress, dateKey } = require('../utils/format');

class TaskService {
  constructor(db) { this.db = db; }
  getTasks(user) {
    return [
      { id: 'messages', name: 'رسائل اليوم', target: 20, current: Math.min(20, user.dailyStats?.messages || 0), reward: 180 },
      { id: 'commands', name: 'أوامر اليوم', target: 5, current: Math.min(5, user.dailyStats?.commands || 0), reward: 150 },
      { id: 'games', name: 'فوز الألعاب', target: 2, current: Math.min(2, user.dailyStats?.gameWins || 0), reward: 220 }
    ];
  }
  claim(user) {
    const key = dateKey();
    if (user.taskState?.date !== key) user.taskState = { date: key, claimed: [] };
    const claimed = new Set(user.taskState.claimed || []);
    const ready = this.getTasks(user).filter((task) => task.current >= task.target && !claimed.has(task.id));
    if (!ready.length) return { ok: false, message: 'لا توجد مهمة جاهزة للمطالبة الآن.' };
    const total = ready.reduce((sum, task) => sum + task.reward, 0);
    for (const task of ready) claimed.add(task.id);
    user.taskState = { date: key, claimed: [...claimed] };
    user.coins += total;
    this.db.addTransaction(user.id, 'مهام', total, '', 'مكافآت مهام يومية');
    this.db.scheduleSave();
    return { ok: true, total, claimed: ready };
  }
  render(user) {
    const key = dateKey();
    if (user.taskState?.date !== key) user.taskState = { date: key, claimed: [] };
    const claimed = new Set(user.taskState.claimed || []);
    return this.getTasks(user).map((task) => {
      const done = task.current >= task.target;
      const state = claimed.has(task.id) ? ' — مستلمة' : done ? ' — جاهزة' : '';
      return `• ${task.name}
  ${progress(task.current, task.target)}
  المكافأة: ${task.reward} عملة${state}`;
    }).join('\n');
  }
}
module.exports = TaskService;
