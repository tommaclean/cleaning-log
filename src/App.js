import React, { useState, useEffect } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import './App.css';
import { db } from './firebase';
import { ref, onValue, remove, update, push, set } from "firebase/database";

const categories = [
  "Living Room", "Kitchen", "Main Bathroom", "En Suite Bathroom", "Bedroom", "Overall", "Stuff"
];

export default function CleaningLogApp() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  useEffect(() => {
    const itemsRef = ref(db, "items");

    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fetchedItems = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setItems(fetchedItems);
      } else {
        setItems([]);
      }
    });

    return () => {
      // No need to manually detach listeners in React 18+
    };
  }, []);

  const handleDateChange = (id, date) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, previousCleaned: item.lastCleaned, lastCleaned: date } : item
    );
    setItems(updatedItems);

    update(ref(db, "items/" + id), {
      lastCleaned: date,
      previousCleaned: updatedItems.find(item => item.id === id).previousCleaned
    });
  };

  const handleToday = (id) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    handleDateChange(id, today);
  };

  const handleUndo = (id) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, lastCleaned: item.previousCleaned, previousCleaned: null } : item
    );
    setItems(updatedItems);

    update(ref(db, "items/" + id), {
      lastCleaned: updatedItems.find(item => item.id === id).previousCleaned,
      previousCleaned: null
    });
  };

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
    remove(ref(db, "items/" + id));
  };

  const handleAddItem = async () => {
    if (newItem.trim() === "") return;

    const newItemData = {
      name: newItem,
      category: selectedCategory,
      lastCleaned: null,
      previousCleaned: null
    };

    const newItemRef = push(ref(db, "items"));
    await set(newItemRef, newItemData);

    setItems([...items, { id: newItemRef.key, ...newItemData }]);
    setNewItem("");
  };

  const getItemColor = (lastCleaned) => {
    if (!lastCleaned) return "bg-gray-200";

    const daysAgo = differenceInDays(new Date(), parseISO(lastCleaned));
    if (daysAgo <= 7) return "bg-[rgb(187,247,208)]"; // Green
    if (daysAgo <= 14) return "bg-[rgb(254,240,138)]"; // Yellow
    return "bg-[rgb(254,202,202)]"; // Red
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
