import React, { useState } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import './App.css';

const categories = [
  "Living Room", "Kitchen", "Main Bathroom", "En Suite Bathroom", "Bedroom", "Overall", "Stuff"
];

export default function CleaningLogApp() {
  const [items, setItems] = useState([
    { id: 1, name: "Vacuum Carpet", category: "Living Room", lastCleaned: null, previousCleaned: null },
    { id: 2, name: "Wipe Counters", category: "Kitchen", lastCleaned: null, previousCleaned: null },
  ]);
  const [newItem, setNewItem] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const handleDateChange = (id, date) => {
    setItems(items.map(item => item.id === id ? { ...item, previousCleaned: item.lastCleaned, lastCleaned: date } : item));
  };

  const handleToday = (id) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    handleDateChange(id, today);
  };

  const handleUndo = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, lastCleaned: item.previousCleaned, previousCleaned: null } : item));
  };

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    if (newItem.trim() === "") return;
    const newEntry = { id: Date.now(), name: newItem, category: selectedCategory, lastCleaned: null, previousCleaned: null };
    setItems([...items, newEntry]);
    setNewItem("");
  };

  // Updated getItemColor function
  const getItemColor = (lastCleaned) => {
    if (!lastCleaned) return "bg-gray-200"; // Default color if no date is selected
    console.log("no lastCleaned date");
    const daysAgo = differenceInDays(new Date(), parseISO(lastCleaned));
    
    if (daysAgo <= 7) {
      console.log("7 or less days ago");
      return "bg-green"; // Color for the last week
    }
    if (daysAgo <= 14) {
      console.log("14 or less days ago");
      return "bg-yellow"; // Color for between 1 and 2 weeks
    }
    return "bg-red"; // Color for over 2 weeks
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cleaning Log</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Enter new item"
          className="border p-1 rounded w-full"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border p-1 rounded"
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button onClick={handleAddItem} className="bg-green-500 text-white px-2 py-1 rounded">Add</button>
      </div>
      {categories.map(category => (
        <div key={category} className="mb-4">
          <h2 className="text-xl font-semibold mb-2">{category}</h2>
          {items.filter(item => item.category === category).map(item => (
            <div key={item.id} className={`flex gap-2 mb-2 items-center p-2 rounded ${getItemColor(item.lastCleaned)}`}>
              <span className="w-40">{item.name}</span>
              <input
                type="date"
                value={item.lastCleaned || ''}
                onChange={(e) => handleDateChange(item.id, e.target.value)}
                className="border p-1 rounded"
              />
              <button onClick={() => handleToday(item.id)} className="bg-blue-500 text-white px-2 py-1 rounded">Today</button>
              <button onClick={() => handleUndo(item.id)} className="bg-gray-500 text-white px-2 py-1 rounded">Undo</button>
              <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
