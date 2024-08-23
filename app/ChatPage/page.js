"use client";
import { Box } from "@mui/material";
import Chatbot from "../components/chatbot";

const ChatPage = () => {
  return (
    <Box
      sx={{
        backgroundImage: "url('/images/background.webp')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        height: "100vh",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <Chatbot />
    </Box>
  );
};

export default ChatPage;
