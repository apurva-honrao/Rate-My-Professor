"use client";
import { Box, Button, Typography, TextField } from "@mui/material";
import { useState } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Welcome to ProfTips Chatbot! How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      setMessages((messages) => [
        ...messages,
        { content: input, role: "user" },
        { content: "", role: "assistant" },
      ]);

      const payload = [
        ...messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        })),
        { role: "user", content: input },
      ];

      const response = fetch("/api/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let result = "";
        return reader.read().then(function processText({ done, value }) {
          if (done) {
            return result;
          }
          const text = decoder.decode(value || new Int8Array(), {
            stream: true,
          });
          setMessages((messages) => {
            let lastMessage = messages[messages.length - 1];
            let otherMessages = messages.slice(0, messages.length - 1);
            return [
              ...otherMessages,
              {
                ...lastMessage,
                content: lastMessage.content + text,
              },
            ];
          });
          return reader.read().then(processText);
        });
      });
      setInput(""); // Clear input field
    }
  };

  const formatMessageContent = (content) => {
    return content.replace(/\n/g, "<br />");
  };

  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      sx={{
        color: "white",
      }}
    >
      <Typography
        variant="h3"
        mt={3}
        mb={3}
        sx={{
          color: "white",
          textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
        }}
      >
        ProfTips Chatbot
      </Typography>
      <Box
        width="100%"
        maxWidth="800px"
        height="70vh"
        bgcolor="rgba(255, 255, 255, 0.1)"
        borderRadius="12px"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
        p={3}
        overflow="auto"
        sx={{
          display: "flex",
          flexDirection: "column",
          backdropFilter: "blur(10px)",
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            mb={2}
            alignSelf={message.role === "user" ? "flex-end" : "flex-start"}
            sx={{
              maxWidth: "75%",
              bgcolor: message.role === "user" ? "#DCF8C6" : "#E5E5EA",
              p: 2,
              borderRadius: "10px",
              wordWrap: "break-word",
              color: "#000",
            }}
          >
            {" "}
            <Typography
              variant="body1"
              component="div"
              dangerouslySetInnerHTML={{
                __html: formatMessageContent(message.content),
              }}
            />
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
            bgcolor: "rgba(255, 255, 255, 0.2)",
            color: "white",
            borderRadius: "8px",
            mr: 2,
            input: {
              color: "white",
            },
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "rgba(255, 255, 255, 0.6)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(255, 255, 255, 0.8)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "rgba(255, 255, 255, 1)",
              },
            },
          }}
        />
        <Button variant="contained" color="primary" onClick={handleSend}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chatbot;
