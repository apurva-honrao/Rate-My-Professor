"use client";
import { Box, Button, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = new useRouter();
  const chatbotOpen = () => {
    router.push("/chatbot");
  };

  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      bgcolor="beige"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        spacing={2}
      >
        <Typography variant="h3" mb={2}>
          Welcome to ProfTips!
        </Typography>
        <Box width="fit-content" onClick={chatbotOpen}>
          <Button variant="contained">Chat with bot</Button>
        </Box>
      </Box>
    </Box>
  );
}
