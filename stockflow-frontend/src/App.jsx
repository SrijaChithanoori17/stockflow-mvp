
import { useEffect, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard, Package, Plus, Search, Trash2, Edit,
  AlertTriangle, Boxes, X, RefreshCw, IndianRupee, LogOut
} from "lucide-react";
import "./App.css";

const BASE_URL = "http://localhost:8080/api";
const AUTH_API = `${BASE_URL}/auth`;
const API = `${BASE_URL}/products`;
const DASHBOARD_API = `${BASE_URL}/dashboard`;

const emptyForm = {
  name: "",
  sku: "",
  description: "",
  quantityOnHand: 0,
  costPrice: 0,
  sellingPrice: 0,
  lowStockThreshold: 5
};

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("stockflowUser")) || null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    username: "",
    password: "",
    organizationName: ""
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUnits: 0,
    lowStockCount: 0,
    inventoryValue: 0,
    lowStockProducts: []
  });

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const organizationId = user?.organizationId;

  // Signup and login
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");

    try {
      if (authMode === "register") {
        await axios.post(`${AUTH_API}/register`, {
          username: authForm.username,
          password: authForm.password,
          organizationName: authForm.organizationName
        });

        setAuthMessage("Account created successfully! Please log in.");
        setAuthMode("login");
        setAuthForm({
          username: authForm.username,
          password: "",
          organizationName: ""
        });
      } else {
        const response = await axios.post(`${AUTH_API}/login`, {
          username: authForm.username,
          password: authForm.password
        });

        const loggedInUser = response.data;

        if (!loggedInUser.organizationId) {
          throw new Error("Organization ID was not returned by the server.");
        }

        localStorage.setItem(
          "stockflowUser",
          JSON.stringify(loggedInUser)
        );

        setUser(loggedInUser);
        setAuthForm({
          username: "",
          password: "",
          organizationName: ""
        });
      }
    } catch (err) {
      console.error("Authentication failed:", err);

      setAuthError(
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Authentication failed. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("stockflowUser");
    setUser(null);
    setProducts([]);
    setStats({
      totalProducts: 0,
      totalUnits: 0,
      lowStockCount: 0,
      inventoryValue: 0,
      lowStockProducts: []
    });
    setError("");
    setAuthMode("login");
  };

  // Load products
  const loadProducts = async () => {
    const response = await axios.get(
      `${API}?organizationId=${organizationId}`
    );
    setProducts(response.data);
  };

  // Load dashboard
  const loadDashboard = async () => {
    const response = await axios.get(
      `${DASHBOARD_API}?organizationId=${organizationId}`
    );
    setStats(response.data);
  };

  // Refresh dashboard
  const refreshData = async () => {
    if (!organizationId) return;

    setError("");

    try {
      await Promise.all([loadProducts(), loadDashboard()]);
    } catch (err) {
      console.error("Unable to load data:", err);
      setError("Unable to connect to backend. Check Spring Boot.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organizationId) {
      setLoading(true);
      refreshData();
    }
  }, [user?.organizationId]);

  // Add product
  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  // Save product
  const saveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      quantityOnHand: Number(form.quantityOnHand),
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      lowStockThreshold: Number(form.lowStockThreshold)
    };

    try {
      if (editingId !== null) {
        await axios.put(
          `${API}/${editingId}?organizationId=${organizationId}`,
          payload
        );
      } else {
        await axios.post(
          `${API}?organizationId=${organizationId}`,
          payload
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      await refreshData();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  };

  // Edit product
  const editProduct = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      quantityOnHand: product.quantityOnHand ?? 0,
      costPrice: product.costPrice ?? 0,
      sellingPrice: product.sellingPrice ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 5
    });
    setShowForm(true);
  };

  // Delete product
  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await axios.delete(
        `${API}/${id}?organizationId=${organizationId}`
      );
      await refreshData();
    } catch (err) {
      setError("Unable to delete product.");
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase();
    return (
      product.name?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query)
    );
  });

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });

  // Authentication screen
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>📦 StockFlow</h1>
          <p>Smart Inventory Management System</p>

          <h2>
            {authMode === "login" ? "Welcome Back" : "Create Account"}
          </h2>

          <p>
            {authMode === "login"
              ? "Log in to manage your inventory"
              : "Create your organization account"}
          </p>

          {authError && (
            <div className="error-message">{String(authError)}</div>
          )}

          {authMessage && (
            <div className="success-message">{authMessage}</div>
          )}

          <form onSubmit={handleAuth}>
            <label>
              Username
              <input
                required
                value={authForm.username}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    username: e.target.value
                  })
                }
                placeholder="Enter username"
              />
            </label>

            <label>
              Password
              <input
                required
                type="password"
                minLength={6}
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    password: e.target.value
                  })
                }
                placeholder="Enter password"
              />
            </label>

            {authMode === "register" && (
              <label>
                Organization Name
                <input
                  required
                  value={authForm.organizationName}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      organizationName: e.target.value
                    })
                  }
                  placeholder="Enter organization name"
                />
              </label>
            )}

            <button
              className="primary auth-submit"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Login"
                  : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === "login" ? "register" : "login"
                );
                setAuthError("");
                setAuthMessage("");
              }}
            >
              {authMode === "login" ? "Sign up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>📦 StockFlow</h2>

        <p className="nav active">
          <LayoutDashboard size={18} /> Dashboard
        </p>

        <p className="nav">
          <Package size={18} /> Products
        </p>

        <p className="nav">
          <Boxes size={18} /> Inventory
        </p>

        <div className="sidebar-user">
          <p>{user.username}</p>
          <small>Organization #{organizationId}</small>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome, {user.username}!</p>
          </div>

          <div className="header-actions">
            <button className="icon-btn" onClick={refreshData}>
              <RefreshCw size={18} />
            </button>
            <button className="primary" onClick={openAddForm}>
              <Plus size={18} /> Add Product
            </button>
          </div>
        </header>

        {error && (
          <div className="error-message">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <section className="stats">
          <div className="stat">
            <Package />
            <p>Total Products</p>
            <h2>{loading ? "..." : stats.totalProducts}</h2>
          </div>

          <div className="stat">
            <Boxes />
            <p>Total Stock Units</p>
            <h2>{loading ? "..." : stats.totalUnits}</h2>
          </div>

          <div className="stat">
            <AlertTriangle />
            <p>Low Stock Items</p>
            <h2>{loading ? "..." : stats.lowStockCount}</h2>
          </div>

          <div className="stat">
            <IndianRupee />
            <p>Inventory Cost Value</p>
            <h2>
              {loading
                ? "..."
                : `₹${formatCurrency(stats.inventoryValue)}`}
            </h2>
          </div>
        </section>

        {!loading && stats.lowStockCount > 0 && (
          <section className="panel">
            <div className="panel-header">
              <h2>
                <AlertTriangle size={19} /> Low Stock Alerts
              </h2>
            </div>

            <p>{stats.lowStockCount} product(s) need restocking.</p>

            {stats.lowStockProducts?.map((product) => (
              <p key={product.id}>
                <strong>{product.name}</strong> —{" "}
                {product.quantityOnHand} units remaining
                {" (Threshold: "}
                {product.lowStockThreshold})
              </p>
            ))}
          </section>
        )}

        <section className="panel">
          <div className="panel-header">
            <h2>Product Inventory</h2>

            <div className="search">
              <Search size={18} />
              <input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan="6">Loading products...</td></tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isLowStock =
                      Number(product.quantityOnHand || 0) <=
                      Number(product.lowStockThreshold || 0);

                    return (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.sku}</td>
                        <td>{product.quantityOnHand}</td>
                        <td>₹{formatCurrency(product.sellingPrice)}</td>
                        <td>
                          <span className={isLowStock ? "low" : "good"}>
                            {isLowStock ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="icon-btn"
                            onClick={() => editProduct(product)}
                          >
                            <Edit size={17} />
                          </button>
                          <button
                            className="icon-btn danger"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}

                {!loading && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showForm && (
          <div className="modal">
            <form className="form" onSubmit={saveProduct}>
              <div className="panel-header">
                <h2>
                  {editingId !== null ? "Edit Product" : "Add Product"}
                </h2>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowForm(false)}
                >
                  <X />
                </button>
              </div>

              {[
                ["name", "Product Name", "text"],
                ["sku", "SKU", "text"],
                ["description", "Description", "text"],
                ["quantityOnHand", "Quantity", "number"],
                ["costPrice", "Cost Price", "number"],
                ["sellingPrice", "Selling Price", "number"],
                ["lowStockThreshold", "Low Stock Threshold", "number"]
              ].map(([key, label, type]) => (
                <label key={key}>
                  {label}
                  <input
                    required={key !== "description"}
                    type={type}
                    min={type === "number" ? 0 : undefined}
                    step={key.includes("Price") ? "0.01" : "1"}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]: e.target.value
                      })
                    }
                  />
                </label>
              ))}

              <button
                className="primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Product"
                    : "Save Product"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
