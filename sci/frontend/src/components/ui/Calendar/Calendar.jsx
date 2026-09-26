import React, { useState } from 'react';
import './Calendar.css';

export const Calendar = () => {
  const [date, setDate] = useState(new Date());

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const daysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const startingDay = firstDay.getDay(); // 0 = Sunday

  const daysInCurrentMonth = daysInMonth(date.getMonth(), date.getFullYear());

  const weeks = [];
  let week = [];

  // Add empty cells for starting day
  for (let i = 0; i < startingDay; i++) {
    week.push(<div key={i} className="calendar-day empty"></div>);
  }

  for (let day = 1; day <= daysInCurrentMonth; day++) {
    if (week.length === 7) {
      weeks.push(<div key={`week-${week.length}`} className="calendar-week">{week}</div>);
      week = [];
    }
    week.push(<div key={day} className="calendar-day">{day}</div>);
  }

  // Fill remaining days of the week
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(<div key={`empty-${week.length}`} className="calendar-day empty"></div>);
    }
    weeks.push(<div key={`week-${week.length}`} className="calendar-week">{week}</div>);
  }

  const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={() => setDate(prevMonth)} className="calendar-nav-btn">‹</button>
        <div className="calendar-month-year">{monthNames[date.getMonth()]} {date.getFullYear()}</div>
        <button onClick={() => setDate(nextMonth)} className="calendar-nav-btn">›</button>
      </div>
      <div className="calendar-days-header">
        {dayNames.map(day => <div key={day} className="calendar-day-name">{day}</div>)}
      </div>
      <div className="calendar-weeks">{weeks}</div>
    </div>
  );
};

Calendar.displayName = 'Calendar';