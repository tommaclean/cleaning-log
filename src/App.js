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

function App() {
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [items, setItems] = useState({});
  const [undoStack, setUndoStack] = useState([]);

  useEffect(() => {
    const itemsRef = ref(database, 'cleaningItems');
    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setItems(data);
    });
  }, []);

  const handleAddItem = () => {
    if (!newItem) return;

    const newItemRef = push(ref(database, 'cleaningItems'));
    const itemData = {
      name: newItem,
      category: selectedCategory,
      lastCleaned: new Date().toISOString().split('T')[0],
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

  const getColorClass = (date) => {
    const daysSince = Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (daysSince < 7) return 'bg-green';
    if (daysSince < 14) return 'bg-yellow';
    return 'bg-red';
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 overflow-x-hidden">
      <div className="w-full max-w-xl sm:max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Cleaning Log</h1>

        <div className="flex flex-col sm:flex-row gap-2 mb-4 items-start">
          <input
            type="text"
            placeholder="New item"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border p-2 rounded w-full sm:w-40"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button onClick={handleAddItem} className="bg-blue-500 text-white p-2 rounded">
            Add
          </button>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-4">
            <h2 className="text-xl font-semibold mb-2">{category}</h2>
            {Object.entries(items)
              .filter(([_, item]) => item.category === category)
              .map(([key, item]) => (
                <div
                  key={key}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 mb-2 rounded ${getColorClass(
                    item.lastCleaned
                  )}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <strong>{item.name}</strong>
                    <input
                      type="date"
                      value={item.lastCleaned}
                      onChange={(e) => handleDateChange(key, e.target.value)}
                      className="border p-1 rounded"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleToday(key)}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => handleUndoChange(key)}
                      className="bg-gray-500 text-white px-2 py-1 rounded"
                    >
                      Undo
                    </button>
                    <button
                      onClick={() => handleDelete(key)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
