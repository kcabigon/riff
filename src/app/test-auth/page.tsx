"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TestAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    username: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ Registration successful! User ID: ${data.user.id}`);
        // Auto-login after registration
        setTimeout(async () => {
          setMessage("Logging in...");
          const result = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if (result?.ok) {
            setMessage("✓ Logged in successfully! Redirecting to API tester...");
            setTimeout(() => router.push("/test-clubs-api"), 1000);
          } else {
            setMessage(`✗ Login failed: ${result?.error}`);
          }
        }, 1000);
      } else {
        setMessage(`✗ Registration failed: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        setMessage("✓ Logged in successfully! Redirecting to API tester...");
        setTimeout(() => router.push("/test-clubs-api"), 1000);
      } else {
        setMessage(`✗ Login failed: ${result?.error || "Invalid credentials"}`);
      }
    } catch (error: any) {
      setMessage(`✗ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const quickFillTest = () => {
    setFormData({
      email: "test@example.com",
      password: "testpassword123",
      name: "Test User",
      username: "testuser",
    });
  };

  return (
    <div style={{
      padding: "40px",
      maxWidth: "500px",
      margin: "0 auto",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <h1 style={{ marginBottom: "10px" }}>Test Authentication</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Create a test user to test the Clubs & Riffs API
      </p>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => setMode("register")}
          style={{
            padding: "10px 20px",
            background: mode === "register" ? "#0070f3" : "#f0f0f0",
            color: mode === "register" ? "white" : "black",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: mode === "register" ? "bold" : "normal",
          }}
        >
          Register
        </button>
        <button
          onClick={() => setMode("login")}
          style={{
            padding: "10px 20px",
            background: mode === "login" ? "#0070f3" : "#f0f0f0",
            color: mode === "login" ? "white" : "black",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: mode === "login" ? "bold" : "normal",
          }}
        >
          Login
        </button>
        <button
          onClick={quickFillTest}
          style={{
            padding: "10px 20px",
            background: "#f0f0f0",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          Quick Fill Test Data
        </button>
      </div>

      <form onSubmit={mode === "register" ? handleRegister : handleLogin}>
        {mode === "register" && (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>
                Username (3-30 characters, alphanumeric)
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                }}
              />
            </div>
          </>
        )}

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              fontSize: "16px",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>
            Password {mode === "register" && "(min 8 characters)"}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              fontSize: "16px",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Processing..." : mode === "register" ? "Register & Login" : "Login"}
        </button>
      </form>

      {message && (
        <div style={{
          marginTop: "20px",
          padding: "15px",
          background: message.startsWith("✓") ? "#d4edda" : "#f8d7da",
          color: message.startsWith("✓") ? "#155724" : "#721c24",
          borderRadius: "5px",
          border: `1px solid ${message.startsWith("✓") ? "#c3e6cb" : "#f5c6cb"}`,
        }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "30px", padding: "15px", background: "#f8f9fa", borderRadius: "5px" }}>
        <h3 style={{ marginTop: 0 }}>Quick Start:</h3>
        <ol style={{ margin: 0, paddingLeft: "20px" }}>
          <li>Click "Quick Fill Test Data" to auto-fill the form</li>
          <li>Click "Register & Login" to create your test account</li>
          <li>You'll be automatically redirected to the API tester</li>
          <li>Start testing the Clubs & Riffs endpoints!</li>
        </ol>
      </div>
    </div>
  );
}
