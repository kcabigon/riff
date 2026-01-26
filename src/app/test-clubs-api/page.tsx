"use client";

import { useState } from "react";

export default function TestClubsAPI() {
  const [output, setOutput] = useState<string>("");
  const [clubId, setClubId] = useState<string>("");
  const [riffId, setRiffId] = useState<string>("");
  const [pieceId, setPieceId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const log = (message: string) => {
    setOutput((prev) => prev + "\n" + message);
    console.log(message);
  };

  const clearOutput = () => setOutput("");

  // Test 1: Create a club
  const testCreateClub = async () => {
    try {
      log("=== Testing: POST /api/clubs ===");
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Writers Club",
          description: "A club for testing the API",
        }),
      });
      const data = await response.json();
      log(`Status: ${response.status}`);
      log(`Response: ${JSON.stringify(data, null, 2)}`);
      if (data.club?.id) {
        setClubId(data.club.id);
        log(`✓ Club created! ID: ${data.club.id}`);
      }
    } catch (error: any) {
      log(`✗ Error: ${error.message}`);
    }
  };

  // Test 2: Get user's clubs
  const testGetClubs = async () => {
    try {
      log("=== Testing: GET /api/clubs ===");
      const response = await fetch("/api/clubs");
      const data = await response.json();
      log(`Status: ${response.status}`);
      log(`Response: ${JSON.stringify(data, null, 2)}`);
      if (data.clubs?.length > 0) {
        log(`✓ Found ${data.clubs.length} clubs`);
      }
    } catch (error: any) {
      log(`✗ Error: ${error.message}`);
    }
  };

  // Test 3: Get club details
  const testGetClubDetails = async () => {
    if (!clubId) {
      log("✗ Please set a club ID first");
      return;
    }
    try {
      log(`=== Testing: GET /api/clubs/${clubId} ===`);
      const response = await fetch(`/api/clubs/${clubId}`);
      const data = await response.json();
      log(`Status: ${response.status}`);
      log(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      log(`✗ Error: ${error.message}`);
    }
  };

  // Test 4: Update club
  const testUpdateClub = async () => {
    if (!clubId) {
      log("✗ Please set a club ID first");
      return;
    }
    try {
      log(`=== Testing: PATCH /api/clubs/${clubId} ===`);
      const response = await fetch(`/api/clubs/${clubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Test Writers Club",
          description: "Updated description",
        }),
      });
      const data = await response.json();
      log(`Status: ${response.status}`);
      log(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      log(`✗ Error: ${error.message}`);
    }
  };

  // Test 5: Create a riff
  const testCreateRiff = async () => {
    if (!clubId) {
      log("✗ Please set a club ID first");
      return;
    }
    try {
      log(`=== Testing: POST /api/clubs/${clubId}/riffs ===`);
      const response = await fetch(`/api/clubs/${clubId}/riffs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Riff",
          prompt: "Write about your favorite memory",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      const data = await response.json();
      log(`Status: ${response.status}`);
      log(`Response: ${JSON.stringify(data, null, 2)}`);
      if (data.riff?.id) {
        setRiffId(data.riff.id);
        log(`✓ Riff created! ID: ${data.riff.id}`);
      }
    } catch (error: any) {
      log(`✗ Error: ${error.message}`);
    }
  };

  // Test 6: Get club's riffs
  const testGetRiffs = async () => {
    if (!clubId) {
      log("✗ Please set a club ID first");
      return;
    }
    try {
      log(`=== Testing: GET /api/clubs/${clubId}/riffs ===`);
      const response = await fetch(`/api/clubs/${clubId}/riffs`);
      const data = await response.json();
      log(`Status: ${response.status}`);
      log(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      log(`✗ Error: ${error.message}`);
    }
  };

  // Test 7: Activate riff (DRAFT → ACTIVE)
  const testActivateRiff = async () => {
    if (!riffId) {
      log("✗ Please set a riff ID first");
      return;
    }
    try {
      log(`=== Testing: PATCH /api/riffs/${riffId} (activate) ===`);
      const response = await fetch(`/api/riffs/${riffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACTIVE",
        }),
      });
      const data = await response.json();
      log(`Status: ${response.status}`);
      log(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      log(`✗ Error: ${error.message}`);
    }
  };

  // Test 8: Join riff
  const testJoinRiff = async () => {
    if (!riffId) {
      log("✗ Please set a riff ID first");
      return;
    }
    try {
      log(`=== Testing: POST /api/riffs/${riffId}/participants ===`);
      const response = await fetch(`/api/riffs/${riffId}/participants`, {
        method: "POST",
      });
      const data = await response.json();
      log(`Status: ${response.status}`);
      log(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      log(`✗ Error: ${error.message}`);
    }
  };

  // Test 9: Complete riff
  const testCompleteRiff = async () => {
    if (!riffId) {
      log("✗ Please set a riff ID first");
      return;
    }
    try {
      log(`=== Testing: PATCH /api/riffs/${riffId} (complete) ===`);
      const response = await fetch(`/api/riffs/${riffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
        }),
      });
      const data = await response.json();
      log(`Status: ${response.status}`);
      log(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      log(`✗ Error: ${error.message}`);
    }
  };

  // Test 10: Run all tests in sequence
  const runAllTests = async () => {
    clearOutput();
    log("=== RUNNING ALL TESTS IN SEQUENCE ===\n");

    await testCreateClub();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testGetClubs();
    await new Promise(resolve => setTimeout(resolve, 500));

    if (clubId) {
      await testGetClubDetails();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testCreateRiff();
      await new Promise(resolve => setTimeout(resolve, 500));

      await testGetRiffs();
      await new Promise(resolve => setTimeout(resolve, 500));

      if (riffId) {
        await testActivateRiff();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testJoinRiff();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    log("\n=== ALL TESTS COMPLETE ===");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Clubs & Riffs API Tester</h1>

      <div style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>Club ID: </label>
          <input
            type="text"
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            placeholder="Auto-populated or paste here"
            style={{ width: "400px", padding: "5px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Riff ID: </label>
          <input
            type="text"
            value={riffId}
            onChange={(e) => setRiffId(e.target.value)}
            placeholder="Auto-populated or paste here"
            style={{ width: "400px", padding: "5px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Piece ID: </label>
          <input
            type="text"
            value={pieceId}
            onChange={(e) => setPieceId(e.target.value)}
            placeholder="Paste piece ID for testing"
            style={{ width: "400px", padding: "5px" }}
          />
        </div>
        <div>
          <label>User ID: </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Paste user ID for member tests"
            style={{ width: "400px", padding: "5px" }}
          />
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Club Tests</h3>
        <button onClick={testCreateClub} style={{ marginRight: "10px" }}>
          1. Create Club
        </button>
        <button onClick={testGetClubs} style={{ marginRight: "10px" }}>
          2. Get All Clubs
        </button>
        <button onClick={testGetClubDetails} style={{ marginRight: "10px" }}>
          3. Get Club Details
        </button>
        <button onClick={testUpdateClub}>
          4. Update Club
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Riff Tests</h3>
        <button onClick={testCreateRiff} style={{ marginRight: "10px" }}>
          5. Create Riff
        </button>
        <button onClick={testGetRiffs} style={{ marginRight: "10px" }}>
          6. Get Club Riffs
        </button>
        <button onClick={testActivateRiff} style={{ marginRight: "10px" }}>
          7. Activate Riff
        </button>
        <button onClick={testJoinRiff} style={{ marginRight: "10px" }}>
          8. Join Riff
        </button>
        <button onClick={testCompleteRiff}>
          9. Complete Riff
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Batch Tests</h3>
        <button onClick={runAllTests} style={{ marginRight: "10px", fontWeight: "bold" }}>
          ▶ Run All Tests
        </button>
        <button onClick={clearOutput}>
          Clear Output
        </button>
      </div>

      <div>
        <h3>Output:</h3>
        <pre style={{
          background: "#1e1e1e",
          color: "#d4d4d4",
          padding: "20px",
          borderRadius: "5px",
          maxHeight: "600px",
          overflow: "auto"
        }}>
          {output || "No output yet. Click a test button to start."}
        </pre>
      </div>
    </div>
  );
}
