"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ServoControl() {
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [angle, setAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const mqttModule = await import("mqtt");
        const mqtt = mqttModule.default;

        const mqttClient = mqtt.connect(
          "wss://e85a81b69187473085a20c5875a3a526.s1.eu.hivemq.cloud:8884/mqtt",
          {
            username: "Aakash_Kavediya",
            password: "Aakash@2006",
            reconnectPeriod: 2000,
            connectTimeout: 4000,
          }
        );

        mqttClient.on("connect", () => {
          console.log("✅ Connected to HiveMQ");
          setConnected(true);
          setConnectionAttempts(0);
          setLastMessage({
            type: "success",
            text: "Connected to MQTT broker",
            timestamp: Date.now(),
          });
          setTimeout(() => setLastMessage(null), 3000);
        });

        mqttClient.on("error", (err) => {
          console.log("❌ MQTT Error:", err);
          setConnectionAttempts(prev => prev + 1);
          setLastMessage({
            type: "error",
            text: `Connection error: ${err.message}`,
            timestamp: Date.now(),
          });
          setTimeout(() => setLastMessage(null), 3000);
        });

        mqttClient.on("close", () => {
          console.log("⚠️ Connection closed");
          setConnected(false);
          setLastMessage({
            type: "warning",
            text: "Connection lost - reconnecting...",
            timestamp: Date.now(),
          });
          setTimeout(() => setLastMessage(null), 3000);
        });

        mqttClient.on("offline", () => {
          console.log("⚠️ Offline");
          setConnected(false);
        });

        setClient(mqttClient);
      } catch (err) {
        console.log("❌ Import Error:", err);
        setLastMessage({
          type: "error",
          text: "Failed to initialize MQTT client",
          timestamp: Date.now(),
        });
      }
    };

    init();
  }, []);

  const toggleServo = () => {
    if (!client || !connected) {
      setLastMessage({
        type: "warning",
        text: "Not connected to MQTT broker",
        timestamp: Date.now(),
      });
      setTimeout(() => setLastMessage(null), 3000);
      return;
    }

    const newAngle = angle === 0 ? 90 : 0;
    setIsAnimating(true);

    client.publish("servo/control", String(newAngle));
    console.log("📤 Sent:", newAngle);

    setAngle(newAngle);
    setLastMessage({
      type: "info",
      text: `Servo angle set to ${newAngle}°`,
      timestamp: Date.now(),
    });

    setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => setLastMessage(null), 2000);
    }, 500);
  };

  const setCustomAngle = (newAngle) => {
    if (!client || !connected) {
      setLastMessage({
        type: "warning",
        text: "Not connected to MQTT broker",
        timestamp: Date.now(),
      });
      setTimeout(() => setLastMessage(null), 3000);
      return;
    }

    setIsAnimating(true);
    client.publish("servo/control", String(newAngle));
    setAngle(newAngle);
    setLastMessage({
      type: "info",
      text: `Servo angle set to ${newAngle}°`,
      timestamp: Date.now(),
    });

    setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => setLastMessage(null), 2000);
    }, 500);
  };

  const getAngleColor = () => {
    const intensity = Math.abs(angle - 45) / 45;
    return `rgba(255, 107, 0, ${0.3 + intensity * 0.5})`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #000000 0%, #1a0b00 100%)",
        fontFamily: "'Segoe UI', 'Poppins', 'Arial', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background particles */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundImage: "radial-gradient(circle at 10% 20%, rgba(255, 107, 0, 0.05) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />
      
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            textAlign: "center",
            marginBottom: "60px",
          }}
        >
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #ff6b00 0%, #ff9e44 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "10px",
              letterSpacing: "-0.02em",
            }}
          >
            Servo Control System
          </h1>
          <p
            style={{
              color: "#888",
              fontSize: "1.1rem",
            }}
          >
            Real-time MQTT Servo Motor Control
          </p>
        </motion.div>

        {/* Status Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              background: "rgba(255, 107, 0, 0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "20px",
              border: "1px solid rgba(255, 107, 0, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "5px" }}>
                  Connection Status
                </p>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: connected ? "#4ade80" : "#ef4444",
                  }}
                >
                  {connected ? "● Connected" : "○ Disconnected"}
                </h3>
              </div>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: connected ? "#4ade80" : "#ef4444",
                  animation: connected ? "pulse 2s infinite" : "none",
                }}
              />
            </div>
            {connectionAttempts > 0 && !connected && (
              <p style={{ color: "#ff6b00", fontSize: "0.8rem", marginTop: "10px" }}>
                Reconnection attempt {connectionAttempts}...
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              background: "rgba(255, 107, 0, 0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "20px",
              border: "1px solid rgba(255, 107, 0, 0.2)",
            }}
          >
            <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "5px" }}>
              Current Angle
            </p>
            <h3
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#ff6b00",
              }}
            >
              {angle}°
            </h3>
          </motion.div>
        </div>

        {/* Servo Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(10px)",
            borderRadius: "30px",
            padding: "40px",
            marginBottom: "40px",
            border: "1px solid rgba(255, 107, 0, 0.3)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#888", marginBottom: "30px", fontSize: "0.9rem" }}>
            Servo Position Visualization
          </p>
          
          <div
            style={{
              position: "relative",
              width: "300px",
              height: "300px",
              margin: "0 auto",
              borderRadius: "50%",
              background: "rgba(255, 107, 0, 0.05)",
              border: "2px solid rgba(255, 107, 0, 0.2)",
              boxShadow: `0 0 30px ${getAngleColor()}`,
            }}
          >
            {/* Center point */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "#ff6b00",
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 10px rgba(255, 107, 0, 0.5)",
                zIndex: 3,
              }}
            />
            
            {/* Angle indicator */}
            <motion.div
              animate={{ rotate: angle * 1.8 - 90 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "120px",
                height: "4px",
                background: "linear-gradient(90deg, #ff6b00, #ff9e44)",
                transformOrigin: "0% 50%",
                borderRadius: "4px",
                boxShadow: "0 0 10px rgba(255, 107, 0, 0.5)",
              }}
            />
            
            {/* Scale markers */}
            {[-90, -45, 0, 45, 90].map((marker) => (
              <div
                key={marker}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "140px",
                  height: "2px",
                  transform: `rotate(${marker}deg)`,
                  transformOrigin: "0% 50%",
                  opacity: 0.3,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: "-5px",
                    top: "-4px",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#ff6b00",
                  }}
                />
              </div>
            ))}
          </div>
          
          <p style={{ color: "#ff6b00", marginTop: "20px", fontSize: "0.9rem" }}>
            {angle === 0 ? "Position: 0° (Left)" : angle === 90 ? "Position: 90° (Right)" : `Position: ${angle}°`}
          </p>
        </motion.div>

        {/* Control Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "30px",
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleServo}
              disabled={isAnimating}
              style={{
                padding: "15px 40px",
                fontSize: "1.1rem",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #ff6b00 0%, #ff9e44 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "50px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 5px 20px rgba(255, 107, 0, 0.3)",
                opacity: isAnimating ? 0.7 : 1,
              }}
            >
              {isAnimating ? "Moving..." : "Toggle Servo (0° ↔ 90°)"}
            </motion.button>
          </div>

          <div
            style={{
              marginTop: "30px",
            }}
          >
            <p style={{ color: "#888", marginBottom: "20px", fontSize: "0.9rem" }}>
              Custom Angle Control
            </p>
            <div
              style={{
                display: "flex",
                gap: "15px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {[0, 30, 45, 60, 90, 180].map((customAngle) => (
                <motion.button
                  key={customAngle}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCustomAngle(customAngle)}
                  disabled={isAnimating || customAngle > 180}
                  style={{
                    padding: "10px 25px",
                    fontSize: "1rem",
                    background: "rgba(255, 107, 0, 0.2)",
                    color: "#ff6b00",
                    border: "1px solid rgba(255, 107, 0, 0.3)",
                    borderRadius: "50px",
                    cursor: customAngle <= 180 ? "pointer" : "not-allowed",
                    transition: "all 0.3s ease",
                    opacity: customAngle > 180 ? 0.5 : 1,
                  }}
                >
                  {customAngle}°
                </motion.button>
              ))}
            </div>
            <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "15px" }}>
              Note: Standard servo range is 0° to 180°
            </p>
          </div>
        </motion.div>

        {/* Notification Messages */}
        <AnimatePresence>
          {lastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                background: lastMessage.type === "success" ? "rgba(74, 222, 128, 0.9)" :
                           lastMessage.type === "error" ? "rgba(239, 68, 68, 0.9)" :
                           lastMessage.type === "warning" ? "rgba(251, 191, 36, 0.9)" :
                           "rgba(255, 107, 0, 0.9)",
                backdropFilter: "blur(10px)",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "10px",
                fontSize: "0.9rem",
                boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
                zIndex: 1000,
              }}
            >
              {lastMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            marginTop: "60px",
            paddingTop: "30px",
            borderTop: "1px solid rgba(255, 107, 0, 0.2)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#666", fontSize: "0.8rem" }}>
            MQTT Broker: HiveMQ Cloud | Topic: servo/control
          </p>
          <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "5px" }}>
            {connected ? "● Real-time communication active" : "○ Waiting for connection..."}
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}