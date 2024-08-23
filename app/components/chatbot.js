"use client";
import { Box, Button, Typography, TextField } from "@mui/material";
import { useState } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      text: "Welcome to ProfTips Chatbot! How can I assist you today?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");

  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      bgcolor="transparent"
    >
      <Typography variant="h3" mt={3} mb={3}>
        ProfTips Chatbot
      </Typography>
      <Box
        width="100%"
        maxWidth="800px"
        height="70vh"
        bgcolor="rgba(255, 255, 255, 0.5)"
        borderRadius="12px"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
        p={3}
        overflow="auto"
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            mb={2}
            alignSelf={message.sender === "user" ? "flex-end" : "flex-start"}
            sx={{
              maxWidth: "75%",
              bgcolor: message.sender === "user" ? "#DCF8C6" : "#E5E5EA",
              p: 2,
              borderRadius: "10px",
              wordWrap: "break-word",
            }}
          >
            <Typography variant="body1">{message.text}</Typography>
          </Box>
        ))}
      </Box>
      <Box
        width="100%"
        maxWidth="800px"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mt={3}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          sx={{
            borderRadius: "8px",
            mr: 2,
          }}
        />
        <Button variant="contained" color="primary">
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chatbot;
