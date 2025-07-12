"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import * as yup from "yup";
import Swal from "sweetalert2";

const API_URL = "https://jsonplaceholder.typicode.com/posts";

const itemSchema = yup.object().shape({
  title: yup.string().required("Title is required").max(100, "Title too long"),
  body: yup.string().required("Description is required").max(500, "Description too long"),
  userId: yup.number().required().min(1, "Invalid user ID"),
});

const INITIAL_FORM_DATA = { id: "", title: "", body: "", userId: 1 };

export default function CrudApp() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Memoized fetch function to prevent unnecessary recreations
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setItems(response.data.slice(0, 10));
    } catch (error) {
      showErrorAlert("Failed to fetch data");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "userId" ? parseInt(value) || 1 : value,
    }));

    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = async () => {
    try {
      await itemSchema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      const newErrors = {};
      err.inner.forEach((error) => {
        if (error.path) newErrors[error.path] = error.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    try {
      setLoading(true);
      if (isEditing) {
        await axios.put(`${API_URL}/${formData.id}`, formData);
        setItems((prev) => prev.map((item) => (item.id === formData.id ? formData : item)));
        showSuccessAlert("Item updated successfully!");
      } else {
        const response = await axios.post(API_URL, formData);
        const newItem = {
          ...response.data,
          // Generate a temporary ID if needed (since jsonplaceholder doesn't return real IDs)
          id: Math.max(0, ...items.map((i) => i.id)) + 1,
        };
        setItems((prev) => [...prev, newItem]);
        showSuccessAlert("Item added successfully!");
      }

      resetForm();
    } catch (error) {
      console.error("Submit error:", error);
      showErrorAlert(isEditing ? "Failed to update item" : "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setIsEditing(false);
    setErrors({});
  };

  const handleEdit = (item) => {
    setFormData(item);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await axios.delete(`${API_URL}/${id}`);
        setItems((prev) => prev.filter((item) => item.id !== id));
        showSuccessAlert("Item deleted successfully!");
      } catch (error) {
        console.error("Delete error:", error);
        showErrorAlert("Failed to delete item");
      } finally {
        setLoading(false);
      }
    }
  };

  const showSuccessAlert = (message) => {
    Swal.fire({
      title: "Success!",
      text: message,
      icon: "success",
      confirmButtonText: "OK",
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const showErrorAlert = (message) => {
    Swal.fire({
      title: "Error!",
      text: message,
      icon: "error",
      confirmButtonText: "OK",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600"> CRUD App </h1>

        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{isEditing ? "Edit Item" : "Add New Item"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${errors.title ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 border ${errors.body ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading}
              />
              {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                User ID *
              </label>
              <input
                type="number"
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 border ${errors.userId ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={loading}
              />
              {errors.userId && <p className="mt-1 text-sm text-red-600">{errors.userId}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white cursor-pointer ${
                  isEditing ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
                } transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-32 flex justify-center`}>
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditing ? "Updating..." : "Adding..."}
                  </>
                ) : isEditing ? (
                  "Update Item"
                ) : (
                  "Add Item"
                )}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Items List</h2>
            <span className="text-sm text-gray-500">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {loading && items.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items found. Add your first item above.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:justify-between items-start overflow-hidden">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg truncate">{item.title}</h3>
                      <p className="text-gray-600 mt-1 break-words">{item.body}</p>
                      <p className="text-sm text-gray-500 mt-2">User ID: {item.userId}</p>
                    </div>
                    <div className="flex space-x-2 mt-4 lg:mt-0">
                      <button
                        onClick={() => handleEdit(item)}
                        disabled={loading}
                        className="px-3 py-1 cursor-pointer bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={loading}
                        className="px-3 py-1 cursor-pointer bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
