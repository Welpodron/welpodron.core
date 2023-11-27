const getMonthDays = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getDayOfWeek = (year: number, month: number, day: number) => {
  return new Date(year, month - 1, day).toLocaleString("ru-RU", {
    year: "numeric",
    weekday: "long",
    month: "long",
  });
};

const getMonthInfo = (year: number, month: number) => {
  const days = new Date(year, month + 1, 0).getDate();
  const date = new Date(year, month - 1, 1);

  const isCurrent = month === new Date().getMonth();

  return {
    date,
    days,
    isCurrent,
  };
};

const getDayInfo = (year: number, month: number, day: number) => {
  const date = new Date(year, month, day);
  // returns value between 0 - Sunday and 6 - Saturday
  const weekday = date.getDay();
  const _month = getMonthInfo(year, month);

  const isWeekend = weekday === 0 || weekday === 6;
  const isCurrent = date.toDateString() === new Date().toDateString();

  return {
    date,
    month: _month,
    isCurrent,
    isWeekend,
  };
};

const getPanel = ({ year, month }: { year: number; month: number }) => {
  const panelFlat = [];
  const panel = [];

  const matrixSize = 42;

  let leftBorder = new Date(year, month, 1).getDay();

  if (leftBorder === 0) {
    leftBorder = 7;
  }

  // -2 так как 0 день текущего месяца это последний день предыдущего месяца найс ))

  leftBorder = leftBorder - 2;

  for (let i = leftBorder * -1; i <= 0; i++) {
    const date = new Date(year, month, i);
    panelFlat.push(date);
  }

  const rightBorder = matrixSize - leftBorder;

  for (let i = 1; i < rightBorder; i++) {
    const date = new Date(year, month, i);
    panelFlat.push(date);
  }

  for (let i = 0; i < panelFlat.length; i += 7) {
    panel.push(panelFlat.slice(i, i + 7));
  }

  return panel;
};
