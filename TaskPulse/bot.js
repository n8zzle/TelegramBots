require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

// Получаем токен бота из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Устанавливаем доступные команды для бота
bot.setMyCommands([
  { command: "/start", description: "Запустить бота и увидеть меню" },
  { command: "/create_task", description: "Создать новую задачу" },
  { command: "/create_subtask", description: "Создать подзадачу" },
  { command: "/show_tasks", description: "Показать все задачи" },
  { command: "/remove_task", description: "Удалить задачу" },
  { command: "/remove_subtask", description: "Удалить подзадачу" },
]);

// Хранение задач в памяти
let tasks = {};

// Функция для проверки, является ли сообщение командой
function isCommand(text) {
  return text.startsWith("/");
}

// Функция для проверки, является ли введенный текст числом
function isNumber(text) {
  return !isNaN(parseInt(text, 10));
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Добро пожаловать в бот для управления задачами! 🎉\n\n" +
      "Доступные команды:\n" +
      "/create_task - Создать задачу\n" +
      "/create_subtask - Создать подзадачу\n" +
      "/show_tasks - Показать все задачи\n" +
      "/remove_task - Удалить задачу\n" +
      "/remove_subtask - Удалить подзадачу",
  );
});

// Обработка команды создания задачи
bot.onText(/\/create_task/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "💡 Давайте добавим новую задачу!\n\n" +
      'Введите описание задачи (например, "Купить молоко"):',
  );
  bot.once("message", (msg) => {
    const task = msg.text;

    // Проверка, что пользователь не ввел команду
    if (isCommand(task)) {
      bot.sendMessage(
        chatId,
        "❌ Это команда. Пожалуйста, введите описание задачи, а не команду.",
      );
      return;
    }

    // Проверка, что описание задачи не пустое
    if (!task || task.trim() === "") {
      bot.sendMessage(
        chatId,
        "❌ Описание задачи не может быть пустым. Пожалуйста, введите описание.",
      );
      return;
    }

    // Добавление задачи в список
    if (!tasks[chatId]) {
      tasks[chatId] = [];
    }
    const newTask = {
      id: tasks[chatId].length + 1,
      taskName: task,
      subtasks: [],
    };
    tasks[chatId].push(newTask);
    bot.sendMessage(
      chatId,
      `✅ Задача успешно добавлена!\n\n` +
        `Задача: ${task}\n` +
        `ID задачи: ${newTask.id}\n` +
        "\n Теперь вы можете добавлять подзадачи или просматривать все задачи. Чтобы посмотреть все задачи, используйте команду /show_tasks.",
    );
  });
});

// Обработка команды создания подзадачи
bot.onText(/\/create_subtask/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "🔧 Давайте добавим подзадачу к существующей задаче!\n\n" +
      "Введите ID задачи, к которой хотите добавить подзадачу:",
  );
  bot.once("message", (msg) => {
    if (isCommand(msg.text)) {
      bot.sendMessage(
        chatId,
        "❌ Это команда. Пожалуйста, введите числовой ID задачи, а не команду.",
      );
      return;
    }

    const taskId = parseInt(msg.text, 10); // Преобразуем в целое число

    // Проверка, что ID задачи - это число
    if (!isNumber(msg.text)) {
      bot.sendMessage(
        chatId,
        "❌ ID задачи должен быть числом. Пожалуйста, введите числовой ID.",
      );
      return;
    }

    const task = tasks[chatId]?.find((t) => t.id === taskId);

    // Проверка, что задача с таким ID существует
    if (!task) {
      bot.sendMessage(
        chatId,
        `❌ Задача с ID ${taskId} не найдена. Пожалуйста, введите правильный ID.`,
      );
      return;
    }

    // После того, как ID задачи найден, спрашиваем описание подзадачи
    bot.sendMessage(
      chatId,
      '📝 Теперь введите описание подзадачи (например, "Купить хлеб"):',
    );
    bot.once("message", (subtaskMsg) => {
      if (isCommand(subtaskMsg.text)) {
        bot.sendMessage(
          chatId,
          "❌ Это команда. Пожалуйста, введите описание подзадачи, а не команду.",
        );
        return;
      }

      // Проверка, что описание подзадачи не пустое
      const subtask = subtaskMsg.text;
      if (!subtask || subtask.trim() === "") {
        bot.sendMessage(
          chatId,
          "❌ Описание подзадачи не может быть пустым. Пожалуйста, введите описание подзадачи.",
        );
        return;
      }

      // Добавление подзадачи
      task.subtasks.push(subtask);
      bot.sendMessage(
        chatId,
        `✅ Подзадача успешно добавлена в задачу с ID ${taskId}!\n\n` +
          `Подзадача: ${subtask}\n` +
          "Теперь вы можете добавлять еще подзадачи или просматривать все задачи с помощью команды /show_tasks.",
      );
    });
  });
});

// Обработка команды просмотра всех задач
bot.onText(/\/show_tasks/, (msg) => {
  const chatId = msg.chat.id;
  if (!tasks[chatId] || tasks[chatId].length === 0) {
    bot.sendMessage(
      chatId,
      "😕 У вас нет задач. Для добавления задачи используйте команду /create_task.",
    );
    return;
  }

  let response = "📋 Ваши задачи:\n";
  tasks[chatId].forEach((task) => {
    response += `\n📝 ID задачи: ${task.id} - ${task.taskName}\n`;
    if (task.subtasks.length > 0) {
      response += "🔹 Подзадачи:\n";
      task.subtasks.forEach((subtask, index) => {
        response += `${index + 1}. ${subtask}\n`;
      });
    } else {
      response += "Нет подзадач.\n";
    }
  });

  bot.sendMessage(chatId, response);
});

// Обработка удаления задачи
bot.onText(/\/remove_task/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "🗑️ Давайте удалим задачу! Для этого введите ID задачи, которую хотите удалить:",
  );
  bot.once("message", (msg) => {
    if (isCommand(msg.text)) {
      bot.sendMessage(
        chatId,
        "❌ Это команда. Пожалуйста, введите числовой ID задачи для удаления.",
      );
      return;
    }

    const taskId = parseInt(msg.text, 10);
    const taskIndex = tasks[chatId]?.findIndex((task) => task.id === taskId);

    // Проверка, что задача с таким ID существует
    if (taskIndex === -1) {
      bot.sendMessage(
        chatId,
        `❌ Задача с ID ${taskId} не найдена. Пожалуйста, введите правильный ID.`,
      );
      return;
    }

    const removedTask = tasks[chatId].splice(taskIndex, 1);
    bot.sendMessage(
      chatId,
      `✅ Задача с ID ${taskId} успешно удалена: ${removedTask[0].taskName}`,
    );
  });
});

// Обработка удаления подзадачи
bot.onText(/\/remove_subtask/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "🗑️ Давайте удалим подзадачу! Для этого введите ID задачи, из которой хотите удалить подзадачу:",
  );
  bot.once("message", (msg) => {
    if (isCommand(msg.text)) {
      bot.sendMessage(
        chatId,
        "❌ Это команда. Пожалуйста, введите числовой ID задачи для удаления подзадачи.",
      );
      return;
    }

    const taskId = parseInt(msg.text, 10);
    const task = tasks[chatId]?.find((task) => task.id === taskId);

    // Проверка, что задача с таким ID существует
    if (!task) {
      bot.sendMessage(
        chatId,
        `❌ Задача с ID ${taskId} не найдена. Пожалуйста, введите правильный ID.`,
      );
      return;
    }

    bot.sendMessage(chatId, "Введите номер подзадачи для удаления:");
    bot.once("message", (subtaskMsg) => {
      if (isCommand(subtaskMsg.text)) {
        bot.sendMessage(
          chatId,
          "❌ Это команда. Пожалуйста, введите номер подзадачи для удаления.",
        );
        return;
      }

      const subtaskIndex = parseInt(subtaskMsg.text, 10) - 1;

      if (subtaskIndex < 0 || subtaskIndex >= task.subtasks.length) {
        bot.sendMessage(chatId, "❌ Неверный номер подзадачи.");
        return;
      }

      const removedSubtask = task.subtasks.splice(subtaskIndex, 1);
      bot.sendMessage(
        chatId,
        `✅ Подзадача "${removedSubtask[0]}" успешно удалена из задачи с ID ${taskId}.`,
      );
    });
  });
});
