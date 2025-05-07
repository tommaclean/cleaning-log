// App.js
import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import {
  ref,
  push,
  onValue,
  remove,
  set,
} from 'firebase/database';
import './App.css';

const categories = [
  'Living Room',
  'Kitchen',
  'Main Bathroom',
  'En Suite Bathroom',
  'Bedroom',
  'Overall',
  'Stuff',
];

const frequencyMap = {
  '1 week': 7,
  '2 weeks': 14,
  '3 weeks': 21,
  '1 month': 30,
  '2 months': 60,
  '3 months': 90,
};

function App() {
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [selectedFrequency, setSelectedFrequency] = useState('1 week');
  const [items, setItems] = useState({});
  const [undoStack, setUndoStack] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [collapsedCategories, setCollapsedCategories] = useState({});

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const itemsRef = ref(database, 'cleaningItems');
    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setItems(data);
    });
  }, []);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleAddItem = () => {
    if (!newItem) return;

    const newItemRef = push(ref(database, 'cleaningItems'));
    const itemData = {
      name: newItem,
      category: selectedCategory,
      lastCleaned: new Date().toISOString().split('T')[0],
      frequency: selectedFrequency,
    };
    set(newItemRef, itemData);
    setUndoStack([...undoStack, { type: 'add', key: newItemRef.key }]);
    setNewItem('');
  };

  const handleDelete = (key) => {
    setUndoStack([...undoStack, { type: 'delete', key, data: items[key] }]);
    remove(ref(database, `cleaningItems/${key}`));
  };

  const handleDateChange = (key, newDate) => {
    setUndoStack([...undoStack, { type: 'edit', key, data: items[key] }]);
    set(ref(database, `cleaningItems/${key}/lastCleaned`), newDate);
  };

  const handleToday = (key) => {
    const today = new Date().toISOString().split('T')[0];
    handleDateChange(key, today);
  };

  const handleUndoChange = (key) => {
    const lastAction = [...undoStack].reverse().find(action => action.key === key && action.type === 'edit');
    if (lastAction) {
      handleDateChange(key, lastAction.data.lastCleaned);
    }
  };

  const getColorClass = (lastCleaned, frequency) => {
    const daysSince = Math.floor((Date.now() - new Date(lastCleaned)) / (1000 * 60 * 60 * 24));
    const frequencyDays = frequencyMap[frequency] || 7;

    if (daysSince < frequencyDays / 2) return 'border-green-400';
    if (daysSince < frequencyDays) return 'border-yellow-400';
    return 'border-red-400';
  };

  const getDaysSince = (lastCleaned) => {
    return Math.floor((Date.now() - new Date(lastCleaned)) / (1000 * 60 * 60 * 24));
  };

  const toggleCollapse = (category) => {
    setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleAll = () => {
    const areAllCollapsed = categories.every(cat => collapsedCategories[cat]);
    const newState = {};
    categories.forEach(cat => {
      newState[cat] = !areAllCollapsed;
    });
    setCollapsedCategories(newState);
  };

  return (
    <div className="min-h-screen w-full p-4 sm:p-8 overflow-x-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-500">
      <div className="w-full max-w-3xl min-w-[320px] mx-auto">
        {/* Dark Mode Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleDarkMode}
            className="relative w-16 h-8 flex items-center bg-gray-300 dark:bg-gray-600 rounded-full p-1 transition-colors duration-300"
          >
            <span
              className={`absolute left-1 transition-transform duration-300 transform ${
                darkMode ? 'translate-x-8' : 'translate-x-0'
              } w-6 h-6 bg-white rounded-full flex items-center justify-center shadow`}
            >
              {darkMode ? '🌜' : '🌞'}
            </span>
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-4">Cleaning Log</h1>

        <div className="flex flex-col sm:flex-row gap-2 mb-2 items-start">
          <input
            type="text"
            placeholder="New item"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="border p-2 rounded w-full sm:w-auto dark:bg-gray-800 dark:border-gray-600"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border p-2 rounded w-full sm:w-40 dark:bg-gray-800 dark:border-gray-600"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={selectedFrequency}
            onChange={(e) => setSelectedFrequency(e.target.value)}
            className="border p-2 rounded w-full sm:w-40 dark:bg-gray-800 dark:border-gray-600"
          >
            {Object.keys(frequencyMap).map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
          <button onClick={handleAddItem} className="btn-primary">
            Add
          </button>
        </div>

        <div className="mb-4">
          <button onClick={toggleAll} className="btn-secondary">
            {categories.every(cat => collapsedCategories[cat]) ? 'Expand All' : 'Collapse All'}
          </button>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-6 p-4 border rounded-lg bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div
              className="category-header cursor-pointer"
              onClick={() => toggleCollapse(category)}
            >
              <h2 className="text-xl font-semibold">{category}</h2>
            </div>
            {!collapsedCategories[category] && (
              <div className="mt-4">
                {Object.entries(items)
                  .filter(([_, item]) => item.category === category)
                  .map(([key, item]) => (
                    <div
                      key={key}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 mb-2 border-l-4 rounded ${getColorClass(item.lastCleaned, item.frequency)} bg-gray-50 dark:bg-gray-700`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div>
                          <strong>{item.name}</strong>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{getDaysSince(item.lastCleaned)} days ago</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 items-center">
                        <input
                          type="date"
                          value={item.lastCleaned}
                          onChange={(e) => handleDateChange(key, e.target.value)}
                          className="border p-1 rounded dark:bg-gray-800 dark:border-gray-600"
                        />
                        <button onClick={() => handleToday(key)} className="btn-primary">Today</button>
                        <button onClick={() => handleUndoChange(key)} className="btn-secondary">↩</button>
                        <button onClick={() => handleDelete(key)} className="btn-danger">X</button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
